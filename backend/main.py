# ─────────────────────────────────────────────────────────────
# MeetingMind — Backend (FastAPI)
# Agent 1: AssemblyAI transcription + diarization
# Agent 2: Groq extraction → structured JSON
# Agent 3: Groq email drafting
# ─────────────────────────────────────────────────────────────

import os
import json
import time
import assemblyai as aai
from groq import Groq
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(title="MeetingMind API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialise API clients ─────────────────────────────────
aai.settings.api_key = os.environ.get("ASSEMBLYAI_API_KEY")
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# ── Health check ───────────────────────────────────────────
@app.get("/")
def home():
    return {"status": "MeetingMind is running!", "version": "1.0.0"}


# ══════════════════════════════════════════════════════════
# AGENT 1: TRANSCRIPTION + DIARIZATION
# Input:  MP3 or M4A audio file upload
# Output: { job_id: string }
# Notes:  AssemblyAI is async — we return a job_id immediately.
#         Frontend polls /status/{job_id} every 3 seconds.
# ══════════════════════════════════════════════════════════
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    # Validate file format
    filename = audio.filename.lower()
    if not (filename.endswith(".mp3") or filename.endswith(".m4a")):
        return {"error": "Only MP3 and M4A files are supported."}

    # Save uploaded file temporarily
    audio_bytes = await audio.read()
    temp_path = f"/tmp/{audio.filename}"
    with open(temp_path, "wb") as f:
        f.write(audio_bytes)

    # Submit to AssemblyAI with speaker diarization enabled
    config = aai.TranscriptionConfig(speaker_labels=True)
    transcriber = aai.Transcriber()
    transcript = transcriber.submit(temp_path, config)

    return {"job_id": transcript.id}


# ══════════════════════════════════════════════════════════
# POLLING ENDPOINT
# Input:  job_id from /transcribe
# Output: { status: "processing" | "complete" | "error",
#           utterances: [...] }  (only when complete)
# ══════════════════════════════════════════════════════════
@app.get("/status/{job_id}")
def get_status(job_id: str):
    transcript = aai.Transcript.get_by_id(job_id)

    if transcript.status == aai.TranscriptStatus.error:
        return {"status": "error", "message": str(transcript.error)}

    if transcript.status != aai.TranscriptStatus.completed:
        return {"status": "processing"}

    # Build clean utterances list
    utterances = []
    speakers_found = set()

    for utt in transcript.utterances:
        utterances.append({
            "speaker": utt.speaker,   # "A", "B", "C" etc
            "text": utt.text,
            "start_ms": utt.start,
            "end_ms": utt.end
        })
        speakers_found.add(utt.speaker)

    return {
        "status": "complete",
        "utterances": utterances,
        "speakers": sorted(list(speakers_found))
    }


# ══════════════════════════════════════════════════════════
# AGENT 2: EXTRACTION
# Input:  { utterances: [...], speaker_map: {A: "Name", B: "Name"} }
# Output: { summary, decisions, action_items, key_topics }
# Notes:  Uses Groq json_object mode for reliable JSON output.
#         Validates output shape before returning.
# ══════════════════════════════════════════════════════════
class AnalyzeInput(BaseModel):
    utterances: list
    speaker_map: dict  # e.g. {"A": "Damian", "B": "Sarah"}

@app.post("/analyze")
def analyze(data: AnalyzeInput):
    # Build named transcript from utterances + speaker map
    named_lines = []
    for utt in data.utterances:
        speaker_label = utt.get("speaker", "Unknown")
        real_name = data.speaker_map.get(speaker_label, f"Speaker {speaker_label}")
        named_lines.append(f"{real_name}: {utt.get('text', '')}")
    named_transcript = "\n".join(named_lines)

    # Validate we have something to work with
    if not named_transcript.strip():
        return {"error": "Transcript is empty. Cannot analyze."}

    prompt = f"""You are an expert meeting analyst.
Read the meeting transcript below and extract the following information.
Use the real speaker names as they appear in the transcript.
Do not add any information not present in the transcript.

Return a JSON object with exactly these keys:

{{
  "summary": "2-3 sentence overview of what the meeting was about",
  "decisions": ["decision one", "decision two"],
  "action_items": [
    {{
      "task": "clear description of what needs to be done",
      "owner": "name of person responsible (or Unassigned if unclear)",
      "deadline": "when it is due (or No deadline if not mentioned)"
    }}
  ],
  "key_topics": ["topic one", "topic two", "topic three"]
}}

MEETING TRANSCRIPT:
{named_transcript}"""

    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=1500
    )

    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Failed to parse extraction response. Please try again."}

    # Validate expected keys are present
    for key in ["summary", "decisions", "action_items", "key_topics"]:
        if key not in result:
            result[key] = [] if key != "summary" else "No summary available."

    return result


# ══════════════════════════════════════════════════════════
# AGENT 3: EMAIL DRAFTING
# Input:  { summary, decisions, action_items, key_topics }
# Output: { email: "plain text email" }
# Notes:  Explicit instruction — no embellishment, under 300 words.
# ══════════════════════════════════════════════════════════
class MeetingData(BaseModel):
    summary: str
    decisions: list
    action_items: list
    key_topics: list

@app.post("/draft-email")
def draft_email(data: MeetingData):
    # Validate input has content
    if not data.summary or data.summary == "No summary available.":
        return {"error": "No meeting data to draft email from."}

    prompt = f"""You are a professional executive assistant.
Write a follow-up email based on the meeting data below.
Use only the information provided — do not add any details not present in the data.
Keep the email under 300 words.

Meeting Summary: {data.summary}
Key Decisions: {', '.join(data.decisions) if data.decisions else 'None recorded'}
Action Items: {json.dumps(data.action_items, indent=2)}
Topics Covered: {', '.join(data.key_topics)}

Write the email with:
- A subject line (format: Subject: ...)
- A friendly professional greeting
- A brief context line
- All action items clearly listed with owner and deadline
- Key decisions noted
- A warm professional closing
- Sign off as: MeetingMind

Return only the email text. Nothing else."""

    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800
    )

    email_text = response.choices[0].message.content.strip()

    if not email_text:
        return {"error": "Email draft was empty. Please try again."}

    return {"email": email_text}