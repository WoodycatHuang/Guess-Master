import { Navigate, Route, Routes } from 'react-router-dom';
import GamePage from './pages/GamePage';
import LobbyPage from './pages/LobbyPage';
import ResultPage from './pages/ResultPage';
import RoomPage from './pages/RoomPage';

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/result/:roomId" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
