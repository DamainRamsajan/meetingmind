# MeetingMind — Development Log

---

## [march 31st, 9pm] — Build Session 3 — Full Pipeline Working ✅

### What was completed
- Phase 4 frontend build complete
- Phase 5 end to end test passed with real audio file
- Full pipeline confirmed working locally:
  Upload → AssemblyAI → polling → speaker naming → Groq → results

### API fixes applied this session
- AssemblyAI: speech_models now requires plural form as a list
  Fix: speech_models=[aai.SpeechModel.universal]
- Groq: llama3-8b-8192 decommissioned
  Fix: replaced with llama-3.3-70b-versatile in both /analyze and /draft-email

### Current blockers
- GitHub push blocked — GH013 secret in old commit
- Not yet deployed — Render and Netlify pending

### Next session
- Fix GitHub push
- Deploy to Render + Netlify
- Get live demo URL working for students



## [march 31, 6:53pm] — Build Session 2 — Backend Complete

### Current status
- Backend fully built and running locally on port 8000
- All four routes confirmed working via /docs and health check
- Frontend not yet started (Phase 5 next)
- GitHub push blocked (see known issues below) — all commits safe locally

### What was completed
- Installed all Python packages with --break-system-packages flag (Chromebook requirement)
- Created backend/main.py with all three agents
- Fixed uvicorn path issue — must use python3 -m uvicorn on Chromebook
- Must run uvicorn from inside backend/ folder, not project root
- Backend health check returning 200 OK confirmed
- FastAPI /docs page confirmed loading with all four routes

### Chromebook-specific fixes discovered
- All pip3 commands need --break-system-packages at the end
- uvicorn command not found — use python3 -m uvicorn instead
- Always cd into backend/ before starting the server

### Known issues
- GitHub push blocked — GH013 secret scanning detected old Groq key in commit ed46067
- Fix: rotate Groq key on console.groq.com, then git push origin main --force
- All code is safe locally, nothing lost

### Next session goals
- Complete Phase 5 — test end to end with real audio file
- Fix GitHub push block and force push clean history
- Phase 6 — deploy to Render and Netlify

## [DATE] — Workshop Day 1

### What was built
- Set up GitHub repository and cloned locally
- Created project folder structure (backend + frontend)
- Stored API keys in .env file (AssemblyAI + Groq)
- Built FastAPI backend with four routes:
  - /transcribe (submit audio to AssemblyAI, returns job_id)
  - /status/{job_id} (poll AssemblyAI for completion)
  - /analyze (Groq extraction → structured JSON)
  - /draft-email (Groq drafting → email text)
- Built React frontend with:
  - MP3/M4A file upload
  - Async polling loop with progress indicator
  - Speaker naming prompt (one prompt per unique speaker)
  - Results: summary card, action items table, email draft
  - Copy-to-clipboard for email
- Tested end-to-end with sample audio
- Deployed backend to Render, frontend to Netlify

### Decisions made
- Dropped browser recording in favour of phone recorder + email transfer
  — removes Web Audio API complexity, better audio quality, simpler guide
- Used AssemblyAI for diarization — cleaner than pyannote on 4GB RAM
- Used Groq Llama 3 8B — 32k context handles long meeting transcripts
- Used Groq json_object mode — near-zero JSON parse failures
- Added validation at every agent handoff — prevents silent failures
- Speaker names confirmed by user — LLM never guesses names

### Problems encountered
- [Fill in during build]

### Next session goals
- Add speaker voice enrollment for automatic name recognition
- Add meeting history with SQLite