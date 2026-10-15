import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlayerName } from '../lib/playerName'
import { clearRoomIdentity, getRoomIdentity } from '../lib/roomSession'
import { rejoinRoom, socket, startGame, type RoomSnapshot } from '../lib/socket'

type LoadState = 'loading' | 'ready' | 'error' | 'closed'

export default function LobbyPage() {
  const { roomCode = '' } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const name = getPlayerName()
  const [copied, setCopied] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [room, setRoom] = useState<RoomSnapshot | null>(null)
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const hasNavigatedToGame = useRef(false)

  const shareLink = `${window.location.origin}${window.location.pathname.replace(/\/lobby\/.*/, '')}/join?code=${roomCode}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable - not critical for this Phase 2 preview.
    }
  }

  // Resume this seat on mount (covers both a normal arrival right after
  // create/join, and a page refresh - see DECISIONS.md "Phase 2 kickoff").
  useEffect(() => {
    let cancelled = false
    const identity = getRoomIdentity(roomCode)
    if (!identity) {
      setLoadState('error')
      setError('No saved seat for this room in this browser. Go back and create or join a room.')
      return
    }

    rejoinRoom(roomCode, identity.playerId, identity.token).then((result) => {
      if (cancelled) return
      if (!result.ok) {
        setLoadState('error')
        setError(result.error)
        return
      }
      setRoom(result.snapshot)
      setMyPlayerId(result.playerId)
      setLoadState('ready')
      if (result.snapshot.status === 'playing' && !hasNavigatedToGame.current) {
        hasNavigatedToGame.current = true
        navigate(`/game/${roomCode}`)
      }
    })

    return () => {
      cancelled = true
    }
  }, [roomCode, navigate])

  useEffect(() => {
    function onRoomUpdate(snapshot: RoomSnapshot) {
      if (snapshot.code !== roomCode) return
      setRoom(snapshot)
    }
    function onRoomClosed() {
      clearRoomIdentity(roomCode)
      setLoadState('closed')
    }
    function onGameStarted() {
      if (hasNavigatedToGame.current) return
      hasNavigatedToGame.current = true
      navigate(`/game/${roomCode}`)
    }

    socket.on('room_update', onRoomUpdate)
    socket.on('room_closed', onRoomClosed)
    socket.on('game_started', onGameStarted)
    return () => {
      socket.off('room_update', onRoomUpdate)
      socket.off('room_closed', onRoomClosed)
      socket.off('game_started', onGameStarted)
    }
  }, [roomCode, navigate])

  async function handleStart() {
    setIsStarting(true)
    const result = await startGame(roomCode)
    setIsStarting(false)
    if (!result.ok) setError(result.error)
    // On success, the game_started broadcast (above) handles navigation for everyone, host included.
  }

  if (loadState === 'closed') {
    return (
      <div className="app-shell">
        <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <h2>Room closed</h2>
          <p style={{ color: '#6f6178' }}>The host left, so this room no longer exists.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className="app-shell">
        <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <h2>Couldn't join this room</h2>
          <p style={{ color: '#6f6178' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  if (loadState === 'loading' || !room) {
    return (
      <div className="app-shell">
        <div className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <p style={{ color: '#6f6178' }}>Joining room...</p>
        </div>
      </div>
    )
  }

  const me = room.players.find((p) => p.id === myPlayerId)
  const isHost = me?.isHost ?? false
  const isFull = room.players.length === 4

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

        <p style={{ fontWeight: 600, marginBottom: 8, textAlign: 'left' }}>Players ({room.players.length}/4)</p>
        <ul style={{ textAlign: 'left', paddingLeft: 20, marginBottom: 24 }}>
          {room.players.map((p) => (
            <li key={p.id}>
              {p.name}
              {p.id === myPlayerId ? ' (you)' : ''}
              {p.isHost ? ' — host' : ''}
              {!p.connected ? ' (reconnecting…)' : ''}
            </li>
          ))}
        </ul>

        {isHost ? (
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={!isFull || isStarting} onClick={handleStart}>
            {isStarting ? 'Starting...' : isFull ? 'Start game' : `Waiting for players (${room.players.length}/4)`}
          </button>
        ) : (
          <p style={{ color: '#6f6178', margin: 0 }}>
            {isFull ? 'Waiting for the host to start the game.' : `Waiting for more players (${room.players.length}/4).`}
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: '#b3261e', fontSize: '0.85rem', marginTop: 12, marginBottom: 0 }}>
            {error}
          </p>
        )}

        {name === '' && (
          <p style={{ fontSize: '0.8rem', color: '#6f6178', marginTop: 16, marginBottom: 0 }}>
            Playing as a guest in this room.
          </p>
        )}
      </div>
    </div>
  )
}
