"""End-to-end API behaviour against a seeded workspace."""
from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

PASTED = (
    "[00:00:02] Alice Smith: We should ship the pricing page by Friday.\n"
    "[00:00:18] Bob Chen: I'll draft the copy and send it to Alice for review tomorrow.\n"
    "[00:00:40] Alice Smith: Bob, can you also update the FAQ section before the launch?\n"
)


def _create(client: TestClient, **overrides) -> dict:
    body = {
        "title": "Pricing Sync",
        "transcript_text": PASTED,
        "participants": [{"name": "Alice Smith", "is_host": True}, {"name": "Bob Chen"}],
        "tags": ["Test"],
        **overrides,
    }
    response = client.post("/api/meetings", json=body)
    assert response.status_code == 201, response.text
    return response.json()


# ------------------------------------------------------------------ smoke
def test_health(client: TestClient) -> None:
    assert client.get("/api/health").json()["status"] == "ok"


def test_seeded_workspace_is_complete(client: TestClient) -> None:
    page = client.get("/api/meetings", params={"page_size": 50}).json()
    assert page["total"] == 7
    for meeting in page["items"]:
        assert meeting["segment_count"] > 0
        assert meeting["participants"]
        assert meeting["gist"], f"{meeting['title']} has no summary gist"


def test_detail_returns_every_panel_in_one_request(client: TestClient) -> None:
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]
    detail = client.get(f"/api/meetings/{meeting_id}").json()
    assert detail["summary"] is not None
    assert detail["topics"] and detail["action_items"] and detail["segments"]
    starts = [segment["start_ms"] for segment in detail["segments"]]
    assert starts == sorted(starts), "transcript must come back in time order"


def test_unknown_meeting_is_404(client: TestClient) -> None:
    assert client.get("/api/meetings/does-not-exist").status_code == 404


# ------------------------------------------------------------ list & filter
def test_filters_and_sorting(client: TestClient) -> None:
    assert client.get("/api/meetings", params={"q": "Northwind"}).json()["total"] == 2
    assert client.get("/api/meetings", params={"participant": "Mei"}).json()["total"] >= 1
    assert client.get("/api/meetings", params={"tag": "Sales"}).json()["total"] == 1

    durations = [m["duration_seconds"] for m in client.get("/api/meetings", params={"sort": "duration"}).json()["items"]]
    assert durations == sorted(durations, reverse=True)

    titles = [m["title"] for m in client.get("/api/meetings", params={"sort": "title"}).json()["items"]]
    assert titles == sorted(titles)


def test_participant_filter_matches_a_person_who_never_spoke(client: TestClient) -> None:
    """A declared attendee is on the roster even with no transcript lines."""
    meeting = _create(client, participants=[{"name": "Alice Smith"}, {"name": "Silent Sam"}])
    names = {p["name"] for p in meeting["participants"]}
    assert "Silent Sam" in names
    assert client.get("/api/meetings", params={"participant": "Silent Sam"}).json()["total"] == 1


def test_pagination_reports_has_more(client: TestClient) -> None:
    page = client.get("/api/meetings", params={"page_size": 3, "page": 1}).json()
    assert len(page["items"]) == 3 and page["has_more"] is True
    last = client.get("/api/meetings", params={"page_size": 3, "page": 3}).json()
    assert last["has_more"] is False


# ------------------------------------------------------------------- CRUD
def test_create_from_pasted_transcript_derives_everything(client: TestClient) -> None:
    meeting = _create(client)
    assert len(meeting["segments"]) == 3
    assert meeting["duration_seconds"] > 0
    assert {p["name"] for p in meeting["participants"]} == {"Alice Smith", "Bob Chen"}
    assert meeting["summary"] is not None
    assert meeting["action_items"], "commitments should be extracted"


def test_generated_action_items_are_attributed_correctly(client: TestClient) -> None:
    meeting = _create(client)
    by_text = {item["text"]: item["assignee_name"] for item in meeting["action_items"]}
    drafting = next(text for text in by_text if "draft the copy" in text)
    faq = next(text for text in by_text if "FAQ" in text)
    assert by_text[drafting] == "Bob Chen"
    assert by_text[faq] == "Bob Chen", "a vocative 'Bob, can you...' is owed by Bob"


