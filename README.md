# 🎙 MeetingMind
### AI-Powered Meeting Analysis · Built for the AI Agents Bootcamp

> Record your meeting → upload the audio → get speaker-labeled minutes,
> action items, sentiment analysis, a meeting coach, and a follow-up email
> — automatically, in under 90 seconds.

**Live Demo:** https://dancing-gecko-e9a899.netlify.app

---

## What MeetingMind Does

Most meetings end with nothing written down. Decisions get forgotten.
Tasks fall through the cracks. People leave with different ideas of
what was agreed.

MeetingMind fixes this. Place your phone on the table, record the meeting,
email the file to yourself, upload it — and get back everything you need
to follow up professionally and effectively.

---

## The Three-Agent Pipeline
```
[Phone Recording — MP3/M4A]
        ↓
[AGENT 1 — AssemblyAI]
  Transcription + Speaker Diarization
  Identifies who said what
        ↓
[Speaker Naming Prompt]
  User confirms real names once
        ↓
[AGENT 2 — Groq Llama 3.3 70B]
  13-field extraction:
  summary · decisions · action items · open questions
  parking lot · sentiment · effectiveness · risk flags
  key quotes · next agenda · meeting type · key topics
        ↓
[AGENT 3 — Groq Llama 3.3 70B]
  Follow-up email — three tones:
  CEO · Client · Team
        ↓
[MEETING COACH — Groq Llama 3.3 70B]
  Prescriptive improvement advice
  Strength · Improvement · Next level · Tips
```

---

## What You Get Back

| Output | Detail |
|---|---|
| Executive Summary | 3-4 sentence overview of outcomes |
| Action Items | Task · Owner · Deadline · Priority (High/Med/Low) |
| Decisions Made | Clearly stated decisions from the meeting |
| Open Questions | Unresolved questions that need follow-up |
| Parking Lot | Topics deferred to a future meeting |
| Risk Flags | Blockers, concerns, dependencies flagged |
| Key Quotes | Notable things said verbatim |
| Sentiment | Positive / Neutral / Mixed / Tense |
| Effectiveness Score | 1-10 with reasoning |
| Next Meeting Agenda | Suggested items based on open questions |
| Talk Time | Who spoke how much — minutes and percentage |
| Confidence Score | How accurately the AI transcribed |
| Follow-up Email | Three tones — CEO, Client, Team |
| Meeting Coach | Prescriptive advice to improve next time |
| Full Transcript | Collapsible speaker-labeled transcript |

---

## Innovation Features

**Email Tone Selector** — Same meeting data, three completely different
emails generated in one click. CEO gets bullet points and no fluff.
Client gets warmth and relationship language. Team gets casual energy.
No other meeting tool does this.

**Meeting Coach** — Not just "here's what happened" but "here's what
to do differently next time." Prescriptive, specific, actionable.

**Demo Mode** — Visitors can see full results without uploading anything.
One click, pre-loaded meeting, full pipeline runs in 15 seconds.

**Talk Time Analytics** — Calculated free from AssemblyAI timestamps.
Shows who dominates the conversation. Zero extra API cost.

---

## How to Record a Meeting

1. Open **Voice Memos** (iPhone) or **Recorder** (Android)
2. Place phone in the centre of the meeting table
3. Press record
4. After the meeting — export as MP3 or M4A
5. Email the file to yourself
6. Download on your laptop
7. Upload to MeetingMind

**Accepted formats:** MP3 and M4A only for file upload.
Browser recording (WebM) supported via the Start Meeting button.

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React + Vite + Axios | Free |
| Backend | Python + FastAPI + Uvicorn | Free |
| Transcription + Diarization | AssemblyAI API | Free (100hrs) |
| LLM — all three agents | Groq — Llama 3.3 70B | Free forever |
| Frontend hosting | Netlify | Free |
| Backend hosting | Render | Free |

**Total API cost to run: $0.00**
Both API keys are free with no credit card required.

---

## How to Run Locally

### Prerequisites
- Python 3.x and pip3
- Node.js and npm
- AssemblyAI API key — https://assemblyai.com (free)
- Groq API key — https://console.groq.com (free)

### Backend
```bash
cd backend
pip3 install -r requirements.txt --break-system-packages
cp .env.example .env
# Add your two API keys to .env
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173
API docs: http://localhost:8000/docs

---

## Project Structure
```
meetingmind/
├── backend/
│   ├── main.py              Three-agent FastAPI backend
│   ├── requirements.txt     Python dependencies (minimal)
│   ├── Procfile             Render deployment config
│   ├── .env                 API keys — never commit this
│   └── .env.example         Safe template
├── frontend/
│   ├── public/
│   │   ├── AIAB_banner.png
│   │   ├── AAIB_brochure.png
│   │   └── AI_Agents_Bootcamp_Curriculum.pdf
│   ├── src/
│   │   ├── App.jsx          Main React component
│   │   └── index.css        Global styles + animations
│   └── package.json
├── README.md
├── ARCHITECTURE.md
├── DEVLOG.md
├── ROADMAP.md
└── CONTEXT.md
```

---

## Built During
**AI Agents Bootcamp —**
Intellica AI · University of the West Indies, St. Augustine Campus
June 2026

---

## Versions
- **v1.0** — Live. Core pipeline working. Basic results display.
- **v2.0** — In development. Rich analysis, meeting coach, tone selector, demo mode.
- **v3.0** — Planned. Industry-standard directory structure, auth, meeting history.