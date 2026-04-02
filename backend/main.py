# ─────────────────────────────────────────────────────────────
# MeetingMind — Backend v2.0
# Innovation additions:
# - Rich 13-field extraction
# - Talk time analytics from timestamps
# - Confidence scoring
# - Email tone selector (CEO / Client / Team)
# - Transcript flattening for better LLM performance
# - Audio quality optimisation flags
# ─────────────────────────────────────────────────────────────

import os
import json
import assemblyai as aai
from groq import Groq
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

app = FastAPI(title="MeetingMind API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

aai.settings.api_key = os.environ.get("ASSEMBLYAI_API_KEY")
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# ── Health check ───────────────────────────────────────────
@app.get("/")
def home():
    return {"status": "MeetingMind is running!", "version": "2.0.0"}


# ══════════════════════════════════════════════════════════
# AGENT 1: TRANSCRIPTION + DIARIZATION
# Accepts MP3, M4A, WebM
# Returns job_id immediately — async
# Optimised config: punctuate + format_text for cleaner LLM input
# ══════════════════════════════════════════════════════════
@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    filename = audio.filename.lower()
    allowed = (".mp3", ".m4a", ".webm")
    if not any(filename.endswith(ext) for ext in allowed):
        return {"error": "Only MP3, M4A, and WebM files are supported."}

    audio_bytes = await audio.read()
    temp_path = f"/tmp/meeting_{filename}"
    with open(temp_path, "wb") as f:
        f.write(audio_bytes)

    config = aai.TranscriptionConfig(
        speaker_labels=True,
        speech_models=[aai.SpeechModel.universal],
        punctuate=True,
        format_text=True,
    )

    transcriber = aai.Transcriber()
    transcript = transcriber.submit(temp_path, config)
    return {"job_id": transcript.id}


# ══════════════════════════════════════════════════════════
# POLLING ENDPOINT
# Innovation: returns talk_time analytics + confidence score
# These come free from AssemblyAI timestamps — zero extra API cost
# ══════════════════════════════════════════════════════════
@app.get("/status/{job_id}")
def get_status(job_id: str):
    transcript = aai.Transcript.get_by_id(job_id)

    if transcript.status == aai.TranscriptStatus.error:
        return {"status": "error", "message": str(transcript.error)}

    if transcript.status != aai.TranscriptStatus.completed:
        return {"status": "processing"}

    utterances = []
    speakers_found = set()
    talk_time = {}

    for utt in transcript.utterances:
        duration_ms = utt.end - utt.start
        utterances.append({
            "speaker": utt.speaker,
            "text": utt.text,
            "start_ms": utt.start,
            "end_ms": utt.end,
            "duration_ms": duration_ms,
        })
        speakers_found.add(utt.speaker)
        talk_time[utt.speaker] = talk_time.get(utt.speaker, 0) + duration_ms

    # Talk time analytics — calculated from timestamps, zero extra cost
    total_ms = sum(talk_time.values())
    talk_time_pct = {}
    if total_ms > 0:
        for speaker, ms in talk_time.items():
            talk_time_pct[speaker] = {
                "ms": ms,
                "minutes": round(ms / 60000, 1),
                "percentage": round((ms / total_ms) * 100, 1),
            }

    # Confidence score from AssemblyAI
    confidence = round(transcript.confidence * 100, 1) if transcript.confidence else None

    return {
        "status": "complete",
        "utterances": utterances,
        "speakers": sorted(list(speakers_found)),
        "confidence": confidence,
        "talk_time": talk_time_pct,
    }


# ══════════════════════════════════════════════════════════
# AGENT 2: RICH EXTRACTION
# Innovation: 13-field extraction including open questions,
# parking lot, sentiment, effectiveness score, next agenda,
# risk flags, key quotes, priority on action items
# Uses transcript flattening for better LLM performance
# ══════════════════════════════════════════════════════════
class AnalyzeInput(BaseModel):
    utterances: list
    speaker_map: dict
    meeting_context: dict = {}

@app.post("/analyze")
def analyze(data: AnalyzeInput):
    # Flatten utterances to clean named transcript
    # Better LLM performance than raw JSON utterance objects
    named_lines = []
    for utt in data.utterances:
        speaker_label = utt.get("speaker", "Unknown")
        real_name = data.speaker_map.get(
            speaker_label, f"Speaker {speaker_label}"
        )
        named_lines.append(f"{real_name}: {utt.get('text', '')}")
    named_transcript = "\n".join(named_lines)

    if not named_transcript.strip():
        return {"error": "Transcript is empty. Cannot analyze."}

    title = data.meeting_context.get("title", "Untitled Meeting")
    date = data.meeting_context.get("date", "Date not specified")

    prompt = f"""You are an expert meeting analyst and executive assistant.
Analyse the meeting transcript below and extract comprehensive information.
Meeting Title: {title}
Meeting Date: {date}

Return ONLY a valid JSON object with exactly these keys.
Do not add any text before or after the JSON.
Do not invent information not present in the transcript.

{{
  "summary": "3-4 sentence executive summary of the meeting purpose, key outcomes, and next steps",

  "decisions": [
    "clearly stated decision one",
    "clearly stated decision two"
  ],

  "action_items": [
    {{
      "task": "specific description of what needs to be done",
      "owner": "name of person responsible (or Unassigned if unclear)",
      "deadline": "deadline mentioned (or No deadline if not mentioned)",
      "priority": "High / Medium / Low based on urgency in conversation"
    }}
  ],

  "open_questions": [
    "question raised in the meeting that was NOT resolved",
    "another unresolved question"
  ],

  "parking_lot": [
    "topic raised but explicitly deferred to a future meeting",
    "another deferred topic"
  ],

  "key_topics": ["topic one", "topic two", "topic three"],

  "key_quotes": [
    {{
      "speaker": "name of speaker",
      "quote": "notable or important thing they said verbatim or near-verbatim"
    }}
  ],

  "sentiment": "Positive / Neutral / Mixed / Tense",

  "sentiment_reason": "one sentence explaining the sentiment rating",

  "effectiveness_score": 7,

  "effectiveness_reason": "one sentence — what worked well and what could improve",

  "next_agenda": [
    "suggested agenda item 1 for next meeting based on open questions and parking lot",
    "suggested agenda item 2",
    "suggested agenda item 3"
  ],

  "risk_flags": [
    "anything that sounds like a blocker, concern, dependency, or unresolved risk"
  ],

  "meeting_type": "one of: Planning / Standup / Retrospective / Decision / Brainstorm / Client / 1-on-1 / All-hands / Other"
}}

MEETING TRANSCRIPT:
{named_transcript}"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=3000,
    )

    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Failed to parse extraction response. Please try again."}

    # Validate and fill missing keys with safe defaults
    defaults = {
        "summary": "No summary available.",
        "decisions": [],
        "action_items": [],
        "open_questions": [],
        "parking_lot": [],
        "key_topics": [],
        "key_quotes": [],
        "sentiment": "Neutral",
        "sentiment_reason": "",
        "effectiveness_score": 0,
        "effectiveness_reason": "",
        "next_agenda": [],
        "risk_flags": [],
        "meeting_type": "Other",
    }
    for key, default in defaults.items():
        if key not in result:
            result[key] = default

    return result


# ══════════════════════════════════════════════════════════
# AGENT 3: EMAIL DRAFTING WITH TONE SELECTOR
# Innovation: same data, three different tones
# CEO = bullet points, no fluff
# Client = warm, relationship-first
# Team = casual, action-focused
# ══════════════════════════════════════════════════════════
class MeetingData(BaseModel):
    summary: str
    decisions: list
    action_items: list
    key_topics: list
    open_questions: list = []
    parking_lot: list = []
    next_agenda: list = []
    meeting_context: dict = {}
    tone: str = "team"  # "ceo" | "client" | "team"

@app.post("/draft-email")
def draft_email(data: MeetingData):
    if not data.summary or data.summary == "No summary available.":
        return {"error": "No meeting data to draft email from."}

    title = data.meeting_context.get("title", "Our Meeting")
    date = data.meeting_context.get("date", "")
    date_line = f" on {date}" if date else ""

    tone_instructions = {
        "ceo": """Write for a C-suite executive audience.
- Use bullet points throughout — no paragraphs
- Lead with outcomes and decisions only
- Action items as a clean numbered list
- No pleasantries, no filler sentences
- Under 200 words total
- Subject line must include the meeting title and date""",

        "client": """Write for an external client relationship.
- Warm, professional, relationship-first tone
- Open with appreciation for their time
- Frame action items as commitments, not tasks
- Close with clear next steps and availability
- Under 300 words
- Professional but human""",

        "team": """Write for an internal team.
- Casual, direct, energetic tone
- Quick context line, then straight to action items
- Use names throughout — make it personal
- End with a motivating close
- Under 250 words
- Feels like it came from a real person, not a robot"""
    }

    instructions = tone_instructions.get(data.tone, tone_instructions["team"])

    prompt = f"""You are a professional executive assistant.
Write a follow-up email for {title}{date_line}.
Use only the information provided. Do not add details not in the data.

TONE INSTRUCTIONS:
{instructions}

Meeting Summary: {data.summary}
Key Decisions: {', '.join(data.decisions) if data.decisions else 'None recorded'}
Action Items: {json.dumps(data.action_items, indent=2)}
Topics Covered: {', '.join(data.key_topics)}
Open Questions: {', '.join(data.open_questions) if data.open_questions else 'None'}
Parking Lot: {', '.join(data.parking_lot) if data.parking_lot else 'None'}
Suggested Next Agenda: {', '.join(data.next_agenda) if data.next_agenda else 'None'}

Format:
Subject: [subject line]
[blank line]
[email body]
[sign off as MeetingMind]

Return only the email text. Nothing else."""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )

    email_text = response.choices[0].message.content.strip()

    if not email_text:
        return {"error": "Email draft was empty. Please try again."}

    return {"email": email_text}


# ══════════════════════════════════════════════════════════
# MEETING COACH ENDPOINT
# Innovation: prescriptive advice based on analysis patterns
# Tells you not just HOW the meeting went but HOW TO IMPROVE
# ══════════════════════════════════════════════════════════
class CoachInput(BaseModel):
    effectiveness_score: int
    effectiveness_reason: str
    open_questions: list
    risk_flags: list
    sentiment: str
    action_items: list
    meeting_type: str

@app.post("/coach")
def coach(data: CoachInput):
    prompt = f"""You are an expert meeting effectiveness coach.
Based on this meeting analysis, provide specific, actionable coaching advice.

Meeting type: {data.meeting_type}
Effectiveness score: {data.effectiveness_score}/10
Reason: {data.effectiveness_reason}
Sentiment: {data.sentiment}
Number of action items: {len(data.action_items)}
Open unresolved questions: {len(data.open_questions)}
Risk flags raised: {len(data.risk_flags)}
Open questions: {', '.join(data.open_questions) if data.open_questions else 'None'}
Risk flags: {', '.join(data.risk_flags) if data.risk_flags else 'None'}

Return ONLY a JSON object with exactly these keys:

{{
  "headline": "one punchy sentence summarising the meeting quality",
  "top_strength": "the single best thing about this meeting",
  "top_improvement": "the single most important thing to change next time",
  "agenda_suggestion": [
    "specific agenda item suggestion for next meeting",
    "another suggestion"
  ],
  "facilitation_tips": [
    "specific tip to run this type of meeting better",
    "another tip"
  ],
  "score_to_beat": "what a {min(data.effectiveness_score + 2, 10)}/10 version of this meeting would look like"
}}"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=800,
    )

    raw = response.choices[0].message.content
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": "Failed to parse coach response. Please try again."}