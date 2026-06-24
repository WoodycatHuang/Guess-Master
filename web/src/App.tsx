import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HowToPlayEntry } from './components/HowToPlayEntry';
import { SiteFooter } from './components/SiteFooter';
import HowToPlayPage from './pages/HowToPlayPage';
import GamePage from './pages/GamePage';
import LobbyPage from './pages/LobbyPage';
import ResultPage from './pages/ResultPage';
import RoomPage from './pages/RoomPage';
import { recordVisitOnce } from './lib/visitStats';

export default function App() {
  useEffect(() => {
    void recordVisitOnce();
  }, []);

  return (
    <div className="app-shell">
      <HowToPlayEntry />
      <div className="app-body">
        <Routes>
          <Route path="/how-to-play" element={<HowToPlayPage />} />
          <Route path="/" element={<LobbyPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/result/:roomId" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}
