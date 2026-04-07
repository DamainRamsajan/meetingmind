// ─────────────────────────────────────────────────────────────
// MeetingMind — Frontend v2.0
// Intellica AI · AI Agents Bootcamp
//
// Key design decisions:
// - "Start Meeting" = browser mic recording (primary CTA)
// - File upload is secondary, compact, below the main button
// - App section visually differentiated: glass morphism panel
//   with animated border, scan-line overlay, terminal aesthetic
// - All v2.0 features: 13-field extraction, demo mode,
//   tone selector, coach card, talk time, sentiment ring
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

// ── Environment config ─────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── State machine ──────────────────────────────────────────
const STEPS = {
  UPLOAD:        'upload',
  RECORDING:     'recording',
  PROCESSING:    'processing',
  NAME_SPEAKERS: 'name_speakers',
  ANALYZING:     'analyzing',
  RESULTS:       'results',
  ERROR:         'error',
}

// ── Design tokens — outside component (created once) ───────
const t = {
  bg:       '#060810',
  panel:    '#0a0e1a',
  card:     '#0d1117',
  border:   '#1e3a5f',
  accent:   '#00d4ff',
  purple:   '#7c3aed',
  text:     '#e8f0fe',
  muted:    '#6b7fa3',
  success:  '#00e676',
  warning:  '#f59e0b',
  error:    '#ff4d4d',
  appBg:    '#020408',
}

// ── Shared styles — outside component ─────────────────────
const S = {
  card: {
    background: '#0d1117',
    border: '1px solid #1e3a5f',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    color: '#00d4ff',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  },
  subCard: {
    background: '#080d18',
    border: '1px solid #1e3a5f',
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
  },
}

const glowBtn = (bg = '#00d4ff', color = '#000', size = 'md') => ({
  padding: size === 'sm' ? '7px 16px' : size === 'lg' ? '16px 40px' : '12px 26px',
  fontSize: size === 'sm' ? 11 : size === 'lg' ? 15 : 13,
  fontWeight: 700,
  background: bg,
  color,
  border: 'none',
  borderRadius: size === 'lg' ? 12 : 8,
  cursor: 'pointer',
  boxShadow: `0 0 20px ${bg}55`,
  transition: 'all 0.2s',
  letterSpacing: '0.8px',
  textTransform: size === 'lg' ? 'uppercase' : 'none',
})

// ── File validation ────────────────────────────────────────
const MAX_MB = 25
const ALLOWED = ['.mp3', '.m4a', '.webm']

