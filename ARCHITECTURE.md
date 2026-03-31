# MeetingMind — Architecture

## System overview
MeetingMind is a three-agent AI pipeline with a React frontend and FastAPI backend.
Audio is recorded on a phone, emailed to the laptop, and uploaded via a file picker.

## Pipeline
```
[Phone Recording — Voice Memos / Recorder app]
        ↓  email MP3/M4A to yourself, download on laptop
[File Upload — React frontend, accepts MP3 and M4A]
        ↓  multipart POST to /transcribe
[AGENT 1 — AssemblyAI]
  - Submits audio file to AssemblyAI transcription API
  - Enables speaker_labels: true for diarization
  - Returns job ID immediately (async)
  - Backend polls AssemblyAI every 3 seconds until complete
  - Returns structured utterances: [{speaker, text, start, end}]
        ↓  utterances array + speaker list
[Speaker Naming Prompt — React frontend]
  - Shows each unique speaker label (A, B, C...)
  - User types real name for each
  - Frontend sends name mapping back to backend
        ↓  {speaker_map: {A: "Damian", B: "Sarah"}, utterances: [...]}
[AGENT 2 — Groq Llama 3 8B]
  - Receives named utterances
  - Extracts: summary, decisions, action_items, key_topics
  - Uses json_object response mode for reliable JSON output
  - Validates output shape before returning
        ↓  structured JSON
[AGENT 3 — Groq Llama 3 8B]
  - Receives structured JSON from Agent 2
  - Drafts professional follow-up email
  - Instruction: use only provided data, no embellishment, under 300 words
        ↓
[Results Display — React frontend]
  - Meeting summary card
  - Action items table (task / owner / deadline)
  - Follow-up email with copy button
```

## API routes
| Route              | Method | Input                          | Output                    |
|--------------------|--------|--------------------------------|---------------------------|
| /                  | GET    | —                              | Health check              |
| /transcribe        | POST   | MP3 or M4A audio file          | { job_id }                |
| /status/{job_id}   | GET    | job_id                         | { status, utterances }    |
| /analyze           | POST   | { utterances, speaker_map }    | Structured JSON           |
| /draft-email       | POST   | Structured JSON                | { email }                 |

## Key design decisions
- **Phone recording → email transfer**: removes browser audio complexity entirely
- **MP3 and M4A only**: the two formats phone recorders export natively
- **AssemblyAI async + polling**: avoids frontend timeout on long recordings
- **Speaker naming prompt**: user confirms names once, LLM never guesses
- **Groq json_object mode**: forces clean JSON output, near-zero parse failures
- **Llama 3 8B over 70B**: larger context window (32k vs 8k) handles long transcripts
- **Validation at every handoff**: backend checks data shape before each agent call
- **Defensive frontend rendering**: empty arrays show placeholder text, never break UI

## Environment variables
- ASSEMBLYAI_API_KEY — used by Agent 1 (transcription + diarization)
- GROQ_API_KEY — used by Agents 2 and 3 (extraction + email)

## Ports (local dev)
- Backend: http://localhost:8000
- Frontend: http://localhost:5173