// ─────────────────────────────────────────────────────────────
// MeetingMind — Frontend (React)
// Flow: upload → poll AssemblyAI → name speakers → analyze → email
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

export default function App() {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [audioFile, setAudioFile] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [utterances, setUtterances] = useState([])
  const [speakers, setSpeakers] = useState([])
  const [speakerMap, setSpeakerMap] = useState({})
  const [results, setResults] = useState(null)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const pollRef = useRef(null)

  // ── Step 1: Upload audio ──────────────────────────────
  async function handleUpload() {
    if (!audioFile) return
    setStep(STEPS.PROCESSING)
    setStatusMsg('Uploading audio to AssemblyAI...')

    try {
      const form = new FormData()
      form.append('audio', audioFile)
      const res = await axios.post(`${API}/transcribe`, form)

      if (res.data.error) throw new Error(res.data.error)

      setJobId(res.data.job_id)
      setStatusMsg('Transcribing and identifying speakers... (this takes 30–90 seconds)')
      startPolling(res.data.job_id)

    } catch (err) {
      setError(err.message || 'Upload failed. Is the backend running?')
      setStep(STEPS.ERROR)
    }
  }

  // ── Poll AssemblyAI until complete ───────────────────
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

          // Initialise speaker map with blank names
          const map = {}
          res.data.speakers.forEach(s => { map[s] = '' })
          setSpeakerMap(map)

          setStep(STEPS.NAME_SPEAKERS)
        }
        // If still processing, keep polling

      } catch (err) {
        clearInterval(pollRef.current)
        setError('Lost connection while polling. Please try again.')
        setStep(STEPS.ERROR)
      }
    }, 3000) // poll every 3 seconds
  }

  // ── Step 2: User names the speakers ─────────────────
  function updateSpeakerName(label, name) {
    setSpeakerMap(prev => ({ ...prev, [label]: name }))
  }

  async function handleNameConfirm() {
    // Check all speakers have been named
    const unnamed = speakers.filter(s => !speakerMap[s].trim())
    if (unnamed.length > 0) {
      setError(`Please name all speakers before continuing. Missing: Speaker ${unnamed.join(', ')}`)
      return
    }
    setError('')
    setStep(STEPS.ANALYZING)
    setStatusMsg('Extracting action items and summary...')
    await runAnalysis()
  }

  // ── Step 3: Analyze + draft email ───────────────────
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
    setJobId(null)
    setUtterances([])
    setSpeakers([])
    setSpeakerMap({})
    setResults(null)
    setEmail('')
    setError('')
    setStatusMsg('')
  }

  // ── Styles ───────────────────────────────────────────
  const card = {
    background: '#fff',
    border: '1px solid #e8e8e5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16
  }

  const btn = (color = '#0f0f12') => ({
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 700,
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer'
  })

  // ── Render ───────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0 }}>🎙 MeetingMind</h1>
      <p style={{ color: '#888', margin: '6px 0 28px', fontSize: 14 }}>
        Upload a meeting recording → get action items, summary, and a follow-up email.
      </p>

      {/* ── UPLOAD STEP ── */}
      {step === STEPS.UPLOAD && (
        <div style={card}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 12 }}>
            Upload your meeting recording
          </label>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
            📱 <strong>How to record:</strong> Use Voice Memos (iPhone) or Recorder (Android).
            Place your phone in the centre of the table. After the meeting, email the file to
            yourself, download it here, and upload below.<br />
            <strong>Accepted formats:</strong> MP3 and M4A only.
          </p>
          <input
            type="file"
            accept=".mp3,.m4a"
            onChange={e => setAudioFile(e.target.files[0])}
            style={{ fontSize: 13, marginBottom: 16 }}
          />
          {audioFile && (
            <p style={{ fontSize: 12, color: '#1D9E75', marginBottom: 16 }}>
              ✓ {audioFile.name} selected
            </p>
          )}
          <button
            onClick={handleUpload}
            disabled={!audioFile}
            style={{ ...btn(), opacity: audioFile ? 1 : 0.4, cursor: audioFile ? 'pointer' : 'not-allowed' }}
          >
            ✨ Upload and Transcribe
          </button>
        </div>
      )}

      {/* ── PROCESSING STEP ── */}
      {step === STEPS.PROCESSING && (
        <div style={card}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>⏳ {statusMsg}</p>
          <p style={{ fontSize: 13, color: '#888' }}>
            AssemblyAI is transcribing your audio and identifying each speaker.
            This usually takes 30–90 seconds. Please wait.
          </p>
          <div style={{ marginTop: 16, height: 6, background: '#f0f0f0', borderRadius: 3 }}>
            <div style={{
              height: 6, width: '60%', background: '#0f0f12',
              borderRadius: 3, animation: 'pulse 1.5s infinite'
            }} />
          </div>
        </div>
      )}

      {/* ── SPEAKER NAMING STEP ── */}
      {step === STEPS.NAME_SPEAKERS && (
        <div style={card}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>👥 Who was in this meeting?</h3>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
            We detected {speakers.length} speaker{speakers.length > 1 ? 's' : ''}.
            Type each person's name below so action items are correctly assigned.
          </p>
          {speakers.map(label => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, background: '#f0f0f0',
                padding: '6px 12px', borderRadius: 6, minWidth: 80
              }}>
                Speaker {label}
              </span>
              <span style={{ fontSize: 13, color: '#888' }}>said:</span>
              <span style={{ fontSize: 12, color: '#555', flex: 1, fontStyle: 'italic' }}>
                "{utterances.find(u => u.speaker === label)?.text?.slice(0, 60)}..."
              </span>
              <input
                type="text"
                placeholder="Enter name"
                value={speakerMap[label] || ''}
                onChange={e => updateSpeakerName(label, e.target.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, borderRadius: 8,
                  border: '1px solid #ddd', width: 160
                }}
              />
            </div>
          ))}
          {error && (
            <p style={{ fontSize: 13, color: '#c0392b', marginBottom: 12 }}>{error}</p>
          )}
          <button onClick={handleNameConfirm} style={btn()}>
            ✓ Confirm Names and Analyse
          </button>
        </div>
      )}

      {/* ── ANALYZING STEP ── */}
      {step === STEPS.ANALYZING && (
        <div style={card}>
          <p style={{ fontSize: 15, fontWeight: 600 }}>⏳ {statusMsg}</p>
          <p style={{ fontSize: 13, color: '#888' }}>Groq is reading the transcript and extracting action items...</p>
        </div>
      )}

      {/* ── ERROR STEP ── */}
      {step === STEPS.ERROR && (
        <div style={{ ...card, background: '#fff0ee', border: '1px solid #f0c0a0' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#c0392b' }}>❌ Something went wrong</p>
          <p style={{ fontSize: 13, color: '#555' }}>{error}</p>
          <button onClick={reset} style={{ ...btn('#c0392b'), marginTop: 12 }}>
            Try Again
          </button>
        </div>
      )}

      {/* ── RESULTS STEP ── */}
      {step === STEPS.RESULTS && results && (
        <div>
          <div style={card}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>📋 Meeting Summary</h3>
            <p style={{ color: '#444', lineHeight: 1.7, fontSize: 13 }}>
              {results.summary || 'No summary available.'}
            </p>
          </div>

          <div style={card}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>✅ Action Items</h3>
            {results.action_items && results.action_items.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f3' }}>
                    {['Task', 'Owner', 'Deadline'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.action_items.map((item, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                      <td style={{ padding: '9px 12px' }}>{item.task || '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#555' }}>{item.owner || '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#555' }}>{item.deadline || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: 13, color: '#888' }}>No action items detected in this meeting.</p>
            )}
          </div>

          {results.decisions && results.decisions.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>🏛 Decisions Made</h3>
              <ul style={{ fontSize: 13, color: '#444', lineHeight: 1.8, paddingLeft: 20 }}>
                {results.decisions.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {email && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, margin: 0 }}>📧 Follow-up Email</h3>
                <button onClick={copyEmail} style={btn(copied ? '#1D9E75' : '#0f0f12')}>
                  {copied ? '✓ Copied!' : 'Copy Email'}
                </button>
              </div>
              <pre style={{
                whiteSpace: 'pre-wrap', fontSize: 13, color: '#333',
                lineHeight: 1.75, fontFamily: 'inherit', margin: 0
              }}>
                {email}
              </pre>
            </div>
          )}

          <button onClick={reset} style={{ ...btn('#555'), marginTop: 8 }}>
            ↩ Analyse Another Meeting
          </button>
        </div>
      )}
    </div>
  )
}