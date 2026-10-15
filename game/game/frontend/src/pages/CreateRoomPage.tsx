import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generatePlaceholderRoomCode, getPlayerName } from '../lib/playerName'

// Per DECISIONS.md Round 2: host chooses rounds per match (5 / 10 / 20).
const ROUND_OPTIONS = [5, 10, 20] as const

export default function CreateRoomPage() {
  const [rounds, setRounds] = useState<(typeof ROUND_OPTIONS)[number]>(10)
  const navigate = useNavigate()
  const name = getPlayerName()

  function handleCreate() {
    // Phase 1 placeholder: generates a fake code locally, no real server/room yet.
    // Phase 2 replaces this with an actual request to the game server.
    const code = generatePlaceholderRoomCode()
    navigate(`/lobby/${code}?rounds=${rounds}`)
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h2>Create a room</h2>
        <p style={{ color: '#6f6178' }}>
          Playing as <strong>{name || 'Guest'}</strong>
        </p>

        <p style={{ fontWeight: 600, marginBottom: 8 }}>Rounds per match</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {ROUND_OPTIONS.map((r) => (
            <button
              key={r}
              className={r === rounds ? 'btn btn-primary' : 'btn btn-ghost'}
              onClick={() => setRounds(r)}
              style={{ flex: 1 }}
            >
              {r}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate}>
          Create room
        </button>

        <p style={{ fontSize: '0.8rem', color: '#6f6178', marginTop: 16, marginBottom: 0 }}>
          Phase 1 preview: this creates a placeholder room code only — no real server or
          other players yet. That arrives in Phase 2.
        </p>
      </div>
    </div>
  )
}
