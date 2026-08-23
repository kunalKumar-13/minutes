"""AI Skills: saved prompts that run over meetings and produce a Feed entry.

Relationship to the summariser
------------------------------
`summarizer.py` turns a transcript into the fixed set of panels every meeting
gets — Overview, chapters, action items. A Skill is that same idea with the
prompt lifted out into a row, so a user can ask a meeting a question the code
never anticipated ("score this candidate", "list every objection") and get a
durable, filterable answer back.

Two execution backends, same contract, exactly as the summariser does it:

* ``extractive`` — deterministic, no network, always available. It reads the
  skill's instructions as a relevance signal, scores transcript sentences
  against it, and assembles a digest. Identical on every run, which is what
  makes the seeded Feed reproducible and the tests meaningful.
* ``llm`` — used only when ``ANTHROPIC_API_KEY`` is set. Better prose, same JSON
  shape, and any failure falls back to extractive rather than surfacing an
  error, because a third party being down must not break the Feed.
"""
from __future__ import annotations

import json
import logging
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..config import settings
from .summarizer import (
    STOPWORDS,
    _clean,
    _score_sentence,
    _sentences,
    extract_action_items,
    keyword_counts,
)
from .transcript_parser import ms_to_timestamp

logger = logging.getLogger(__name__)

# Fireflies meters the expensive step and bundles the cheap one: transcription
# is unlimited, AI actions draw down a pool. One credit per meeting a skill runs
# on is their published rule, and the free tier's pool is 20.
CREDITS_PER_RUN = 1
CREDIT_ALLOWANCE = 20


# --------------------------------------------------------------------------- catalogue
# The built-in skills offered on the Discover tab. Kept as code rather than seed
# rows so the catalogue is the same on a fresh clone as on a seeded one; a row
# is written only when someone enables or edits a template.
TEMPLATES: list[dict[str, Any]] = [
    {
        "key": "sales_call",
        "name": "Sales Call Digest",
        "category": "sales",
        "description": "Pain points, business needs and next steps from a sales conversation.",
        "instructions": (
            "Read the call and pull out what the buyer actually needs. List the pain points they "
            "described in their own words, the business outcome they are trying to reach, the "
            "budget or timeline signals they gave, and the concrete next step each side owes."
        ),
        "output_type": "text",
        "tint": "orange",
    },
    {
        "key": "objections",
        "name": "Objection Tracker",
        "category": "sales",
        "description": "Every concern, hesitation or objection the customer raised.",
        "instructions": (
            "List every objection, concern or hesitation the customer raised, quoting the phrasing "
            "they used. For each one, note whether it was answered on the call and what the answer was."
        ),
        "output_type": "text",
        "tint": "rose",
    },
    {
        "key": "bant",
        "name": "BANT Qualification",
        "category": "sales",
        "description": "Budget, authority, need and timeline, extracted from the call.",
        "instructions": (
            "Qualify this opportunity against BANT. Budget: what did they say about cost or funding? "
            "Authority: who decides, and were they on the call? Need: what problem are they solving? "
            "Timeline: when do they need it working? Say plainly when a dimension was not discussed."
        ),
        "output_type": "text",
        "tint": "amber",
    },
    {
        "key": "followup_email",
        "name": "Follow-Up Email",
        "category": "sales",
        "description": "A ready-to-send follow-up with subject line and next steps.",
        "instructions": (
            "Draft the follow-up email this call earned. Give it a subject line, a short opening that "
            "references something specific from the conversation, a bulleted recap of what was agreed, "
            "and a clear next step with an owner and a date. Write it ready to send."
        ),
        "output_type": "text",
        "tint": "cyan",
    },
    {
        "key": "candidate_scorecard",
        "name": "Candidate Scorecard",
        "category": "recruiting",
        "description": "Score a candidate across the signals the panel discussed.",
        "instructions": (
            "Score this candidate. For each signal the interview actually probed — technical depth, "
            "communication, ownership, relevant experience — give the evidence from the transcript and "
            "a rating. Finish with a recommendation and the strongest reason against it."
        ),
        "output_type": "text",
        "tint": "purple",
    },
    {
        "key": "interview_notes",
        "name": "Interview Notes",
        "category": "recruiting",
        "description": "Structured notes on what the candidate was asked and answered.",
        "instructions": (
            "Summarise the interview as question-and-answer pairs. For each question the panel asked, "
            "capture the substance of the candidate's answer and any follow-up that was needed."
        ),
        "output_type": "text",
        "tint": "violet",
    },
    {
        "key": "product_feedback",
        "name": "Product Feedback Digest",
        "category": "product",
        "description": "Feature requests, bug reports and recurring themes.",
        "instructions": (
            "Pull out everything said about the product. Separate feature requests from bug reports "
            "from general reactions, and note who said each one and how strongly."
        ),
        "output_type": "text",
        "tint": "emerald",
    },
    {
        "key": "decisions_log",
        "name": "Decision Log",
        "category": "general",
        "description": "What was decided, by whom, and what is still open.",
        "instructions": (
            "List the decisions this meeting actually made. For each, record what was decided, who "
            "made the call, and what it now unblocks. Then list what was raised but left unresolved."
        ),
        "output_type": "text",
        "tint": "blue",
    },
    {
        "key": "standup_digest",
        "name": "Standup Digest",
        "category": "general",
        "description": "Roll a run of standups into one status update.",
        "instructions": (
            "Turn this into a status update: what shipped, what is in flight, and what is blocked. "
            "Attribute each line to the person who owns it."
        ),
        "output_type": "text",
        "tint": "sky",
    },
    {
        "key": "talk_time",
        "name": "Talk Time Balance",
        "category": "coaching",
        "description": "Who dominated the conversation, as a chart.",
        "instructions": (
            "Measure how the conversation was shared. Report each speaker's share of the talking and "
            "flag anyone who held the floor for an unusually long stretch."
        ),
        "output_type": "chart",
        "tint": "teal",
    },
]

