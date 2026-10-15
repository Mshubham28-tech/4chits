import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { RoomManager } from './rooms.js'

// Allowed origins for the live site. Both the apex and www are listed since
// either can end up being what a browser actually sends as Origin depending
// on DNS/redirect behavior - see game/DECISIONS.md for the 4chits.com/play
// hosting setup.
const ALLOWED_ORIGINS = ['https://4chits.com', 'https://www.4chits.com']

const app = express()
app.use(cors({ origin: ALLOWED_ORIGINS }))

// Render (and anyone else) can hit this to check the server is awake - also
// useful for the frontend's "waking up the game table" cold-start screen.
app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS },
})

const rooms = new RoomManager()

// Sweep for abandoned rooms every minute (Phase 2 kickoff: 5-minute empty-room cleanup).
setInterval(() => rooms.sweepEmptyRooms(), 60_000)

interface JoinedInfo {
  code: string
  playerId: string
}

io.on('connection', (socket) => {
  // Tracks which room/player this socket is currently seated as, so
  // disconnect handling knows who to act on without trusting client input.
  let joined: JoinedInfo | null = null

  socket.on('create_room', (payload: { name?: string; rounds?: number }, ack: (res: unknown) => void) => {
    const name = String(payload?.name ?? '').trim().slice(0, 20)
    const rounds = [5, 10, 20].includes(payload?.rounds as number) ? (payload!.rounds as number) : 10
    if (!name) return ack({ ok: false, error: 'Enter a display name first.' })

    const { room, player, snapshot } = rooms.createRoom(name, rounds)
    socket.join(room.code)
    joined = { code: room.code, playerId: player.id }
    ack({ ok: true, snapshot, playerId: player.id, token: player.token })
  })

  socket.on('join_room', (payload: { code?: string; name?: string }, ack: (res: unknown) => void) => {
    const code = String(payload?.code ?? '').trim().toUpperCase()
    const name = String(payload?.name ?? '').trim().slice(0, 20)
    if (!name) return ack({ ok: false, error: 'Enter a display name first.' })
    if (!code) return ack({ ok: false, error: 'Enter a room code.' })

    const result = rooms.joinRoom(code, name)
    if (!result.ok) return ack(result)

    socket.join(result.room.code)
    joined = { code: result.room.code, playerId: result.player.id }
    socket.to(result.room.code).emit('room_update', result.snapshot)
    ack({ ok: true, snapshot: result.snapshot, playerId: result.player.id, token: result.player.token })
  })

  socket.on(
    'rejoin_room',
    (payload: { code?: string; playerId?: string; token?: string }, ack: (res: unknown) => void) => {
      const code = String(payload?.code ?? '').trim().toUpperCase()
      const playerId = String(payload?.playerId ?? '')
      const token = String(payload?.token ?? '')
      const result = rooms.rejoinRoom(code, playerId, token)
      if (!result.ok) return ack(result)

      socket.join(result.room.code)
      joined = { code: result.room.code, playerId: result.player.id }
      io.to(result.room.code).emit('room_update', result.snapshot)
      ack({ ok: true, snapshot: result.snapshot, playerId: result.player.id, token: result.player.token })
    },
  )

  socket.on('start_game', (payload: { code?: string }, ack: (res: unknown) => void) => {
    if (!joined) return ack({ ok: false, error: 'You’re not in a room.' })
    const code = String(payload?.code ?? '').trim().toUpperCase()
    if (code !== joined.code) return ack({ ok: false, error: 'Room mismatch.' })

    const result = rooms.startGame(code, joined.playerId)
    if (!result.ok) return ack(result)

    io.to(code).emit('room_update', result.snapshot)
    io.to(code).emit('game_started')
    ack({ ok: true })
  })

  socket.on('leave_room', () => {
    if (!joined) return
    const { code, playerId } = joined
    const result = rooms.removePlayer(code, playerId)
    socket.leave(code)
    joined = null
    if (result.roomClosed) {
      socket.to(code).emit('room_closed')
    } else if (result.snapshot) {
      io.to(code).emit('room_update', result.snapshot)
    }
  })

  socket.on('disconnect', () => {
    if (!joined) return
    const { code, playerId } = joined
    rooms.handleDisconnect(code, playerId, (result) => {
      if (result.roomClosed) {
        io.to(code).emit('room_closed')
      } else if (result.snapshot) {
        io.to(code).emit('room_update', result.snapshot)
      }
    })
    // Let everyone else know this player is (maybe temporarily) disconnected,
    // without waiting for the grace period to resolve.
    const snapshot = rooms.snapshotOf(code)
    if (snapshot) socket.to(code).emit('room_update', snapshot)
  })
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001
httpServer.listen(PORT, () => {
  console.log(`4chits game server listening on port ${PORT}`)
})
