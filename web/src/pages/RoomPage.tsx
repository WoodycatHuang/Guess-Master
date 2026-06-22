import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { isHardModeRoom, HARD_MODE_SERVER_HINT } from '@shared/services/sync/hardMode';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import type { GameDifficulty } from '@shared/types/room';
import { Button } from '../components/Button';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { RoomWaiting } from '../components/RoomWaiting';
import { clearSession, getSessionUserId } from '../lib/storage';
import { getShareUrl } from '../lib/share';

export default function RoomPage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const entryMessage = (location.state as { entryMessage?: string } | null)?.entryMessage;

  const { room, self, setSelf, leaveRoom, startGame, playAgain, addMockGuests } =
    useRoomSync(roomId || null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const hadRoom = useRef(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/', { replace: true });
      return;
    }
    const storedUserId = getSessionUserId();
    if (storedUserId && room) {
      const me =
        room.players.find((u) => u.id === storedUserId) ??
        room.spectators.find((u) => u.id === storedUserId);
      if (me) setSelf(me);
    }
    if (room) hadRoom.current = true;
  }, [roomId, room, navigate, setSelf]);

  useEffect(() => {
    if (!room || !roomId) return;
    if (room.status === 'gaming') {
      navigate(`/game/${roomId}`, { replace: true });
    } else if (room.status === 'verifying') {
      navigate(`/result/${roomId}`, { replace: true });
    }
  }, [room?.status, roomId, navigate, room]);

  const handleLeave = async () => {
    await leaveRoom();
    clearSession();
    navigate('/');
  };

  const shareUrl = getShareUrl(roomId);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('链接已复制，发给朋友即可加入');
    } catch {
      prompt('复制此链接发给朋友：', shareUrl);
    }
  };

  const handleStartClick = () => {
    if (!room || room.players.length < 2) return;
    setPickerOpen(true);
  };

  const handleDifficulty = async (difficulty: GameDifficulty) => {
    setPickerOpen(false);
    setError('');
    const result = await startGame(difficulty);
    if (!result) return;
    if ('code' in result) {
      setError(result.message);
      return;
    }
    if (difficulty === 'hard' && !isHardModeRoom(result)) {
      setError(HARD_MODE_SERVER_HINT);
      await playAgain();
    }
  };

  const handleAddMock = async () => {
    setError('');
    const result = await addMockGuests(1);
    if (!result) {
      setError('无法添加测试玩家');
    }
  };

  if (!roomId) return null;

  if (!room && hadRoom.current) {
    return (
      <main className="page">
        <h2 className="section-title" style={{ color: '#ff0055' }}>
          房间已解散
        </h2>
        <p className="hint">房主已离开，房间已关闭</p>
        <Button className="btn--block" onClick={() => navigate('/')}>
          退回大厅
        </Button>
      </main>
    );
  }

  if (!room || !self) {
    return (
      <main className="page">
        <p className="hint">正在同步房间…</p>
      </main>
    );
  }

  if (room.status !== 'waiting') {
    return (
      <main className="page">
        <p className="hint">进入游戏中…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <Link to="/" className="hint">
          ← 退回大厅
        </Link>
        <span className="status-pill">等待中</span>
      </div>

      <h1 className="field-label">房间号</h1>
      <div className="room-id-hero">{roomId}</div>

      {error ? <div className="toast-error">{error}</div> : null}

      <RoomWaiting
        room={room}
        self={self}
        entryMessage={entryMessage}
        onStart={handleStartClick}
        onAddMock={handleAddMock}
        onCopyLink={handleCopyLink}
        shareUrl={shareUrl}
      />

      <Button className="btn--block" variant="secondary" onClick={handleLeave}>
        离开房间
      </Button>

      <DifficultyPicker
        open={pickerOpen}
        playerCount={room.players.length}
        onSelect={handleDifficulty}
        onClose={() => setPickerOpen(false)}
      />
    </main>
  );
}
