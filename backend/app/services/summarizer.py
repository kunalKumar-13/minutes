"""Produce Fireflies-shaped AI notes from transcript segments.

Two backends, same output contract:

* ``extractive`` (default) — a deterministic, dependency-free summariser. It
  scores sentences by keyword density and position, chunks the meeting into
  chapters, and pulls commitments out with a small grammar of "who owes what"
  cues. No network, no key, always available, and identical on every run, which
  is what makes the seeded data reproducible.
* ``llm`` — used only when ``ANTHROPIC_API_KEY`` is set. Same JSON shape, better
  prose. Falls back to extractive on any error, so the app never breaks because
  a third party is down.

The output mirrors the panels of the real product: an Overview paragraph, Notes
grouped into timestamped chapters, Action Items attributed to a speaker, and a
Meeting Outcome list.
"""
from __future__ import annotations

import json
import logging
import re
from collections import Counter
from typing import Any

from ..config import settings
from .transcript_parser import ms_to_timestamp

logger = logging.getLogger(__name__)

STOPWORDS = {
    "a", "about", "actually", "after", "all", "also", "am", "an", "and", "any", "are", "as", "at",
    "back", "basically", "be", "because", "been", "before", "being", "but", "by", "can", "could",
    "did", "do", "does", "doing", "done", "down", "each", "even", "every", "for", "from", "get",
    "getting", "go", "going", "good", "got", "great", "had", "has", "have", "he", "her", "here",
    "hers", "him", "his", "how", "i", "if", "in", "into", "is", "it", "its", "just", "kind", "know",
    "let", "like", "little", "lot", "make", "makes", "maybe", "me", "mean", "more", "most", "much",
    "my", "need", "no", "not", "now", "of", "off", "ok", "okay", "on", "one", "only", "or", "other",
    "our", "out", "over", "really", "right", "said", "say", "see", "she", "should", "so", "some",
    "sort", "still", "such", "sure", "take", "than", "that", "the", "their", "them", "then",
    "there", "these", "they", "thing", "things", "think", "this", "those", "through", "to", "too",
    "up", "us", "use", "very", "want", "was", "way", "we", "well", "were", "what", "when", "where",
    "which", "while", "who", "why", "will", "with", "would", "yeah", "yes", "you", "your", "re",
    "ll", "ve", "don", "doesn", "didn", "gonna", "wanna", "thanks", "thank", "hey", "hi", "hello",
    "alright", "anyone", "anything", "everyone", "everything", "honestly", "literally", "morning",
    "nobody", "obviously", "quick", "quickly", "someone", "something", "thing", "actually", "again",
    "already", "always", "another", "around", "away", "come", "coming", "look", "looking", "keep",
    "put", "start", "started", "talk", "tell", "told", "give", "given", "having", "point", "part",
}

# "we're" / "I'll" tokenise as one word; strip the clitic and re-test.
CONTRACTIONS = ("'re", "'ll", "'ve", "'d", "'s", "'t", "'m", "n't")

# Cues that mark a sentence as a commitment someone owes after the call.
ACTION_CUES = (
    r"\bi(?:'| a)?ll\b", r"\bwe(?:'| wi)?ll\b", r"\bi will\b", r"\bwe will\b", r"\bwe need to\b",
    r"\bi need to\b", r"\blet(?:'s| us)\b", r"\bcan you\b", r"\bcould you\b", r"\bplease\b",
    r"\bgoing to (?:send|share|set up|schedule|write|draft|review|check|follow|prepare|update|put)\b",
    r"\bfollow(?:ing)? up\b", r"\baction item\b", r"\btake (?:this|that) (?:on|away)\b",
    r"\bby (?:monday|tuesday|wednesday|thursday|friday|next week|end of|eod|eow)\b",
    r"\bowns?\b", r"\btask\b", r"\bassign(?:ed)?\b", r"\bdeliver\b", r"\bship\b",
)
ACTION_RE = re.compile("|".join(ACTION_CUES), re.IGNORECASE)

# A cue phrase on its own produces a lot of false positives ("I'll say it
# plainly"). A real commitment also names something being done, so require a
# deliverable verb, and reject the filler openers outright.
DELIVERABLE_RE = re.compile(
    r"\b(?:send|share|write|draft|prepare|review|check|schedule|book|set up|setup|build|fix|add|"
    r"ship|deliver|update|circulate|pull|dig|design|test|run|create|invite|follow up|report|"
    r"document|scope|own|take|get|put|post|email|call|reach out|confirm|migrate|deploy|"
    r"instrument|implement|rework|recut|cut|restructure|answer|explain|escalate|chase|"
    r"present|publish|handle|resolve|assign|track|measure|remove|enable|read)\b",
    re.IGNORECASE,
)
ACTION_NOISE_RE = re.compile(
    r"^\s*(?:"
    r"let(?:'s| us)\s+(?:see|talk|go|start|move|call it|do it|make it)"
    r"|i'?ll (?:be honest|say|admit|keep|stop|leave|hear|note that)"
    r"|we'?ll (?:see|talk|get to|come back)"
    r"|i (?:have|do|did|was|am|would|think|agree|hear|know)\b"
    r"|then let"
    r"|that'?s"
    r"|it'?s"
    r")",
    re.IGNORECASE,
)

