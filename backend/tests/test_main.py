# ─────────────────────────────────────────────────────────────
# MeetingMind — Backend Smoke Tests
# Run: cd backend && pytest tests/ -v
# Purpose: basic route validation — ensures nothing is broken
# before deployment. Not exhaustive — see ROADMAP.md for v3.0
# full test coverage plan.
# ─────────────────────────────────────────────────────────────

import io
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


# ── Health check ─────────────────────────────────────────────
def test_health_check():
    """GET / should return status and correct version."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "MeetingMind is running!"
    assert data["version"] == "2.0.0"


# ── /transcribe — file validation ────────────────────────────
def test_transcribe_rejects_invalid_extension():
    """POST /transcribe should reject non-audio file types."""
    fake_file = io.BytesIO(b"this is not audio")
    response = client.post(
        "/transcribe",
        files={"audio": ("meeting.txt", fake_file, "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data
    assert "MP3" in data["error"] or "supported" in data["error"]


def test_transcribe_rejects_pdf():
    """PDF files should be rejected with a clear error message."""
    fake_file = io.BytesIO(b"%PDF fake content")
    response = client.post(
        "/transcribe",
        files={"audio": ("meeting.pdf", fake_file, "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


# ── /analyze — input validation ──────────────────────────────
def test_analyze_empty_transcript():
    """POST /analyze with empty utterances should return an error."""
    response = client.post("/analyze", json={
        "utterances": [],
        "speaker_map": {},
        "meeting_context": {},
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


def test_analyze_valid_structure():
    """POST /analyze with valid input should return expected keys.
    Note: this calls Groq — requires GROQ_API_KEY in environment.
    Skip in CI if API key not present.
    """
    import os
    if not os.environ.get("GROQ_API_KEY"):
        pytest.skip("GROQ_API_KEY not set — skipping live API test")

    response = client.post("/analyze", json={
        "utterances": [
            {"speaker": "A", "text": "We need to launch the product by Friday.", "start_ms": 0, "end_ms": 4000},
            {"speaker": "B", "text": "I can have the backend ready by Wednesday.", "start_ms": 4200, "end_ms": 8000},
        ],
        "speaker_map": {"A": "Alice", "B": "Bob"},
        "meeting_context": {"title": "Test Meeting", "date": "1 April 2026"},
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" not in data
    # Check core required keys are present
    for key in ["summary", "action_items", "decisions", "sentiment", "effectiveness_score"]:
        assert key in data, f"Missing key: {key}"


# ── /draft-email — guard clause ──────────────────────────────
def test_draft_email_rejects_empty_summary():
    """POST /draft-email with empty summary should return an error."""
    response = client.post("/draft-email", json={
        "summary": "",
        "decisions": [],
        "action_items": [],
        "key_topics": [],
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" in data


# ── /coach — structure validation ────────────────────────────
def test_coach_live():
    """POST /coach with valid input should return expected keys.
    Requires GROQ_API_KEY.
    """
    import os
    if not os.environ.get("GROQ_API_KEY"):
        pytest.skip("GROQ_API_KEY not set — skipping live API test")

    response = client.post("/coach", json={
        "effectiveness_score": 6,
        "effectiveness_reason": "Good decisions were made but open questions remained.",
        "open_questions": ["What is the rollback plan?"],
        "risk_flags": ["Payment gateway not tested"],
        "sentiment": "Mixed",
        "action_items": [{"task": "Test payment gateway", "owner": "Bob", "deadline": "Wednesday", "priority": "High"}],
        "meeting_type": "Planning",
    })
    assert response.status_code == 200
    data = response.json()
    assert "error" not in data
    for key in ["headline", "top_strength", "top_improvement", "facilitation_tips"]:
        assert key in data, f"Missing key: {key}"
