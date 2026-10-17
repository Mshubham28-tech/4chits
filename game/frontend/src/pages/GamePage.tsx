import { useParams } from 'react-router-dom'

export default function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>()

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <h2>Room {roomCode}</h2>
        <p style={{ color: '#6f6178' }}>
          The actual game — dealing chits, roles, and scoring — arrives in Phase 3.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#6f6178' }}>
          Phase 1 preview: this screen is just a placeholder so the app shell's routes are all
          reachable. Nothing is playable yet.
        </p>
      </div>
    </div>
  )
}
