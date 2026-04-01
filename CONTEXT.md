# MeetingMind — Current Context
> This file is a live snapshot. Overwrite it at the end of every session.
> Paste this into a new chat to continue the project instantly.

---

## What this app does
AI-powered meeting analysis app. User emails an MP3/M4A recording from their
phone to their laptop, uploads it to MeetingMind, and gets back:
- A speaker-labeled transcript (Speaker A, Speaker B etc)
- A prompt to name each speaker once
- Action items table (task / owner / deadline)
- Meeting summary
- Ready-to-send follow-up email

## Tech stack
- Frontend: React + Vite + Axios — http://localhost:5173
- Backend: Python + FastAPI — http://localhost:8000
- Transcription + Diarization: AssemblyAI API (free, no credit card)
- LLM: Groq API — llama-3.3-70b-versatile (free, no credit card)
- Deployment: Render (backend) + Netlify (frontend) — NOT YET DEPLOYED

---

## Current state: WORKING LOCALLY — END TO END TESTED ✅

### What works
- ✅ Audio file upload (MP3 and M4A)
- ✅ AssemblyAI transcription + speaker diarization
- ✅ Async polling loop (frontend polls /status every 3 seconds)
- ✅ Speaker naming prompt (user names each speaker once)
- ✅ Groq extraction → summary, action items, decisions, key topics
- ✅ Groq email drafting
- ✅ Full results display — summary card, action items table, email + copy button
- ✅ End to end test passed with real audio file

### What is NOT done yet
- ❌ GitHub push still blocked (see GitHub issue below)
- ❌ Render backend deployment
- ❌ Netlify frontend deployment
- ❌ Live demo URL for students

---

## File structure
```
meetingmind/
├── backend/
│   ├── main.py              ✅ Complete — three agents working
│   ├── requirements.txt     ✅ Complete
│   ├── .env                 ✅ Has real keys — NEVER commit this
│   └── .env.example         ✅ Placeholder text only — safe for GitHub
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ✅ Complete — full UI with polling + speaker naming
│   │   └── index.css        ✅ Complete
│   └── package.json         ✅ Complete
├── README.md                ✅ Complete
├── ARCHITECTURE.md          ✅ Complete
├── DEVLOG.md                ✅ Complete
├── ROADMAP.md               ✅ Complete
└── CONTEXT.md               ← This file
```

---

## API keys (2 total — both free)
| Service | Key prefix | Used for | Status |
|---|---|---|---|
| AssemblyAI | 32-char string | Transcription + diarization | ✅ Working |
| Groq | gsk_ | LLM extraction + email draft | ✅ Working |

Keys are stored in `backend/.env` — never commit that file.

---

## Known fixes already applied (do not revert these)
| Problem | Fix applied |
|---|---|
| Chromebook pip3 blocked | Add `--break-system-packages` to all pip3 commands |
| uvicorn command not found | Use `python3 -m uvicorn` instead of `uvicorn` |
| Must run from correct folder | Always `cd ~/meetingmind/backend` before starting server |
| AssemblyAI `speech_model` deprecated | Use `speech_models=[aai.SpeechModel.universal]` (plural, list) |
| AssemblyAI `speech_model` deprecated again | Use `speech_models=[aai.SpeechModel.universal]` |
| Groq `llama3-8b-8192` decommissioned | Replaced with `llama-3.3-70b-versatile` |

---

## GitHub issue — UNRESOLVED
- Push is blocked due to GH013 secret scanning
- Old commit `ed46067` contains a real Groq key in `.env.example`
- All code is safe locally — nothing lost
- Fix steps:
  1. Rotate Groq key at https://console.groq.com → API Keys
  2. Update backend/.env with new key
  3. Run: `git reset --soft HEAD~3`
  4. Re-add files: `git add README.md ARCHITECTURE.md DEVLOG.md ROADMAP.md CONTEXT.md`
  5. Re-add backend: `git add backend/main.py backend/requirements.txt backend/.env.example`
  6. Re-add frontend: `git add frontend/src/App.jsx frontend/src/index.css frontend/package.json`
  7. Commit: `git commit -m "Clean rebuild — all fixes applied, no secrets"`
  8. Force push: `git push origin main --force`

---

## Commands to resume this project

### Start backend
```bash
cd ~/meetingmind/backend
python3 -m uvicorn main:app --reload --port 8000
```

### Start frontend
```bash
cd ~/meetingmind/frontend
npm run dev
```

### Open app
```
http://localhost:5173
```

### Open API docs
```
http://localhost:8000/docs
```

---

## Next steps in order
1. Fix GitHub push (rotate Groq key + force push — see above)
2. Deploy backend to Render (Phase 6 of build guide)
3. Deploy frontend to Netlify (Phase 6 of build guide)
4. Test live deployed URL end to end
5. Share demo URL with prospective students

---

## Next session — paste this into a new chat with this message
"I am continuing the MeetingMind project. Here is my current context file.
Please read it and help me continue from the next steps."
Then paste this entire file.