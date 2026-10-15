// Per-room reconnect identity (Phase 2). Lets a page refresh resume the same
// seat instead of being treated as a brand-new join - see DECISIONS.md
// "Phase 2 kickoff" > Refresh/reconnect. Keyed per room code since a tab
// could theoretically have been in more than one room this session.

interface RoomIdentity {
  playerId: string
  token: string
}

function key(code: string): string {
  return `4chits:room:${code.toUpperCase()}`
}

export function saveRoomIdentity(code: string, playerId: string, token: string): void {
  try {
    sessionStorage.setItem(key(code), JSON.stringify({ playerId, token }))
  } catch {
    // sessionStorage unavailable (private browsing etc.) - reconnect-by-refresh just won't work this session.
  }
}

export function getRoomIdentity(code: string): RoomIdentity | null {
  try {
    const raw = sessionStorage.getItem(key(code))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.playerId === 'string' && typeof parsed?.token === 'string') return parsed
    return null
  } catch {
    return null
  }
}

export function clearRoomIdentity(code: string): void {
  try {
    sessionStorage.removeItem(key(code))
  } catch {
    // ignore
  }
}