def test_create_without_a_transcript_still_records_the_roster(client: TestClient) -> None:
    meeting = _create(client, transcript_text=None, generate_summary=False)
    assert meeting["segments"] == []
    assert len(meeting["participants"]) == 2
    assert meeting["participants"][0]["is_host"] is True


def test_create_with_an_unparseable_transcript_is_422(client: TestClient) -> None:
    response = client.post("/api/meetings", json={"title": "Bad", "transcript_text": "{", "transcript_format": "json"})
    assert response.status_code == 422
    assert "detail" in response.json()


def test_update_and_delete(client: TestClient) -> None:
    meeting = _create(client)
    patched = client.patch(f"/api/meetings/{meeting['id']}", json={"title": "Renamed", "tags": ["A", "B"]}).json()
    assert patched["title"] == "Renamed"
    assert {tag["name"] for tag in patched["tags"]} == {"A", "B"}

    assert client.delete(f"/api/meetings/{meeting['id']}").status_code == 204
    assert client.get(f"/api/meetings/{meeting['id']}").status_code == 404


def test_favorite_toggles(client: TestClient) -> None:
    meeting = _create(client)
    assert client.post(f"/api/meetings/{meeting['id']}/favorite").json()["is_favorite"] is True
    assert client.post(f"/api/meetings/{meeting['id']}/favorite").json()["is_favorite"] is False


# ----------------------------------------------------------------- upload
def test_upload_vtt(client: TestClient) -> None:
    vtt = (
        "WEBVTT\n\n00:00:01.000 --> 00:00:06.000\n<v Dana Wu>Let's lock the vendor contract this week.\n\n"
        "00:00:07.000 --> 00:00:12.000\n<v Eli Roth>I'll send the redlines to legal tomorrow morning.\n"
    )
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("vendor-sync.vtt", vtt, "text/vtt")},
        data={"title": "Vendor Sync", "tags": "Ops"},
    )
    assert response.status_code == 201, response.text
    meeting = response.json()
    assert {p["name"] for p in meeting["participants"]} == {"Dana Wu", "Eli Roth"}
    assert meeting["source"] == "upload"


def test_upload_derives_a_title_from_the_filename(client: TestClient) -> None:
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("quarterly-board-review.txt", "Ana: We reviewed the numbers today.", "text/plain")},
    )
    assert response.json()["title"] == "quarterly board review"


def test_upload_accepts_a_json_participant_roster(client: TestClient) -> None:
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("sync.txt", "Dana: We start the migration on Monday morning.", "text/plain")},
        data={"participants": json.dumps([{"name": "Dana Wu", "email": "dana@x.dev"}])},
    )
    participant = response.json()["participants"][0]
    assert participant["name"] == "Dana Wu" and participant["email"] == "dana@x.dev"


# ------------------------------------------------------------- transcript
def test_editing_a_line_updates_the_search_index(client: TestClient) -> None:
    meeting = _create(client)
    segment_id = meeting["segments"][0]["id"]
    client.patch(
        f"/api/meetings/{meeting['id']}/transcript/{segment_id}",
        json={"text": "We should ship the pricing page on Wednesday instead."},
    )
    hits = client.get("/api/search", params={"q": "Wednesday instead"}).json()["segments"]
    assert any(hit["segment_id"] == segment_id for hit in hits)


def test_renaming_a_speaker_rewrites_their_lines(client: TestClient) -> None:
    meeting = _create(client)
    alice = next(p for p in meeting["participants"] if p["name"] == "Alice Smith")
    client.patch(f"/api/meetings/{meeting['id']}/participants/{alice['id']}", json={"name": "Alice Smythe"})

    after = client.get(f"/api/meetings/{meeting['id']}").json()
    assert "Alice Smith" not in {segment["speaker_name"] for segment in after["segments"]}
    assert "Alice Smythe" in {segment["speaker_name"] for segment in after["segments"]}