TEMPLATES_BY_KEY = {t["key"]: t for t in TEMPLATES}
CATEGORIES = sorted({t["category"] for t in TEMPLATES})


# --------------------------------------------------------------------------- matching
def meeting_matches(skill: models.Skill, meeting: models.Meeting) -> bool:
    """Does this skill's "Run skill on" filter select this meeting?

    Scope "all" takes everything. Scope "custom" ANDs together whichever of the
    three filters are set — an unset filter is not a constraint, so a skill with
    only a title filter is not also silently requiring a host match.
    """
    if skill.scope != "custom":
        return True

    if skill.filter_title:
        if skill.filter_title.strip().lower() not in (meeting.title or "").lower():
            return False

    if skill.filter_host:
        needle = skill.filter_host.strip().lower()
        host = next((p for p in meeting.participants if p.is_host), None)
        candidates = [meeting.owner.name or "", meeting.owner.email or ""]
        if host:
            candidates += [host.name or "", host.email or ""]
        if not any(needle in c.lower() for c in candidates if c):
            return False

    if skill.filter_participant:
        needle = skill.filter_participant.strip().lower()
        haystack = [f"{p.name or ''} {p.email or ''}" for p in meeting.participants]
        if not any(needle in h.lower() for h in haystack):
            return False

    return True


def segments_for(meeting: models.Meeting) -> list[dict[str, Any]]:
    """The transcript in the shape the summariser helpers expect."""
    return [
        {
            "speaker": segment.speaker_name,
            "text": segment.text,
            "start_ms": segment.start_ms,
            "end_ms": segment.end_ms,
        }
        for segment in meeting.segments
    ]


# --------------------------------------------------------------------------- execution
def _instruction_weights(instructions: str, segments: list[dict[str, Any]]) -> Counter:
    """Score words by how much this *skill* cares about them.

    The instructions are the signal we have about what the user wants pulled
    out, so its content words are weighted far above the transcript's own
    frequent terms. Without this, every skill would return the same digest.
    """
    weights: Counter = Counter()
    for word in re.findall(r"[a-z][a-z'-]+", instructions.lower()):
        if word in STOPWORDS or len(word) < 4:
            continue
        weights[word] += 6

    for phrase, score in keyword_counts(segments, limit=12):
        weights[phrase] = max(weights.get(phrase, 0), score)
        for word in phrase.split():
            weights[word] = max(weights.get(word, 0), score)
    return weights


def _talk_time_chart(segments: list[dict[str, Any]]) -> dict[str, Any]:
    """Seconds of speech per speaker, largest first."""
    totals: Counter = Counter()
    for segment in segments:
        totals[segment["speaker"]] += max(0, segment["end_ms"] - segment["start_ms"])
    ordered = totals.most_common()
    total_ms = sum(totals.values()) or 1
    return {
        "labels": [name for name, _ in ordered],
        "values": [round(ms / 1000) for _, ms in ordered],
        "shares": [round(100 * ms / total_ms) for _, ms in ordered],
        "unit": "seconds",
    }


