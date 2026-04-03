# MeetingMind — Master Context Document
> Version: Post v1.0 Live Deployment
> Last updated: End of build session 1
> Purpose: Paste this into a new chat to continue instantly with zero lost context

---

---
## SESSION UPDATE — v2.0 Recording Bug Fixed & Ready for Deployment
> Date: Current session
> Status: ✅ All bugs resolved, ready for merge

### What Was Accomplished This Session

1. **Recording Bug Fixed** ✅
   - Problem: Browser recording returned "Only MP3/M4A supported" error
   - Root cause: Chromebook Linux container networking + missing file validation
   - Fix applied: Updated `/transcribe` endpoint with:
     - File extension validation (.mp3, .m4a, .webm)
     - Content-type detection for WebM files
     - Automatic filename fixing for browser recording
     - Debug logging for troubleshooting
   - Verified working on Chromebook at http://localhost:5174

2. **Frontend Verification** ✅
   - Confirmed all v2.0 features present:
     - Demo mode with pre-built product launch meeting
     - 13-field extraction (summary, decisions, action items with priority, open questions, parking lot, key topics, key quotes, sentiment, effectiveness, next agenda, risk flags, meeting type)
     - Email tone selector (CEO/Client/Team)
     - Meeting Coach card with prescriptive advice
     - Talk time bars with CSS progress indicators
     - Confidence score badge
     - Sentiment badge with color coding
     - Effectiveness score ring (SVG circular progress)
     - Collapsible transcript view
     - Download minutes as .txt
     - Share via email (mailto:)
   - App running correctly on Chromebook at port 5174

3. **Chromebook-Specific Resolution** ✅
   - Identified Linux container IP: 100.115.92.198
   - Updated frontend `.env` with correct API URL
   - Backend bound to 0.0.0.0:8000 for container access
   - Both services communicating properly

### Current State

| Component | Status | Location |
|-----------|--------|----------|
| Backend (v2.0) | ✅ Working locally | http://100.115.92.198:8000 |
| Frontend (v2.0) | ✅ Working locally | http://localhost:5174 |
| Demo Mode | ✅ Verified | Shows 13-field output instantly |
| File Upload | ✅ Verified | MP3/M4A processing works |
| Browser Recording | ✅ Fixed | WebM files now accepted |
| Branch | feature/v2-upgrade | Ready for merge |

### Open Issues
- None blocking v2.0 deployment
- Chromebook recording works but may need mic permissions on first use

### Files Modified This Session

| File | Changes |
|------|---------|
| `backend/main.py` | Added file validation, content-type detection, WebM support, debug logging to `/transcribe` endpoint |
| `frontend/.env` | Updated VITE_API_URL to http://100.115.92.198:8000 for Chromebook |
| `frontend/src/App.jsx` | Verified correct (no changes needed - already had proper recording implementation) |

---

## NEXT STEPS — Merge & Deploy v2.0 Live

### Step 1: Commit the recording bug fix

