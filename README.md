# 🎙 MeetingMind

AI-powered meeting analysis app. Record your meeting on your phone, upload the audio file,
and get back: a speaker-labeled transcript, action items with owners and deadlines,
a meeting summary, and a ready-to-send follow-up email.

## What it does
- Transcribes MP3/M4A audio using AssemblyAI
- Identifies and labels each speaker (Speaker A, Speaker B...)
- Prompts user to name each speaker once
- Extracts decisions, action items (owner + deadline), summary, key topics using Groq (Llama 3)
- Drafts a professional follow-up email using Groq
- Displays results in a clean React interface

## How to record a meeting
1. Open your phone's Voice Memos (iPhone) or Recorder (Android) app
2. Place phone on the meeting table — center is best
3. Press record
4. When done, export as MP3 or M4A
5. Email the file to yourself
6. Download on your laptop and upload to MeetingMind

## Tech stack
- **Frontend**: React + Vite + Axios
- **Backend**: Python + FastAPI + Uvicorn
- **Transcription + Diarization**: AssemblyAI API
- **LLM**: Groq API (Llama 3 8B)
- **Deployment**: Render (backend) + Netlify (frontend)

## How to run locally

### Prerequisites
- Python 3.x and pip3
- Node.js and npm
- AssemblyAI API key (assemblyai.com — free)
- Groq API key (console.groq.com — free)

### Backend
```bash
cd backend
pip3 install -r requirements.txt
cp .env.example .env
# Open .env and add your two API keys
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Project structure
```
meetingmind/
├── backend/
│   ├── main.py              # FastAPI app — all three agents
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # API keys (never commit this)
│   └── .env.example         # Safe template
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   └── index.css        # Global styles
│   └── package.json
├── README.md
├── ARCHITECTURE.md
├── DEVLOG.md
└── ROADMAP.md
```

## Built during
Intellica Multi Agent Coding Workshop — one-day hands-on build session.