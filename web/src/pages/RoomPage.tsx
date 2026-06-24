import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { isHardModeRoom, HARD_MODE_SERVER_HINT } from '@shared/services/sync/hardMode';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import type { GameDifficulty } from '@shared/types/room';
import { Button } from '../components/Button';
import { BrandHeader } from '../components/BrandHeader';
import { DifficultyPicker } from '../components/DifficultyPicker';
import { PageBackNav } from '../components/PageBackNav';
import { RoomWaiting } from '../components/RoomWaiting';
import { clearSession, getSessionUserId, loadProfile, persistSession } from '../lib/storage';
import { findExistingMember } from '@shared/services/sync/memberLookup';
import { getShareUrl } from '../lib/share';

export default function RoomPage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const location = useLocation();
  const entryMessage = (location.state as { entryMessage?: string } | null)?.entryMessage;

  const { room, self, setSelf, leaveRoom, startGame, playAgain, joinRoom } =
    useRoomSync(roomId || null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncHint, setSyncHint] = useState('正在同步房间…');
  const hadRoom = useRef(false);
  const recoverAttempted = useRef(false);

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

  /** 房间已加载但未识别身份 → 尝试 API 复入，否则回大厅 */
  useEffect(() => {
    if (!roomId || !room || self || recoverAttempted.current) return;

    const profile = loadProfile();
    const storedUserId = getSessionUserId();
    const existing = findExistingMember(room, profile.nickname, storedUserId ?? undefined);
    if (existing) {
      persistSession(existing.id, roomId);
      setSelf(existing);
      return;
    }

    if (!profile.nickname.trim()) {
      navigate(`/?room=${roomId}`, { replace: true });
      return;
    }

    recoverAttempted.current = true;
    setSyncHint('正在加入房间…');

    void (async () => {
      const result = await joinRoom({
        name: profile.nickname.trim(),
        avatarId: profile.avatarId || 1,
        roomId,
        userId: storedUserId ?? undefined,
      });
      if ('code' in result) {
        setSyncError(result.message);
        recoverAttempted.current = false;
        return;
      }
      persistSession(result.self.id, roomId);
      setSelf(result.self);
    })();
  }, [roomId, room, self, joinRoom, navigate, setSelf]);

  useEffect(() => {
    if (!roomId || room) return;
    const timer = window.setTimeout(() => {
      setSyncError('无法连接房间，请检查网络后重试');
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [roomId, room]);

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

  if (!roomId) return null;

  if (!room && hadRoom.current) {
    return (
      <main className="page">
        <BrandHeader variant="compact" showLogo={false} />
        <h2 className="section-title section-title--fail">
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
        {syncError ? (
          <>
            <div className="toast-error">{syncError}</div>
            <Button
              className="btn--block"
              onClick={() => navigate(`/?room=${roomId}`, { replace: true })}
            >
              返回大厅重新加入
            </Button>
          </>
        ) : (
          <p className="hint">{syncHint}</p>
        )}
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
    <main className="page page--with-back-nav">
      <PageBackNav onLeave={handleLeave} />

      <BrandHeader variant="compact" showLogo={false} />

      <p className="field-label field-label--pixel">房间号</p>
      <div className="room-id-hero">{roomId}</div>

      {error ? <div className="toast-error">{error}</div> : null}

      <RoomWaiting
        room={room}
        self={self}
        entryMessage={entryMessage}
        onStart={handleStartClick}
        onCopyLink={handleCopyLink}
        onLeave={handleLeave}
      />

      <DifficultyPicker
        open={pickerOpen}
        playerCount={room.players.length}
        onSelect={handleDifficulty}
        onClose={() => setPickerOpen(false)}
      />
    </main>
  );
}
