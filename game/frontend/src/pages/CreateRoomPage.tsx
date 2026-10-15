import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../lib/socket'
import { getPlayerName } from '../lib/playerName'
import { saveRoomIdentity } from '../lib/roomSession'

// Per DECISIONS.md Round 2: host chooses rounds per match (5 / 10 / 20).
const ROUND_OPTIONS = [5, 10, 20] as const

export default function CreateRoomPage() {
  const [rounds, setRounds] = useState<(typeof ROUND_OPTIONS)[number]>(10)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const name = getPlayerName()

  async function handleCreate() {
    setIsCreating(true)
    setError(null)
    const result = await createRoom(name, rounds)
    setIsCreating(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    saveRoomIdentity(result.snapshot.code, result.playerId, result.token)
    navigate(`/lobby/${result.snapshot.code}`)
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

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreate} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create room'}
        </button>

        {error && (
          <p role="alert" style={{ color: '#b3261e', fontSize: '0.85rem', marginTop: 12, marginBottom: 0 }}>
            {error}
          </p>
        )}

        <p style={{ fontSize: '0.8rem', color: '#6f6178', marginTop: 16, marginBottom: 0 }}>
          Other players can join with the room code or invite link shown in the next screen.
        </p>
      </div>
    </div>
  )
}
