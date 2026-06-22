import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FLIP_INTERVAL_MS } from '@shared/constants/result';
import { useRoomSync } from '@shared/hooks/useRoomSync';
import {
  cardNumberAtSortIndex,
  evaluateSortedCards,
} from '@shared/services/sync/roomUtils';
import { normalizeRoomId } from '@shared/services/sync/roomKeys';
import { parseSortSlot, sortSlotBorderColor } from '@shared/services/sync/sortSlots';
import { BackToLobbyLink } from '../components/BackToLobbyLink';
import { Button } from '../components/Button';
import { FlipRevealCard } from '../components/FlipRevealCard';
import { clearSession, getSessionUserId } from '../lib/storage';

type Phase = 'flipping' | 'done';

export default function ResultPage() {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? normalizeRoomId(rawRoomId) : '';
  const navigate = useNavigate();
  const { room, self, setSelf, playAgain, leaveRoom } = useRoomSync(roomId || null);

  const outcome = useMemo(
    () => (room ? evaluateSortedCards(room) : { success: false, crackIndex: null }),
    [room],
  );

  const [revealedCount, setRevealedCount] = useState(0);
  const [crackedIndices, setCrackedIndices] = useState<Set<number>>(() => new Set());
  const [phase, setPhase] = useState<Phase>('flipping');
  const [error, setError] = useState('');

  const sortEntries = useMemo(() => {
    if (!room) return [];
    return room.sortOrder.map((token, index) => {
      const userId =
        room.difficulty === 'hard' ? parseSortSlot(token).userId : token;
      const user = room.players.find((u) => u.id === userId);
      const borderColor =
        room.difficulty === 'hard'
          ? sortSlotBorderColor(parseSortSlot(token).cardIndex)
          : undefined;
      return {
        key: `${token}-${index}`,
        index,
        user,
        cardNumber: cardNumberAtSortIndex(room, index) ?? 0,
        borderColor,
      };
    });
  }, [room]);

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
      const me =
        room.players.find((u) => u.id === uid) ??
        room.spectators.find((u) => u.id === uid);
      if (me) setSelf(me);
    }
  }, [room, setSelf]);

  useEffect(() => {
    if (!room) return;
    setRevealedCount(0);
    setCrackedIndices(new Set());
    setPhase('flipping');
  }, [room?.roomId]);

  useEffect(() => {
    if (!room || phase !== 'flipping') return;

    if (revealedCount >= room.sortOrder.length) {
      setPhase('done');
      return;
    }

    const timer = setTimeout(() => {
      const index = revealedCount;
      if (index > 0) {
        const prev = cardNumberAtSortIndex(room, index - 1);
        const cur = cardNumberAtSortIndex(room, index);
        if (prev !== null && cur !== null && cur <= prev) {
          setCrackedIndices((prevSet) => {
            const next = new Set(prevSet);
            next.add(index);
            return next;
          });
        }
      }
      setRevealedCount((c) => c + 1);
    }, FLIP_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [phase, revealedCount, room]);

  const handleAgain = async () => {
    setError('');
    const result = await playAgain();
    if (result && 'code' in result) {
      setError(result.message);
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

  const success = phase === 'done' && outcome.success;
  const isHost = self.id === room.hostId;

  return (
    <main className="page">
      <div className="page-header">
        <span className="hint" style={{ margin: 0 }}>
          ROOM {room.roomId}
        </span>
        <BackToLobbyLink onLeave={handleLeave} />
      </div>

      <div className="panel">
        <p className="field-label">本局话题</p>
        <h2 className="topic-title">{room.topic}</h2>
        <p className="hint hint--ok">
          {room.topicLowLabel} ← → {room.topicHighLabel}
        </p>
      </div>

      <h2 className="section-title">
        {phase === 'flipping' ? '正在按顺序翻牌…' : '验证完成'}
      </h2>
      <p className="result-hint">
        {phase === 'flipping'
          ? '从左到右依次翻开，数字必须严格递增'
          : success
            ? '所有数字按从小到大排列'
            : '出现逆序，错误位置已标红'}
      </p>

      <div className="reveal-strip">
        {sortEntries.map(({ key, index, user, cardNumber, borderColor }) => {
          if (!user) return null;
          return (
            <FlipRevealCard
              key={key}
              index={index}
              name={user.name}
              avatarId={user.avatarId}
              cardNumber={cardNumber}
              revealed={index < revealedCount}
              cracked={crackedIndices.has(index)}
              borderColor={borderColor}
            />
          );
        })}
      </div>

      {phase === 'done' ? (
        <div className={`result-banner${success ? ' result-banner--ok' : ' result-banner--fail'}`}>
          <p className={`result-banner__title${success ? '' : ' result-banner__title--fail'}`}>
            {success ? '✓ SUCCESS' : '✕ FAIL'}
          </p>
          <p className={`result-banner__sub${success ? '' : ' result-banner__sub--fail'}`}>
            {success ? '挑战成功' : '挑战失败'}
          </p>
        </div>
      ) : (
        <p className="reveal-progress">
          {revealedCount}/{room.sortOrder.length} REVEALED
        </p>
      )}

      {error ? <p className="toast-error">{error}</p> : null}

      {phase === 'done' ? (
        <div className="result-actions">
          <Button className="btn--block" onClick={handleAgain}>
            再来一局
          </Button>
          {!isHost ? (
            <p className="hint hint--ok" style={{ textAlign: 'center', margin: '4px 0' }}>
              点击后回到等待页，需房主再次开始游戏
            </p>
          ) : null}
          <Button className="btn--block" variant="secondary" onClick={handleLeave}>
            返回大厅
          </Button>
        </div>
      ) : null}
    </main>
  );
}
