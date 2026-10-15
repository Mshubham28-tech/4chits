import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlayerName, setPlayerName } from '../lib/playerName'

export default function HomePage() {
  const [name, setName] = useState(getPlayerName())
  const navigate = useNavigate()

  const canProceed = name.trim().length > 0

  function goTo(path: string) {
    if (!canProceed) return
    setPlayerName(name.trim())
    navigate(path)
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.6rem' }}>4chits: Raja Mantri Chor Sipahi</h1>
        <p style={{ color: '#6f6178' }}>Enter a display name to create or join a room.</p>

        <label className="sr-only" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={!canProceed} onClick={() => goTo('/create')}>
            Create a room
          </button>
          <button className="btn btn-ghost" disabled={!canProceed} onClick={() => goTo('/join')}>
            Join a room
          </button>
        </div>
      </div>
    </div>
  )
}
