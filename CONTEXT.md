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

## Current state: WORKING LOCALLY + UI REDESIGN COMPLETE ✅

### What works
- ✅ Audio file upload (MP3 and M4A)
- ✅ AssemblyAI transcription + speaker diarization
- ✅ Async polling loop (frontend polls /status every 3 seconds)
- ✅ Speaker naming prompt (user names each speaker once)
- ✅ Groq extraction → summary, action items, decisions, key topics
- ✅ Groq email drafting
- ✅ Full results display — summary card, action items table, email + copy button
- ✅ Full UI redesign — dark futuristic theme (navy/electric blue/purple)
- ✅ Workshop landing page — banner, architecture SVG diagram, workshop materials
- ✅ AIAB_banner.png displayed as full-width hero
- ✅ AAIB_brochure.png displayed as brochure thumbnail card
- ✅ AI_Agents_Bootcamp_Curriculum.pdf linked — opens in new tab
- ✅ Curriculum thumbnail — banner image reused with overlay
- ✅ Tech stack badges displayed under architecture diagram
- ✅ Footer: Built with Intellica AI · Powered by AssemblyAI + Groq

### What is NOT done yet
- ❌ GitHub push still blocked (see GitHub issue below)
- ❌ Render backend deployment
- ❌ Netlify frontend deployment
- ❌ Live demo URL for students
- ❌ In-browser voice recording (Start Meeting button — next feature)
- ❌ UI improvement: MeetingMind upload section needs redesign

---

## Page structure (top to bottom)
1. BANNER — AIAB_banner.png full width + UWI venue overlay
2. ARCHITECTURE — SVG three-agent pipeline diagram + tech stack badges
3. WORKSHOP MATERIALS — brochure card + curriculum PDF card (side by side)
4. THE APP — MeetingMind upload + pipeline + results (dark theme)
5. FOOTER — Intellica AI credit line

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
│   ├── public/
│   │   ├── AIAB_banner.png          ✅ Workshop banner image
│   │   ├── AAIB_brochure.png        ✅ Brochure thumbnail
│   │   └── AI_Agents_Bootcamp_Curriculum.pdf  ✅ Curriculum PDF
│   ├── src/
│   │   ├── App.jsx          ✅ Complete — full redesigned UI
│   │   └── index.css        ✅ Complete — dark theme + pulse animation
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

Keys stored in backend/.env — never commit that file.

---

## Design tokens (current theme)
```
bg:      #0a0e1a  (deep dark navy)
card:    #111827  (dark card)
border:  #1e3a5f  (dark blue border)
accent:  #00d4ff  (electric blue)
purple:  #7c3aed  (violet)
text:    #f0f4f8  (white-ish)
muted:   #8899aa  (grey)
success: #00e676  (green)
error:   #ff4d4d  (red)
```

---

## Known fixes already applied (do not revert)
| Problem | Fix applied |
|---|---|
| Chromebook pip3 blocked | Add --break-system-packages to all pip3 commands |
| uvicorn command not found | Use python3 -m uvicorn instead of uvicorn |
| Must run from correct folder | Always cd ~/meetingmind/backend before starting |
| AssemblyAI speech_model deprecated | Use speech_models=[aai.SpeechModel.universal] |
| Groq llama3-8b-8192 decommissioned | Replaced with llama-3.3-70b-versatile |
| JSX parse error on curriculum <a> tag | Put all <a> attributes on one line |
| label variable name conflict in JSX | Renamed loop variable to spkr |

---

## GitHub issue — UNRESOLVED
- Push blocked — GH013 secret scanning, old commit ed46067
- All code safe locally, nothing lost
- Fix when ready:
  1. Rotate Groq key at https://console.groq.com
  2. Update backend/.env with new key
  3. git reset --soft HEAD~3
  4. git add README.md ARCHITECTURE.md DEVLOG.md ROADMAP.md CONTEXT.md
  5. git add backend/main.py backend/requirements.txt backend/.env.example
  6. git add frontend/src/App.jsx frontend/src/index.css frontend/package.json
  7. git add frontend/public/AIAB_banner.png frontend/public/AAIB_brochure.png
  8. git add "frontend/public/AI_Agents_Bootcamp_Curriculum.pdf"
  9. git commit -m "Clean rebuild — full app, redesigned UI, no secrets"
  10. git push origin main --force

---

## Commands to resume
### Start backend
```bash
cd ~/meetingmind/backend
python3 -m uvicorn main:app --reload --port 8000
```
### Start frontend
```bash
cd ~/meetingmind/frontend && npm run dev
```
### Open app
```
http://localhost:5173
```

---

## Next steps in order
1. Redesign MeetingMind upload section (Section 4) — make it stand out
2. Add Start Meeting button with in-browser voice recording
3. Add pre-recording message: "Please state your name and position before speaking"
4. Fix GitHub push (rotate key + force push)
5. Deploy to Render + Netlify
6. Share live demo URL with prospective students

---

## Next session — paste this into a new chat with:
"I am continuing the MeetingMind project. Here is my current CONTEXT.md.
Please read it and help me continue from the next steps."