function validateFile(file) {
  if (!file) return 'No file selected.'
  const name = file.name.toLowerCase()
  if (!ALLOWED.some(e => name.endsWith(e))) return 'Accepted formats: MP3, M4A only.'
  if (file.size > MAX_MB * 1024 * 1024)
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_MB} MB.`
  return null
}

// ── Demo data ──────────────────────────────────────────────
const DEMO_UTTERANCES = [
  { speaker: 'A', text: "Alright, let's finalise the launch plan. Target is end of next week.", start_ms: 0, end_ms: 8200, duration_ms: 8200 },
  { speaker: 'B', text: "Backend is ready. Only blocker is the payment gateway — need one more day to test the Stripe webhooks. Confident we'll be done by Wednesday.", start_ms: 8500, end_ms: 21000, duration_ms: 12500 },
  { speaker: 'C', text: "Marketing side is good. Announcement email is drafted, social posts are scheduled. Just waiting on the final feature list from Bob.", start_ms: 21300, end_ms: 33500, duration_ms: 12200 },
  { speaker: 'A', text: "Decision: we launch Friday if the gateway passes testing Wednesday. Bob owns that. Carol, send the announcement Thursday morning once Bob gives you the green light.", start_ms: 33900, end_ms: 47000, duration_ms: 13100 },
  { speaker: 'B', text: "Understood. One flag — we haven't discussed a rollback plan if something breaks post-launch. Should we park that?", start_ms: 47400, end_ms: 57800, duration_ms: 10400 },
  { speaker: 'A', text: "Good catch. Rollback plan goes to Monday's standup. For now — focus on Friday. Any other blockers?", start_ms: 58200, end_ms: 69000, duration_ms: 10800 },
]
const DEMO_SPEAKER_MAP = { A: 'Alice', B: 'Bob', C: 'Carol' }

// ── Helper ─────────────────────────────────────────────────
function fmt(s) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
}

// ── Global CSS injected once ───────────────────────────────
const CSS = `
  @keyframes pulse-bar { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes glow-pulse {
    0%,100%{box-shadow:0 0 20px #00d4ff33,inset 0 0 20px #00d4ff08}
    50%{box-shadow:0 0 50px #00d4ff55,inset 0 0 40px #00d4ff14}
  }
  @keyframes border-flow {
    0%{border-color:#00d4ff55} 50%{border-color:#7c3aed88} 100%{border-color:#00d4ff55}
  }
  @keyframes rec-pulse {
    0%,100%{box-shadow:0 0 0 0 #ff4d4d66} 50%{box-shadow:0 0 0 10px #ff4d4d00}
  }
  @keyframes count-pop {
    0%{transform:scale(1.3);opacity:0} 100%{transform:scale(1);opacity:1}
  }
  .app-panel {
    animation: glow-pulse 3s ease-in-out infinite, border-flow 4s ease-in-out infinite;
  }
  .rec-dot { animation: rec-pulse 1.2s ease-out infinite; }
  .blink { animation: blink 1s step-end infinite; }
  .count-num { animation: count-pop 0.3s ease-out; }
`

// ── Sub-components ─────────────────────────────────────────
function SentimentBadge({ sentiment }) {
  const map = {
    Positive: { bg: '#00e67618', color: '#00e676', border: '#00e67640' },
    Neutral:  { bg: '#00d4ff18', color: '#00d4ff', border: '#00d4ff40' },
    Mixed:    { bg: '#f59e0b18', color: '#f59e0b', border: '#f59e0b40' },
    Tense:    { bg: '#ff4d4d18', color: '#ff4d4d', border: '#ff4d4d40' },
  }
  const s = map[sentiment] || map.Neutral
  return (
    <span style={{ padding: '4px 14px', borderRadius: 20, background: s.bg,
      color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700 }}>
      {sentiment || 'Neutral'}
    </span>
  )
}

function ScoreRing({ score }) {
  const color = score >= 7 ? '#00e676' : score >= 4 ? '#f59e0b' : '#ff4d4d'
  const r = 28, circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1e3a5f" strokeWidth="5" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(score / 10) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: '#6b7fa3' }}>/ 10</span>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const map = {
    High:   { bg: '#ff4d4d18', color: '#ff4d4d', border: '#ff4d4d40' },
    Medium: { bg: '#f59e0b18', color: '#f59e0b', border: '#f59e0b40' },
    Low:    { bg: '#00e67618', color: '#00e676', border: '#00e67640' },
  }
  const s = map[priority] || map.Low
  return (
    <span style={{ padding: '2px 9px', borderRadius: 10, background: s.bg,
      color: s.color, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {priority || 'Low'}
    </span>
  )
}

const TALK_COLORS = ['#00d4ff', '#7c3aed', '#00e676', '#f59e0b']

function TalkBar({ name, data, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: '#e8f0fe', fontWeight: 600 }}>{name}</span>
        <span style={{ color: '#6b7fa3' }}>{data.minutes} min · {data.percentage}%</span>
      </div>
      <div style={{ height: 5, background: '#1e3a5f', borderRadius: 3 }}>
        <div style={{ height: 5, width: `${data.percentage}%`, background: color,
          borderRadius: 3, boxShadow: `0 0 8px ${color}66`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {

  // ── Core state ───────────────────────────────────────────
  const [step, setStep]             = useState(STEPS.UPLOAD)
  const [audioFile, setAudioFile]   = useState(null)
  const [utterances, setUtterances] = useState([])
  const [speakers, setSpeakers]     = useState([])
  const [speakerMap, setSpeakerMap] = useState({})
  const [results, setResults]       = useState(null)
  const [email, setEmail]           = useState('')
  const [error, setError]           = useState('')
  const [copied, setCopied]         = useState(false)
  const [statusMsg, setStatusMsg]   = useState('')
  const [fileError, setFileError]   = useState('')

  // ── v2.0 state ───────────────────────────────────────────
  const [talkTime, setTalkTime]               = useState({})
  const [confidence, setConfidence]           = useState(null)
  const [emailTone, setEmailTone]             = useState('team')
  const [meetingTitle, setMeetingTitle]       = useState('')
  const [meetingDate, setMeetingDate]         = useState(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  )
  const [transcriptOpen, setTranscriptOpen]   = useState(false)
  const [namedTranscript, setNamedTranscript] = useState('')
  const [coachData, setCoachData]             = useState(null)
  const [demoMode, setDemoMode]               = useState(false)
  const [regenLoading, setRegenLoading]       = useState(false)

  // ── Recording state ──────────────────────────────────────
  const [isRecording, setIsRecording]     = useState(false)
  const [recordingSecs, setRecordingSecs] = useState(0)
  const [countdown, setCountdown]         = useState(null)

  // ── Refs ─────────────────────────────────────────────────
  const pollRef          = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const recordingTimer   = useRef(null)

  // Inject CSS once on mount
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS
    document.head.appendChild(el)
    return () => { if (document.head.contains(el)) document.head.removeChild(el) }
  }, [])

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => setRecordingSecs(s => s + 1), 1000)
    } else {
      clearInterval(recordingTimer.current)
      setRecordingSecs(0)
    }
    return () => clearInterval(recordingTimer.current)
  }, [isRecording])

  // ── Countdown then start recording ──────────────────────
  async function handleStartMeeting() {
    for (let i = 3; i >= 1; i--) {
      setCountdown(i)
      await new Promise(r => setTimeout(r, 1000))
    }
    setCountdown(null)
    startBrowserRecording()
  }
  
    async function startBrowserRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      audioChunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(tr => tr.stop())
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType })
        uploadAudioFile(new File([blob], 'meeting.webm', { type: mr.mimeType }))
      }
      mediaRecorderRef.current = mr
      mr.start()
      setIsRecording(true)
      setStep(STEPS.RECORDING)
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.')
      setStep(STEPS.ERROR)
    }
  }    
      

  function handleStopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // ── File upload path ─────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files[0] || null
    setAudioFile(file)
    setFileError(file ? (validateFile(file) || '') : '')
  }

  async function handleUpload() {
    const err = validateFile(audioFile)
    if (err) { setFileError(err); return }
    await uploadAudioFile(audioFile)
  }

  // ── Shared upload ────────────────────────────────────────
  async function uploadAudioFile(file) {
    setStep(STEPS.PROCESSING)
    setStatusMsg('Uploading audio to AssemblyAI...')
    try {
      const form = new FormData()
      form.append('audio', file)
      const res = await axios.post(`${API}/transcribe`, form)
      if (res.data.error) throw new Error(res.data.error)
      setStatusMsg('Transcribing and identifying speakers... (30–90 sec)')
      startPolling(res.data.job_id)
    } catch (err) {
      setError(err.message || 'Upload failed. Make sure the backend is running.')
      setStep(STEPS.ERROR)
    }
  }

  // ── Polling ──────────────────────────────────────────────
  function startPolling(id) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/status/${id}`)
        if (res.data.status === 'error') {
          clearInterval(pollRef.current)
          setError('AssemblyAI transcription failed. Please try again.')
          setStep(STEPS.ERROR)
          return
        }
        if (res.data.status === 'complete') {
          clearInterval(pollRef.current)
          setUtterances(res.data.utterances)
          setSpeakers(res.data.speakers)
          setTalkTime(res.data.talk_time || {})
          setConfidence(res.data.confidence)
          const map = {}
          res.data.speakers.forEach(s => { map[s] = '' })
          setSpeakerMap(map)
          setStep(STEPS.NAME_SPEAKERS)
        }
      } catch {
        clearInterval(pollRef.current)
        setError('Lost connection while polling. Please try again.')
        setStep(STEPS.ERROR)
      }
    }, 3000)
  }

  // ── Demo mode ────────────────────────────────────────────
  async function handleDemoMode() {
    setDemoMode(true)
    setSpeakers(Object.keys(DEMO_SPEAKER_MAP))
    setSpeakerMap(DEMO_SPEAKER_MAP)
    setMeetingTitle('Client Portal Launch Planning')
    const raw = {}
    let total = 0
    DEMO_UTTERANCES.forEach(u => {
      raw[u.speaker] = (raw[u.speaker] || 0) + u.duration_ms
      total += u.duration_ms
    })
    const tt = {}
    Object.entries(raw).forEach(([sp, ms]) => {
      tt[sp] = { ms, minutes: +(ms / 60000).toFixed(1), percentage: +((ms / total) * 100).toFixed(1) }
    })
    setTalkTime(tt)
    setConfidence(96.4)
    setStep(STEPS.ANALYZING)
    setStatusMsg('Running demo analysis...')
    await runAnalysis(DEMO_UTTERANCES, DEMO_SPEAKER_MAP)
  }

  // ── Name confirm ─────────────────────────────────────────
  async function handleNameConfirm() {
    const unnamed = speakers.filter(s => !speakerMap[s].trim())
    if (unnamed.length > 0) {
      setError(`Please name all speakers. Missing: ${unnamed.map(s => `Speaker ${s}`).join(', ')}`)
      return
    }
    setError('')
    setStep(STEPS.ANALYZING)
    setStatusMsg('Extracting insights...')
    await runAnalysis(utterances, speakerMap)
  }

  // ── Analysis pipeline ────────────────────────────────────
  const runAnalysis = useCallback(async (utts, spkMap) => {
    try {
      const meeting_context = { title: meetingTitle || 'Meeting', date: meetingDate }

      const transcript = utts.map(u => {
        const name = spkMap[u.speaker] || `Speaker ${u.speaker}`
        return `${name}: ${u.text}`
      }).join('\n')
      setNamedTranscript(transcript)

      setStatusMsg('Groq extracting 13 insights...')
      const r2 = await axios.post(`${API}/analyze`, {
        utterances: utts,
        speaker_map: spkMap,
        meeting_context,
      })
      if (r2.data.error) throw new Error(r2.data.error)
      setResults(r2.data)

      setStatusMsg('Drafting follow-up email...')
      const r3 = await axios.post(`${API}/draft-email`, {
        ...r2.data,
        meeting_context,
        tone: emailTone,
      })
      if (r3.data.error) throw new Error(r3.data.error)
      setEmail(r3.data.email)

      setStatusMsg('Running meeting coach...')
      try {
        const r4 = await axios.post(`${API}/coach`, {
          effectiveness_score: r2.data.effectiveness_score,
          effectiveness_reason: r2.data.effectiveness_reason,
          open_questions: r2.data.open_questions,
          risk_flags: r2.data.risk_flags,
          sentiment: r2.data.sentiment,
          action_items: r2.data.action_items,
          meeting_type: r2.data.meeting_type,
        })
        if (!r4.data.error) setCoachData(r4.data)
      } catch { /* coach is optional */ }

      setStep(STEPS.RESULTS)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStep(STEPS.ERROR)
    }
  }, [meetingTitle, meetingDate, emailTone])

  // ── Regenerate email ─────────────────────────────────────
  async function regenerateEmail(tone) {
    if (!results) return
    setRegenLoading(true)
    try {
      const res = await axios.post(`${API}/draft-email`, {
        ...results,
        meeting_context: { title: meetingTitle, date: meetingDate },
        tone,
      })
      if (!res.data.error) setEmail(res.data.email)
    } catch { /* keep existing */ }
    finally { setRegenLoading(false) }
  }

  // ── Copy email ───────────────────────────────────────────
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      const el = document.createElement('textarea')
      el.value = email
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // ── Download minutes ─────────────────────────────────────
  function downloadMinutes() {
    if (!results) return
    const lines = [
      `MEETING MINUTES — ${(meetingTitle || 'Meeting').toUpperCase()}`,
      meetingDate, '='.repeat(60), '',
      'SUMMARY', '-'.repeat(40), results.summary || '', '',
      'DECISIONS', '-'.repeat(40),
      ...(results.decisions || []).map((d, i) => `${i + 1}. ${d}`), '',
      'ACTION ITEMS', '-'.repeat(40),
      ...(results.action_items || []).map(a =>
        `• ${a.task} | Owner: ${a.owner} | Deadline: ${a.deadline} | Priority: ${a.priority}`
      ), '',
      'OPEN QUESTIONS', '-'.repeat(40),
      ...(results.open_questions || []).map(q => `• ${q}`), '',
      'RISK FLAGS', '-'.repeat(40),
      ...(results.risk_flags || []).map(r => `⚠ ${r}`), '',
      'FOLLOW-UP EMAIL', '-'.repeat(40), email || '', '',
      '='.repeat(60), 'Generated by MeetingMind · Intellica AI',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MeetingMind_${(meetingTitle || 'Minutes').replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function shareViaEmail() {
    const subject = encodeURIComponent(`Meeting Minutes${meetingTitle ? ` — ${meetingTitle}` : ''}`)
    const body = encodeURIComponent(email || '')
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  // ── Reset ────────────────────────────────────────────────
  function reset() {
    clearInterval(pollRef.current)
    clearInterval(recordingTimer.current)
    if (mediaRecorderRef.current && isRecording) {
      try { mediaRecorderRef.current.stop() } catch { /* ignore */ }
    }
    setStep(STEPS.UPLOAD); setAudioFile(null); setUtterances([]); setSpeakers([])
    setSpeakerMap({}); setResults(null); setEmail(''); setError(''); setStatusMsg('')
    setFileError(''); setTalkTime({}); setConfidence(null); setNamedTranscript('')
    setCoachData(null); setDemoMode(false); setTranscriptOpen(false)
    setIsRecording(false); setRecordingSecs(0); setCountdown(null)
    setMeetingTitle('')
    setMeetingDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ background: '#060810', minHeight: '100vh', color: '#e8f0fe',
      fontFamily: "'SF Pro Display', system-ui, -apple-system, sans-serif" }}>

      {/* ════════════════════════════════════════════════════
          SECTION 1 — BANNER
      ════════════════════════════════════════════════════ */}
      <div style={{ width: '100%', position: 'relative' }}>
        <img src="/AIAB_banner.png" alt="AI Agents Bootcamp"
          style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(6,8,16,0.98))',
          padding: '40px 40px 20px',
          fontSize: 12, color: '#6b7fa3', letterSpacing: '1.5px',
        }}>
          📍 Workshop Venue: University of the West Indies, St. Augustine Campus
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>

        {/* ════════════════════════════════════════════════════
            SECTION 2 — ARCHITECTURE
        ════════════════════════════════════════════════════ */}
        <div style={S.card}>
          <span style={S.label}>How It Works</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 28px', color: '#e8f0fe' }}>
            The Three-Agent Pipeline
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox="0 0 860 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', minWidth: 600 }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#1e3a5f" />
                </marker>
              </defs>
              <rect x="10" y="60" width="130" height="80" rx="12" fill="#0d1b2e" stroke="#1e3a5f" strokeWidth="1.5" />
              <text x="75" y="88" textAnchor="middle" fill="#6b7fa3" fontSize="10" fontWeight="700" letterSpacing="1">INPUT</text>
              <text x="75" y="108" textAnchor="middle" fill="#e8f0fe" fontSize="13" fontWeight="800">📱 Phone</text>
              <text x="75" y="126" textAnchor="middle" fill="#6b7fa3" fontSize="10">MP3 / M4A</text>
              <line x1="140" y1="100" x2="175" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="157" y="93" textAnchor="middle" fill="#6b7fa3" fontSize="9">email</text>
              <rect x="175" y="50" width="150" height="100" rx="12" fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="250" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 1</text>
              <text x="250" y="95" textAnchor="middle" fill="#e8f0fe" fontSize="13" fontWeight="800">AssemblyAI</text>
              <text x="250" y="113" textAnchor="middle" fill="#6b7fa3" fontSize="10">Transcription</text>
              <text x="250" y="129" textAnchor="middle" fill="#6b7fa3" fontSize="10">+ Diarization</text>
              <line x1="325" y1="100" x2="365" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="345" y="93" textAnchor="middle" fill="#6b7fa3" fontSize="9">speakers</text>
              <rect x="365" y="60" width="130" height="80" rx="12" fill="#0d1b2e" stroke="#7c3aed" strokeWidth="1.5" />
              <text x="430" y="88" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="700" letterSpacing="1">USER STEP</text>
              <text x="430" y="108" textAnchor="middle" fill="#e8f0fe" fontSize="13" fontWeight="800">👥 Name</text>
              <text x="430" y="126" textAnchor="middle" fill="#6b7fa3" fontSize="10">Speakers</text>
              <line x1="495" y1="100" x2="535" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="515" y="93" textAnchor="middle" fill="#6b7fa3" fontSize="9">transcript</text>
              <rect x="535" y="50" width="140" height="100" rx="12" fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="605" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 2</text>
              <text x="605" y="95" textAnchor="middle" fill="#e8f0fe" fontSize="13" fontWeight="800">Groq LLM</text>
              <text x="605" y="113" textAnchor="middle" fill="#6b7fa3" fontSize="10">Extract Tasks</text>
              <text x="605" y="129" textAnchor="middle" fill="#6b7fa3" fontSize="10">Llama 3.3 70B</text>
              <line x1="675" y1="100" x2="710" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="692" y="93" textAnchor="middle" fill="#6b7fa3" fontSize="9">JSON</text>
              <rect x="710" y="50" width="140" height="100" rx="12" fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="780" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 3</text>
              <text x="780" y="95" textAnchor="middle" fill="#e8f0fe" fontSize="13" fontWeight="800">Groq LLM</text>
              <text x="780" y="113" textAnchor="middle" fill="#6b7fa3" fontSize="10">Draft Email</text>
              <text x="780" y="129" textAnchor="middle" fill="#6b7fa3" fontSize="10">Llama 3.3 70B</text>
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            {[
              { label: 'AssemblyAI', color: '#00d4ff' },
              { label: 'Groq', color: '#00d4ff' },
              { label: 'Llama 3.3 70B', color: '#7c3aed' },
              { label: 'FastAPI', color: '#7c3aed' },
              { label: 'React + Vite', color: '#00d4ff' },
              { label: 'Free to Build', color: '#00e676' },
            ].map(b => (
              <span key={b.label} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11,
                fontWeight: 700, border: `1px solid ${b.color}40`, color: b.color, background: `${b.color}0f` }}>
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SECTION 3 — WORKSHOP MATERIALS
        ════════════════════════════════════════════════════ */}
        <div style={S.card}>
          <span style={S.label}>Workshop Materials</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 24px', color: '#e8f0fe' }}>
            AI Agents Bootcamp 
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Lines 683-695: Brochure Card - NOW CLICKABLE */}
                        {/* Lines 683-695: Brochure Card - NOW CLICKABLE */}
            <a href="/AIAB_June5th_brochure.png" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#080d18', border: '1px solid #1e3a5f', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <img src="/AIAB_brchre_thumbnail.png" alt="AI Agents Bootcamp Brochure"
                  style={{ width: '100%', display: 'block', height: 220, objectFit: 'cover' }} />
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e8f0fe' }}>Workshop Brochure</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7fa3' }}>Overview, outcomes, and who this is for</p>
                </div>
              </div>
            </a>
            <a href="/AI_Agents_Bootcamp_Curriculum.pdf" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ background: '#080d18', border: '1px solid #7c3aed66', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <img src="/AIAB_CUR_Thumbnail.png" alt="Curriculum"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <span style={{ fontSize: 36 }}>📄</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff',
                      background: '#7c3aedcc', padding: '6px 16px', borderRadius: 20 }}>
                      VIEW CURRICULUM
                    </span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#e8f0fe' }}>Full Curriculum PDF</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7fa3' }}>Full day schedule and build phases</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SECTION 4 — THE APP
            Visually separated: near-black background,
            animated cyan/purple border, scan-line overlay,
            terminal header bar, corner bracket accents
        ════════════════════════════════════════════════════ */}
        <div className="app-panel" style={{
          position: 'relative',
          background: '#020408',
          border: '1.5px solid #00d4ff',
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 20,
        }}>

          {/* Scan-line texture — decorative only */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px)',
          }} />

          {/* Corner bracket accents */}
          {[
            { top: 0, left: 0, borderTop: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff' },
            { top: 0, right: 0, borderTop: '2px solid #00d4ff', borderRight: '2px solid #00d4ff' },
            { bottom: 0, left: 0, borderBottom: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff' },
            { bottom: 0, right: 0, borderBottom: '2px solid #00d4ff', borderRight: '2px solid #00d4ff' },
          ].map((cs, i) => (
            <div key={i} style={{ position: 'absolute', width: 18, height: 18, zIndex: 2, ...cs }} />
          ))}

          {/* Terminal header bar */}
          <div style={{
            position: 'relative', zIndex: 1,
            borderBottom: '1px solid rgba(0,212,255,0.15)',
            padding: '14px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(0,212,255,0.07), transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#6b7fa3', letterSpacing: '2px', fontFamily: 'monospace' }}>
                MEETINGMIND v2.0
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676' }} />
              <span style={{ fontSize: 10, color: '#00e676', letterSpacing: '1px', fontFamily: 'monospace' }}>ONLINE</span>
            </div>
          </div>

          {/* App content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '28px 28px 32px' }}>

            {/* ── UPLOAD / IDLE ── */}
            {step === STEPS.UPLOAD && (
              <div>
                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  {/* Mic icon */}
                  <div style={{
                    width: 90, height: 90, margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0,212,255,0.15), rgba(0,212,255,0.02))',
                    border: '1.5px solid rgba(0,212,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(0,212,255,0.15)',
                  }}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect x="13" y="4" width="14" height="22" rx="7" fill="#00d4ff" opacity="0.9" />
                      <path d="M6 20c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <line x1="20" y1="34" x2="20" y2="39" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="14" y1="39" x2="26" y2="39" stroke="#00d4ff" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  {countdown !== null ? (
                    <div>
                      <div key={countdown} className="count-num" style={{
                        fontSize: 80, fontWeight: 900, color: '#00d4ff', lineHeight: 1, margin: '0 0 12px',
                        textShadow: '0 0 60px #00d4ff',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {countdown}
                      </div>
                      <p style={{ fontSize: 14, color: '#6b7fa3', margin: 0 }}>
                        Recording starts in a moment — position your device
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e8f0fe', margin: '0 0 8px' }}>
                        Ready to capture your meeting?
                      </h2>
                      <p style={{ fontSize: 13, color: '#6b7fa3', margin: '0 0 28px', lineHeight: 1.7,
                        maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
                        Click <strong style={{ color: '#00d4ff' }}>Start Meeting</strong> to record from your browser mic.
                        Place your laptop in the centre of the table.
                      </p>
                      {/* Button row — Start Meeting + Demo Report side by side */}
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={handleStartMeeting} style={{
                          ...glowBtn('#00d4ff', '#000', 'lg'),
                          display: 'inline-flex', alignItems: 'center', gap: 10,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                            <rect x="13" y="4" width="14" height="22" rx="7" fill="#000" />
                            <path d="M6 20c0 7.732 6.268 14 14 14s14-6.268 14-14" stroke="#000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            <line x1="20" y1="34" x2="20" y2="39" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          START MEETING
                        </button>
                        <button onClick={handleDemoMode} style={{
                          ...glowBtn('#7c3aed', '#fff', 'lg'),
                          display: 'inline-flex', alignItems: 'center', gap: 10,
                        }}>
                          ⚡ DEMO REPORT
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Secondary options — file upload only */}
                {countdown === null && (
                  <div style={{ borderTop: '1px solid rgba(0,212,255,0.12)', paddingTop: 20 }}>

                    {/* File upload */}
                    <div style={{
                      background: 'rgba(0,212,255,0.04)',
                      border: '1px solid rgba(0,212,255,0.25)',
                      borderRadius: 10, padding: '16px 20px',
                    }}>
                      <p style={{ fontSize: 12, color: '#e8f0fe', margin: '0 0 4px', fontWeight: 600 }}>
                        Upload a recorded meeting file
                      </p>
                      <p style={{ fontSize: 11, color: '#6b7fa3', margin: '0 0 12px' }}>
                        MP3 or M4A · max {MAX_MB} MB · recorded on phone or any device
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <input type="file" accept=".mp3,.m4a" onChange={handleFileChange}
                          style={{ fontSize: 12, color: '#6b7fa3', flex: 1, minWidth: 0 }} />
                        <button onClick={handleUpload} disabled={!audioFile} style={{
                          ...glowBtn(audioFile ? '#00d4ff' : '#1e3a5f', audioFile ? '#000' : '#6b7fa3', 'sm'),
                          opacity: audioFile ? 1 : 0.5,
                          cursor: audioFile ? 'pointer' : 'not-allowed',
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}>Upload &amp; Process Meeting File</button>
                      </div>
                      {audioFile && !fileError && (
                        <p style={{ fontSize: 11, color: '#00e676', margin: '6px 0 0' }}>
                          ✓ {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                        </p>
                      )}
                      {fileError && <p style={{ fontSize: 11, color: '#ff4d4d', margin: '6px 0 0' }}>{fileError}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── RECORDING ── */}
            {step === STEPS.RECORDING && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 90, height: 90, margin: '0 auto 20px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,77,77,0.2), rgba(255,77,77,0.03))',
                  border: '1.5px solid rgba(255,77,77,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div className="rec-dot" style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff4d4d' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="blink" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4d' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#ff4d4d', letterSpacing: '2px', fontFamily: 'monospace' }}>REC</span>
                  <span style={{ fontSize: 13, color: '#e8f0fe', fontFamily: 'monospace' }}>{fmt(recordingSecs)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#6b7fa3', margin: '0 0 24px' }}>
                  Recording in progress — speak clearly into the microphone
                </p>
                <button onClick={handleStopRecording} style={glowBtn('#ff4d4d', '#fff', 'lg')}>
                  ⏹ STOP &amp; ANALYSE
                </button>
              </div>
            )}

            {/* ── PROCESSING ── */}
            {step === STEPS.PROCESSING && (
              <div style={{ padding: '8px 0' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#00d4ff', fontFamily: 'monospace' }}>
                  {'>'} {statusMsg}<span className="blink">_</span>
                </p>
                <p style={{ fontSize: 12, color: '#6b7fa3' }}>
                  AssemblyAI is transcribing your audio and identifying each speaker. Usually 30–90 seconds.
                </p>
                <div style={{ marginTop: 16, height: 3, background: '#1e3a5f', borderRadius: 2 }}>
                  <div style={{ height: 3, width: '60%',
                    background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
                    borderRadius: 2, animation: 'pulse-bar 1.5s infinite' }} />
                </div>
              </div>
            )}

            {/* ── SPEAKER NAMING ── */}
            {step === STEPS.NAME_SPEAKERS && (
              <div>
                <h3 style={{ fontSize: 16, color: '#e8f0fe', margin: '0 0 6px', fontWeight: 800 }}>
                  👥 Who was in this meeting?
                </h3>
                <p style={{ fontSize: 13, color: '#6b7fa3', margin: '0 0 20px' }}>
                  We detected <strong style={{ color: '#00d4ff' }}>{speakers.length}</strong> speaker{speakers.length !== 1 ? 's' : ''}.
                  Name each one so action items are correctly assigned.
                </p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ ...S.label, marginBottom: 6 }}>Meeting Title (optional)</label>
                    <input type="text" placeholder="e.g. Q3 Planning Session"
                      value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)}
                      style={{ width: '100%', padding: '9px 14px', fontSize: 13, borderRadius: 8,
                        border: '1px solid #1e3a5f', background: '#060810', color: '#e8f0fe', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ ...S.label, marginBottom: 6 }}>Meeting Date</label>
                    <input type="text" value={meetingDate} onChange={e => setMeetingDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 14px', fontSize: 13, borderRadius: 8,
                        border: '1px solid #1e3a5f', background: '#060810', color: '#e8f0fe', boxSizing: 'border-box' }} />
                  </div>
                </div>

                {speakers.map(spkr => (
                  <div key={spkr} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(0,212,255,0.12)',
                      color: '#00d4ff', padding: '5px 12px', borderRadius: 14,
                      border: '1px solid rgba(0,212,255,0.3)', minWidth: 85, textAlign: 'center' }}>
                      Speaker {spkr}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7fa3', fontStyle: 'italic', flex: 1, minWidth: 100 }}>
                      "{utterances.find(u => u.speaker === spkr)?.text?.slice(0, 55)}..."
                    </span>
                    <input type="text" placeholder="Enter name"
                      value={speakerMap[spkr] || ''}
                      onChange={e => setSpeakerMap(prev => ({ ...prev, [spkr]: e.target.value }))}
                      style={{ padding: '9px 14px', fontSize: 13, borderRadius: 8,
                        border: '1px solid #1e3a5f', background: '#060810', color: '#e8f0fe', width: 180 }} />
                  </div>
                ))}
                {error && <p style={{ fontSize: 13, color: '#ff4d4d', marginBottom: 12 }}>{error}</p>}
                <button onClick={handleNameConfirm} style={glowBtn()}>
                  ✓ Confirm Names and Analyse
                </button>
              </div>
            )}

            {/* ── ANALYZING ── */}
            {step === STEPS.ANALYZING && (
              <div style={{ padding: '8px 0' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#00d4ff', fontFamily: 'monospace' }}>
                  {'>'} {statusMsg}<span className="blink">_</span>
                </p>
                <p style={{ fontSize: 12, color: '#6b7fa3' }}>
                  Groq Llama 3.3 70B is extracting 13 categories of insight from the transcript...
                </p>
                <div style={{ marginTop: 16, height: 3, background: '#1e3a5f', borderRadius: 2 }}>
                  <div style={{ height: 3, width: '80%',
                    background: 'linear-gradient(90deg, #7c3aed, #00d4ff)',
                    borderRadius: 2, animation: 'pulse-bar 1.5s infinite' }} />
                </div>
              </div>
            )}

            {/* ── ERROR ── */}
            {step === STEPS.ERROR && (
              <div style={{ background: '#120609', border: '1px solid rgba(255,77,77,0.4)', borderRadius: 12, padding: 20 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#ff4d4d' }}>❌ Something went wrong</p>
                <p style={{ fontSize: 13, color: '#6b7fa3', fontFamily: 'monospace' }}>{error}</p>
                <button onClick={reset} style={{ ...glowBtn('#ff4d4d', '#fff'), marginTop: 12 }}>Try Again</button>
              </div>
            )}

            {/* ════════════════════════════════════════════════
                RESULTS
            ════════════════════════════════════════════════ */}
            {step === STEPS.RESULTS && results && (
              <div>
                {/* Meeting header */}
                <div style={{ marginBottom: 20 }}>
                  {meetingTitle && <h3 style={{ fontSize: 18, fontWeight: 800, color: '#e8f0fe', margin: '0 0 4px' }}>{meetingTitle}</h3>}
                  <p style={{ fontSize: 12, color: '#6b7fa3', margin: 0 }}>{meetingDate}</p>
                  {demoMode && (
                    <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 10px', borderRadius: 10,
                      background: 'rgba(124,58,237,0.15)', color: '#7c3aed',
                      border: '1px solid rgba(124,58,237,0.35)', fontSize: 10, fontWeight: 700 }}>
                      DEMO MODE
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {confidence !== null && (
                    <div style={{ ...S.subCard, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <span style={{ fontSize: 10, color: '#6b7fa3', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Confidence</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: confidence >= 80 ? '#00e676' : '#f59e0b' }}>{confidence}%</span>
                      <span style={{ fontSize: 10, color: '#6b7fa3' }}>
                        {confidence >= 90 ? 'Excellent audio' : confidence >= 70 ? 'Good quality' : 'Review carefully'}
                      </span>
                    </div>
                  )}
                  <div style={{ ...S.subCard, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#6b7fa3', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Sentiment</span>
                    <SentimentBadge sentiment={results.sentiment} />
                    {results.sentiment_reason && <span style={{ fontSize: 10, color: '#6b7fa3' }}>{results.sentiment_reason}</span>}
                  </div>
                  <div style={{ ...S.subCard, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#6b7fa3', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Effectiveness</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ScoreRing score={results.effectiveness_score} />
                      {results.effectiveness_reason && <span style={{ fontSize: 10, color: '#6b7fa3', flex: 1 }}>{results.effectiveness_reason}</span>}
                    </div>
                  </div>
                </div>

                {/* Talk time */}
                {Object.keys(talkTime).length > 0 && (
                  <div style={S.subCard}>
                    <span style={S.label}>Talk Time</span>
                    {Object.entries(talkTime).map(([lbl, data], i) => (
                      <TalkBar key={lbl} name={speakerMap[lbl] || `Speaker ${lbl}`}
                        data={data} color={TALK_COLORS[i % TALK_COLORS.length]} />
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div style={S.subCard}>
                  <span style={S.label}>Meeting Summary</span>
                  <p style={{ fontSize: 11, color: '#6b7fa3', margin: '0 0 8px' }}>
                    Type: <strong style={{ color: '#00d4ff' }}>{results.meeting_type || 'Other'}</strong>
                  </p>
                  <p style={{ color: '#e8f0fe', lineHeight: 1.8, fontSize: 14, margin: 0 }}>
                    {results.summary || 'No summary available.'}
                  </p>
                </div>

                {/* Action items */}
                <div style={S.subCard}>
                  <span style={S.label}>Action Items</span>
                  {results.action_items && results.action_items.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e3a5f' }}>
                          {['Task', 'Owner', 'Deadline', 'Priority'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left',
                              fontWeight: 700, color: '#00d4ff', fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.action_items.map((item, i) => (
                          <tr key={`${item.task}-${i}`} style={{ borderBottom: '1px solid rgba(30,58,95,0.4)' }}>
                            <td style={{ padding: '9px 10px', color: '#e8f0fe' }}>{item.task || '—'}</td>
                            <td style={{ padding: '9px 10px', color: '#00d4ff' }}>{item.owner || '—'}</td>
                            <td style={{ padding: '9px 10px', color: '#6b7fa3' }}>{item.deadline || '—'}</td>
                            <td style={{ padding: '9px 10px' }}><PriorityBadge priority={item.priority} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ fontSize: 13, color: '#6b7fa3' }}>No action items detected.</p>
                  )}
                </div>

                {/* Decisions */}
                {results.decisions && results.decisions.length > 0 && (
                  <div style={S.subCard}>
                    <span style={S.label}>Decisions Made</span>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#e8f0fe', lineHeight: 1.9 }}>
                      {results.decisions.map((d, i) => <li key={`d-${i}`}>{d}</li>)}
                    </ul>
                  </div>
                )}

                {/* Key quotes */}
                {results.key_quotes && results.key_quotes.length > 0 && (
                  <div style={S.subCard}>
                    <span style={S.label}>Key Quotes</span>
                    {results.key_quotes.map((q, i) => (
                      <div key={`q-${i}`} style={{ borderLeft: '3px solid #7c3aed', paddingLeft: 14, marginBottom: 12 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 13, color: '#e8f0fe', fontStyle: 'italic' }}>"{q.quote}"</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#7c3aed', fontWeight: 700 }}>— {q.speaker}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Open questions + Parking lot */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {results.open_questions && results.open_questions.length > 0 && (
                    <div style={{ background: '#080d18', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: 16 }}>
                      <span style={{ ...S.label, color: '#f59e0b' }}>Open Questions</span>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#e8f0fe', lineHeight: 1.9 }}>
                        {results.open_questions.map((q, i) => <li key={`oq-${i}`}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                  {results.parking_lot && results.parking_lot.length > 0 && (
                    <div style={{ background: '#080d18', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, padding: 16 }}>
                      <span style={{ ...S.label, color: '#7c3aed' }}>Parking Lot</span>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#e8f0fe', lineHeight: 1.9 }}>
                        {results.parking_lot.map((p, i) => <li key={`pl-${i}`}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Risk flags */}
                {results.risk_flags && results.risk_flags.length > 0 && (
                  <div style={{ background: '#120609', border: '1px solid rgba(255,77,77,0.4)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <span style={{ ...S.label, color: '#ff4d4d' }}>⚠ Risk Flags</span>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#e8f0fe', lineHeight: 1.9 }}>
                      {results.risk_flags.map((r, i) => <li key={`rf-${i}`}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {/* Next agenda */}
                {results.next_agenda && results.next_agenda.length > 0 && (
                  <div style={{ background: '#080d18', border: '1px solid rgba(0,230,118,0.4)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <span style={{ ...S.label, color: '#00e676' }}>Next Meeting Agenda</span>
                    <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#e8f0fe', lineHeight: 1.9 }}>
                      {results.next_agenda.map((a, i) => <li key={`na-${i}`}>{a}</li>)}
                    </ol>
                  </div>
                )}

                {/* Key topics */}
                {results.key_topics && results.key_topics.length > 0 && (
                  <div style={{ ...S.subCard, marginBottom: 14 }}>
                    <span style={S.label}>Key Topics</span>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {results.key_topics.map((topic, i) => (
                        <span key={`topic-${i}`} style={{ padding: '3px 12px', borderRadius: 14,
                          background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
                          color: '#00d4ff', fontSize: 12, fontWeight: 600 }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coach */}
                {coachData && (
                  <div style={{ background: '#080d18', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 10, padding: 20, marginBottom: 14 }}>
                    <span style={{ ...S.label, color: '#7c3aed' }}>🏆 Meeting Coach</span>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#e8f0fe', margin: '0 0 16px' }}>{coachData.headline}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.25)', borderRadius: 8, padding: 14 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#00e676', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Top Strength</p>
                        <p style={{ fontSize: 13, color: '#e8f0fe', margin: 0 }}>{coachData.top_strength}</p>
                      </div>
                      <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: 14 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Top Improvement</p>
                        <p style={{ fontSize: 13, color: '#e8f0fe', margin: 0 }}>{coachData.top_improvement}</p>
                      </div>
                    </div>
                    {coachData.score_to_beat && (
                      <div style={{ background: '#060810', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#00d4ff', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>Score to Beat</p>
                        <p style={{ fontSize: 13, color: '#e8f0fe', margin: 0 }}>{coachData.score_to_beat}</p>
                      </div>
                    )}
                    {coachData.facilitation_tips && coachData.facilitation_tips.length > 0 && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7fa3', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>Facilitation Tips</p>
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#e8f0fe', lineHeight: 1.9 }}>
                          {coachData.facilitation_tips.map((tip, i) => <li key={`tip-${i}`}>{tip}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Email + tone selector */}
                {email && (
                  <div style={{ background: '#080d18', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 10, padding: 20, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                      <span style={S.label}>Follow-up Email</span>
                      <button onClick={copyEmail} style={glowBtn(copied ? '#00e676' : '#7c3aed', '#fff', 'sm')}>
                        {copied ? '✓ Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, color: '#6b7fa3', margin: '0 0 8px' }}>Regenerate with a different tone:</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { value: 'ceo', label: '📊 CEO', desc: 'Bullets, outcomes only' },
                          { value: 'client', label: '🤝 Client', desc: 'Warm, relationship-first' },
                          { value: 'team', label: '⚡ Team', desc: 'Casual, action-focused' },
                        ].map(tone => (
                          <button key={tone.value} title={tone.desc}
                            onClick={() => { setEmailTone(tone.value); regenerateEmail(tone.value) }}
                            disabled={regenLoading}
                            style={{
                              ...glowBtn(emailTone === tone.value ? '#7c3aed' : '#1e3a5f',
                                emailTone === tone.value ? '#fff' : '#6b7fa3', 'sm'),
                              opacity: regenLoading ? 0.6 : 1,
                            }}>
                            {tone.label}
                          </button>
                        ))}
                        {regenLoading && <span style={{ fontSize: 11, color: '#6b7fa3', alignSelf: 'center' }}>Regenerating...</span>}
                      </div>
                    </div>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#e8f0fe', lineHeight: 1.8, fontFamily: 'inherit', margin: 0 }}>
                      {email}
                    </pre>
                  </div>
                )}

                {/* Transcript */}
                {namedTranscript && (
                  <div style={{ ...S.subCard, marginBottom: 14 }}>
                    <button onClick={() => setTranscriptOpen(p => !p)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, padding: 0, width: '100%' }}>
                      <span style={{ ...S.label, margin: 0 }}>Full Transcript</span>
                      <span style={{ fontSize: 11, color: '#6b7fa3', marginLeft: 'auto' }}>
                        {transcriptOpen ? '▲ Collapse' : '▼ Expand'}
                      </span>
                    </button>
                    {transcriptOpen && (
                      <pre style={{ marginTop: 14, whiteSpace: 'pre-wrap', fontSize: 12,
                        color: '#6b7fa3', lineHeight: 1.8, fontFamily: 'monospace',
                        maxHeight: 380, overflowY: 'auto' }}>
                        {namedTranscript}
                      </pre>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
                  <button onClick={downloadMinutes} style={glowBtn('#00d4ff', '#000', 'sm')}>⬇ Download Minutes</button>
                  <button onClick={shareViaEmail} style={glowBtn('#7c3aed', '#fff', 'sm')}>✉ Share via Email</button>
                  <button onClick={reset} style={glowBtn('#1e3a5f', '#e8f0fe', 'sm')}>↩ New Meeting</button>
                </div>
              </div>
            )}

          </div>{/* end app content */}
        </div>{/* end app-panel */}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0 40px', fontSize: 11, color: '#6b7fa3', letterSpacing: '1px' }}>
          Built with Intellica AI · Powered by AssemblyAI + Groq · AI Agents Bootcamp
        </div>

      </div>
    </div>
  )
}