def run_extractive(skill: models.Skill, segments: list[dict[str, Any]], meeting: models.Meeting) -> dict[str, Any]:
    """Deterministic execution. Always available, never calls out."""
    if not segments:
        return {"body": "This meeting has no transcript yet, so there was nothing for the skill to read."}

    weights = _instruction_weights(skill.instructions, segments)

    scored: list[tuple[float, str, dict[str, Any]]] = []
    for index, segment in enumerate(segments):
        position = index / max(1, len(segments) - 1)
        for sentence in _sentences(segment["text"]):
            if len(sentence.split()) < 6:
                continue
            scored.append((_score_sentence(sentence, weights, position), sentence, segment))
    scored.sort(key=lambda row: row[0], reverse=True)

    findings = [
        {
            "text": _clean(sentence),
            "speaker": segment["speaker"],
            "timestamp": ms_to_timestamp(segment["start_ms"]),
            "start_ms": segment["start_ms"],
        }
        for _, sentence, segment in scored[:6]
    ]

    commitments = [
        {"text": item["text"], "owner": item.get("assignee_name"), "timestamp_ms": item.get("timestamp_ms")}
        for item in extract_action_items(segments, limit=5)
    ]

    lines = [f"### {skill.name}", ""]
    if findings:
        lines.append("**What the meeting said**")
        lines += [f"- {f['text']} — {f['speaker']} at {f['timestamp']}" for f in findings]
        lines.append("")
    if commitments:
        lines.append("**What someone owes**")
        lines += [f"- {c['text']}" + (f" — {c['owner']}" if c["owner"] else "") for c in commitments]
        lines.append("")

    signals = [phrase for phrase, _ in keyword_counts(segments, limit=8)]
    if signals:
        lines.append("**Signals**")
        lines.append(", ".join(signals))

    output: dict[str, Any] = {
        "body": "\n".join(lines).strip(),
        "findings": findings,
        "commitments": commitments,
    }
    if skill.output_type == "chart":
        output["chart"] = _talk_time_chart(segments)
    return output


LLM_PROMPT = """You are running a saved "AI Skill" over one meeting transcript.

Skill name: {name}
Skill instructions (follow these exactly):
{instructions}

Meeting title: {title}

Transcript (each line is [start_ms] Speaker: text):
{transcript}

Return ONLY a JSON object:
{{
  "body": "your answer as GitHub-flavoured markdown, following the instructions above",
  "findings": [{{"text": "...", "speaker": "...", "start_ms": 0}}]
}}
Ground every claim in the transcript. If the instructions ask for something the
meeting never covered, say so plainly rather than inventing it."""


def run_llm(skill: models.Skill, segments: list[dict[str, Any]], meeting: models.Meeting) -> dict[str, Any] | None:
    """Ask Claude to run the skill. Returns None when unavailable, so the
    caller falls back to the extractive path rather than failing the run."""
    if not settings.anthropic_api_key:
        return None
    try:
        import httpx

        from .summarizer import _transcript_for_llm

        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 3072,
                "messages": [
                    {
                        "role": "user",
                        "content": LLM_PROMPT.format(
                            name=skill.name,
                            instructions=skill.instructions,
                            title=meeting.title,
                            transcript=_transcript_for_llm(segments),
                        ),
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
        logger.warning("Skill %s falling back to extractive: %s", skill.name, exc)
        return None

    if not isinstance(data, dict) or not data.get("body"):
        return None
    data.setdefault("findings", [])
    if skill.output_type == "chart":
        data["chart"] = _talk_time_chart(segments)
    return data


def execute(skill: models.Skill, meeting: models.Meeting, use_llm: bool = True) -> tuple[dict[str, Any], str]:
    """Run the skill and report which backend produced the answer."""
    segments = segments_for(meeting)
    if use_llm and settings.anthropic_api_key:
        result = run_llm(skill, segments, meeting)
        if result:
            return result, "llm"
    return run_extractive(skill, segments, meeting), "extractive"


def run_for_meeting(
    db: Session, skill: models.Skill, meeting: models.Meeting, use_llm: bool = True
) -> models.SkillRun:
    """Execute and persist. Re-running a skill on the same meeting replaces the
    previous run rather than stacking duplicates in the Feed — the pair is
    unique in the schema, so this is the only correct behaviour."""
    run = (
        db.query(models.SkillRun)
        .filter(models.SkillRun.skill_id == skill.id, models.SkillRun.meeting_id == meeting.id)
        .first()
    )
    if run is None:
        run = models.SkillRun(skill_id=skill.id, meeting_id=meeting.id)
        db.add(run)

    try:
        content, backend = execute(skill, meeting, use_llm=use_llm)
        run.content = content
        run.generated_by = backend
        run.status = "ready"
        run.error = None
    except Exception as exc:  # a broken skill must not take the request down
        logger.exception("Skill %s failed on meeting %s", skill.id, meeting.id)
        run.content = {}
        run.status = "error"
        run.error = str(exc)

    run.credits_used = CREDITS_PER_RUN
    run.created_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(run)
    return run


def credits_used(db: Session, user: models.User) -> int:
    """Credits this user has spent — the sum of what their runs actually cost."""
    total = (
        db.query(models.SkillRun)
        .join(models.Skill, models.Skill.id == models.SkillRun.skill_id)
        .filter(models.Skill.owner_id == user.id)
        .with_entities(models.SkillRun.credits_used)
        .all()
    )
    return sum(row[0] or 0 for row in total)
