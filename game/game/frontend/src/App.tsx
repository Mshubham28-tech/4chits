import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CreateRoomPage from './pages/CreateRoomPage'
import JoinRoomPage from './pages/JoinRoomPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'

// basename="/play" because the whole app is served at 4chits.com/play
// (see game/DECISIONS.md — "Build Phase 1 kickoff" section).
export default function App() {
  return (
    <BrowserRouter basename="/play">
      <header className="app-header">
        4<span>chits</span>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/join" element={<JoinRoomPage />} />
        <Route path="/lobby/:roomCode" element={<LobbyPage />} />
        <Route path="/game/:roomCode" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}
