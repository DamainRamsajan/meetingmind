# MeetingMind — Master Context Document
> Version: Post v1.0 Live Deployment
> Last updated: End of build session 1
> Purpose: Paste this into a new chat to continue instantly with zero lost context

---

## 🏁 CURRENT STATUS — v1.0 LIVE ✅

### Live URLs
- **Frontend (Netlify):** https://dancing-gecko-e9a899.netlify.app
- **Backend (Render):** https://meetingmind-api.onrender.com
- **GitHub:** https://github.com/DamainRamsajan/meetingmind — tagged v1.0

---

## WHAT THIS APP DOES

MeetingMind is an AI-powered meeting analysis app built for the
Intellica AI — AI Agents Bootcamp workshop series.

User workflow:
1. Record meeting on phone (Voice Memos / Recorder app) → export MP3 or M4A
2. Email file to themselves → download on laptop
3. Upload MP3/M4A to MeetingMind
4. AssemblyAI transcribes audio and identifies speakers (Speaker A, B etc)
5. User is prompted to name each speaker once
6. Groq (Llama 3.3 70B) extracts action items, summary, decisions, key topics
7. Groq drafts a professional follow-up email
8. Results displayed: summary card, action items table, decisions, email + copy button

---

## TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite + Axios | http://localhost:5173 locally |
| Backend | Python + FastAPI + Uvicorn | http://localhost:8000 locally |
| Transcription | AssemblyAI API | Free — 100hrs, no credit card |
| Diarization | AssemblyAI speaker_labels | Returns Speaker A, B, C labels |
| LLM | Groq — llama-3.3-70b-versatile | Free forever, no credit card |
| Deployment | Render (backend) + Netlify (frontend) | Both free tiers |
| Version control | GitHub | https://github.com/DamainRamsajan/meetingmind |

---

## API KEYS — 2 TOTAL, BOTH FREE

| Service | Key prefix | Used for | Dashboard |
|---|---|---|---|
| AssemblyAI | 32-char string | Transcription + diarization | assemblyai.com |
| Groq | gsk_ | LLM extraction + email drafting | console.groq.com |

Keys stored in `backend/.env` — NEVER commit this file.
`backend/.env.example` has placeholder text only — safe for GitHub.

---

## COMPLETE FILE STRUCTURE
```
meetingmind/
├── backend/
│   ├── main.py              ✅ v1.0 complete — three agents
│   ├── requirements.txt     ✅ Clean minimal — no system packages
│   ├── Procfile             ✅ Render deployment config
│   ├── .env                 ✅ Real API keys — NEVER commit
│   └── .env.example         ✅ Placeholder text only
├── frontend/
│   ├── public/
│   │   ├── AIAB_banner.png           ✅ Workshop banner — full width hero
│   │   ├── AAIB_brochure.png         ✅ Brochure thumbnail card
│   │   └── AI_Agents_Bootcamp_Curriculum.pdf  ✅ Opens in new tab
│   ├── src/
│   │   ├── App.jsx          ✅ v1.0 complete — full redesigned UI
│   │   └── index.css        ✅ Dark theme + animations
│   ├── package.json         ✅ Complete
│   └── index.html           ✅ Complete
├── README.md                ✅ Complete
├── ARCHITECTURE.md          ✅ Complete
├── DEVLOG.md                ✅ Complete
├── ROADMAP.md               ✅ Complete
└── CONTEXT.md               ← This file
```

---

## BACKEND ARCHITECTURE — main.py

Four FastAPI routes:

### GET /
Health check. Returns `{"status": "MeetingMind is running!", "version": "1.0.0"}`

### POST /transcribe
- Input: MP3, M4A, or WebM audio file (multipart upload)
- Validates file extension
- Saves to `/tmp/`
- Submits to AssemblyAI with:
  - `speaker_labels=True`
  - `speech_models=[aai.SpeechModel.universal]`
- Returns: `{ job_id }` immediately — async

### GET /status/{job_id}
- Polls AssemblyAI for job completion
- Returns `{ status: "processing" }` while waiting
- When complete returns:
  - `status: "complete"`
  - `utterances: [{speaker, text, start_ms, end_ms}]`
  - `speakers: ["A", "B"]`
