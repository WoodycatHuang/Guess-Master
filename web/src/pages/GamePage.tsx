import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import { PageBackNav } from '../components/PageBackNav';
import { BrandHeader } from '../components/BrandHeader';
import { HostSortPanel } from '../components/HostSortPanel';
import { SortWatchPanel } from '../components/SortWatchPanel';
import { clearSession, getSessionUserId } from '../lib/storage';

function findPlayer(room: import('@shared/types/room').Room, userId: string) {
  return room.players.find((u) => u.id === userId);
}

export default function GamePage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const { room, self, setSelf, leaveRoom, updateSortOrder, submitSort } =
    useRoomSync(roomId || null);

  const [submitError, setSubmitError] = useState('');

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
      const me =
        room.players.find((u) => u.id === uid) ??
        room.spectators.find((u) => u.id === uid);
      if (me) setSelf(me);
    }
  }, [room, setSelf]);

  const handleLeave = async () => {
    await leaveRoom();
    clearSession();
    navigate('/');
  };

  const handleSubmitSort = async () => {
    setSubmitError('');
    const result = await submitSort();
    if (result && 'code' in result) {
      setSubmitError(result.message);
    }
  };

  if (!room || !self) {
    return (
      <main className="page">
        <p className="hint">加载游戏…</p>
      </main>
    );
  }

  const isHost = self.id === room.hostId;
  const isPlayer = self.role === 'Host' || self.role === 'Guest';
  const selfInRoom = findPlayer(room, self.id);
  const myCard = selfInRoom?.cardNumber ?? null;
  const myCard2 = selfInRoom?.cardNumber2 ?? null;

  return (
    <main className="page page--game page--with-back-subnav">
      <PageBackNav roomId={room.roomId} onLeave={handleLeave} />

      <div className="game-scroll">
        <BrandHeader variant="compact" showLogo={false} />

        {isPlayer && (
          <p className="game-hint">
            请尽量不要使用形容词，而是使用名词/名字来描述你的卡牌
          </p>
        )}

        <div className="panel">
          <p className="field-label">本局话题</p>
          <h2 className="topic-title">{room.topic}</h2>
          <p className="hint hint--ok">
            {room.topicLowLabel} ← → {room.topicHighLabel}
          </p>
        </div>

        {isPlayer && myCard !== null && (
          <div className="panel panel--accent">
            {room.difficulty === 'hard' && myCard2 !== null ? (
              <>
                <p className="field-label">YOUR CARDS</p>
                <div className="card-pair">
                  <div className="card-tile card-tile--primary">
                    <span className="card-tile__num">{myCard}</span>
                  </div>
                  <div className="card-tile card-tile--secondary">
                    <span className="card-tile__num">{myCard2}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="field-label">YOUR CARD</p>
                <div className="card-hero">{myCard}</div>
              </>
            )}
            <p className="hint hint--ok" style={{ textAlign: 'center', marginTop: 8 }}>
              {getAvatarEmoji(self.avatarId)} {self.name}
            </p>
          </div>
        )}

        {submitError ? <p className="toast-error">{submitError}</p> : null}
      </div>

      {isHost ? (
        <div className="sort-dock">
          <HostSortPanel
            room={room}
            sortOrder={room.sortOrder}
            onMoveSort={updateSortOrder}
            onSubmitSort={handleSubmitSort}
          />
        </div>
      ) : (
        <div className="sort-dock">
          <SortWatchPanel room={room} sortOrder={room.sortOrder} />
        </div>
      )}
    </main>
  );
}