```bash
cd ~/meetingmind

# Check you're on feature branch
git branch
# Should show * feature/v2-upgrade

# Add the modified main.py
git add backend/main.py

# Commit with message
git commit -m "fix: add file validation and WebM support to /transcribe endpoint

- Added extension validation (.mp3, .m4a, .webm)
- Added content-type detection for browser recording
- Automatic filename fixing for MediaRecorder output
- Debug logging for troubleshooting
- Fixes 'Only MP3/M4A supported' error on Chromebook"

# Push to feature branch
git push origin feature/v2-upgrade

## MERGE CHECKLIST — do not merge until recording bug is fixed
- [ ] Recording bug fixed and tested
- [ ] Demo Report button confirmed working live
- [ ] File upload confirmed working live  
- [ ] merge feature/v2-upgrade → main
- [ ] Render manual redeploy
- [ ] Confirm /docs shows 5 routes and version 2.0.0
- [ ] Tag v2.0

---

## ALL BUGS AND FIXES — CUMULATIVE

| # | Problem | Fix | File |
|---|---|---|---|
| 1 | Chromebook pip3 blocked | --break-system-packages | Terminal |
| 2 | uvicorn not found | python3 -m uvicorn | Terminal |
| 3 | uvicorn can't find main.py | cd ~/meetingmind/backend first | Terminal |
| 4 | AssemblyAI speech_model deprecated | speech_models=[aai.SpeechModel.universal] | main.py |
| 5 | Groq llama3-8b decommissioned | llama-3.3-70b-versatile | main.py |
| 6 | JSX parse error | a tag attributes on one line | App.jsx |
| 7 | label variable conflict | renamed to spkr | App.jsx |
| 8 | GitHub push blocked GH013 | Rotated key + unblock URL | Git |
| 9 | Render build failed dbus-python | Clean minimal requirements.txt | requirements.txt |
| 10 | Accidentally pushed to main | No damage, switched back | Git |
| 11 | handleStartMeeting broken | startBrowserRecording() was outside function body | App.jsx |
| 12 | Recording → "Only MP3/M4A" error | OPEN — debug filename first | main.py |

---

## v3.0 PLAN — intellicaworkshops account
- New GitHub account: intellicaworkshops
- Component extraction: App.jsx split into proper folders
- Transcript upload: mammoth.js (DOCX) + pdfjs-dist (PDF), client-side
- Locked CORS to Netlify domain only
- Full test coverage with pytest
- Three workshop tiers:
  - Beginner: Replit build
  - Intermediate: Claude Code build  
  - Advanced: Full local setup
- Windows laptop setup guide (pip vs pip3, .env.txt trap, etc)

## v4.0 PLAN — Mobile / Play Store
- Capacitor wrapper around existing React app
- Same FastAPI backend unchanged
- Google Developer account ($25 one-time)
- Privacy policy page required (handles audio)
- Mic permissions handled by Capacitor automatically

---

## NEXT SESSION OPENING MESSAGE

"I am continuing MeetingMind. v2.0 frontend is complete and working
except for one open bug: browser recording returns 'Only MP3 and M4A
supported' error. The fix requires knowing what filename the browser
is sending. Add this debug line to the transcribe function in main.py:

print(f"DEBUG received filename: '{filename}'")

Restart uvicorn, record, stop, read the terminal output, then fix
based on what the filename actually is. Here is my CONTEXT.md."


# MeetingMind — Context Update: v2.0 Build Session
> Append this to your existing CONTEXT.md
> Last updated: End of v2.0 backend session
> Current branch: feature/v2-upgrade

---

## SESSION SUMMARY — WHAT WAS DONE THIS SESSION

### Branch created
- Created feature branch: `feature/v2-upgrade`
- All v2.0 work happens here — main branch untouched and live
- Accidentally pushed to main once (no damage — no code changes had been made yet)
- Confirmed back on feature/v2-upgrade before starting development

### Backend — main.py completely replaced ✅
- v2.0 backend written and saved
- NOT yet deployed to Render — waiting for branch merge
- Verified locally via /docs page

---

## CURRENT STATE

### Branch status
```
* feature/v2-upgrade   ← you are here, all v2.0 work
  main                 ← live app, v1.0, untouched
```

### What is done
- ✅ Step 1.1 — new main.py written and saved
- ✅ Step 1.2 — verified /docs shows 5 routes locally
- ✅ Step 1.3 — committed to feature/v2-upgrade branch
- ✅ Step 1.4 — NOT deployed to Render yet (intentional — waiting for merge)

### What is NOT done yet
- ❌ Step 2 — Frontend upgrade (App.jsx — start here next session)
- ❌ Render redeployment (after merge)
- ❌ Branch merge to main
- ❌ v2.0 GitHub tag

---

## GIT COMMANDS FOR THIS BUILD

### Daily workflow on feature branch
```bash
cd ~/meetingmind
git add .
git commit -m "your message"
git push origin feature/v2-upgrade
```

### Check which branch you are on
```bash
git branch
```

### When v2.0 is fully working — merge and go live
```bash
git checkout main
git merge feature/v2-upgrade
git push origin main
```

### Tag v2.0 after merge
```bash
git tag -a v2.0 -m "MeetingMind v2.0 — rich analysis, coach, tone selector, demo mode"
git push origin v2.0
```

### If you accidentally switch to main
```bash
git checkout feature/v2-upgrade
```

---

## v2.0 BACKEND — COMPLETE SPECIFICATION
### File: backend/main.py (already replaced ✅)

### Five routes (up from four in v1.0)
| Route | Method | Input | Output | Status |
|---|---|---|---|---|
| / | GET | — | Health check v2.0.0 | ✅ Done |
| /transcribe | POST | MP3, M4A, WebM | { job_id } | ✅ Done |
| /status/{job_id} | GET | job_id | utterances + talk_time + confidence | ✅ Done |
| /analyze | POST | utterances + speaker_map + meeting_context | 13-field JSON | ✅ Done |
| /draft-email | POST | analysis + tone | { email } | ✅ Done |
| /coach | POST | analysis subset | coach JSON | ✅ Done |

### New in /transcribe vs v1.0
- Added `punctuate=True` — cleaner transcript text
- Added `format_text=True` — better capitalisation and formatting
- Accepts WebM in addition to MP3 and M4A

### New in /status vs v1.0
- Returns `talk_time` per speaker:
```json
  {
    "A": { "ms": 22500, "minutes": 0.4, "percentage": 41.7 },
    "B": { "ms": 16000, "minutes": 0.3, "percentage": 29.6 }
  }
