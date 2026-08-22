"""Turn an uploaded or pasted transcript into normalised segments.

Four input shapes are accepted, and `parse()` sniffs which one it is:

* **VTT / SRT** — timed cues, optionally carrying a speaker via ``<v Name>`` or a
  ``Name:`` prefix inside the cue body.
* **JSON** — either ``{"segments": [...]}`` or a bare list of objects with
  ``speaker`` / ``text`` and ``start``/``start_ms`` style keys.
* **Plain text** — the messy one. Handles ``[00:01:23] Name: text``,
  ``Name (00:12): text``, ``Name  00:12`` on its own line, and bare
  ``Name: text`` with no timings at all.

When a format carries no timings we synthesise them from a reading rate, so the
player and the click-to-seek behaviour still work on a raw paste.
"""
from __future__ import annotations

import json
import re
from typing import Any, Iterable

# Average speaking rate used to fake timings for untimed transcripts.
WORDS_PER_MINUTE = 145
_MIN_SEGMENT_MS = 1200

_TS = r"(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?"

# "[00:01:23] Alice: hello"  /  "00:01:23 Alice: hello"
RE_BRACKET = re.compile(rf"^\s*[\[(]?\s*({_TS})\s*[\])]?\s*[-–]?\s*([^:\n]{{1,60}}?)\s*:\s*(.*)$")
# "Alice (00:12): hello"  /  "Alice [00:12] hello"
RE_NAME_TS = re.compile(rf"^\s*([^:\n(\[]{{1,60}}?)\s*[\[(]\s*({_TS})\s*[\])]\s*:?\s*(.*)$")
# "Alice: hello"
RE_NAME_ONLY = re.compile(r"^\s*([A-Z][^:\n]{0,58}?)\s*:\s+(.*)$")
# A speaker header on its own line: "Alice   00:12"
RE_HEADER = re.compile(rf"^\s*([^:\n]{{1,60}}?)\s{{1,}}({_TS})\s*$")

RE_VTT_CUE = re.compile(rf"({_TS})\s*-->\s*({_TS})")
RE_VOICE = re.compile(r"<v\s+([^>]+)>(.*?)(?:</v>)?$", re.IGNORECASE | re.DOTALL)
RE_TAGS = re.compile(r"<[^>]+>")


class TranscriptParseError(ValueError):
    """Raised when nothing usable could be extracted from the input."""


def timestamp_to_ms(value: str) -> int:
    """``01:02:03.400`` / ``02:03`` / ``123`` -> milliseconds."""
    value = value.strip().replace(",", ".")
    if not value:
        return 0
    parts = value.split(":")
    try:
        numbers = [float(p) for p in parts]
    except ValueError:
        return 0
    seconds = 0.0
    for number in numbers:  # left-to-right: h, m, s (or m, s, or just s)
        seconds = seconds * 60 + number
    return int(round(seconds * 1000))


def ms_to_timestamp(ms: int) -> str:
    """Milliseconds -> ``MM:SS`` (or ``H:MM:SS`` past an hour)."""
    ms = max(0, int(ms))
    total = ms // 1000
    hours, remainder = divmod(total, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes:02d}:{seconds:02d}"


def _estimate_duration_ms(text: str) -> int:
    words = max(1, len(text.split()))
    return max(_MIN_SEGMENT_MS, int(words / WORDS_PER_MINUTE * 60_000))


def detect_format(raw: str, filename: str | None = None) -> str:
    stripped = raw.lstrip()
    if filename:
        lowered = filename.lower()
        if lowered.endswith(".json"):
            return "json"
        if lowered.endswith(".vtt"):
            return "vtt"
        if lowered.endswith(".srt"):
            return "srt"
    # A text transcript can legitimately open with "[00:01:23] ...", so a bare
    # "[" is not enough to call it JSON — the next token has to look like JSON.
    if stripped.startswith("{") or re.match(r'\[\s*[{\["]', stripped):
        return "json"
    if stripped.upper().startswith("WEBVTT"):
        return "vtt"
    if RE_VTT_CUE.search(raw):
        return "srt" if re.search(r"^\s*\d+\s*$", raw, re.MULTILINE) else "vtt"
    return "txt"


