"""The notes engine: what gets pulled out, and who it gets attributed to."""
from __future__ import annotations

from app.services import summarizer as sm
from app.services import transcript_parser as tp

TRANSCRIPT = """[00:00:04] Priya Raman: Retention is flat at thirty-eight percent and that is the problem.
[00:00:30] Daniel Okafor: I'll circulate the search design doc by Wednesday with the rollback plan.
[00:01:10] Priya Raman: Tomas, can you draft the event schema and send it to Daniel for review?
[00:01:40] Tomas Ferreira: I'll draft the schema by the end of next week.
[00:02:10] Daniel Okafor: I have, and I'll keep pushing on this.
[00:02:30] Priya Raman: We agreed that mobile goes on the no-list for the whole quarter.
"""


def _segments():
    return tp.parse(TRANSCRIPT)


def test_a_vocative_name_wins_over_a_name_mentioned_in_passing() -> None:
    """"Tomas, can you ... send it to Daniel" is owed by Tomas, not Daniel."""
    items = sm.extract_action_items(_segments())
    drafting = next(item for item in items if "event schema" in item["text"])
    assert drafting["assignee_name"] == "Tomas Ferreira"


def test_a_first_person_commitment_belongs_to_the_speaker() -> None:
    items = sm.extract_action_items(_segments())
    doc = next(item for item in items if "search design doc" in item["text"])
    assert doc["assignee_name"] == "Daniel Okafor"
    assert doc["timestamp_ms"] == 30_000


def test_cue_words_without_a_deliverable_are_not_action_items() -> None:
    texts = [item["text"] for item in sm.extract_action_items(_segments())]
    assert not any(text.startswith("I have") for text in texts), texts


def test_action_items_are_deduplicated() -> None:
    doubled = tp.parse(TRANSCRIPT + TRANSCRIPT)
    items = sm.extract_action_items(doubled)
    fingerprints = [item["text"].lower() for item in items]
    assert len(fingerprints) == len(set(fingerprints))


def test_urgent_language_raises_priority() -> None:
    segments = tp.parse("[00:00:02] Alice Smith: I'll fix the critical outage today, it is urgent.")
    assert sm.extract_action_items(segments)[0]["priority"] == "high"


def test_keywords_skip_contractions_and_filler() -> None:
    keywords = [word for word, _ in sm.keyword_counts(_segments(), limit=10)]
    assert not any("'" in word for word in keywords)
    assert not any(word in {"alright", "okay", "yeah"} for word in keywords)


def test_summary_has_every_section_the_ui_renders() -> None:
    result = sm.summarize_extractive(_segments(), title="Roadmap")
    for key in ("gist", "overview", "bullet_points", "keywords", "questions", "sentiment", "topics", "action_items"):
        assert key in result
    assert result["generated_by"] == "extractive"
    assert result["gist"]


def test_topics_are_contiguous_and_ordered() -> None:
    topics = sm.build_topics(_segments(), count=3)
    assert topics
    starts = [topic["start_ms"] for topic in topics]
    assert starts == sorted(starts)
    for topic in topics:
        assert topic["end_ms"] >= topic["start_ms"]
        assert topic["emoji"]


def test_summarizing_nothing_returns_empty_sections_rather_than_failing() -> None:
    result = sm.summarize_extractive([])
    assert result["topics"] == []
    assert result["action_items"] == []


def test_sentiment_reads_negative_language() -> None:
    negative = tp.parse(
        "[00:00:01] Alice: There is a serious problem and a blocker here.\n"
        "[00:00:10] Bob: I am worried, this is a risk and the delay is a real issue.\n"
        "[00:00:20] Alice: Another bug, and customers complain about it constantly."
    )
    assert sm.summarize_extractive(negative)["sentiment"] == "negative"
