import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPlayerName } from '../lib/playerName'

export default function LobbyPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const name = getPlayerName()
  const [copied, setCopied] = useState(false)

  const shareLink = `${window.location.origin}${window.location.pathname.replace(/\/lobby\/.*/, '')}/join?code=${roomCode}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — not critical for this Phase 1 preview.
    }
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <h2>Room lobby</h2>

        <p style={{ color: '#6f6178', marginBottom: 4 }}>Room code</p>
        <p
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'var(--purple-600)',
            margin: '0 0 16px',
          }}
        >
          {roomCode}
        </p>

        <button className="btn btn-ghost" onClick={copyLink} style={{ marginBottom: 24 }}>
          {copied ? 'Link copied!' : 'Copy invite link'}
        </button>

        <p style={{ fontWeight: 600, marginBottom: 8, textAlign: 'left' }}>Players (1/4)</p>
        <ul style={{ textAlign: 'left', paddingLeft: 20, marginBottom: 24 }}>
          <li>{name || 'Guest'} (you)</li>
        </ul>

        <p style={{ fontSize: '0.85rem', color: '#6f6178' }}>
          Phase 1 preview: this is a static lobby showing just you — Phase 2 adds the real
          server that syncs other players joining live, in real time.
        </p>
      </div>
    </div>
  )
}