def test_reassigning_a_line_to_another_speaker(client: TestClient) -> None:
    meeting = _create(client)
    bob = next(p for p in meeting["participants"] if p["name"] == "Bob Chen")
    segment = client.patch(
        f"/api/meetings/{meeting['id']}/transcript/{meeting['segments'][0]['id']}",
        json={"speaker_id": bob["id"]},
    ).json()
    assert segment["speaker_name"] == "Bob Chen"


def test_a_line_from_another_meeting_is_404(client: TestClient) -> None:
    first, second = _create(client), _create(client, title="Other")
    response = client.patch(
        f"/api/meetings/{first['id']}/transcript/{second['segments'][0]['id']}", json={"text": "nope"}
    )
    assert response.status_code == 404


# ----------------------------------------------------------------- search
def test_transcript_search_returns_ordered_matches_with_snippets(client: TestClient) -> None:
    meetings = client.get("/api/meetings", params={"q": "Roadmap"}).json()["items"]
    meeting_id = meetings[0]["id"]
    hits = client.get(f"/api/meetings/{meeting_id}/transcript/search", params={"q": "retention"}).json()
    assert hits
    assert [hit["start_ms"] for hit in hits] == sorted(hit["start_ms"] for hit in hits)
    assert all("retention" in hit["snippet"].lower() for hit in hits)


def test_global_search_spans_titles_lines_and_tasks(client: TestClient) -> None:
    result = client.get("/api/search", params={"q": "renewal"}).json()
    assert result["total"] > 0
    assert result["segments"], "transcript lines should match"


def test_prefix_search_matches_partial_words(client: TestClient) -> None:
    assert client.get("/api/search", params={"q": "onboa"}).json()["segments"]


def test_hostile_query_does_not_500(client: TestClient) -> None:
    response = client.get("/api/search", params={"q": 'AND "or NOT ('})
    assert response.status_code == 200


# ------------------------------------------------------------ action items
def test_action_item_lifecycle(client: TestClient) -> None:
    meeting = _create(client)
    item = client.post(f"/api/meetings/{meeting['id']}/action-items", json={"text": "Book the launch review"}).json()
    assert item["source"] == "manual"

    completed = client.patch(f"/api/action-items/{item['id']}", json={"status": "completed"}).json()
    assert completed["status"] == "completed" and completed["completed_at"] is not None

    reopened = client.patch(f"/api/action-items/{item['id']}", json={"status": "open"}).json()
    assert reopened["completed_at"] is None

    assert client.delete(f"/api/action-items/{item['id']}").status_code == 204
    assert client.patch(f"/api/action-items/{item['id']}", json={"text": "x"}).status_code == 404


def test_assigning_to_someone_from_another_meeting_is_rejected(client: TestClient) -> None:
    first, second = _create(client), _create(client, title="Other")
    response = client.post(
        f"/api/meetings/{first['id']}/action-items",
        json={"text": "Cross-meeting assignee", "assignee_id": second["participants"][0]["id"]},
    )
    assert response.status_code == 400


def test_tasks_endpoint_filters_by_status(client: TestClient) -> None:
    everything = client.get("/api/tasks").json()
    open_only = client.get("/api/tasks", params={"status": "open"}).json()
    assert len(open_only) < len(everything)
    assert all(item["status"] == "open" for item in open_only)
    assert all(item["meeting_title"] for item in everything)


# ----------------------------------------------------------------- notes
def test_regenerate_rebuilds_notes_but_keeps_what_a_person_owns(client: TestClient) -> None:
    meeting = _create(client)
    manual = client.post(f"/api/meetings/{meeting['id']}/action-items", json={"text": "Hand-written follow-up"}).json()
    generated = next(item for item in meeting["action_items"] if item["source"] == "ai")
    client.patch(f"/api/action-items/{generated['id']}", json={"status": "completed"})

    after = client.post(f"/api/meetings/{meeting['id']}/summary/regenerate").json()
    texts = {item["text"] for item in after["action_items"]}
    assert "Hand-written follow-up" in texts, "a manually added item must survive"
    assert generated["text"] in texts, "a completed item must survive"
    assert after["summary"] is not None and after["topics"]

    # And it stays idempotent rather than duplicating on a second run.
    again = client.post(f"/api/meetings/{meeting['id']}/summary/regenerate").json()
    assert len([i for i in again["action_items"] if i["text"] == "Hand-written follow-up"]) == 1
    assert client.get(f"/api/meetings/{meeting['id']}").json()["summary"] is not None


