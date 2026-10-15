// Manual integration test for Phase 2 room/lobby logic. Not part of the
// shipped server - run with `node test-client.mjs` against a locally
// running server (see instructions printed by the test itself).
import { io } from 'socket.io-client'

const URL = 'http://localhost:3999'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function connect(label) {
  const socket = io(URL, { transports: ['websocket'], reconnection: false })
  socket.on('room_update', (s) => console.log(`[${label}] room_update:`, JSON.stringify(s)))
  socket.on('room_closed', () => console.log(`[${label}] room_closed`))
  socket.on('game_started', () => console.log(`[${label}] game_started`))
  return socket
}

function emitAck(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload, resolve))
}

async function main() {
  console.log('--- Test 1: create + 3 joins fills room to 4/4 ---')
  const host = connect('host')
  await sleep(200)
  const created = await emitAck(host, 'create_room', { name: 'Shubham', rounds: 10 })
  console.log('created:', created)
  const code = created.snapshot.code

  const p2 = connect('p2')
  const p3 = connect('p3')
  const p4 = connect('p4')
  await sleep(100)
  const j2 = await emitAck(p2, 'join_room', { code, name: 'Alice' })
  const j3 = await emitAck(p3, 'join_room', { code, name: 'Bob' })
  const j4 = await emitAck(p4, 'join_room', { code, name: 'Carol' })
  console.log('join results ok?', j2.ok, j3.ok, j4.ok, 'players:', j4.snapshot.players.length)

  console.log('--- Test 2: 5th player rejected (room full) ---')
  const p5 = connect('p5')
  await sleep(100)
  const j5 = await emitAck(p5, 'join_room', { code, name: 'Dave' })
  console.log('5th join result (expect ok:false, full):', j5)
  p5.close()

  console.log('--- Test 3: non-host disconnects, then reconnects within grace period ---')
  const p2Token = j2.token
  const p2Id = j2.playerId
  p2.close()
  await sleep(500)
  const p2b = connect('p2-reconnect')
  const rejoin = await emitAck(p2b, 'rejoin_room', { code, playerId: p2Id, token: p2Token })
  console.log('rejoin result ok?', rejoin.ok, 'connected flags:', rejoin.snapshot.players.map((p) => p.connected))

  console.log('--- Test 4: host starts game at 4/4 ---')
  const start = await emitAck(host, 'start_game', { code })
  console.log('start_game result:', start)
  await sleep(200)

  console.log('--- Test 5: host disconnects -> room closes for everyone ---')
  host.close()
  await sleep(500) // room_closed should NOT fire yet (grace period is 60s in real server; test server uses a short override)
  console.log('(waiting for grace period to expire - server should log this)')

  await sleep(2000)
  console.log('--- done, closing remaining sockets ---')
  p2b.close()
  p3.close()
  p4.close()
  process.exit(0)
}

main()
