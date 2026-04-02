// ─────────────────────────────────────────────────────────────
// MeetingMind — Frontend v2.0
// Author: Intellica AI · AI Agents Bootcamp
//
// Changes from v1.0:
// - API URL moved to environment variable (VITE_API_URL)
// - Style constants moved outside component (fixes re-render cost)
// - File size validation added (25MB guard)
// - navigator.clipboard wrapped in try/catch (HTTP-safe)
// - SVG <defs> moved to correct position (before first use)
// - Confirm Names button disabled during analysis
// - New: demo mode, tone selector, coach card, 13 result fields
// - New: talk time bars, sentiment badge, score ring
// - New: collapsible transcript, download minutes, share via email
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import axios from 'axios'

// ── Environment config ─────────────────────────────────────
// In production: set VITE_API_URL in frontend/.env
// Fallback to localhost for development without .env file
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── State machine ──────────────────────────────────────────
const STEPS = {
  UPLOAD:        'upload',
  PROCESSING:    'processing',
  NAME_SPEAKERS: 'name_speakers',
  ANALYZING:     'analyzing',
  RESULTS:       'results',
  ERROR:         'error',
}

// ── Design tokens — defined OUTSIDE component to avoid re-creation on every render ──
const theme = {
  bg:      '#0a0e1a',
  card:    '#111827',
  border:  '#1e3a5f',
  accent:  '#00d4ff',
  purple:  '#7c3aed',
  text:    '#f0f4f8',
  muted:   '#8899aa',
  success: '#00e676',
  warning: '#f59e0b',
  error:   '#ff4d4d',
}

