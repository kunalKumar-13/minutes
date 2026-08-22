"""The parser is the front door for every transcript, so it gets the most cases."""
from __future__ import annotations

import json

import pytest

from app.services import transcript_parser as tp


@pytest.mark.parametrize(
    "raw,fmt",
    [
        ("[00:00:05] Alice: Hello there everyone.\n[00:00:12] Bob: Hi Alice.", "txt"),
        ("Alice (00:05): Hello there everyone.\nBob (00:12): Hi Alice.", "txt"),
        ("Alice  00:05\nHello there everyone.\n\nBob  00:12\nHi Alice.", "txt"),
        ("Alice: Hello there everyone.\nBob: Hi Alice.", "txt"),
        ("WEBVTT\n\n00:00:05.000 --> 00:00:09.000\n<v Alice>Hello there everyone.\n\n00:00:12.000 --> 00:00:15.000\nBob: Hi Alice.", "vtt"),
        ("1\n00:00:05,000 --> 00:00:09,000\nAlice: Hello there everyone.\n\n2\n00:00:12,000 --> 00:00:15,000\nBob: Hi Alice.", "srt"),
    ],
)
def test_every_supported_shape_yields_two_speakers(raw: str, fmt: str) -> None:
    assert tp.detect_format(raw) == fmt
    segments = tp.parse(raw)
    assert [s["speaker"] for s in segments] == ["Alice", "Bob"]
    assert segments[0]["text"].startswith("Hello there")


def test_bracketed_timestamp_is_not_mistaken_for_json() -> None:
    """A text transcript can legitimately start with "[00:00:05]"."""
    raw = "[00:00:05] Alice: Hello there everyone."
    assert tp.detect_format(raw) == "txt"
    assert tp.parse(raw)[0]["speaker"] == "Alice"


def test_json_object_and_bare_list_both_parse() -> None:
    payload = {"segments": [{"speaker": "Alice", "start_ms": 5000, "end_ms": 9000, "text": "Hello."}]}
    assert tp.parse(json.dumps(payload))[0]["start_ms"] == 5000

    bare = [{"speaker": "Alice", "text": "Hello."}, {"speaker": "Bob", "text": "Hi."}]
    assert len(tp.parse(json.dumps(bare))) == 2


def test_json_accepts_float_seconds_for_start() -> None:
    payload = [{"speaker": "Alice", "start": 12.5, "text": "Hello there."}]
    assert tp.parse(json.dumps(payload))[0]["start_ms"] == 12_500


def test_untimed_transcript_gets_synthetic_monotonic_timings() -> None:
    segments = tp.parse("Alice: One two three four five.\nBob: Six seven eight nine ten.")
    assert segments[0]["start_ms"] == 0
    assert all(
        segments[i]["end_ms"] <= segments[i + 1]["start_ms"] for i in range(len(segments) - 1)
    ), "segments must not overlap"
    assert all(s["end_ms"] > s["start_ms"] for s in segments)


def test_consecutive_cues_from_one_speaker_merge_into_a_paragraph() -> None:
    raw = (
        "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<v Alice>This is the first part\n\n"
        "00:00:03.000 --> 00:00:06.000\n<v Alice>and this is the second part.\n\n"
        "00:00:07.000 --> 00:00:09.000\n<v Bob>Understood.\n"
    )
    segments = tp.parse(raw)
    assert len(segments) == 2
    assert segments[0]["text"] == "This is the first part and this is the second part."
    assert segments[0]["end_ms"] == 6000


def test_speakerless_text_falls_back_to_a_single_speaker() -> None:
    segments = tp.parse("Just a wall of text with nobody named in it at all.")
    assert segments[0]["speaker"] == "Speaker 1"


def test_empty_input_raises() -> None:
    with pytest.raises(tp.TranscriptParseError):
        tp.parse("   \n  ")


def test_malformed_json_raises_a_readable_error() -> None:
    with pytest.raises(tp.TranscriptParseError, match="Invalid JSON"):
        tp.parse('{"segments": [', fmt="json")


@pytest.mark.parametrize(
    "value,expected",
    [("00:05", 5_000), ("01:02", 62_000), ("01:02:03", 3_723_000), ("00:00:01.500", 1_500), ("00:00:01,500", 1_500)],
)
def test_timestamp_to_ms(value: str, expected: int) -> None:
    assert tp.timestamp_to_ms(value) == expected


@pytest.mark.parametrize("ms,expected", [(0, "00:00"), (65_000, "01:05"), (3_723_000, "1:02:03")])
def test_ms_to_timestamp(ms: int, expected: str) -> None:
    assert tp.ms_to_timestamp(ms) == expected


def test_speakers_of_preserves_first_appearance_order() -> None:
    segments = tp.parse("Bob: First line here.\nAlice: Second line here.\nBob: Third line here.")
    assert tp.speakers_of(segments) == ["Bob", "Alice"]
