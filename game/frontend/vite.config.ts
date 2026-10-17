import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base: '/play/' because this app is served at 4chits.com/play (not the domain root) —
// see game/DECISIONS.md, "Build Phase 1 kickoff" section, for why.
export default defineConfig({
  base: '/play/',
  plugins: [react()],
})