```
- Returns `confidence` score (0-100) from AssemblyAI

### New in /analyze vs v1.0
- Accepts `meeting_context: { title, date }` — optional
- Flattens utterances to clean named transcript before sending to Groq
  - v1.0 sent raw JSON utterance objects
  - v2.0 sends "Alice: We need to launch by Friday." — better LLM output
- Returns 13 fields instead of 4:
```
summary              — 3-4 sentence executive summary
decisions            — list of decisions made
action_items         — list with task/owner/deadline/priority (NEW: priority)
open_questions       — unresolved questions raised
parking_lot          — topics deferred to future meeting
key_topics           — main topics covered
key_quotes           — notable quotes with speaker attribution
sentiment            — Positive/Neutral/Mixed/Tense
sentiment_reason     — one sentence explanation
effectiveness_score  — integer 1-10
effectiveness_reason — one sentence explanation
next_agenda          — suggested items for next meeting
risk_flags           — blockers, concerns, dependencies
meeting_type         — Planning/Standup/Retrospective/Decision/
                       Brainstorm/Client/1-on-1/All-hands/Other
```

### New in /draft-email vs v1.0
- Accepts `tone` parameter: "ceo" | "client" | "team"
- Three distinct writing styles:
  - **ceo** — bullet points, no fluff, under 200 words, outcomes only
  - **client** — warm, relationship-first, commitments not tasks, under 300 words
  - **team** — casual, direct, energetic, uses names, under 250 words
- Also uses open_questions, parking_lot, next_agenda in prompt

### NEW: /coach endpoint
- Input: effectiveness_score, effectiveness_reason, open_questions,
  risk_flags, sentiment, action_items, meeting_type
- Returns:
```json
  {
    "headline": "punchy one-line meeting quality summary",
    "top_strength": "single best thing about the meeting",
    "top_improvement": "single most important change for next time",
    "agenda_suggestion": ["item 1", "item 2"],
    "facilitation_tips": ["tip 1", "tip 2"],
    "score_to_beat": "what a higher score version looks like"
  }