// ── Shared style objects — outside component, created once ──
const styles = {
  card: {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: theme.accent,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  },
  subCard: {
    background: '#0d1b2e',
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
}

// ── Button factory — pure function, no closure over component state ──
const glowBtn = (bg = theme.accent, color = '#000') => ({
  padding: '13px 28px',
  fontSize: 14,
  fontWeight: 700,
  background: bg,
  color,
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  boxShadow: `0 0 18px ${bg}66`,
  transition: 'all 0.2s',
  letterSpacing: '0.5px',
})

const smallBtn = (bg = theme.accent, color = '#000') => ({
  padding: '8px 18px',
  fontSize: 12,
  fontWeight: 700,
  background: bg,
  color,
  border: `1px solid ${bg}66`,
  borderRadius: 8,
  cursor: 'pointer',
  letterSpacing: '0.5px',
  transition: 'all 0.2s',
})

// ── File validation constants ──────────────────────────────
const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_EXTENSIONS = ['.mp3', '.m4a', '.webm']

// ── Demo data — pre-built product launch meeting ───────────
// Skips upload + polling entirely — goes straight to /analyze
const DEMO_UTTERANCES = [
  { speaker: 'A', text: "Alright everyone, let's get started. We need to finalise the launch plan for the client portal. The target is end of next week, which means we have tight deadlines.", start_ms: 0, end_ms: 9200, duration_ms: 9200 },
  { speaker: 'B', text: "The core backend is ready. The payment gateway integration is the only blocker right now. I need one more day to test the Stripe webhooks but I'm confident we'll be done by Wednesday.", start_ms: 9400, end_ms: 22100, duration_ms: 12700 },
  { speaker: 'C', text: "Marketing-wise, the announcement email is drafted and the social posts are scheduled. We're waiting on the final feature list from engineering before we can confirm the copy.", start_ms: 22400, end_ms: 33800, duration_ms: 11400 },
  { speaker: 'A', text: "Good. So the decision is: we launch Friday if the payment gateway passes testing by Wednesday. Bob, you own that. Carol, once Bob gives you the green light on Wednesday, send the announcement Thursday morning.", start_ms: 34200, end_ms: 47600, duration_ms: 13400 },
  { speaker: 'B', text: "Understood. One thing I want to flag — we haven't discussed a rollback plan if something goes wrong post-launch. Should we park that for now or handle it today?", start_ms: 48000, end_ms: 58900, duration_ms: 10900 },
  { speaker: 'A', text: "Good catch. Let's park the rollback plan for our Monday standup — that's a separate conversation. For now, we stay focused on Friday. Any blockers I haven't heard?", start_ms: 59200, end_ms: 70400, duration_ms: 11200 },
]

const DEMO_SPEAKER_MAP = { A: 'Alice', B: 'Bob', C: 'Carol' }

// ── Helper: format seconds as MM:SS ───────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Helper components — defined outside App to avoid re-creation ──

function SentimentBadge({ sentiment }) {
  const map = {
    Positive: { bg: '#00e67622', color: '#00e676', border: '#00e67644' },
    Neutral:  { bg: '#00d4ff22', color: '#00d4ff', border: '#00d4ff44' },
    Mixed:    { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b44' },
    Tense:    { bg: '#ff4d4d22', color: '#ff4d4d', border: '#ff4d4d44' },
  }
  const s = map[sentiment] || map.Neutral
  return (
    <span style={{
      padding: '5px 14px',
      borderRadius: 20,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.5px',
    }}>
      {sentiment || 'Neutral'}
    </span>
  )
}

function ScoreRing({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? theme.success : score >= 4 ? theme.warning : theme.error
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1e3a5f" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: theme.muted, letterSpacing: '0.5px' }}>/10</span>
      </div>
    </div>
  )
}

function TalkTimeBar({ speakerMap, talkTime }) {
  if (!talkTime || Object.keys(talkTime).length === 0) return null
  const colors = [theme.accent, theme.purple, theme.success, theme.warning]

  return (
    <div>
      {Object.entries(talkTime).map(([label, data], i) => {
        const name = speakerMap[label] || `Speaker ${label}`
        const color = colors[i % colors.length]
        return (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginBottom: 5, fontSize: 12,
            }}>
              <span style={{ color: theme.text, fontWeight: 600 }}>{name}</span>
              <span style={{ color: theme.muted }}>
                {data.minutes} min · {data.percentage}%
              </span>
            </div>
            <div style={{ height: 6, background: '#1e3a5f', borderRadius: 3 }}>
              <div style={{
                height: 6,
                width: `${data.percentage}%`,
                background: color,
                borderRadius: 3,
                boxShadow: `0 0 8px ${color}66`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PriorityBadge({ priority }) {
  const map = {
    High:   { bg: '#ff4d4d22', color: '#ff4d4d', border: '#ff4d4d44' },
    Medium: { bg: '#f59e0b22', color: '#f59e0b', border: '#f59e0b44' },
    Low:    { bg: '#00e67622', color: '#00e676', border: '#00e67644' },
  }
  const s = map[priority] || map.Low
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 12,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: 10,
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {priority || 'Low'}
    </span>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ══════════════════════════════════════════════════════════
export default function App() {

  // ── Core pipeline state ──────────────────────────────────
  const [step, setStep]               = useState(STEPS.UPLOAD)
  const [audioFile, setAudioFile]     = useState(null)
  const [utterances, setUtterances]   = useState([])
  const [speakers, setSpeakers]       = useState([])
  const [speakerMap, setSpeakerMap]   = useState({})
  const [results, setResults]         = useState(null)
  const [email, setEmail]             = useState('')
  const [error, setError]             = useState('')
  const [copied, setCopied]           = useState(false)
  const [statusMsg, setStatusMsg]     = useState('')

  // ── v2.0 new state ───────────────────────────────────────
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
  const [regeneratingEmail, setRegeneratingEmail] = useState(false)

  // ── Refs ─────────────────────────────────────────────────
  const pollRef            = useRef(null)
  const mediaRecorderRef   = useRef(null)
  const audioChunksRef     = useRef([])
  const recordingTimerRef  = useRef(null)

  // ── File validation ──────────────────────────────────────
  function validateFile(file) {
    if (!file) return 'No file selected.'
    const name = file.name.toLowerCase()
    const validExt = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))
    if (!validExt) return `Invalid file type. Accepted formats: MP3, M4A, WebM.`
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`
    }
    return null // null = valid
  }

  // ── Upload handler ───────────────────────────────────────
  async function handleUpload() {
    const validationError = validateFile(audioFile)
    if (validationError) {
      setError(validationError)
      return
    }
    await uploadAudioFile(audioFile)
  }

  // ── Shared upload function (used by file upload + browser recording) ──
  async function uploadAudioFile(file) {
    setStep(STEPS.PROCESSING)
    setStatusMsg('Uploading audio to AssemblyAI...')
    try {
      const form = new FormData()
      form.append('audio', file)
      const res = await axios.post(`${API}/transcribe`, form)
      if (res.data.error) throw new Error(res.data.error)
      setStatusMsg('Transcribing and identifying speakers... (30–90 seconds)')
      startPolling(res.data.job_id)
    } catch (err) {
      setError(err.message || 'Upload failed. Is the backend running?')
      setStep(STEPS.ERROR)
    }
  }

  // ── Polling — now captures talk_time and confidence ──────
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
      } catch (err) {
        clearInterval(pollRef.current)
        setError('Lost connection while polling. Please try again.')
        setStep(STEPS.ERROR)
      }
    }, 3000)
  }

  function updateSpeakerName(label, name) {
    setSpeakerMap(prev => ({ ...prev, [label]: name }))
  }

  async function handleNameConfirm() {
    const unnamed = speakers.filter(s => !speakerMap[s].trim())
    if (unnamed.length > 0) {
      setError(`Please name all speakers. Missing: Speaker ${unnamed.join(', ')}`)
      return
    }
    setError('')
    setStep(STEPS.ANALYZING)
    setStatusMsg('Extracting action items and summary...')
    await runAnalysis(utterances, speakerMap)
  }

  // ── Demo mode — skips upload, uses pre-built data ────────
  async function handleDemoMode() {
    setDemoMode(true)
    setSpeakers(Object.keys(DEMO_SPEAKER_MAP))
    setSpeakerMap(DEMO_SPEAKER_MAP)
    setMeetingTitle('Client Portal Launch Planning')
    setMeetingDate(new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    }))
    // Build fake talk time from demo utterances
    const fakeTalkTime = {}
    let total = 0
    DEMO_UTTERANCES.forEach(u => {
      fakeTalkTime[u.speaker] = (fakeTalkTime[u.speaker] || 0) + u.duration_ms
      total += u.duration_ms
    })
    const fakeTalkTimePct = {}
    Object.entries(fakeTalkTime).forEach(([sp, ms]) => {
      fakeTalkTimePct[sp] = {
        ms,
        minutes: +(ms / 60000).toFixed(1),
        percentage: +((ms / total) * 100).toFixed(1),
      }
    })
    setTalkTime(fakeTalkTimePct)
    setConfidence(96.4)
    setStep(STEPS.ANALYZING)
    setStatusMsg('Running demo analysis...')
    await runAnalysis(DEMO_UTTERANCES, DEMO_SPEAKER_MAP)
  }

  // ── Core analysis — v2.0: passes meeting_context, tone, calls /coach ──
  const runAnalysis = useCallback(async (utts, spkMap) => {
    try {
      const meeting_context = {
        title: meetingTitle || 'Meeting',
        date: meetingDate,
      }

      // Build named transcript for display
      const lines = utts.map(u => {
        const name = spkMap[u.speaker] || `Speaker ${u.speaker}`
        return `${name}: ${u.text}`
      })
      const transcript = lines.join('\n')
      setNamedTranscript(transcript)

      setStatusMsg('Extracting insights with Groq...')
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

      setStep(STEPS.RESULTS)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStep(STEPS.ERROR)
    }
  }, [meetingTitle, meetingDate, emailTone])

  // ── Regenerate email with new tone ───────────────────────
  async function regenerateEmail(tone) {
    if (!results) return
    setRegeneratingEmail(true)
    try {
      const res = await axios.post(`${API}/draft-email`, {
        ...results,
        meeting_context: { title: meetingTitle, date: meetingDate },
        tone,
      })
      if (res.data.error) throw new Error(res.data.error)
      setEmail(res.data.email)
    } catch (err) {
      // Silently fail — keep existing email
    } finally {
      setRegeneratingEmail(false)
    }
  }

  // ── Clipboard copy — try/catch for HTTP environments ────
  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      // Fallback: select a textarea and use execCommand
      const el = document.createElement('textarea')
      el.value = email
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // ── Download minutes as .txt ─────────────────────────────
  function downloadMinutes() {
    if (!results) return
    const titleLine = meetingTitle ? `MEETING MINUTES — ${meetingTitle.toUpperCase()}` : 'MEETING MINUTES'
    const lines = [
      titleLine,
      meetingDate,
      '='.repeat(60),
      '',
      'SUMMARY',
      '-'.repeat(40),
      results.summary || '',
      '',
      'DECISIONS',
      '-'.repeat(40),
      ...(results.decisions || []).map((d, i) => `${i + 1}. ${d}`),
      '',
      'ACTION ITEMS',
      '-'.repeat(40),
      ...(results.action_items || []).map(a =>
        `• ${a.task} | Owner: ${a.owner} | Deadline: ${a.deadline} | Priority: ${a.priority}`
      ),
      '',
      'OPEN QUESTIONS',
      '-'.repeat(40),
      ...(results.open_questions || []).map(q => `• ${q}`),
      '',
      'PARKING LOT',
      '-'.repeat(40),
      ...(results.parking_lot || []).map(p => `• ${p}`),
      '',
      'RISK FLAGS',
      '-'.repeat(40),
      ...(results.risk_flags || []).map(r => `⚠ ${r}`),
      '',
      'NEXT MEETING AGENDA',
      '-'.repeat(40),
      ...(results.next_agenda || []).map((a, i) => `${i + 1}. ${a}`),
      '',
      '='.repeat(60),
      'FOLLOW-UP EMAIL',
      '-'.repeat(40),
      email || '',
      '',
      '='.repeat(60),
      `Generated by MeetingMind · Intellica AI · AI Agents Bootcamp`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MeetingMind_${(meetingTitle || 'Minutes').replace(/\s+/g, '_')}_${meetingDate.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Share via email (mailto) ─────────────────────────────
  function shareViaEmail() {
    const subject = encodeURIComponent(`Meeting Minutes${meetingTitle ? ` — ${meetingTitle}` : ''}`)
    const body = encodeURIComponent(email || 'See attached meeting minutes.')
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  // ── Reset all state ──────────────────────────────────────
  function reset() {
    clearInterval(pollRef.current)
    setStep(STEPS.UPLOAD)
    setAudioFile(null)
    setUtterances([])
    setSpeakers([])
    setSpeakerMap({})
    setResults(null)
    setEmail('')
    setError('')
    setStatusMsg('')
    setTalkTime({})
    setConfidence(null)
    setNamedTranscript('')
    setCoachData(null)
    setDemoMode(false)
    setTranscriptOpen(false)
    setMeetingTitle('')
    setMeetingDate(new Date().toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    }))
    setRegeneratingEmail(false)
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ════════════════════════════════════════════════════
          SECTION 1 — BANNER
      ════════════════════════════════════════════════════ */}
      <div style={{ width: '100%', position: 'relative' }}>
        <img
          src="/AIAB_banner.png"
          alt="AI Agents Bootcamp Banner"
          style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(10,14,26,0.95))',
          padding: '32px 40px 20px',
          fontSize: 13, color: theme.muted, letterSpacing: '1px',
        }}>
          📍 Workshop Venue: University of the West Indies, St. Augustine Campus
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>

        {/* ════════════════════════════════════════════════════
            SECTION 2 — ARCHITECTURE DIAGRAM
        ════════════════════════════════════════════════════ */}
        <div style={styles.card}>
          <span style={styles.label}>How It Works</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 28px', color: theme.text }}>
            The Three-Agent Pipeline
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox="0 0 860 200" xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', minWidth: 600 }}>

              {/* ── Defs first — before any element that references them ── */}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#1e3a5f" />
                </marker>
              </defs>

              {/* Node 1 — Phone */}
              <rect x="10" y="60" width="130" height="80" rx="12"
                fill="#0d1b2e" stroke="#1e3a5f" strokeWidth="1.5" />
              <text x="75" y="88" textAnchor="middle" fill="#8899aa" fontSize="10" fontWeight="700" letterSpacing="1">INPUT</text>
              <text x="75" y="108" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">📱 Phone</text>
              <text x="75" y="126" textAnchor="middle" fill="#8899aa" fontSize="10">MP3 / M4A</text>

              <line x1="140" y1="100" x2="175" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="157" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">email</text>

              {/* Node 2 — AssemblyAI (Agent 1) */}
              <rect x="175" y="50" width="150" height="100" rx="12"
                fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="250" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 1</text>
              <text x="250" y="95" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">AssemblyAI</text>
              <text x="250" y="113" textAnchor="middle" fill="#8899aa" fontSize="10">Transcription</text>
              <text x="250" y="129" textAnchor="middle" fill="#8899aa" fontSize="10">+ Diarization</text>

              <line x1="325" y1="100" x2="365" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="345" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">speakers</text>

              {/* Node 3 — Speaker ID */}
              <rect x="365" y="60" width="130" height="80" rx="12"
                fill="#0d1b2e" stroke="#7c3aed" strokeWidth="1.5" />
              <text x="430" y="88" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="700" letterSpacing="1">USER STEP</text>
              <text x="430" y="108" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">👥 Name</text>
              <text x="430" y="126" textAnchor="middle" fill="#8899aa" fontSize="10">Speakers</text>

              <line x1="495" y1="100" x2="535" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="515" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">transcript</text>

              {/* Node 4 — Groq Agent 2 */}
              <rect x="535" y="50" width="140" height="100" rx="12"
                fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="605" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 2</text>
              <text x="605" y="95" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">Groq LLM</text>
              <text x="605" y="113" textAnchor="middle" fill="#8899aa" fontSize="10">Extract Tasks</text>
              <text x="605" y="129" textAnchor="middle" fill="#8899aa" fontSize="10">Llama 3.3 70B</text>

              <line x1="675" y1="100" x2="710" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="692" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">JSON</text>

              {/* Node 5 — Groq Agent 3 */}
              <rect x="710" y="50" width="140" height="100" rx="12"
                fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="780" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 3</text>
              <text x="780" y="95" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">Groq LLM</text>
              <text x="780" y="113" textAnchor="middle" fill="#8899aa" fontSize="10">Draft Email</text>
              <text x="780" y="129" textAnchor="middle" fill="#8899aa" fontSize="10">Llama 3.3 70B</text>
            </svg>
          </div>

          {/* Tech stack badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            {[
              { label: 'AssemblyAI',     color: theme.accent },
              { label: 'Groq',           color: theme.accent },
              { label: 'Llama 3.3 70B',  color: theme.purple },
              { label: 'FastAPI',        color: theme.purple },
              { label: 'React + Vite',   color: theme.accent },
              { label: 'Free to Build',  color: theme.success },
            ].map(badge => (
              <span key={badge.label} style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: `1px solid ${badge.color}44`,
                color: badge.color,
                fontSize: 11,
                fontWeight: 700,
                background: `${badge.color}11`,
                letterSpacing: '0.5px',
              }}>
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SECTION 3 — WORKSHOP MATERIALS
        ════════════════════════════════════════════════════ */}
        <div style={styles.card}>
          <span style={styles.label}>Workshop Materials</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 24px', color: theme.text }}>
            AI Agents Bootcamp
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Brochure card */}
            <div style={{
              background: '#0d1b2e',
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <img
                src="/AAIB_brochure.png"
                alt="AI Agents Bootcamp Brochure"
                style={{ width: '100%', display: 'block', height: 220, objectFit: 'cover' }}
              />
              <div style={{ padding: '14px 16px' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.text }}>Workshop Brochure</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.muted }}>Overview, outcomes, and who this is for</p>
              </div>
            </div>

            {/* Curriculum card */}
            <a href="/AI_Agents_Bootcamp_Curriculum.pdf" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#0d1b2e',
                border: `1px solid ${theme.purple}66`,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <img
                    src="/AIAB_banner.png"
                    alt="AI Agents Bootcamp Curriculum"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 36 }}>📄</span>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: '#fff',
                      background: `${theme.purple}cc`,
                      padding: '6px 16px', borderRadius: 20, letterSpacing: '1px',
                    }}>
                      VIEW CURRICULUM
                    </span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.text }}>Full Curriculum PDF</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.muted }}>Click to open — full day schedule and build phases</p>
                </div>
              </div>
            </a>

          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SECTION 4 — THE APP
        ════════════════════════════════════════════════════ */}
        <div style={{ ...styles.card, border: `1px solid ${theme.accent}44` }}>
          <span style={styles.label}>Try It Now</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: theme.text }}>
            🎙 MeetingMind
          </h2>
          <p style={{ fontSize: 13, color: theme.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
            Record your meeting on your phone → email the MP3/M4A to yourself →
            upload below → get action items, summary, and a follow-up email instantly.
          </p>

          {/* ── UPLOAD ── */}
          {step === STEPS.UPLOAD && (
            <div>
              <span style={styles.label}>Upload Recording</span>
              <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16, lineHeight: 1.7 }}>
                📱 Use <strong style={{ color: theme.text }}>Voice Memos</strong> (iPhone) or{' '}
                <strong style={{ color: theme.text }}>Recorder</strong> (Android).
                Place phone in the centre of the table. After the meeting,
                email the file to yourself, download it, and upload below.<br />
                <strong style={{ color: theme.accent }}>Accepted: MP3 and M4A only. Max {MAX_FILE_SIZE_MB} MB.</strong>
              </p>
              <input
                type="file"
                accept=".mp3,.m4a"
                onChange={e => {
                  setAudioFile(e.target.files[0] || null)
                  setError('')
                }}
                style={{ fontSize: 13, color: theme.text, marginBottom: 16 }}
              />
              {audioFile && (
                <p style={{ fontSize: 12, color: theme.success, marginBottom: 16 }}>
                  ✓ {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB) ready to upload
                </p>
              )}
              {error && (
                <p style={{ fontSize: 13, color: theme.error, marginBottom: 16 }}>{error}</p>
              )}
              <button
                onClick={handleUpload}
                disabled={!audioFile}
                style={{
                  ...glowBtn(),
                  opacity: audioFile ? 1 : 0.4,
                  cursor: audioFile ? 'pointer' : 'not-allowed',
                }}
              >
                ✨ Upload and Transcribe
              </button>

              {/* Demo mode separator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                margin: '24px 0 16px',
              }}>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
                <span style={{ fontSize: 11, color: theme.muted, letterSpacing: '1px' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: theme.border }} />
              </div>

              <button
                onClick={handleDemoMode}
                style={glowBtn(theme.purple, '#fff')}
              >
                ⚡ Try Demo — No Upload Needed
              </button>
              <p style={{ fontSize: 11, color: theme.muted, marginTop: 8 }}>
                Loads a sample product launch meeting and runs the full pipeline instantly.
              </p>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {step === STEPS.PROCESSING && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: theme.accent }}>⏳ {statusMsg}</p>
              <p style={{ fontSize: 13, color: theme.muted }}>
                AssemblyAI is transcribing your audio and identifying each speaker.
                Usually takes 30–90 seconds.
              </p>
              <div style={{ marginTop: 20, height: 4, background: '#1e3a5f', borderRadius: 2 }}>
                <div style={{
                  height: 4, width: '60%',
                  background: `linear-gradient(90deg, ${theme.accent}, ${theme.purple})`,
                  borderRadius: 2, animation: 'pulse 1.5s infinite',
                }} />
              </div>
            </div>
          )}

          {/* ── SPEAKER NAMING ── */}
          {step === STEPS.NAME_SPEAKERS && (
            <div>
              <h3 style={{ fontSize: 16, color: theme.text, marginBottom: 6 }}>
                👥 Who was in this meeting?
              </h3>
              <p style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>
                We detected {speakers.length} speaker{speakers.length > 1 ? 's' : ''}.
                Type each person's name so action items are correctly assigned.
              </p>

              {/* Optional meeting details */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ ...styles.label, marginBottom: 6 }}>Meeting Title (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 Planning Session"
                      value={meetingTitle}
                      onChange={e => setMeetingTitle(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 14px', fontSize: 13,
                        borderRadius: 8, border: `1px solid ${theme.border}`,
                        background: '#0d1b2e', color: theme.text, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ ...styles.label, marginBottom: 6 }}>Meeting Date</label>
                    <input
                      type="text"
                      value={meetingDate}
                      onChange={e => setMeetingDate(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 14px', fontSize: 13,
                        borderRadius: 8, border: `1px solid ${theme.border}`,
                        background: '#0d1b2e', color: theme.text, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {speakers.map(spkr => (
                <div key={spkr} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, marginBottom: 14, flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800,
                    background: `${theme.accent}22`,
                    color: theme.accent,
                    padding: '6px 14px', borderRadius: 20,
                    border: `1px solid ${theme.accent}44`,
                    minWidth: 90, textAlign: 'center',
                  }}>
                    Speaker {spkr}
                  </span>
                  <span style={{ fontSize: 12, color: theme.muted, fontStyle: 'italic', flex: 1, minWidth: 120 }}>
                    "{utterances.find(u => u.speaker === spkr)?.text?.slice(0, 60)}..."
                  </span>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={speakerMap[spkr] || ''}
                    onChange={e => updateSpeakerName(spkr, e.target.value)}
                    style={{
                      padding: '9px 14px', fontSize: 13,
                      borderRadius: 8, border: `1px solid ${theme.border}`,
                      background: '#0d1b2e', color: theme.text, width: 180,
                    }}
                  />
                </div>
              ))}
              {error && <p style={{ fontSize: 13, color: theme.error, marginBottom: 12 }}>{error}</p>}
              <button
                onClick={handleNameConfirm}
                disabled={step === STEPS.ANALYZING}
                style={{
                  ...glowBtn(),
                  opacity: step === STEPS.ANALYZING ? 0.5 : 1,
                  cursor: step === STEPS.ANALYZING ? 'not-allowed' : 'pointer',
                }}
              >
                ✓ Confirm Names and Analyse
              </button>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {step === STEPS.ANALYZING && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: theme.accent }}>⏳ {statusMsg}</p>
              <p style={{ fontSize: 13, color: theme.muted }}>
                Groq is reading the transcript and extracting insights across 13 categories...
              </p>
              <div style={{ marginTop: 20, height: 4, background: '#1e3a5f', borderRadius: 2 }}>
                <div style={{
                  height: 4, width: '80%',
                  background: `linear-gradient(90deg, ${theme.purple}, ${theme.accent})`,
                  borderRadius: 2, animation: 'pulse 1.5s infinite',
                }} />
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === STEPS.ERROR && (
            <div style={{
              background: '#1a0a0a',
              border: `1px solid ${theme.error}44`,
              borderRadius: 12, padding: 20,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.error }}>❌ Something went wrong</p>
              <p style={{ fontSize: 13, color: theme.muted }}>{error}</p>
              <button onClick={reset} style={{ ...glowBtn(theme.error, '#fff'), marginTop: 12 }}>
                Try Again
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              RESULTS — v2.0 full output
          ════════════════════════════════════════════════ */}
          {step === STEPS.RESULTS && results && (
            <div>

              {/* Meeting title + date */}
              {(meetingTitle || meetingDate) && (
                <div style={{ marginBottom: 20 }}>
                  {meetingTitle && (
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: '0 0 4px' }}>
                      {meetingTitle}
                    </h3>
                  )}
                  {meetingDate && (
                    <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>{meetingDate}</p>
                  )}
                  {demoMode && (
                    <span style={{
                      display: 'inline-block', marginTop: 6,
                      padding: '3px 10px', borderRadius: 10,
                      background: `${theme.purple}22`, color: theme.purple,
                      border: `1px solid ${theme.purple}44`, fontSize: 10, fontWeight: 700,
                    }}>
                      DEMO MODE
                    </span>
                  )}
                </div>
              )}

              {/* Stats row — confidence + sentiment + effectiveness */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12, marginBottom: 16,
              }}>
                {/* Confidence */}
                {confidence !== null && (
                  <div style={{
                    ...styles.subCard, margin: 0,
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <span style={{ fontSize: 10, color: theme.muted, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Transcription Confidence
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: confidence >= 80 ? theme.success : theme.warning }}>
                      {confidence}%
                    </span>
                    <span style={{ fontSize: 11, color: theme.muted }}>
                      {confidence >= 90 ? 'Excellent audio quality' : confidence >= 70 ? 'Good — minor errors possible' : 'Review transcript carefully'}
                    </span>
                  </div>
                )}

                {/* Sentiment */}
                <div style={{
                  ...styles.subCard, margin: 0,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: theme.muted, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Meeting Sentiment
                  </span>
                  <SentimentBadge sentiment={results.sentiment} />
                  {results.sentiment_reason && (
                    <span style={{ fontSize: 11, color: theme.muted }}>{results.sentiment_reason}</span>
                  )}
                </div>

                {/* Effectiveness */}
                <div style={{
                  ...styles.subCard, margin: 0,
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: theme.muted, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Effectiveness
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ScoreRing score={results.effectiveness_score} />
                    {results.effectiveness_reason && (
                      <span style={{ fontSize: 11, color: theme.muted, flex: 1 }}>{results.effectiveness_reason}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Talk time */}
              {Object.keys(talkTime).length > 0 && (
                <div style={styles.subCard}>
                  <span style={styles.label}>Talk Time</span>
                  <TalkTimeBar speakerMap={speakerMap} talkTime={talkTime} />
                </div>
              )}

              {/* Summary */}
              <div style={styles.subCard}>
                <span style={styles.label}>Meeting Summary</span>
                <p style={{ fontSize: 12, color: theme.muted, margin: '0 0 8px' }}>
                  Meeting type: <strong style={{ color: theme.accent }}>{results.meeting_type || 'Other'}</strong>
                </p>
                <p style={{ color: theme.text, lineHeight: 1.8, fontSize: 14, margin: 0 }}>
                  {results.summary || 'No summary available.'}
                </p>
              </div>

              {/* Action items — with priority */}
              <div style={styles.subCard}>
                <span style={styles.label}>Action Items</span>
                {results.action_items && results.action_items.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                        {['Task', 'Owner', 'Deadline', 'Priority'].map(h => (
                          <th key={h} style={{
                            padding: '8px 12px', textAlign: 'left',
                            fontWeight: 700, color: theme.accent,
                            fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.action_items.map((item, i) => (
                        // Using combination of task + index for key — more stable than index alone
                        <tr key={`${item.task}-${i}`} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                          <td style={{ padding: '10px 12px', color: theme.text }}>{item.task || '—'}</td>
                          <td style={{ padding: '10px 12px', color: theme.accent }}>{item.owner || '—'}</td>
                          <td style={{ padding: '10px 12px', color: theme.muted }}>{item.deadline || '—'}</td>
                          <td style={{ padding: '10px 12px' }}><PriorityBadge priority={item.priority} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: 13, color: theme.muted }}>No action items detected.</p>
                )}
              </div>

              {/* Decisions */}
              {results.decisions && results.decisions.length > 0 && (
                <div style={styles.subCard}>
                  <span style={styles.label}>Decisions Made</span>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: theme.text, lineHeight: 1.9 }}>
                    {results.decisions.map((d, i) => <li key={`decision-${i}`}>{d}</li>)}
                  </ul>
                </div>
              )}

              {/* Key quotes */}
              {results.key_quotes && results.key_quotes.length > 0 && (
                <div style={styles.subCard}>
                  <span style={styles.label}>Key Quotes</span>
                  {results.key_quotes.map((q, i) => (
                    <div key={`quote-${i}`} style={{
                      borderLeft: `3px solid ${theme.purple}`,
                      paddingLeft: 14, marginBottom: 12,
                    }}>
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: theme.text, fontStyle: 'italic' }}>
                        "{q.quote}"
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: theme.purple, fontWeight: 700 }}>
                        — {q.speaker}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Open questions + parking lot — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {results.open_questions && results.open_questions.length > 0 && (
                  <div style={{
                    background: '#0d1b2e',
                    border: `1px solid ${theme.warning}44`,
                    borderRadius: 12, padding: 18,
                  }}>
                    <span style={{ ...styles.label, color: theme.warning }}>Open Questions</span>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: theme.text, lineHeight: 1.9 }}>
                      {results.open_questions.map((q, i) => <li key={`oq-${i}`}>{q}</li>)}
                    </ul>
                  </div>
                )}
                {results.parking_lot && results.parking_lot.length > 0 && (
                  <div style={{
                    background: '#0d1b2e',
                    border: `1px solid ${theme.purple}44`,
                    borderRadius: 12, padding: 18,
                  }}>
                    <span style={{ ...styles.label, color: theme.purple }}>Parking Lot</span>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: theme.text, lineHeight: 1.9 }}>
                      {results.parking_lot.map((p, i) => <li key={`pl-${i}`}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Risk flags */}
              {results.risk_flags && results.risk_flags.length > 0 && (
                <div style={{
                  background: '#1a0a0a',
                  border: `1px solid ${theme.error}44`,
                  borderRadius: 12, padding: 18, marginBottom: 16,
                }}>
                  <span style={{ ...styles.label, color: theme.error }}>⚠ Risk Flags</span>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: theme.text, lineHeight: 1.9 }}>
                    {results.risk_flags.map((r, i) => <li key={`rf-${i}`}>{r}</li>)}
                  </ul>
                </div>
              )}

              {/* Next agenda */}
              {results.next_agenda && results.next_agenda.length > 0 && (
                <div style={{
                  background: '#0d1b2e',
                  border: `1px solid ${theme.success}44`,
                  borderRadius: 12, padding: 18, marginBottom: 16,
                }}>
                  <span style={{ ...styles.label, color: theme.success }}>Next Meeting Agenda</span>
                  <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: theme.text, lineHeight: 1.9 }}>
                    {results.next_agenda.map((a, i) => <li key={`na-${i}`}>{a}</li>)}
                  </ol>
                </div>
              )}

              {/* Key topics — tag cloud */}
              {results.key_topics && results.key_topics.length > 0 && (
                <div style={{ ...styles.subCard, marginBottom: 16 }}>
                  <span style={styles.label}>Key Topics</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {results.key_topics.map((t, i) => (
                      <span key={`topic-${i}`} style={{
                        padding: '4px 12px',
                        borderRadius: 16,
                        background: `${theme.accent}11`,
                        border: `1px solid ${theme.accent}33`,
                        color: theme.accent,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meeting Coach */}
              {coachData && (
                <div style={{
                  background: '#0d1b2e',
                  border: `1px solid ${theme.purple}66`,
                  borderRadius: 12, padding: 20, marginBottom: 16,
                }}>
                  <span style={{ ...styles.label, color: theme.purple }}>🏆 Meeting Coach</span>
                  <p style={{ fontSize: 16, fontWeight: 800, color: theme.text, margin: '0 0 16px' }}>
                    {coachData.headline}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{
                      background: `${theme.success}11`,
                      border: `1px solid ${theme.success}33`,
                      borderRadius: 10, padding: 14,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: theme.success, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                        Top Strength
                      </p>
                      <p style={{ fontSize: 13, color: theme.text, margin: 0 }}>{coachData.top_strength}</p>
                    </div>
                    <div style={{
                      background: `${theme.warning}11`,
                      border: `1px solid ${theme.warning}33`,
                      borderRadius: 10, padding: 14,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: theme.warning, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                        Top Improvement
                      </p>
                      <p style={{ fontSize: 13, color: theme.text, margin: 0 }}>{coachData.top_improvement}</p>
                    </div>
                  </div>
                  {coachData.score_to_beat && (
                    <div style={{
                      background: '#0a0e1a',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10, padding: 14, marginBottom: 12,
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: theme.accent, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                        Score to Beat
                      </p>
                      <p style={{ fontSize: 13, color: theme.text, margin: 0 }}>{coachData.score_to_beat}</p>
                    </div>
                  )}
                  {coachData.facilitation_tips && coachData.facilitation_tips.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: theme.muted, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px' }}>
                        Facilitation Tips
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: theme.text, lineHeight: 1.9 }}>
                        {coachData.facilitation_tips.map((tip, i) => <li key={`tip-${i}`}>{tip}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Email — with tone selector */}
              {email && (
                <div style={{
                  background: '#0d1b2e',
                  border: `1px solid ${theme.purple}66`,
                  borderRadius: 12, padding: 20, marginBottom: 16,
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12,
                  }}>
                    <span style={styles.label}>Follow-up Email</span>
                    <button
                      onClick={copyEmail}
                      style={smallBtn(copied ? theme.success : theme.purple, '#fff')}
                    >
                      {copied ? '✓ Copied!' : 'Copy Email'}
                    </button>
                  </div>

                  {/* Tone selector */}
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, color: theme.muted, margin: '0 0 8px' }}>
                      Email tone — click to regenerate:
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { value: 'ceo',    label: '📊 CEO',    desc: 'Bullet points, outcomes only' },
                        { value: 'client', label: '🤝 Client', desc: 'Warm, relationship-first' },
                        { value: 'team',   label: '⚡ Team',   desc: 'Casual, action-focused' },
                      ].map(t => (
                        <button
                          key={t.value}
                          onClick={() => {
                            setEmailTone(t.value)
                            regenerateEmail(t.value)
                          }}
                          disabled={regeneratingEmail}
                          title={t.desc}
                          style={{
                            ...smallBtn(
                              emailTone === t.value ? theme.purple : '#1e3a5f',
                              emailTone === t.value ? '#fff' : theme.muted
                            ),
                            opacity: regeneratingEmail ? 0.6 : 1,
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                      {regeneratingEmail && (
                        <span style={{ fontSize: 11, color: theme.muted, alignSelf: 'center' }}>
                          Regenerating...
                        </span>
                      )}
                    </div>
                  </div>

                  <pre style={{
                    whiteSpace: 'pre-wrap', fontSize: 13,
                    color: theme.text, lineHeight: 1.8,
                    fontFamily: 'inherit', margin: 0,
                  }}>
                    {email}
                  </pre>
                </div>
              )}

              {/* Collapsible transcript */}
              {namedTranscript && (
                <div style={{ ...styles.subCard, marginBottom: 16 }}>
                  <button
                    onClick={() => setTranscriptOpen(prev => !prev)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: 0, width: '100%',
                    }}
                  >
                    <span style={{ ...styles.label, margin: 0 }}>Full Transcript</span>
                    <span style={{ fontSize: 12, color: theme.muted, marginLeft: 'auto' }}>
                      {transcriptOpen ? '▲ Collapse' : '▼ Expand'}
                    </span>
                  </button>
                  {transcriptOpen && (
                    <pre style={{
                      marginTop: 16, whiteSpace: 'pre-wrap',
                      fontSize: 12, color: theme.muted,
                      lineHeight: 1.8, fontFamily: 'inherit',
                      maxHeight: 400, overflowY: 'auto',
                    }}>
                      {namedTranscript}
                    </pre>
                  )}
                </div>
              )}

              {/* Action buttons row */}
              <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap',
                paddingTop: 8, marginBottom: 4,
              }}>
                <button onClick={downloadMinutes} style={smallBtn(theme.accent, '#000')}>
                  ⬇ Download Minutes
                </button>
                <button onClick={shareViaEmail} style={smallBtn(theme.purple, '#fff')}>
                  ✉ Share via Email
                </button>
                <button onClick={reset} style={smallBtn('#1e3a5f', theme.text)}>
                  ↩ New Meeting
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '24px 0 40px',
          fontSize: 12, color: theme.muted, letterSpacing: '0.5px',
        }}>
          Built with Intellica AI · Powered by AssemblyAI + Groq · Vibe Coding Workshop
        </div>

      </div>
    </div>
  )
}