DECISION_RE = re.compile(
    r"\b(?:we (?:decided|agreed|settled|landed|concluded)|decision is|agreed that|"
    r"the plan is|we(?:'| wi)?ll go with|final(?:ly|ised|ized))\b",
    re.IGNORECASE,
)

# Chapter titles get an emoji the way the real Notes panel does.
CHAPTER_EMOJI = ["🚀", "🔍", "📅", "💡", "📊", "🎯", "🛠️", "🤝", "📝", "⚡", "🧩", "🔄"]

SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9])")


def _sentences(text: str) -> list[str]:
    parts = [s.strip() for s in SENTENCE_SPLIT.split(text) if s.strip()]
    return [p for p in parts if len(p.split()) >= 3]


def _words(text: str) -> list[str]:
    """Content words only, with contractions reduced to their stem first."""
    words: list[str] = []
    for raw in re.findall(r"[a-zA-Z][a-zA-Z'\u2019\-]{1,}", text.lower()):
        token = raw.replace("\u2019", "'")
        for clitic in CONTRACTIONS:
            if token.endswith(clitic):
                token = token[: -len(clitic)]
                break
        if len(token) > 2 and token not in STOPWORDS:
            words.append(token)
    return words


def keyword_counts(segments: list[dict[str, Any]], limit: int = 12) -> list[tuple[str, int]]:
    """Top content words, with two-word phrases preferred over single words."""
    unigrams = Counter()
    bigrams = Counter()
    for segment in segments:
        words = _words(segment["text"])
        unigrams.update(words)
        bigrams.update(f"{a} {b}" for a, b in zip(words, words[1:]))

    chosen: list[tuple[str, int]] = []
    used: set[str] = set()
    for phrase, count in bigrams.most_common(40):
        if count < 2:
            break
        left, right = phrase.split()
        # Only keep a bigram if it explains most of its parts' occurrences.
        if count >= max(2, int(0.5 * min(unigrams[left], unigrams[right]))):
            chosen.append((phrase, count))
            used.update({left, right})
        if len(chosen) >= limit // 2:
            break
    for word, count in unigrams.most_common(60):
        if len(chosen) >= limit:
            break
        if word not in used and count >= 2:
            chosen.append((word, count))
            used.add(word)
    return chosen[:limit]


def _titlecase(phrase: str) -> str:
    minor = {"and", "or", "the", "of", "for", "to", "in", "on", "a", "an", "with"}
    words = phrase.split()
    return " ".join(w.capitalize() if i == 0 or w not in minor else w for i, w in enumerate(words))


def _score_sentence(sentence: str, weights: Counter, position: float) -> float:
    words = _words(sentence)
    if not words:
        return 0.0
    density = sum(weights.get(w, 0) for w in words) / (len(words) ** 0.65)
    length_fit = 1.0 if 8 <= len(words) <= 34 else 0.55
    # Openings and closings carry disproportionate signal in a meeting.
    edge_bonus = 1.18 if position < 0.12 or position > 0.88 else 1.0
    return density * length_fit * edge_bonus


