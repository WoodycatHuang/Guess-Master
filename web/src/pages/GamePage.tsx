import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import { Button } from '../components/Button';
import { clearSession, getSessionUserId } from '../lib/storage';

/** M3 占位：游戏页完整 UI 下一迭代实现 */
export default function GamePage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const { room, self, setSelf, leaveRoom } = useRoomSync(roomId || null);

  useEffect(() => {
    if (!roomId) navigate('/', { replace: true });
  }, [roomId, navigate]);

  useEffect(() => {
    if (!room) return;
    if (room.status === 'waiting') navigate(`/room/${roomId}`, { replace: true });
    if (room.status === 'verifying') navigate(`/result/${roomId}`, { replace: true });
  }, [room?.status, roomId, navigate, room]);

  useEffect(() => {
    const uid = getSessionUserId();
    if (uid && room) {
      const me = room.players.find((u) => u.id === uid);
      if (me) setSelf(me);
    }
  }, [room, setSelf]);

  const handleLeave = async () => {
    await leaveRoom();
    clearSession();
    navigate('/');
  };

  if (!room || !self) {
    return (
      <main className="page">
        <p className="hint">加载游戏…</p>
      </main>
    );
  }

  const myCard =
    room.difficulty === 'hard'
      ? `${room.players.find((u) => u.id === self.id)?.cardNumber ?? '?'} / ${room.players.find((u) => u.id === self.id)?.cardNumber2 ?? '?'}`
      : String(self.cardNumber ?? '?');

  return (
    <main className="page">
      <div className="page-header">
        <span className="status-pill">游戏中</span>
        <Link to="/" className="hint">
          大厅
        </Link>
      </div>

      <div className="panel">
        <p className="field-label">本局话题</p>
        <h2 className="topic-title">{room.topic}</h2>
        <p className="hint hint--ok">
          {room.topicLowLabel} ← → {room.topicHighLabel}
        </p>
        <p className="hint" style={{ marginTop: 12 }}>
          难度：{room.difficulty === 'hard' ? '困难' : '简单'}
        </p>
      </div>

      <div className="panel panel--accent">
        <p className="field-label">你的数字牌</p>
        <div className="card-hero">{myCard}</div>
        <p className="hint hint--ok" style={{ textAlign: 'center' }}>
          {getAvatarEmoji(self.avatarId)} {self.name}
        </p>
      </div>

      {self.role === 'Host' ? (
        <p className="hint" style={{ textAlign: 'center' }}>
          M3 将实现：拖拽排序与提交验证
        </p>
      ) : (
        <p className="hint" style={{ textAlign: 'center' }}>
          请根据话题猜测排序，等待房主提交…
        </p>
      )}

      <Button className="btn--block" variant="secondary" onClick={handleLeave}>
        离开房间
      </Button>
    </main>
  );
}
