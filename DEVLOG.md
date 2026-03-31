# MeetingMind — Development Log

---

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