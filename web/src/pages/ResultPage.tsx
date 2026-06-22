import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import { Button } from '../components/Button';
import { clearSession, getSessionUserId } from '../lib/storage';

/** M4 占位：翻牌结果页下一迭代实现 */
export default function ResultPage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const { room, self, setSelf, playAgain, leaveRoom } = useRoomSync(roomId || null);

  useEffect(() => {
    if (!roomId) navigate('/', { replace: true });
  }, [roomId, navigate]);

  useEffect(() => {
    if (!room) return;
    if (room.status === 'waiting') navigate(`/room/${roomId}`, { replace: true });
    if (room.status === 'gaming') navigate(`/game/${roomId}`, { replace: true });
  }, [room?.status, roomId, navigate, room]);

  useEffect(() => {
    const uid = getSessionUserId();
    if (uid && room) {
      const me = room.players.find((u) => u.id === uid);
      if (me) setSelf(me);
    }
  }, [room, setSelf]);

  const handleAgain = async () => {
    const result = await playAgain();
    if (result && 'code' in result) {
      alert(result.message);
    }
  };

  const handleLeave = async () => {
    await leaveRoom();
    clearSession();
    navigate('/');
  };

  if (!room || !self) {
    return (
      <main className="page">
        <p className="hint">加载结果…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <span className="status-pill">验证中</span>
      <h2 className="section-title">本局结束</h2>
      <p className="hint" style={{ textAlign: 'center', marginBottom: 16 }}>
        M4 将实现翻牌动画与胜负展示
      </p>
      <Button className="btn--block" onClick={handleAgain}>
        再来一局
      </Button>
      <Button className="btn--block" variant="secondary" onClick={handleLeave}>
        返回大厅
      </Button>
    </main>
  );
}