- Frontend polls this every 3 seconds

### POST /analyze
- Input: `{ utterances, speaker_map: {A: "Damian", B: "Sarah"} }`
- Builds clean named transcript from utterances + speaker map
- Sends to Groq llama-3.3-70b-versatile
- Uses `response_format: json_object` for reliable JSON
- Extracts: summary, decisions, action_items, key_topics
- Validates all keys present before returning
- Returns structured JSON

### POST /draft-email
- Input: `{ summary, decisions, action_items, key_topics }`
- Sends to Groq llama-3.3-70b-versatile
- Returns: `{ email: "plain text email" }`
- Prompt instructions: use only provided data, under 300 words

---

## FRONTEND ARCHITECTURE — App.jsx

### State machine — 6 steps:
```
UPLOAD → PROCESSING → NAME_SPEAKERS → ANALYZING → RESULTS → ERROR
```

### Key state variables:
- `step` — current pipeline step
- `audioFile` — selected file for upload
- `utterances` — array from AssemblyAI
- `speakers` — unique speaker labels ["A", "B"]
- `speakerMap` — { A: "Damian", B: "Sarah" }
- `results` — full extraction JSON
- `email` — drafted email text
- `countdown` — 3..2..1 before browser recording
- `isRecording` — browser recording active
- `recordingTime` — seconds elapsed
- `pollRef` — interval ref for AssemblyAI polling
- `mediaRecorderRef` — browser MediaRecorder ref
- `audioChunksRef` — collected audio chunks

### Page sections (top to bottom):
1. **BANNER** — AIAB_banner.png full width + UWI venue overlay text
2. **ARCHITECTURE** — SVG three-agent pipeline diagram + tech stack badges
3. **WORKSHOP MATERIALS** — brochure card + curriculum PDF card side by side
4. **HERO APP SECTION** — glowing mic icon, Start Meeting CTA, pipeline states
5. **FALLBACK UPLOAD** — file picker for MP3/M4A (shown only on UPLOAD step)
6. **FOOTER** — Intellica AI credit line

### Design tokens:
```javascript
bg:      '#0a0e1a'  // deep dark navy
card:    '#111827'  // dark card background
border:  '#1e3a5f'  // dark blue border
accent:  '#00d4ff'  // electric blue
purple:  '#7c3aed'  // violet
text:    '#f0f4f8'  // near white
muted:   '#8899aa'  // grey
success: '#00e676'  // green
error:   '#ff4d4d'  // red
```

### Key functions:
- `handleStartMeeting()` — triggers 3..2..1 countdown
- `startBrowserRecording()` — requests mic, starts MediaRecorder
- `handleStopRecording()` — stops MediaRecorder, triggers upload
- `uploadAudioFile(file)` — shared upload function for both paths
- `startPolling(job_id)` — polls /status every 3 seconds
- `handleNameConfirm()` — validates speaker names, triggers analysis
- `runAnalysis()` — calls /analyze then /draft-email sequentially
- `copyEmail()` — clipboard copy with 2.5s feedback
- `reset()` — clears all state, returns to UPLOAD step
- `formatTime(seconds)` — MM:SS formatter for recording timer

---

## PIPELINE DATA FLOW
```
[Phone recording — MP3/M4A]
        ↓ email to self, download on laptop
[File picker OR browser Start Meeting button]
        ↓ FormData POST to /transcribe
[AssemblyAI — async]
        ↓ job_id returned immediately
[Frontend polls /status every 3 seconds]
        ↓ status: complete → utterances + speakers
[Speaker naming prompt]
        ↓ user types real names, speakerMap built
[POST /analyze with utterances + speaker_map]
        ↓ Groq builds named transcript, extracts JSON
[POST /draft-email with extraction JSON]
        ↓ Groq drafts email
[Results display]
  - Summary card
  - Action items table (task / owner / deadline)
  - Decisions list
  - Follow-up email + copy button
  - Reset button
```

---

## EVERY BUG AND FIX DISCOVERED IN v1.0 BUILD

These are permanent — do not revert any of them.

