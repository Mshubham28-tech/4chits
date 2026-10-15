import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinRoom } from '../lib/socket'
import { getPlayerName } from '../lib/playerName'
import { saveRoomIdentity } from '../lib/roomSession'

export default function JoinRoomPage() {
  const [code, setCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const name = getPlayerName()

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setIsJoining(true)
    setError(null)
    const result = await joinRoom(trimmed, name)
    setIsJoining(false)
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

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={!code.trim() || isJoining}
          onClick={handleJoin}
        >
          {isJoining ? 'Joining...' : 'Join room'}
        </button>

        {error && (
          <p role="alert" style={{ color: '#b3261e', fontSize: '0.85rem', marginTop: 12, marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