# ------------------------------------------------------------------------- json
def _first(mapping: dict, *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in mapping and mapping[key] not in (None, ""):
            return mapping[key]
    return default


def _coerce_ms(value: Any) -> int:
    """Accept ms ints, second floats, or ``"00:01:02"`` strings."""
    if value is None:
        return 0
    if isinstance(value, str):
        return timestamp_to_ms(value) if ":" in value else int(float(value or 0))
    number = float(value)
    # Heuristic: anything under 10_000 in a "start" field is almost certainly
    # seconds, not milliseconds (10s of seconds vs 10 seconds of audio).
    return int(number * 1000) if number < 10_000 and not float(number).is_integer() else int(number)


def parse_json(raw: str) -> list[dict[str, Any]]:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise TranscriptParseError(f"Invalid JSON transcript: {exc.msg}") from exc

    if isinstance(payload, dict):
        rows = _first(payload, "segments", "sentences", "transcript", "utterances", "results", default=[])
    else:
        rows = payload
    if not isinstance(rows, list):
        raise TranscriptParseError("JSON transcript must contain a list of segments.")

    segments: list[dict[str, Any]] = []
    cursor = 0
    for row in rows:
        if not isinstance(row, dict):
            continue
        text = str(_first(row, "text", "sentence", "content", "utterance", default="")).strip()
        if not text:
            continue
        speaker = str(_first(row, "speaker", "speaker_name", "speaker_label", "name", default="Speaker 1")).strip()
        start = _coerce_ms(_first(row, "start_ms", "startTime", "start", "begin", "from"))
        end = _coerce_ms(_first(row, "end_ms", "endTime", "end", "to"))
        if not start and cursor:
            start = cursor
        if end <= start:
            end = start + _estimate_duration_ms(text)
        cursor = end
        segments.append({"speaker": speaker, "start_ms": start, "end_ms": end, "text": text})
    return segments


# -------------------------------------------------------------------- vtt / srt
def parse_cues(raw: str) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    blocks = re.split(r"\n\s*\n", raw.strip())
    for block in blocks:
        lines = [ln for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        cue = None
        body_start = 0
        for index, line in enumerate(lines[:3]):
            match = RE_VTT_CUE.search(line)
            if match:
                cue = match
                body_start = index + 1
                break
        if cue is None:
            continue
        body = "\n".join(lines[body_start:]).strip()
        if not body:
            continue

        speaker = None
        voice = RE_VOICE.search(body)
        if voice:
            speaker, body = voice.group(1).strip(), voice.group(2).strip()
        body = RE_TAGS.sub("", body).strip()
        if speaker is None:
            named = RE_NAME_ONLY.match(body)
            if named:
                speaker, body = named.group(1).strip(), named.group(2).strip()
        if not body:
            continue
        segments.append(
            {
                "speaker": speaker or "Speaker 1",
                "start_ms": timestamp_to_ms(cue.group(1)),
                "end_ms": timestamp_to_ms(cue.group(2)),
                "text": body,
            }
        )
    return _merge_consecutive(segments)


# ------------------------------------------------------------------------- text
def parse_text(raw: str) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    pending_speaker: str | None = None
    pending_ts: int | None = None

    for line in raw.splitlines():
        line = line.rstrip()
        if not line.strip():
            continue
        if line.strip().upper() in {"WEBVTT", "TRANSCRIPT"}:
            continue

        header = RE_HEADER.match(line)
        if header and not header.group(1).strip().endswith("."):
            pending_speaker = header.group(1).strip()
            pending_ts = timestamp_to_ms(header.group(2))
            continue

        speaker: str | None = None
        start: int | None = None
        text = ""

        bracket = RE_BRACKET.match(line)
        name_ts = RE_NAME_TS.match(line)
        if bracket:
            start, speaker, text = timestamp_to_ms(bracket.group(1)), bracket.group(2).strip(), bracket.group(3).strip()
        elif name_ts:
            speaker, start, text = name_ts.group(1).strip(), timestamp_to_ms(name_ts.group(2)), name_ts.group(3).strip()
        else:
            name_only = RE_NAME_ONLY.match(line)
            if name_only and len(name_only.group(1).split()) <= 5:
                speaker, text = name_only.group(1).strip(), name_only.group(2).strip()
            else:
                text = line.strip()

        if speaker is None:
            speaker = pending_speaker or (segments[-1]["speaker"] if segments else "Speaker 1")
        if start is None:
            start, pending_ts = pending_ts, None
        if not text:
            pending_speaker, pending_ts = speaker, start
            continue

        segments.append({"speaker": speaker, "start_ms": start, "end_ms": None, "text": text})
        pending_speaker, pending_ts = None, None

    return _fill_missing_times(_merge_consecutive(segments))


# ------------------------------------------------------------------- normalising
def _merge_consecutive(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Glue adjacent cues from the same speaker into one readable paragraph."""
    merged: list[dict[str, Any]] = []
    for segment in segments:
        previous = merged[-1] if merged else None
        contiguous = (
            previous is not None
            and previous["speaker"] == segment["speaker"]
            and len(previous["text"]) < 320
            and not previous["text"].rstrip().endswith(("?", "!"))
        )
        if contiguous:
            previous["text"] = f"{previous['text']} {segment['text']}".strip()
            if segment.get("end_ms"):
                previous["end_ms"] = segment["end_ms"]
        else:
            merged.append(dict(segment))
    return merged


def _fill_missing_times(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cursor = 0
    for index, segment in enumerate(segments):
        start = segment.get("start_ms")
        if start is None or (index and start < cursor):
            start = cursor
        segment["start_ms"] = start
        nxt = segments[index + 1] if index + 1 < len(segments) else None
        end = segment.get("end_ms")
        if not end:
            following = nxt.get("start_ms") if nxt else None
            end = following if following and following > start else start + _estimate_duration_ms(segment["text"])
        segment["end_ms"] = max(end, start + _MIN_SEGMENT_MS)
        cursor = segment["end_ms"]
    return segments


def parse(raw: str, fmt: str = "auto", filename: str | None = None) -> list[dict[str, Any]]:
    """Parse `raw` into ``[{speaker, start_ms, end_ms, text}, ...]``."""
    if not raw or not raw.strip():
        raise TranscriptParseError("Transcript is empty.")
    resolved = detect_format(raw, filename) if fmt == "auto" else fmt

    if resolved == "json":
        segments = parse_json(raw)
    elif resolved in {"vtt", "srt"}:
        segments = parse_cues(raw)
    else:
        segments = parse_text(raw)

    segments = _fill_missing_times([s for s in segments if s.get("text", "").strip()])
    if not segments:
        raise TranscriptParseError("No transcript lines could be read from that file.")
    return segments


def speakers_of(segments: Iterable[dict[str, Any]]) -> list[str]:
    """Distinct speakers, in first-appearance order."""
    seen: dict[str, None] = {}
    for segment in segments:
        seen.setdefault(segment["speaker"], None)
    return list(seen)
