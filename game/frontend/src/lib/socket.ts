import { io, type Socket } from 'socket.io-client'

// The Phase 2 game server's URL. Render's free tier assigns this when the
// web service is first created. Can be overridden at build time via the
// VITE_SERVER_URL env var (used for local testing); otherwise falls back to
// the constant below, which gets updated once the real Render URL is known.
export const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'https://REPLACE_WITH_RENDER_URL.onrender.com'

// Render's free tier sleeps the server after idling and can take up to ~1
// minute to wake back up (DECISIONS.md Phase 2 kickoff). These options make
// the client retry patiently through that instead of giving up quickly.
export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  timeout: 20_000,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 2_000,
  reconnectionDelayMax: 8_000,
})

export type ConnectionState = 'connecting' | 'connected' | 'error'

export function getConnectionState(): ConnectionState {
  return socket.connected ? 'connected' : 'connecting'
}

/** Subscribes to connect/disconnect/error changes; returns an unsubscribe function. */
export function onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
  const onConnect = () => callback('connected')
  const onDisconnect = () => callback('connecting')
  const onError = () => callback('connecting')

  socket.on('connect', onConnect)
  socket.on('disconnect', onDisconnect)
  socket.on('connect_error', onError)

  return () => {
    socket.off('connect', onConnect)
    socket.off('disconnect', onDisconnect)
    socket.off('connect_error', onError)
  }
}

function emitAck<TPayload, TResponse>(event: string, payload: TPayload): Promise<TResponse> {
  return new Promise((resolve) => {
    socket.emit(event, payload, resolve)
  })
}

export interface PlayerView {
  id: string
  name: string
  connected: boolean
  isHost: boolean
}

export interface RoomSnapshot {
  code: string
  rounds: number
  status: 'lobby' | 'playing'
  players: PlayerView[]
}

type AckResult<T extends object> = ({ ok: true } & T) | { ok: false; error: string }

export function createRoom(name: string, rounds: number) {
  return emitAck<{ name: string; rounds: number }, AckResult<{ snapshot: RoomSnapshot; playerId: string; token: string }>>(
    'create_room',
    { name, rounds },
  )
}

export function joinRoom(code: string, name: string) {
  return emitAck<{ code: string; name: string }, AckResult<{ snapshot: RoomSnapshot; playerId: string; token: string }>>(
    'join_room',
    { code, name },
  )
}

export function rejoinRoom(code: string, playerId: string, token: string) {
  return emitAck<
    { code: string; playerId: string; token: string },
    AckResult<{ snapshot: RoomSnapshot; playerId: string; token: string }>
  >('rejoin_room', { code, playerId, token })
}

export function startGame(code: string) {
  return emitAck<{ code: string }, AckResult<Record<string, never>>>('start_game', { code })
}

export function leaveRoom() {
  socket.emit('leave_room')
}