```
- Innovation: prescriptive coaching not just descriptive analysis
- No other free meeting tool does this

---

## v2.0 FRONTEND — COMPLETE SPECIFICATION
### File: frontend/src/App.jsx (NOT YET DONE — start here)

### New state variables to add
```javascript
const [talkTime, setTalkTime] = useState({})
const [confidence, setConfidence] = useState(null)
const [emailTone, setEmailTone] = useState('team')
const [meetingTitle, setMeetingTitle] = useState('')
const [meetingDate, setMeetingDate] = useState(
  new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
)
const [transcriptOpen, setTranscriptOpen] = useState(false)
const [namedTranscript, setNamedTranscript] = useState('')
const [coachData, setCoachData] = useState(null)
const [demoMode, setDemoMode] = useState(false)
```

### New refs to add
```javascript
const mediaRecorderRef = useRef(null)
const audioChunksRef = useRef([])
const recordingTimerRef = useRef(null)
```

### New functions to add
| Function | What it does |
|---|---|
| `handleDemoMode()` | Loads pre-built demo utterances, skips upload, runs full pipeline |
| `downloadMinutes()` | Generates .txt file of full meeting analysis + email |
| `shareViaEmail()` | Opens mailto with pre-populated subject and email body |
| `SentimentBadge()` | Renders coloured sentiment pill (Positive/Neutral/Mixed/Tense) |
| `ScoreRing()` | Renders circular effectiveness score (colour coded) |
| `TalkTimeBar()` | Renders CSS progress bar per speaker |

### Functions to update
| Function | What changes |
|---|---|
| `startPolling()` | Now captures talk_time and confidence from /status response |
| `runAnalysis()` | Now passes meeting_context + tone, builds namedTranscript, calls /coach |
| `handleUpload()` | Now calls shared uploadAudioFile() function |
| `reset()` | Now clears talkTime, confidence, namedTranscript, coachData, demoMode, transcriptOpen, meetingTitle, meetingDate |

### Demo mode data
Pre-built 6-utterance product launch meeting with 3 speakers:
- Speaker A = Alice (meeting chair)
- Speaker B = Bob (engineering)
- Speaker C = Carol (marketing)
- Includes: action items, risk flag (payment gateway), parking lot item (rollback plan)
- Skips upload and polling entirely — goes straight to /analyze

### New UI sections in results
| Section | Detail |
|---|---|
| Meeting details | Editable title + date inputs at top of results |
| Stats row | Confidence % + Sentiment badge + Effectiveness ring — 3 column grid |
| Talk time | CSS bars per speaker with minutes and percentage |
| Action items | Now includes Priority column with colour-coded badge (High/Med/Low) |
| Open questions | Orange bordered card |
| Parking lot | Purple bordered card |
| Open questions + parking lot | Side by side in a 2-column grid |
| Risk flags | Red background card — visually urgent |
| Key quotes | Left-bordered quote style with speaker attribution |
| Next agenda | Green bordered ordered list |
| Meeting Coach | Full coaching card — headline, strength, improvement, next level, tips |
| Email tone selector | CEO / Client / Team toggle buttons — redrafts email on click |
| Collapsible transcript | Expand/collapse full speaker-labeled transcript |
| Action buttons | Download Minutes + Share via Email + New Meeting — row of 3 |

### Demo button location
Below the Start Meeting button in the hero section:
- Label: "⚡ Try Demo — No Upload Needed"
- Style: purple glow button
- Separated by a horizontal rule

---

## STEP BY STEP — WHAT TO DO IN NEXT SESSION

Start a new chat, paste CONTEXT.md, then say:
"I am continuing MeetingMind v2.0. Backend is done.
Start me at Step 2.1 — frontend upgrade."

### Step 2.1 — Add new state variables
Find the existing state block and add 9 new state variables + 3 new refs

### Step 2.2 — Add demo mode data + new functions
Add DEMO_UTTERANCES array, DEMO_SPEAKER_MAP, handleDemoMode()

### Step 2.3 — Update runAnalysis()
Add meeting_context, tone, namedTranscript building, /coach call

### Step 2.4 — Update startPolling()
Capture talk_time and confidence from /status response

### Step 2.5 — Add downloadMinutes() and shareViaEmail()

### Step 2.6 — Update reset()
Clear all new state variables

### Step 2.7 — Add helper components
SentimentBadge, ScoreRing, TalkTimeBar — add before return statement

### Step 2.8 — Replace results section
Full replacement of results JSX with all new cards

### Step 2.9 — Add demo button to hero section
Below Start Meeting button

### Step 2.10 — Save, test locally, commit to feature branch
```bash
git add .
git commit -m "v2.0 frontend: rich results, demo mode, coach, tone selector"
git push origin feature/v2-upgrade
```

### Step 2.11 — Merge to main and deploy
```bash
git checkout main
git merge feature/v2-upgrade
git push origin main
```
Then Render manual deploy → verify live URL

### Step 2.12 — Tag v2.0
```bash
git tag -a v2.0 -m "MeetingMind v2.0 complete"
git push origin v2.0
```

---

## ALL BUGS AND FIXES — CUMULATIVE LIST
### (Additions to v1.0 list)

| # | Problem | Fix | File |
|---|---|---|---|
| 13 | Accidentally pushed to main during branch setup | No damage — no code changes made yet, switched back to feature branch | Git |

---

## INNOVATION FEATURES IN v2.0
### (For workshop and demo narrative)

| Feature | Why it's novel |
|---|---|
| Email tone selector | Same meeting data → 3 completely different emails in one click. No meeting tool does this. |
| Meeting Coach | Prescriptive improvement advice, not just descriptive analysis. Tells you what to do differently next time. |
| Talk time analytics | Calculated free from AssemblyAI timestamps — no extra API cost. Shows who dominates meetings. |
| Demo mode | Zero friction — visitors see full results without uploading anything. Conversion tool. |
| 13-field extraction | Most tools give summary + action items. We give 13 fields including risk flags, key quotes, parking lot. |
| Confidence score | Trust signal. Shows how accurately the AI transcribed. No other free tool surfaces this. |

---

## OPENING MESSAGE FOR NEXT CHAT

Copy and paste this exactly:

"I am continuing the MeetingMind project — AI Agents Bootcamp workshop app.
I am on branch feature/v2-upgrade.
v2.0 backend is complete (main.py replaced, 5 routes, not yet deployed to Render).
v1.0 is live on main branch — do not touch main.
Here is my complete CONTEXT.md. Please start me at Step 2.1 — frontend upgrade of App.jsx."

Then paste the full CONTEXT.md.

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