| # | Problem | Fix Applied | File |
|---|---|---|---|
| 1 | Chromebook pip3 blocked by system | Add `--break-system-packages` to all pip3 commands | Terminal |
| 2 | `uvicorn` command not found | Use `python3 -m uvicorn` instead | Terminal |
| 3 | uvicorn can't find main.py | Always `cd ~/meetingmind/backend` before starting | Terminal |
| 4 | AssemblyAI `speech_model` deprecated | Use `speech_models=[aai.SpeechModel.universal]` (plural, list) | main.py |
| 5 | AssemblyAI rejected again | Same fix — plural + list was the correct form | main.py |
| 6 | Groq `llama3-8b-8192` decommissioned | Replace with `llama-3.3-70b-versatile` in both routes | main.py |
| 7 | JSX parse error line 345 | `<a>` tag opening was stripped — put all attributes on one line | App.jsx |
| 8 | `label` variable conflict in JSX map | Renamed loop variable from `label` to `spkr` | App.jsx |
| 9 | GitHub push blocked GH013 | Real Groq key accidentally in .env.example commit ed46067 | Git |
| 10 | GitHub fix | Rotated Groq key + used GitHub secret scanning unblock URL | GitHub |
| 11 | Render build failed — dbus-python | requirements.txt had system packages from `pip3 freeze` | requirements.txt |
| 12 | Render fix | Replaced requirements.txt with clean minimal 7-package list | requirements.txt |

---

## DEPLOYMENT CONFIGURATION

### Backend — Render
- **Service type:** Web Service
- **Root directory:** `backend`
- **Runtime:** Python 3
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment variables:** `ASSEMBLYAI_API_KEY`, `GROQ_API_KEY`
- **Plan:** Free
- **Note:** Spins down after 15min inactivity — 30s cold start on first request

