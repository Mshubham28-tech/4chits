import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlayerName } from '../lib/playerName'

export default function JoinRoomPage() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const name = getPlayerName()

  function handleJoin() {
    if (!code.trim()) return
    // Phase 1 placeholder: no real room lookup/validation yet — Phase 2 adds that.
    navigate(`/lobby/${code.trim().toUpperCase()}`)
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h2>Join a room</h2>
        <p style={{ color: '#6f6178' }}>
          Playing as <strong>{name || 'Guest'}</strong>
        </p>

        <label className="sr-only" htmlFor="roomCode">
          Room code
        </label>
        <input
          id="roomCode"
          type="text"
          placeholder="Room code (e.g. BLUE42)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={8}
          style={{ marginBottom: 16, textTransform: 'uppercase' }}
        />

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={!code.trim()} onClick={handleJoin}>
          Join room
        </button>

        <p style={{ fontSize: '0.8rem', color: '#6f6178', marginTop: 16, marginBottom: 0 }}>
          Phase 1 preview: any code is accepted for now since there's no real server yet.
          Phase 2 adds real room validation.
        </p>
      </div>
    </div>
  )
}