def _chunk(segments: list[dict[str, Any]], target: int) -> list[list[dict[str, Any]]]:
    if not segments:
        return []
    count = max(1, min(target, len(segments)))
    size = max(1, len(segments) // count)
    chunks = [segments[i : i + size] for i in range(0, len(segments), size)]
    # Fold a stubby trailing chunk back into its predecessor.
    if len(chunks) > 1 and len(chunks[-1]) < max(1, size // 2):
        chunks[-2].extend(chunks.pop())
    return chunks


def _clean(sentence: str) -> str:
    sentence = re.sub(r"\s+", " ", sentence).strip().strip("-–— ")
    sentence = re.sub(r"^(?:so|and|but|well|okay|ok|yeah|right|um|uh)[,\s]+", "", sentence, flags=re.IGNORECASE)
    if sentence and sentence[0].islower():
        sentence = sentence[0].upper() + sentence[1:]
    if sentence and sentence[-1] not in ".!?":
        sentence += "."
    return sentence


def _sentiment(segments: list[dict[str, Any]]) -> str:
    positive = len(re.findall(
        r"\b(great|good|excellent|perfect|agree|agreed|happy|excited|love|nice|thanks|awesome|win|"
        r"solid|works|yes|absolutely|fantastic)\b",
        " ".join(s["text"] for s in segments), re.IGNORECASE))
    negative = len(re.findall(
        r"\b(concern|concerned|issue|issues|problem|problems|blocker|blocked|risk|risky|delay|"
        r"delayed|worried|bug|broken|fail|failing|churn|complain|frustrat)\b",
        " ".join(s["text"] for s in segments), re.IGNORECASE))
    if positive >= negative * 1.6 and positive >= 3:
        return "positive"
    if negative > positive * 1.2 and negative >= 3:
        return "negative"
    return "neutral"


def _first_name(name: str) -> str:
    return (name or "").split()[0] if name else ""


def extract_action_items(segments: list[dict[str, Any]], limit: int = 10) -> list[dict[str, Any]]:
    """Pull commitments out of the transcript, attributed and timestamped.

    "I'll ..." is owed by the speaker; "can you ..." / "Alice, please ..." is
    owed by whoever is being addressed, which we resolve against the roster.
    """
    roster = {}
    for segment in segments:
        roster.setdefault(_first_name(segment["speaker"]).lower(), segment["speaker"])

    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for segment in segments:
        for sentence in _sentences(segment["text"]):
            if len(items) >= limit:
                break
            if not ACTION_RE.search(sentence) or ACTION_NOISE_RE.match(sentence):
                continue
            if not DELIVERABLE_RE.search(sentence):
                continue
            if not 7 <= len(sentence.split()) <= 45 or len(sentence) > 260:
                continue

            assignee = segment["speaker"]
            lowered = sentence.lower()
            if re.search(r"\b(?:can|could|would) you\b|\bplease\b", lowered):
                # The sentence is addressed to someone else. A name in the
                # vocative — "Tomás, can you..." — wins over a name mentioned
                # later in passing ("...send it to Daniel"), which is the whole
                # difference between the owner and a bystander.
                vocative = re.match(r"\s*([\w\u00c0-\u024f'-]+)\s*[,:]", sentence)
                addressed = None
                if vocative and vocative.group(1).lower() in roster:
                    addressed = roster[vocative.group(1).lower()]
                if addressed is None or addressed == segment["speaker"]:
                    addressed = next(
                        (
                            full
                            for first, full in roster.items()
                            if first and re.search(rf"\b{re.escape(first)}\b", lowered) and full != segment["speaker"]
                        ),
                        None,
                    )
                assignee = addressed or next(
                    (s["speaker"] for s in segments if s["speaker"] != segment["speaker"]), assignee
                )

            text = _clean(sentence)
            fingerprint = re.sub(r"[^a-z ]", "", text.lower())[:70]
            if fingerprint in seen:
                continue
            seen.add(fingerprint)
            items.append(
                {
                    "text": text,
                    "assignee_name": assignee,
                    "timestamp_ms": segment["start_ms"],
                    "priority": "high" if re.search(r"\b(asap|urgent|today|tomorrow|blocker|critical)\b", lowered) else "medium",
                }
            )
    return items


def build_topics(segments: list[dict[str, Any]], count: int = 4) -> list[dict[str, Any]]:
    """Split the meeting into titled, timestamped chapters with bullets."""
    weights = Counter(dict(keyword_counts(segments, limit=40)))
    for phrase, score in list(weights.items()):
        for word in phrase.split():
            weights[word] = max(weights.get(word, 0), score)

    topics: list[dict[str, Any]] = []
    for index, chunk in enumerate(_chunk(segments, count)):
        local = keyword_counts(chunk, limit=3)
        title = _titlecase(local[0][0]) if local else f"Discussion {index + 1}"
        if len(local) > 1 and len(title.split()) == 1:
            title = f"{title} & {_titlecase(local[1][0])}"

        scored: list[tuple[float, str]] = []
        for position, segment in enumerate(chunk):
            for sentence in _sentences(segment["text"]):
                scored.append((_score_sentence(sentence, weights, position / max(1, len(chunk) - 1)), sentence))
        scored.sort(key=lambda pair: pair[0], reverse=True)

        bullets: list[str] = []
        for _, sentence in scored:
            candidate = _clean(sentence)
            if len(bullets) >= 3:
                break
            if any(candidate[:40].lower() == existing[:40].lower() for existing in bullets):
                continue
            bullets.append(candidate)

        topics.append(
            {
                "title": title,
                "bullets": bullets,
                "start_ms": chunk[0]["start_ms"],
                "end_ms": chunk[-1]["end_ms"],
                "emoji": CHAPTER_EMOJI[index % len(CHAPTER_EMOJI)],
            }
        )
    return topics


def summarize_extractive(
    segments: list[dict[str, Any]], title: str = "", participants: list[str] | None = None
) -> dict[str, Any]:
    if not segments:
        return {
            "gist": "", "overview": "", "bullet_points": [], "keywords": [], "questions": [],
            "sentiment": "neutral", "topics": [], "action_items": [], "generated_by": "extractive",
        }

    keywords = keyword_counts(segments, limit=10)
    weights = Counter(dict(keywords))
    for phrase, score in list(weights.items()):
        for word in phrase.split():
            weights[word] = max(weights.get(word, 0), score)

    scored: list[tuple[float, str]] = []
    for index, segment in enumerate(segments):
        position = index / max(1, len(segments) - 1)
        for sentence in _sentences(segment["text"]):
            scored.append((_score_sentence(sentence, weights, position), sentence))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    highlights = [_clean(sentence) for _, sentence in scored[:6]]

    names = participants or sorted({s["speaker"] for s in segments})
    who = ", ".join(names[:-1]) + f" and {names[-1]}" if len(names) > 1 else (names[0] if names else "the team")
    subject = _titlecase(keywords[0][0]) if keywords else (title or "the agenda")
    minutes = max(1, round((segments[-1]["end_ms"] - segments[0]["start_ms"]) / 60000))

    gist = f"{who} discussed {subject.lower()} across a {minutes}-minute conversation."
    overview = " ".join([gist] + highlights[:3])

    questions = [
        _clean(sentence)
        for segment in segments
        for sentence in _sentences(segment["text"])
        if sentence.rstrip().endswith("?") and len(sentence.split()) >= 6
    ][:6]

    outcomes = [
        _clean(sentence)
        for segment in segments
        for sentence in _sentences(segment["text"])
        if DECISION_RE.search(sentence) and len(sentence.split()) >= 8
    ][:4] or [h for h in highlights if len(h.split()) >= 8][:3]

    return {
        "gist": gist,
        "overview": overview,
        "bullet_points": outcomes,
        "keywords": [_titlecase(word) for word, _ in keywords],
        "questions": questions,
        "sentiment": _sentiment(segments),
        "topics": build_topics(segments),
        "action_items": extract_action_items(segments),
        "generated_by": "extractive",
        "model_name": None,
    }


# ---------------------------------------------------------------------------- LLM
LLM_PROMPT = """You are the meeting-notes engine behind a Fireflies-style app.
Read the transcript and reply with ONE JSON object, no prose and no code fence:

{{"gist": "one sentence, under 25 words",
  "overview": "2-4 sentence paragraph",
  "bullet_points": ["3-5 outcome/decision bullets"],
  "keywords": ["6-10 short topic phrases, Title Case"],
  "questions": ["open questions raised, verbatim-ish"],
  "sentiment": "positive|neutral|negative",
  "topics": [{{"title": "Chapter title", "emoji": "one emoji",
              "start_ms": 0, "end_ms": 0, "bullets": ["2-3 bullets"]}}],
  "action_items": [{{"text": "the commitment", "assignee_name": "speaker name",
                    "timestamp_ms": 0, "priority": "low|medium|high"}}]}}

Use only speaker names that appear in the transcript. Timestamps must be the
millisecond offsets shown in brackets.

Meeting title: {title}

Transcript:
{transcript}"""


def _transcript_for_llm(segments: list[dict[str, Any]], budget: int = 48_000) -> str:
    lines = [f"[{s['start_ms']}] {s['speaker']}: {s['text']}" for s in segments]
    text = "\n".join(lines)
    if len(text) <= budget:
        return text
    # Keep the head and tail: openings set the agenda, closings hold the asks.
    head = text[: int(budget * 0.6)]
    tail = text[-int(budget * 0.4) :]
    return f"{head}\n...\n{tail}"


def summarize_llm(segments: list[dict[str, Any]], title: str = "") -> dict[str, Any] | None:
    """Ask Claude for the same JSON shape. Returns None if unavailable."""
    if not settings.anthropic_api_key:
        return None
    try:
        import httpx

        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 4096,
                "messages": [
                    {
                        "role": "user",
                        "content": LLM_PROMPT.format(title=title, transcript=_transcript_for_llm(segments)),
                    }
                ],
            },
            timeout=90.0,
        )
        response.raise_for_status()
        text = "".join(block.get("text", "") for block in response.json().get("content", []))
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None
        data = json.loads(match.group(0))
    except Exception as exc:  # network, quota, malformed JSON — all non-fatal
        logger.warning("LLM summary unavailable, using extractive summariser: %s", exc)
        return None

    data.setdefault("topics", [])
    data.setdefault("action_items", [])
    data["generated_by"] = "llm"
    data["model_name"] = settings.anthropic_model
    return data


def summarize(
    segments: list[dict[str, Any]], title: str = "", participants: list[str] | None = None, use_llm: bool = True
) -> dict[str, Any]:
    """Public entry point: LLM when configured, extractive otherwise."""
    if use_llm and settings.anthropic_api_key:
        result = summarize_llm(segments, title)
        if result:
            return result
    return summarize_extractive(segments, title, participants)