def test_regenerating_without_a_transcript_is_400(client: TestClient) -> None:
    meeting = _create(client, transcript_text=None, generate_summary=False)
    assert client.post(f"/api/meetings/{meeting['id']}/summary/regenerate").status_code == 400


def test_editing_the_summary_marks_it_manual(client: TestClient) -> None:
    meeting = _create(client)
    summary = client.patch(f"/api/meetings/{meeting['id']}/summary", json={"gist": "Edited by hand."}).json()
    assert summary["gist"] == "Edited by hand." and summary["generated_by"] == "manual"


# ------------------------------------------------------- comments & clips
def test_comment_on_a_line_inherits_its_timestamp(client: TestClient) -> None:
    meeting = _create(client)
    segment = meeting["segments"][1]
    comment = client.post(
        f"/api/meetings/{meeting['id']}/comments", json={"body": "Good catch.", "segment_id": segment["id"]}
    ).json()
    assert comment["timestamp_ms"] == segment["start_ms"]
    assert client.delete(f"/api/comments/{comment['id']}").status_code == 204


def test_soundbite_excerpt_is_stitched_from_the_covered_lines(client: TestClient) -> None:
    meeting = _create(client)
    soundbite = client.post(
        f"/api/meetings/{meeting['id']}/soundbites", json={"title": "The ask", "start_ms": 0, "end_ms": 30_000}
    ).json()
    assert "pricing page" in (soundbite["transcript_excerpt"] or "")
    assert any(s["id"] == soundbite["id"] for s in client.get("/api/soundbites").json())


def test_a_backwards_soundbite_is_rejected(client: TestClient) -> None:
    meeting = _create(client)
    response = client.post(
        f"/api/meetings/{meeting['id']}/soundbites", json={"title": "Bad", "start_ms": 9000, "end_ms": 1000}
    )
    assert response.status_code == 400


# ------------------------------------------------------------------ misc
def test_deleting_a_meeting_purges_it_from_the_search_index(client: TestClient) -> None:
    meeting = _create(client, transcript_text="[00:00:01] Zed Quill: Xylophone procurement is on track.")
    assert client.get("/api/search", params={"q": "Xylophone"}).json()["segments"]
    client.delete(f"/api/meetings/{meeting['id']}")
    assert client.get("/api/search", params={"q": "Xylophone"}).json()["segments"] == []


def test_deleting_a_meeting_cascades_to_its_children(seeded, client: TestClient) -> None:
    from app import models

    meeting = _create(client)
    client.post(f"/api/meetings/{meeting['id']}/comments", json={"body": "note"})
    seeded.expire_all()
    assert seeded.query(models.TranscriptSegment).filter_by(meeting_id=meeting["id"]).count() > 0

    client.delete(f"/api/meetings/{meeting['id']}")
    seeded.expire_all()
    for model in (models.TranscriptSegment, models.Participant, models.Summary, models.Topic, models.ActionItem, models.Comment):
        assert seeded.query(model).filter_by(meeting_id=meeting["id"]).count() == 0, model.__name__


def test_exports(client: TestClient) -> None:
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]

    markdown = client.get(f"/api/meetings/{meeting_id}/export", params={"format": "md"})
    assert markdown.status_code == 200
    assert "## Transcript" in markdown.text and "attachment" in markdown.headers["content-disposition"]

    assert "[" in client.get(f"/api/meetings/{meeting_id}/export", params={"format": "txt"}).text
    assert json.loads(client.get(f"/api/meetings/{meeting_id}/export", params={"format": "json"}).text)["segments"]


def test_ask_returns_a_grounded_answer_with_citations(client: TestClient) -> None:
    meeting_id = client.get("/api/meetings", params={"q": "Roadmap"}).json()["items"][0]["id"]
    answer = client.post(f"/api/meetings/{meeting_id}/ask", json={"question": "What did we decide about mobile?"}).json()
    assert answer["answer"]
    assert answer["citations"]
    assert answer["generated_by"] == "retrieval"