### Frontend — Netlify
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist`
- **Plan:** Free
- **Auto-deploys:** Yes — on every push to main branch

### Procfile (backend root)
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## WORKSHOP CONTEXT

### About the workshop series
- **Name:** AI Agents Bootcamp (AIAB)
- **Organiser:** Intellica AI (Damian's company)
- **Venue:** University of the West Indies, St. Augustine Campus
- **Date:** June 2026
- **Format:** Two separate workshops planned

### Workshop 1 — Replit build
- Students build MeetingMind on Replit
- Separate beginner guide needed
- Replit licenses needed this week
- Guide not yet written

### Workshop 2 — Claude Code build
- Students build with Claude Code
- Separate guide needed
- Further out — guide not yet written

### This app serves as:
- Damian's personal demo build
- Live demo for prospective students before they sign up
- Centerpiece of both workshop curricula

---

## REQUIREMENTS EVOLUTION — KEY DECISIONS MADE

These decisions were made deliberately after discussion — do not revisit without good reason.

| Decision | Reason |
|---|---|
| AssemblyAI for transcription + diarization | Best free diarization, no credit card, 100hrs free |
| Groq for LLM | Completely free forever, no credit card, fast |
| 2 API keys only | Simplicity for workshop — both free, both fast to set up |
| No Anthropic/OpenAI in workshop build | Requires credit card — eliminated for workshop accessibility |
| Phone recording → email → upload | Simpler than browser recording, better audio quality |
| MP3 and M4A only for file upload | Two formats phones export natively |
| WebM accepted for browser recording | Browser MediaRecorder outputs WebM |
| AssemblyAI async + polling | Required — AssemblyAI doesn't respond synchronously |
| Groq json_object mode | Forces clean JSON — near-zero parse failures |
| llama-3.3-70b-versatile | Replaced decommissioned llama3-8b-8192 |
| Speaker naming prompt | User confirms names once — LLM never guesses |
| Dark futuristic theme | Navy/blue/purple — AI/robotic aesthetic |
| React + Vite frontend | More impressive demo than Streamlit or vanilla |
| FastAPI backend | Clean, debuggable, good docs page |
| Render + Netlify deployment | Both free, both reliable |
| Minimal requirements.txt | Full pip freeze caused Render build failure |

---

## COMMANDS TO RESUME PROJECT

### Start backend locally
```bash
cd ~/meetingmind/backend
python3 -m uvicorn main:app --reload --port 8000
```

### Start frontend locally
```bash
cd ~/meetingmind/frontend && npm run dev
```

### Open locally
```
http://localhost:5173        (app)
http://localhost:8000/docs   (API docs)
```

### Git workflow
```bash
cd ~/meetingmind
git add .
git commit -m "your message"
git push origin main
```

### Install packages (Chromebook)
```bash
pip3 install package-name --break-system-packages
```

---

## v2.0 FULL FEATURE PLAN

### Layer 1 — Analysis Quality (Backend — main.py already written)
All of these are already coded in the updated main.py built during session 1.
Just needs to be pasted in and deployed.

| Feature | Detail |
|---|---|
| Expanded extraction | 13 fields: summary, decisions, action_items (with priority), open_questions, parking_lot, key_topics, key_quotes, sentiment, sentiment_reason, effectiveness_score, effectiveness_reason, next_agenda, risk_flags |
| Transcript flattening | Clean named text sent to Groq — not raw JSON utterances |
| punctuate + format_text | AssemblyAI cleans transcript before analysis |
| Talk time calculation | Per speaker: ms, minutes, percentage — from timestamps |
| Confidence score | AssemblyAI confidence passed through to frontend |

### Layer 2 — UX Improvements (Frontend)

| Feature | Detail | Effort |
|---|---|---|
| Meeting title + date | Added in results after analysis, pre-fills today's date | Low |
| Collapsible transcript | Full speaker-labeled transcript below results | Low |
| Talk time bar chart | CSS bars per speaker — no library | Low |
| Confidence score badge | Small badge showing transcription quality % | Low |
| Sentiment card | Visual sentiment + effectiveness score display | Low |
| Open questions card | New result card | Low |
| Parking lot card | New result card | Low |
| Next agenda card | Suggested next meeting items | Low |
| Risk flags card | Highlighted blockers | Low |
| Key quotes card | Notable quotes with speaker attribution | Low |
| Demo mode button | Pre-loaded sample — no upload needed | Medium |
| Download minutes | One-click .txt download of full analysis | Low |
| Share via email | mailto link pre-populated with follow-up email | Low |
| Word cloud topics | Styled tag display of key topics | Low |
| Action item priority | High/Medium/Low badge on each action item | Low |

### Layer 3 — Power Features

| Feature | Detail | Effort |
|---|---|---|
| Meeting history | localStorage — browse past analyses | Medium |
| Browser recording polish | Start Meeting fully tested on live deployment | Medium |
| Audio quality constraints | echoCancellation, noiseSuppression, 16kHz | Low |
| Render cold start handler | Wake-up ping + message when backend sleeping | Low |
| Export as PDF | Download full minutes as PDF | Medium |
| Slack webhook | Post action items to Slack channel | Medium |

### Layer 4 — Workshop Deliverables (Separate docs)

| Deliverable | Status |
|---|---|
| Replit student build guide | Not started — needed urgently |
| Claude Code student build guide | Not started — further out |

---

## RECOMMENDED v2.0 BUILD ORDER

### Week 1 — High impact, low effort
1. Paste in updated main.py (already written) → push → redeploy Render
2. Add all new result cards (sentiment, effectiveness, open questions,
   parking lot, next agenda, risk flags, key quotes)
3. Talk time bars + confidence badge
4. Action item priority badges
5. Meeting title + date fields in results
6. Download minutes button
7. Share via email button
8. Collapsible transcript view

### Week 2 — Polish and power
9. Demo mode button with pre-loaded sample transcript
10. Meeting history with localStorage
11. Audio quality constraints for browser recording
12. Test Start Meeting button end to end on live deployment
13. Render cold start handler

### Later — bigger builds
14. PDF export
15. Slack webhook
16. Replit workshop guide (urgent — needed before Workshop 1)
17. Claude Code workshop guide

---

## NEXT SESSION OPENING MESSAGE

Paste this entire document into a new chat with this message:

"I am continuing the MeetingMind project — AI Agents Bootcamp workshop app.
v1.0 is live. Here is my complete CONTEXT.md.
Please read it fully and help me start v2.0.
Start with Step 1 — paste in the updated main.py backend which was
already written last session and is documented in the v2.0 plan above."