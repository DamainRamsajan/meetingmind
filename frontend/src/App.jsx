// ─────────────────────────────────────────────────────────────
// MeetingMind — Frontend (React)
// Redesigned: dark futuristic theme + workshop landing section
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

const STEPS = {
  UPLOAD: 'upload',
  PROCESSING: 'processing',
  NAME_SPEAKERS: 'name_speakers',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
  ERROR: 'error'
}

// ── Design tokens ─────────────────────────────────────────────
const theme = {
  bg: '#0a0e1a',
  card: '#111827',
  border: '#1e3a5f',
  accent: '#00d4ff',
  purple: '#7c3aed',
  text: '#f0f4f8',
  muted: '#8899aa',
  success: '#00e676',
  error: '#ff4d4d',
}

export default function App() {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [audioFile, setAudioFile] = useState(null)
  const [utterances, setUtterances] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [speakerMap, setSpeakerMap] = useState({})
  const [results, setResults] = useState(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const pollRef = useRef(null)

  async function handleUpload() {
    if (!audioFile) return
    setStep(STEPS.PROCESSING)
    setStatusMsg('Uploading audio to AssemblyAI...')
    try {
      const form = new FormData()
      form.append('audio', audioFile)
      const res = await axios.post(`${API}/transcribe`, form)
      if (res.data.error) throw new Error(res.data.error)
      setStatusMsg('Transcribing and identifying speakers... (30–90 seconds)')
      startPolling(res.data.job_id)
    } catch (err) {
      setError(err.message || 'Upload failed. Is the backend running?')
      setStep(STEPS.ERROR)
    }
  }

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
    await runAnalysis()
  }

  async function runAnalysis() {
    try {
      const r2 = await axios.post(`${API}/analyze`, {
        utterances,
        speaker_map: speakerMap
      })
      if (r2.data.error) throw new Error(r2.data.error)
      setResults(r2.data)
      setStatusMsg('Drafting follow-up email...')
      const r3 = await axios.post(`${API}/draft-email`, r2.data)
      if (r3.data.error) throw new Error(r3.data.error)
      setEmail(r3.data.email)
      setStep(STEPS.RESULTS)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      setStep(STEPS.ERROR)
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

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
  }

  // ── Shared styles ─────────────────────────────────────────
  const card = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  }

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

  const label = {
    fontSize: 12,
    fontWeight: 700,
    color: theme.accent,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'block',
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div style={{ background: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'system-ui, sans-serif' }}>

      {/* ══════════════════════════════════════════════════
          SECTION 1 — BANNER
      ══════════════════════════════════════════════════ */}
      <div style={{ width: '100%', position: 'relative' }}>
        <img
          src="/AIAB_banner.png"
          alt="AI Agents Bootcamp Banner"
          style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }}
        />
        {/* Venue overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(10,14,26,0.95))',
          padding: '32px 40px 20px',
          fontSize: 13, color: theme.muted, letterSpacing: '1px'
        }}>
          📍 Workshop Venue: University of the West Indies, St. Augustine Campus
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — ARCHITECTURE DIAGRAM
      ══════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={card}>
          <span style={label}>How It Works</span>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 28px', color: theme.text }}>
            The Three-Agent Pipeline
          </h2>

          {/* SVG Architecture Diagram */}
          <div style={{ overflowX: 'auto' }}>
            <svg viewBox="0 0 860 200" xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', minWidth: 600 }}>

              {/* ── Node definitions ── */}
              {/* Node 1 — Phone */}
              <rect x="10" y="60" width="130" height="80" rx="12"
                fill="#0d1b2e" stroke="#1e3a5f" strokeWidth="1.5" />
              <text x="75" y="88" textAnchor="middle" fill="#8899aa" fontSize="10" fontWeight="700" letterSpacing="1">INPUT</text>
              <text x="75" y="108" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">📱 Phone</text>
              <text x="75" y="126" textAnchor="middle" fill="#8899aa" fontSize="10">MP3 / M4A</text>

              {/* Arrow 1 */}
              <line x1="140" y1="100" x2="175" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="157" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">email</text>

              {/* Node 2 — AssemblyAI (Agent 1) */}
              <rect x="175" y="50" width="150" height="100" rx="12"
                fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="250" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 1</text>
              <text x="250" y="95" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">AssemblyAI</text>
              <text x="250" y="113" textAnchor="middle" fill="#8899aa" fontSize="10">Transcription</text>
              <text x="250" y="129" textAnchor="middle" fill="#8899aa" fontSize="10">+ Diarization</text>

              {/* Arrow 2 */}
              <line x1="325" y1="100" x2="365" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="345" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">speakers</text>

              {/* Node 3 — Speaker ID */}
              <rect x="365" y="60" width="130" height="80" rx="12"
                fill="#0d1b2e" stroke="#7c3aed" strokeWidth="1.5" />
              <text x="430" y="88" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="700" letterSpacing="1">USER STEP</text>
              <text x="430" y="108" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">👥 Name</text>
              <text x="430" y="126" textAnchor="middle" fill="#8899aa" fontSize="10">Speakers</text>

              {/* Arrow 3 */}
              <line x1="495" y1="100" x2="535" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="515" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">transcript</text>

              {/* Node 4 — Groq Agent 2 */}
              <rect x="535" y="50" width="140" height="100" rx="12"
                fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="605" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 2</text>
              <text x="605" y="95" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">Groq LLM</text>
              <text x="605" y="113" textAnchor="middle" fill="#8899aa" fontSize="10">Extract Tasks</text>
              <text x="605" y="129" textAnchor="middle" fill="#8899aa" fontSize="10">Llama 3.3 70B</text>

              {/* Arrow 4 */}
              <line x1="675" y1="100" x2="710" y2="100" stroke="#1e3a5f" strokeWidth="2" markerEnd="url(#arrow)" />
              <text x="692" y="93" textAnchor="middle" fill="#8899aa" fontSize="9">JSON</text>

              {/* Node 5 — Groq Agent 3 */}
              <rect x="710" y="50" width="140" height="100" rx="12"
                fill="#0d1b2e" stroke="#00d4ff" strokeWidth="1.5" />
              <text x="780" y="75" textAnchor="middle" fill="#00d4ff" fontSize="9" fontWeight="700" letterSpacing="1">AGENT 3</text>
              <text x="780" y="95" textAnchor="middle" fill="#f0f4f8" fontSize="13" fontWeight="800">Groq LLM</text>
              <text x="780" y="113" textAnchor="middle" fill="#8899aa" fontSize="10">Draft Email</text>
              <text x="780" y="129" textAnchor="middle" fill="#8899aa" fontSize="10">Llama 3.3 70B</text>

              {/* Arrow marker definition */}
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#1e3a5f" />
                </marker>
              </defs>
            </svg>
          </div>

          {/* Tech stack badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            {[
              { label: 'AssemblyAI', color: theme.accent },
              { label: 'Groq', color: theme.accent },
              { label: 'Llama 3.3 70B', color: theme.purple },
              { label: 'FastAPI', color: theme.purple },
              { label: 'React + Vite', color: theme.accent },
              { label: 'Free to Build', color: '#00e676' },
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

        {/* ══════════════════════════════════════════════════
            SECTION 3 — WORKSHOP MATERIALS
        ══════════════════════════════════════════════════ */}
        <div style={card}>
          <span style={label}>Workshop Materials</span>
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
              cursor: 'default',
            }}>
              <img
                src="/AAIB_brochure.png"
                alt="AI Agents Bootcamp Brochure"
                style={{ width: '100%', display: 'block', height: 220, objectFit: 'cover' }}
              />
              <div style={{ padding: '14px 16px' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.text }}>
                  Workshop Brochure
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.muted }}>
                  Overview, outcomes, and who this is for
                </p>
              </div>
            </div>

            {/* Curriculum card */}
            <a href="/AI_Agents_Bootcamp_Curriculum.pdf" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
              <div style={{
                background: '#0d1b2e',
                border: `1px solid ${theme.purple}66`,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}>
                {/* Curriculum thumbnail — banner image reused with overlay */}
                <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
                  <img
                    src="/AIAB_banner.png"
                    alt="AI Agents Bootcamp Curriculum"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 10,
                  }}>
                    <span style={{ fontSize: 36 }}>📄</span>
                    <span style={{
                      fontSize: 13, fontWeight: 800, color: '#fff',
                      background: `${theme.purple}cc`,
                      padding: '6px 16px', borderRadius: 20,
                      letterSpacing: '1px',
                    }}>
                      VIEW CURRICULUM
                    </span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: theme.text }}>
                    Full Curriculum PDF
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.muted }}>
                    Click to open — full day schedule and build phases
                  </p>
                </div>
              </div>
            </a>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            SECTION 4 — THE APP
        ══════════════════════════════════════════════════ */}
        <div style={{ ...card, border: `1px solid ${theme.accent}44` }}>
          <span style={label}>Try It Now</span>
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
              <span style={label}>Upload Recording</span>
              <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16, lineHeight: 1.7 }}>
                📱 Use <strong style={{ color: theme.text }}>Voice Memos</strong> (iPhone) or{' '}
                <strong style={{ color: theme.text }}>Recorder</strong> (Android).
                Place phone in the centre of the table. After the meeting,
                email the file to yourself, download it, and upload below.<br />
                <strong style={{ color: theme.accent }}>Accepted: MP3 and M4A only.</strong>
              </p>
              <input
                type="file"
                accept=".mp3,.m4a"
                onChange={e => setAudioFile(e.target.files[0])}
                style={{ fontSize: 13, color: theme.text, marginBottom: 16 }}
              />
              {audioFile && (
                <p style={{ fontSize: 12, color: theme.success, marginBottom: 16 }}>
                  ✓ {audioFile.name} ready to upload
                </p>
              )}
              <button
                onClick={handleUpload}
                disabled={!audioFile}
                style={{
                  ...glowBtn(),
                  opacity: audioFile ? 1 : 0.4,
                  cursor: audioFile ? 'pointer' : 'not-allowed'
                }}
              >
                ✨ Upload and Transcribe
              </button>
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
                  borderRadius: 2, animation: 'pulse 1.5s infinite'
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
              {speakers.map(spkr => (
                <div key={spkr} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 12, marginBottom: 14, flexWrap: 'wrap'
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 800,
                    background: `${theme.accent}22`,
                    color: theme.accent,
                    padding: '6px 14px', borderRadius: 20,
                    border: `1px solid ${theme.accent}44`,
                    minWidth: 90, textAlign: 'center'
                  }}>
                    Speaker {spkr}
                  </span>
                  <span style={{ fontSize: 12, color: theme.muted, fontStyle: 'italic', flex: 1 }}>
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
                      background: '#0d1b2e', color: theme.text, width: 180
                    }}
                  />
                </div>
              ))}
              {error && <p style={{ fontSize: 13, color: theme.error, marginBottom: 12 }}>{error}</p>}
              <button onClick={handleNameConfirm} style={glowBtn()}>
                ✓ Confirm Names and Analyse
              </button>
            </div>
          )}

          {/* ── ANALYZING ── */}
          {step === STEPS.ANALYZING && (
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: theme.accent }}>⏳ {statusMsg}</p>
              <p style={{ fontSize: 13, color: theme.muted }}>
                Groq is reading the transcript and extracting action items...
              </p>
              <div style={{ marginTop: 20, height: 4, background: '#1e3a5f', borderRadius: 2 }}>
                <div style={{
                  height: 4, width: '80%',
                  background: `linear-gradient(90deg, ${theme.purple}, ${theme.accent})`,
                  borderRadius: 2, animation: 'pulse 1.5s infinite'
                }} />
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
          {step === STEPS.ERROR && (
            <div style={{
              background: '#1a0a0a',
              border: `1px solid ${theme.error}44`,
              borderRadius: 12, padding: 20
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.error }}>❌ Something went wrong</p>
              <p style={{ fontSize: 13, color: theme.muted }}>{error}</p>
              <button onClick={reset} style={{ ...glowBtn(theme.error, '#fff'), marginTop: 12 }}>
                Try Again
              </button>
            </div>
          )}

          {/* ── RESULTS ── */}
          {step === STEPS.RESULTS && results && (
            <div>
              {/* Summary */}
              <div style={{
                background: '#0d1b2e',
                border: `1px solid ${theme.border}`,
                borderRadius: 12, padding: 20, marginBottom: 16
              }}>
                <span style={label}>Meeting Summary</span>
                <p style={{ color: theme.text, lineHeight: 1.8, fontSize: 14, margin: 0 }}>
                  {results.summary || 'No summary available.'}
                </p>
              </div>

              {/* Action items */}
              <div style={{
                background: '#0d1b2e',
                border: `1px solid ${theme.border}`,
                borderRadius: 12, padding: 20, marginBottom: 16
              }}>
                <span style={label}>Action Items</span>
                {results.action_items && results.action_items.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                        {['Task', 'Owner', 'Deadline'].map(h => (
                          <th key={h} style={{
                            padding: '8px 12px', textAlign: 'left',
                            fontWeight: 700, color: theme.accent, fontSize: 11,
                            letterSpacing: '1px', textTransform: 'uppercase'
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.action_items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                          <td style={{ padding: '10px 12px', color: theme.text }}>{item.task || '—'}</td>
                          <td style={{ padding: '10px 12px', color: theme.accent }}>{item.owner || '—'}</td>
                          <td style={{ padding: '10px 12px', color: theme.muted }}>{item.deadline || '—'}</td>
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
                <div style={{
                  background: '#0d1b2e',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12, padding: 20, marginBottom: 16
                }}>
                  <span style={label}>Decisions Made</span>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: theme.text, lineHeight: 1.9 }}>
                    {results.decisions.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}

              {/* Email */}
              {email && (
                <div style={{
                  background: '#0d1b2e',
                  border: `1px solid ${theme.purple}66`,
                  borderRadius: 12, padding: 20, marginBottom: 16
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 16
                  }}>
                    <span style={label}>Follow-up Email</span>
                    <button onClick={copyEmail} style={glowBtn(copied ? theme.success : theme.purple, '#fff')}>
                      {copied ? '✓ Copied!' : 'Copy Email'}
                    </button>
                  </div>
                  <pre style={{
                    whiteSpace: 'pre-wrap', fontSize: 13,
                    color: theme.text, lineHeight: 1.8,
                    fontFamily: 'inherit', margin: 0
                  }}>
                    {email}
                  </pre>
                </div>
              )}

              <button onClick={reset} style={{ ...glowBtn('#1e3a5f', theme.text), marginTop: 4 }}>
                ↩ Analyse Another Meeting
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '24px 0 40px',
          fontSize: 12, color: theme.muted, letterSpacing: '0.5px'
        }}>
          Built with Intellica AI · Powered by AssemblyAI + Groq · Vibe Coding Workshop
        </div>

      </div>
    </div>
  )
}