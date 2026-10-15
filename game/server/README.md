# 4chits game server (Phase 2)

Node.js + Socket.IO server for real-time rooms/lobby. See `../DECISIONS.md`
for the product decisions this implements. Full gameplay (dealing chits,
roles, scoring) is Phase 3 - this server only handles creating/joining
rooms and keeping the lobby's player list in sync.

## Local development

```
npm install
npm run dev
```

Runs on port 3001 by default (`PORT` env var to change it).

## Testing the room/lobby logic

`test-client.mjs` is a manual integration test that connects several
socket.io-client instances and exercises: filling a room to 4/4, rejecting a
5th join, a disconnect + reconnect within the grace period, starting the
game, and a host disconnect closing the room for everyone.

```
npm run build
PORT=3999 RECONNECT_GRACE_MS_OVERRIDE=1500 EMPTY_ROOM_TTL_MS_OVERRIDE=3000 node dist/index.js &
node test-client.mjs
```

The env var overrides shrink the 60s/5min real-world timers so the test
finishes in seconds - production always uses the real values.

## Deployment (Render free tier)

This is deployed as a separate Render "Web Service" from the same GitHub
repo (the static site on GitHub Pages can't run a Node process). See the
chat/README instructions for the exact Render dashboard steps - in short:

- Root directory: `game/server`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Free plan (sleeps when idle, ~1 min cold start - the frontend shows a
  "waking up" message for this, per DECISIONS.md)

The frontend's `game/frontend/src/lib/socket.ts` has the server's URL as a
constant that needs updating once the Render service is created.
