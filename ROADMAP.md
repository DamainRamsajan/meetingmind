# MeetingMind — Roadmap

## Current status: v1.0 — Personal Demo Build

✅ MP3/M4A audio upload
✅ AssemblyAI transcription + speaker diarization
✅ Speaker naming prompt (user confirms names)
✅ Groq extraction (summary, decisions, action items, key topics)
✅ Groq email drafting
✅ React frontend with async progress indicator
✅ Deployed (Render + Netlify)

---

## Short term — next improvements
- [ ] Speaker voice enrollment — recognise speakers automatically
- [ ] Meeting history — save past analyses (SQLite)
- [ ] Slack webhook — post action items to a channel automatically
- [ ] Export minutes as PDF
- [ ] Multi-language support (AssemblyAI supports 99 languages)
- [ ] Meeting effectiveness score

## Medium term
- [ ] User authentication
- [ ] Calendar integration — add action items to Google Calendar
- [ ] Recurring meeting comparison — are the same issues coming up?
- [ ] Mobile-friendly UI

## Long term vision
- Running meeting intelligence dashboard
- Team-level insights (who owns most tasks, talk time per person)
- Direct integration with Zoom / Google Meet / Teams

## Known issues / limitations
- Free Render tier spins down after 15 min inactivity — 30s cold start
- No authentication — anyone with the URL can use the app
- Speaker diarization degrades with more than 5 speakers or heavy background noise
- AssemblyAI async means 30-90s wait per analysis

## Tech debt
- No automated tests — add pytest for backend routes
- CORS set to allow all origins — restrict to frontend domain in production
- Add proper error logging to backend

## Workshop versions (coming)
- v2 — Replit student build guide
- v3 — Claude Code student build guide