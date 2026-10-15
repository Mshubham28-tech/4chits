// Phase 1 only: no accounts (per DECISIONS.md Round 4 — display name only),
// so we just remember the player's chosen name for this browser tab/session.
// This will be replaced by real server-assigned identity once Phase 2 (rooms/server) lands.

const KEY = '4chits:playerName'

export function getPlayerName(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setPlayerName(name: string): void {
  try {
    sessionStorage.setItem(KEY, name)
  } catch {
    // sessionStorage unavailable (private browsing etc.) — not critical for Phase 1 shell.
  }
}

// Placeholder room code generator for Phase 1's UI shell only.
// Phase 2 replaces this with a real code issued by the game server.
export function generatePlaceholderRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // no I/O to avoid confusion with 1/0
  const digits = '23456789' // no 0/1 for the same reason
  let code = ''
  for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)]
  for (let i = 0; i < 2; i++) code += digits[Math.floor(Math.random() * digits.length)]
  return code
}
