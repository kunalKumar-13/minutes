"""AI Skills: catalogue, CRUD, ownership scoping, execution, credits."""
from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from app import models
from app.services import skills as skills_service

BANT = {"template_key": "bant", "name": "BANT Qualification", "instructions": "Qualify against BANT properly."}


@pytest.fixture(autouse=True)
def _clear_skills(db: Session):
    """Skills hang off users, which survive `_wipe`, so clear them per test."""
    db.query(models.SkillRun).delete()
    db.query(models.Skill).delete()
    db.commit()
    yield
    db.query(models.SkillRun).delete()
    db.query(models.Skill).delete()
    db.commit()


# ------------------------------------------------------------------- catalogue
def test_templates_are_listed_and_annotated(client):
    templates = client.get("/api/skills/templates").json()
    assert len(templates) == len(skills_service.TEMPLATES)
    assert all(t["skill_id"] is None and t["is_enabled"] is False for t in templates)

    created = client.post("/api/skills", json={**BANT, "is_enabled": True}).json()

    after = {t["key"]: t for t in client.get("/api/skills/templates").json()}
    assert after["bant"]["skill_id"] == created["id"]
    assert after["bant"]["is_enabled"] is True


def test_templates_filter_by_category(client):
    sales = client.get("/api/skills/templates", params={"category": "sales"}).json()
    assert sales and {t["category"] for t in sales} == {"sales"}


# ------------------------------------------------------------------------ CRUD
def test_enabling_a_template_twice_returns_the_same_skill(client):
    first = client.post("/api/skills", json={**BANT, "is_enabled": True})
    second = client.post("/api/skills", json={**BANT, "is_enabled": True})
    assert first.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert len(client.get("/api/skills").json()) == 1


def test_duplicate_name_is_rejected(client):
    body = {"name": "Renewal Risk", "instructions": "Flag every renewal risk raised on the call."}
    assert client.post("/api/skills", json=body).status_code == 201
    assert client.post("/api/skills", json=body).status_code == 409


def test_unknown_template_key_is_rejected(client):
    response = client.post("/api/skills", json={**BANT, "template_key": "not-a-template"})
    assert response.status_code == 400


def test_instructions_have_a_minimum_length(client):
    response = client.post("/api/skills", json={"name": "Too short", "instructions": "hi"})
    assert response.status_code == 422


def test_update_and_delete(client):
    skill = client.post("/api/skills", json=BANT).json()

    patched = client.patch(f"/api/skills/{skill['id']}", json={"schedule": "weekly", "is_enabled": True}).json()
    assert patched["schedule"] == "weekly" and patched["is_enabled"] is True

    assert client.delete(f"/api/skills/{skill['id']}").status_code == 204
    assert client.get(f"/api/skills/{skill['id']}").status_code == 404


# ------------------------------------------------------------------- ownership
def test_another_users_skill_is_not_reachable(client, db: Session):
    """The security property that matters: skills are scoped to their owner."""
    stranger = models.User(name="Stranger", email="stranger@example.com")
    db.add(stranger)
    db.commit()
    theirs = models.Skill(owner_id=stranger.id, name="Private", instructions="Their private prompt text.")
    db.add(theirs)
    db.commit()

    assert client.get(f"/api/skills/{theirs.id}").status_code == 404
    assert client.patch(f"/api/skills/{theirs.id}", json={"name": "Hijacked"}).status_code == 404
    assert client.delete(f"/api/skills/{theirs.id}").status_code == 404
    assert theirs.id not in {s["id"] for s in client.get("/api/skills").json()}

    db.delete(theirs)
    db.delete(stranger)
    db.commit()


# ------------------------------------------------------------------- execution
def test_preview_returns_real_output_and_persists_nothing(client):
    skill = client.post("/api/skills", json=BANT).json()

    preview = client.post(f"/api/skills/{skill['id']}/preview").json()
    assert preview["results"], "preview should run against the seeded meetings"
    assert all(r["content"]["body"].strip() for r in preview["results"])

    assert client.get("/api/skills/feed").json() == []
    assert client.get("/api/skills/credits").json()["used"] == 0


def test_run_writes_a_feed_entry_and_charges_a_credit(client):
    skill = client.post("/api/skills", json=BANT).json()
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]

    runs = client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": meeting_id}).json()
    assert len(runs) == 1
    assert runs[0]["status"] == "ready"
    assert runs[0]["generated_by"] == "extractive"
    assert runs[0]["credits_used"] == 1
    assert runs[0]["content"]["body"]

    feed = client.get("/api/skills/feed").json()
    assert [r["id"] for r in feed] == [runs[0]["id"]]
    assert client.get("/api/skills/credits").json()["used"] == 1


