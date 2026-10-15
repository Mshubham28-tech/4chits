import { randomUUID } from 'node:crypto'

// Phase 2 scope only: rooms + lobby. No game state (chits/roles/scoring) yet - that's Phase 3.

export interface Player {
  id: string
  /** Secret the client must present to resume this seat after a refresh/disconnect. Never sent in room_update. */
  token: string
  name: string
  connected: boolean
  isHost: boolean
}

export type RoomStatus = 'lobby' | 'playing'

export interface Room {
  code: string
  rounds: number
  status: RoomStatus
  players: Map<string, Player>
  /** Timestamp the room became empty (no connected players), or null if someone is connected. Used for the 5-minute cleanup sweep. */
  emptySince: number | null
  /** Per-player 60s reconnect grace timers (DECISIONS.md Phase 2 kickoff). */
  disconnectTimers: Map<string, NodeJS.Timeout>
}

export interface RoomSnapshot {
  code: string
  rounds: number
  status: RoomStatus
  players: { id: string; name: string; connected: boolean; isHost: boolean }[]
}

const MAX_PLAYERS = 4
// Overridable via env var for integration testing only (see test-client.mjs) -
// production always runs with the real Phase 0/Phase 2 values below.
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS_OVERRIDE) || 60_000 // Phase 0 Round 4 decision
const EMPTY_ROOM_TTL_MS = Number(process.env.EMPTY_ROOM_TTL_MS_OVERRIDE) || 5 * 60_000 // Phase 2 kickoff decision

// Same alphabet as the Phase 1 frontend placeholder generator, minus ambiguous
// characters (no I/O to avoid confusion with 1/0).
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_DIGITS = '23456789'

export class RoomManager {
  private rooms = new Map<string, Room>()

  private generateCode(): string {
    let code = ''
    for (let i = 0; i < 4; i++) code += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]
    for (let i = 0; i < 2; i++) code += CODE_DIGITS[Math.floor(Math.random() * CODE_DIGITS.length)]
    return code
  }

  private snapshot(room: Room): RoomSnapshot {
    return {
      code: room.code,
      rounds: room.rounds,
      status: room.status,
      players: [...room.players.values()].map((p) => ({
        id: p.id,
        name: p.name,
        connected: p.connected,
        isHost: p.isHost,
      })),
    }
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase())
  }

  createRoom(name: string, rounds: number): { room: Room; player: Player; snapshot: RoomSnapshot } {
    let code = this.generateCode()
    while (this.rooms.has(code)) code = this.generateCode() // astronomically unlikely, but don't collide

    const player: Player = { id: randomUUID(), token: randomUUID(), name, connected: true, isHost: true }
    const room: Room = {
      code,
      rounds,
      status: 'lobby',
      players: new Map([[player.id, player]]),
      emptySince: null,
      disconnectTimers: new Map(),
    }
    this.rooms.set(code, room)
    return { room, player, snapshot: this.snapshot(room) }
  }

  joinRoom(
    code: string,
    name: string,
  ): { ok: true; room: Room; player: Player; snapshot: RoomSnapshot } | { ok: false; error: string } {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'That room code doesn’t exist.' }
    if (room.status !== 'lobby') return { ok: false, error: 'That game has already started.' }
    if (room.players.size >= MAX_PLAYERS) return { ok: false, error: 'That room is full (4/4).' }

    const player: Player = { id: randomUUID(), token: randomUUID(), name, connected: true, isHost: false }
    room.players.set(player.id, player)
    room.emptySince = null
    return { ok: true, room, player, snapshot: this.snapshot(room) }
  }

  rejoinRoom(
    code: string,
    playerId: string,
    token: string,
  ): { ok: true; room: Room; player: Player; snapshot: RoomSnapshot } | { ok: false; error: string } {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'That room no longer exists.' }
    const player = room.players.get(playerId)
    if (!player || player.token !== token) return { ok: false, error: 'Could not resume your seat in that room.' }

    this.clearDisconnectTimer(room, playerId)
    player.connected = true
    room.emptySince = null
    return { ok: true, room, player, snapshot: this.snapshot(room) }
  }

  startGame(code: string, requesterId: string): { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string } {
    const room = this.getRoom(code)
    if (!room) return { ok: false, error: 'That room no longer exists.' }
    const requester = room.players.get(requesterId)
    if (!requester?.isHost) return { ok: false, error: 'Only the host can start the game.' }
    if (room.players.size !== MAX_PLAYERS) return { ok: false, error: `Need ${MAX_PLAYERS} players to start (have ${room.players.size}).` }

    room.status = 'playing'
    return { ok: true, snapshot: this.snapshot(room) }
  }

  snapshotOf(code: string): RoomSnapshot | undefined {
    const room = this.getRoom(code)
    return room ? this.snapshot(room) : undefined
  }

  private clearDisconnectTimer(room: Room, playerId: string) {
    const timer = room.disconnectTimers.get(playerId)
    if (timer) {
      clearTimeout(timer)
      room.disconnectTimers.delete(playerId)
    }
  }

  /**
   * Called when a player's socket disconnects. Starts the 60s reconnect grace
   * period (Phase 2 kickoff decision). `onResolved` fires once the grace
   * period actually expires without a rejoin - never on a timely reconnect.
   */
  handleDisconnect(code: string, playerId: string, onResolved: (result: { roomClosed: boolean; snapshot?: RoomSnapshot }) => void) {
    const room = this.getRoom(code)
    if (!room) return
    const player = room.players.get(playerId)
    if (!player) return

    player.connected = false
    this.clearDisconnectTimer(room, playerId)

    const timer = setTimeout(() => {
      room.disconnectTimers.delete(playerId)
      const stillThere = room.players.get(playerId)
      if (!stillThere || stillThere.connected) return // they reconnected before the timer fired

      const wasHost = stillThere.isHost
      room.players.delete(playerId)

      if (wasHost) {
        // Host leaves lobby = room closes immediately (Phase 2 kickoff decision).
        this.rooms.delete(room.code)
        onResolved({ roomClosed: true })
        return
      }

      if (room.players.size === 0) {
        room.emptySince = Date.now()
      }
      onResolved({ roomClosed: false, snapshot: this.snapshot(room) })
    }, RECONNECT_GRACE_MS)

    room.disconnectTimers.set(playerId, timer)
  }

  /** Explicit "leave" (not a disconnect) - removes immediately, no grace period. */
  removePlayer(code: string, playerId: string): { roomClosed: boolean; snapshot?: RoomSnapshot } {
    const room = this.getRoom(code)
    if (!room) return { roomClosed: false }
    const player = room.players.get(playerId)
    if (!player) return { roomClosed: false }

    this.clearDisconnectTimer(room, playerId)
    room.players.delete(playerId)

    if (player.isHost) {
      this.rooms.delete(room.code)
      return { roomClosed: true }
    }
    if (room.players.size === 0) room.emptySince = Date.now()
    return { roomClosed: false, snapshot: this.snapshot(room) }
  }

  /** Periodic sweep: deletes rooms that have had zero connected players for EMPTY_ROOM_TTL_MS. */
  sweepEmptyRooms() {
    const now = Date.now()
    for (const [code, room] of this.rooms) {
      const hasConnected = [...room.players.values()].some((p) => p.connected)
      if (hasConnected) {
        room.emptySince = null
        continue
      }
      if (room.emptySince === null) {
        room.emptySince = now
        continue
      }
      if (now - room.emptySince >= EMPTY_ROOM_TTL_MS) {
        for (const timer of room.disconnectTimers.values()) clearTimeout(timer)
        this.rooms.delete(code)
      }
    }
  }
}