def test_ask_with_no_match_falls_back_to_the_overview(client: TestClient) -> None:
    meeting_id = client.get("/api/meetings").json()["items"][0]["id"]
    answer = client.post(f"/api/meetings/{meeting_id}/ask", json={"question": "zzzzqqqxx"}).json()
    assert answer["citations"] == []
    assert answer["answer"]


def test_analytics_rollups(client: TestClient) -> None:
    data = client.get("/api/analytics/overview").json()
    assert data["total_meetings"] == 7
    assert data["total_duration_seconds"] > 0
    assert len(data["meetings_by_day"]) == 14
    assert data["top_speakers"]
    assert sum(speaker["percent"] for speaker in data["top_speakers"]) <= 100.5


def test_profile_can_be_updated(client: TestClient) -> None:
    assert client.patch("/api/me", json={"job_title": "Staff Engineer"}).json()["job_title"] == "Staff Engineer"


def test_empty_workspace_returns_an_empty_page_not_an_error(empty_client: TestClient) -> None:
    page = empty_client.get("/api/meetings").json()
    assert page["total"] == 0 and page["items"] == []
    assert empty_client.get("/api/tasks").json() == []


# ------------------------------------------------------------------- auth
def test_sign_in_issues_a_working_session(client: TestClient) -> None:
    created = client.post("/api/auth/session", json={"provider": "google"})
    assert created.status_code == 201
    body = created.json()
    assert body["token"] and body["provider"] == "google"
    assert body["user"]["email"]

    headers = {"Authorization": f"Bearer {body['token']}"}
    me = client.get("/api/auth/session", headers=headers).json()
    assert me["user"]["id"] == body["user"]["id"]
    assert client.get("/api/me", headers=headers).json()["id"] == body["user"]["id"]


def test_an_unknown_provider_is_rejected(client: TestClient) -> None:
    assert client.post("/api/auth/session", json={"provider": "myspace"}).status_code == 422


def test_signing_out_revokes_the_token(client: TestClient) -> None:
    token = client.post("/api/auth/session", json={"provider": "sso"}).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/session", headers=headers).status_code == 200

    assert client.delete("/api/auth/session", headers=headers).status_code == 204
    assert client.get("/api/auth/session", headers=headers).status_code == 401
    # Idempotent: signing out twice is not an error.
    assert client.delete("/api/auth/session", headers=headers).status_code == 204


@pytest.mark.parametrize("header", ["", "Bearer", "Bearer   ", "Basic abc", "Bearer not-a-real-token"])
def test_a_bad_authorization_header_is_ignored_not_fatal(client: TestClient, header: str) -> None:
    """The default-user fallback keeps /docs and curl usable without a login."""
    response = client.get("/api/me", headers={"Authorization": header} if header else {})
    assert response.status_code == 200


def test_reading_an_invalid_session_is_401(client: TestClient) -> None:
    assert client.get("/api/auth/session", headers={"Authorization": "Bearer nope"}).status_code == 401


def test_active_sessions_are_listed_and_revoked_ones_are_not(client: TestClient) -> None:
    first = client.post("/api/auth/session", json={"provider": "google"}).json()["token"]
    second = client.post("/api/auth/session", json={"provider": "microsoft"}).json()["token"]
    headers = {"Authorization": f"Bearer {first}"}

    tokens = {row["id"] for row in client.get("/api/auth/sessions", headers=headers).json()}
    assert {first, second} <= tokens

    client.delete("/api/auth/session", headers={"Authorization": f"Bearer {second}"})
    tokens = {row["id"] for row in client.get("/api/auth/sessions", headers=headers).json()}
    assert second not in tokens and first in tokens


def test_deleting_a_user_cascades_to_their_sessions(seeded, client: TestClient) -> None:
    from app import models

    token = client.post("/api/auth/session", json={"provider": "google"}).json()["token"]
    seeded.expire_all()
    user = seeded.get(models.Session, token).user
    seeded.delete(user)
    seeded.commit()
    assert seeded.get(models.Session, token) is None
