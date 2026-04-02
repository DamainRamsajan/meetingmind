# MeetingMind — Architecture

## System Overview

MeetingMind is a three-agent AI pipeline with a React frontend,
FastAPI backend, and two free API services — AssemblyAI for audio
intelligence and Groq for language intelligence.

The architecture is deliberately simple: no message queues, no
orchestration frameworks, no vector databases. Just clean HTTP
routes, async polling, and prompt engineering.

---

## High-Level Data Flow
```
[User Device]
  Phone records meeting → MP3/M4A
  Email to self → download on laptop
  Upload via browser file picker
        ↓
[React Frontend — Netlify]
  FormData POST → /transcribe
        ↓
[FastAPI Backend — Render]
        ↓
[AGENT 1 — AssemblyAI]
  POST audio file to AssemblyAI
  Returns job_id immediately (async)
  Backend polls /status every 3 seconds
  Returns: utterances + speakers + talk_time + confidence
        ↓
[React Frontend]
  Speaker naming prompt
  User types real name for each speaker label
  Sends speaker_map + utterances back
        ↓
[FastAPI Backend]
  Flattens utterances to clean named transcript
  "Alice: We need to launch by Friday."
        ↓
[AGENT 2 — Groq Llama 3.3 70B]
  13-field extraction via json_object mode
  Returns structured JSON
        ↓
[AGENT 3 — Groq Llama 3.3 70B]
  Email drafting — tone selected by user
  CEO / Client / Team
        ↓
[MEETING COACH — Groq Llama 3.3 70B]
  Prescriptive improvement advice
  Runs after main analysis
        ↓
[React Frontend]
  Renders all results cards
  Talk time bars · Sentiment · Effectiveness · Coach
  Action items with priority · Risk flags · Key quotes
  Email with tone toggle · Collapsible transcript
  Download minutes · Share via email
```

---

## API Routes

| Route | Method | Input | Output | Agent |
|---|---|---|---|---|
| / | GET | — | Health check | — |
| /transcribe | POST | MP3/M4A/WebM file | { job_id } | AssemblyAI |
| /status/{job_id} | GET | job_id | { status, utterances, speakers, talk_time, confidence } | AssemblyAI |
| /analyze | POST | { utterances, speaker_map, meeting_context } | 13-field JSON | Groq |
| /draft-email | POST | { analysis, tone, meeting_context } | { email } | Groq |
| /coach | POST | { effectiveness_score, open_questions, risk_flags... } | { headline, strength, improvement, tips } | Groq |

---

## Frontend State Machine
```
UPLOAD
  ↓ file selected + upload clicked
PROCESSING
  ↓ AssemblyAI polling every 3 seconds
  ↓ status: complete
NAME_SPEAKERS
  ↓ user confirms all speaker names
ANALYZING
  ↓ /analyze → /draft-email → /coach (sequential)
RESULTS
  ↓ reset clicked
UPLOAD

ERROR (reachable from any step)
  ↓ try again clicked
UPLOAD
```

---

## AssemblyAI Configuration
```python
config = aai.TranscriptionConfig(
    speaker_labels=True,           # diarization
    speech_models=[aai.SpeechModel.universal],  # best accuracy
    punctuate=True,                # clean punctuation
    format_text=True,              # proper capitalisation
)
```

**Why async polling:**
AssemblyAI processes audio server-side and cannot return
synchronously. A 10-minute meeting takes 30-90 seconds to
process. The frontend polls /status every 3 seconds until
`status: complete` is returned.

---

## Groq Configuration
```python
response = groq_client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": prompt}],
    response_format={"type": "json_object"},  # forces clean JSON
    max_tokens=3000,
)
```

**Why json_object mode:**
Without it, Llama 3 occasionally adds preamble text before
the JSON or wraps it in markdown fences. json_object mode
forces pure JSON output — near-zero parse failures.

**Why transcript flattening:**
Sending raw utterance JSON objects to the LLM wastes tokens
on structure overhead and reduces output quality. Flattening
to "Alice: text. Bob: text." gives the LLM cleaner input
and produces significantly better extraction.

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| AssemblyAI for diarization | Best free speaker identification — returns clean A/B/C labels |
| Groq for LLM | Completely free, no credit card, fast inference |
| Two API keys only | Workshop accessibility — both free with no credit card |
| Phone recording → email → upload | Better audio quality than browser mic, simpler architecture |
| Async polling not webhooks | Simpler implementation, works on free Render tier |
| json_object mode | Eliminates JSON parse failures |
| Transcript flattening | Better LLM output quality |
| Speaker naming prompt | User confirms names — LLM never guesses |
| Tone selector on email | Same data, three audiences — novel feature |
| Meeting coach as separate endpoint | Independent, cacheable, improvable separately |
| Demo mode with pre-loaded data | Zero friction for prospective students |
| Feature branches | Safe development — live app never breaks mid-build |

---

## Deployment Architecture
```
GitHub (main branch)
    ↓ auto-trigger
Netlify (frontend)          Render (backend)
  npm run build               pip install -r requirements.txt
  frontend/dist               uvicorn main:app --host 0.0.0.0 --port $PORT
  https://dancing-gecko-      https://meetingmind-api.onrender.com
  e9a899.netlify.app
```

**Render free tier note:**
Spins down after 15 minutes of inactivity. First request
after sleep takes ~30 seconds to wake up. Acceptable for
demo and workshop use. Upgrade to paid tier for production.

---

## Environment Variables

| Variable | Service | Used by |
|---|---|---|
| ASSEMBLYAI_API_KEY | AssemblyAI | /transcribe + /status |
| GROQ_API_KEY | Groq | /analyze + /draft-email + /coach |

Stored in `backend/.env` — never committed to Git.
`backend/.env.example` contains placeholder text only.

---

## Audio Quality Optimisations

### File upload path
- Accepted: MP3, M4A
- Saved to /tmp/ before forwarding to AssemblyAI
- AssemblyAI handles format conversion internally

### Browser recording path
- Accepted: WebM (MediaRecorder default)
- Audio constraints applied:
```javascript
  {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 16000,
    channelCount: 1
  }
```
- 16kHz mono is optimal for speech recognition
- Maximum recording: 30 minutes (auto-stops)

---

## Versions

### v1.0 — Current live
- 4 routes, 4-field extraction
- Basic results display
- File upload only

### v2.0 — In development (feature/v2-upgrade branch)
- 6 routes, 13-field extraction
- Meeting coach endpoint
- Email tone selector
- Talk time analytics
- Demo mode
- Rich results UI

### v3.0 — Planned
- Industry-standard full-stack directory structure
- User authentication
- Meeting history (database)
- PDF export
- Slack webhook
- Replit workshop guide
- Claude Code workshop guide