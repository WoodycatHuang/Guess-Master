import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import { Button } from '../components/Button';
import { clearSession, getSessionUserId } from '../lib/storage';

export default function RoomPage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const { room, self, setSelf, leaveRoom } = useRoomSync(roomId || null);

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
  }, [roomId, room, navigate, setSelf]);

  const handleLeave = async () => {
    await leaveRoom();
    clearSession();
    navigate('/');
  };

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?room=${roomId}`
      : `https://guessmaster.cn/?room=${roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('链接已复制，发给朋友即可加入');
    } catch {
      prompt('复制此链接发给朋友：', shareUrl);
    }
  };

  if (!roomId) return null;

  return (
    <main className="page">
      <Link to="/" className="hint" style={{ display: 'block', marginBottom: 12 }}>
        ← 返回大厅
      </Link>

      <span className="status-pill">
        {room?.status === 'waiting'
          ? '等待中'
          : room?.status === 'gaming'
            ? '游戏中'
            : room?.status === 'verifying'
              ? '验证中'
              : '加载中…'}
      </span>

      <h1 className="field-label">房间号</h1>
      <div className="room-id-hero">{roomId}</div>

      {!room ? (
        <p className="hint">正在同步房间…</p>
      ) : (
        <>
          <div className="panel">
            <p className="field-label">玩家 ({room.players.length})</p>
            <ul className="player-list">
              {room.players.map((user) => (
                <li key={user.id} className="player-item">
                  <span className="player-emoji">{getAvatarEmoji(user.avatarId)}</span>
                  <span className="player-name">
                    {user.name}
                    {self?.id === user.id ? '（我）' : ''}
                  </span>
                  {user.role === 'Host' ? <span className="badge">房主</span> : null}
                </li>
              ))}
            </ul>
          </div>

          <Button className="btn--block" variant="secondary" onClick={handleCopyLink}>
            复制邀请链接
          </Button>
          <p className="hint">{shareUrl}</p>
        </>
      )}

      <Button className="btn--block" variant="secondary" onClick={handleLeave}>
        离开房间
      </Button>

      <p className="hint" style={{ marginTop: 20 }}>
        M2 将在此页加入「开始游戏」；当前 M1 已可创建/加入房间并联机同步玩家列表。
      </p>
    </main>
  );
}