def test_rerunning_replaces_rather_than_duplicates(client):
    skill = client.post("/api/skills", json=BANT).json()
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]

    first = client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": meeting_id}).json()[0]
    second = client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": meeting_id}).json()[0]

    assert second["id"] == first["id"]
    assert len(client.get("/api/skills/feed").json()) == 1


def test_run_across_matching_meetings(client):
    skill = client.post("/api/skills", json={**BANT, "is_enabled": True}).json()
    runs = client.post(f"/api/skills/{skill['id']}/run", json={"limit": 3}).json()
    assert 1 <= len(runs) <= 3
    assert client.get("/api/skills/credits").json()["used"] == len(runs)


def test_runs_are_exposed_per_meeting(client):
    skill = client.post("/api/skills", json=BANT).json()
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]
    client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": meeting_id})

    runs = client.get(f"/api/meetings/{meeting_id}/skill-runs").json()
    assert len(runs) == 1 and runs[0]["meeting_id"] == meeting_id


def test_chart_skill_produces_a_chart(client):
    skill = client.post(
        "/api/skills",
        json={
            "template_key": "talk_time",
            "name": "Talk Time Balance",
            "instructions": "Measure how the conversation was shared between speakers.",
            "output_type": "chart",
        },
    ).json()
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]

    run = client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": meeting_id}).json()[0]
    chart = run["content"]["chart"]
    assert chart["labels"] and len(chart["labels"]) == len(chart["values"])
    assert sum(chart["shares"]) == pytest.approx(100, abs=2)


def test_different_instructions_produce_different_output(client):
    """The instructions must actually steer the result, or the feature is a lie."""
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]
    a = client.post("/api/skills", json={"name": "Pricing lens", "instructions": "Extract every mention of pricing, discount, contract value and budget."}).json()
    b = client.post("/api/skills", json={"name": "Hiring lens", "instructions": "Extract every mention of hiring, candidates, interviews and headcount."}).json()

    out_a = client.post(f"/api/skills/{a['id']}/run", json={"meeting_id": meeting_id}).json()[0]["content"]["body"]
    out_b = client.post(f"/api/skills/{b['id']}/run", json={"meeting_id": meeting_id}).json()[0]["content"]["body"]
    assert out_a != out_b


# --------------------------------------------------------------------- filters
def test_custom_title_filter_selects_meetings(client, db: Session, seeded):
    meeting = db.query(models.Meeting).first()
    word = meeting.title.split()[0]

    skill = client.post(
        "/api/skills",
        json={
            "name": "Filtered",
            "instructions": "Summarise only the meetings that match this filter.",
            "scope": "custom",
            "filter_title": word,
        },
    ).json()

    runs = client.post(f"/api/skills/{skill['id']}/run", json={"limit": 20}).json()
    assert runs, "the filter should match at least the meeting it was taken from"
    assert all(word.lower() in r["meeting_title"].lower() for r in runs)


def test_filter_that_matches_nothing_is_a_400(client):
    skill = client.post(
        "/api/skills",
        json={
            "name": "Impossible",
            "instructions": "This filter is deliberately impossible to satisfy.",
            "scope": "custom",
            "filter_title": "zzz-no-such-meeting-zzz",
        },
    ).json()
    assert client.post(f"/api/skills/{skill['id']}/run", json={"limit": 20}).status_code == 400


# --------------------------------------------------------------------- credits
def test_run_is_refused_when_it_would_exceed_the_allowance(client, db: Session, monkeypatch):
    monkeypatch.setattr(skills_service, "CREDIT_ALLOWANCE", 1)
    skill = client.post("/api/skills", json=BANT).json()
    ids = [m["id"] for m in client.get("/api/meetings").json()["items"][:2]]

    assert client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": ids[0]}).status_code == 200
    denied = client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": ids[1]})
    assert denied.status_code == 402
    assert "credits" in denied.json()["detail"].lower()
    # Nothing was charged for the refused run.
    assert client.get("/api/skills/credits").json()["used"] == 1


def test_deleting_a_skill_removes_its_runs(client):
    skill = client.post("/api/skills", json=BANT).json()
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]
    client.post(f"/api/skills/{skill['id']}/run", json={"meeting_id": meeting_id})
    assert client.get("/api/skills/feed").json()

    client.delete(f"/api/skills/{skill['id']}")
    assert client.get("/api/skills/feed").json() == []
