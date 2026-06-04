import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlipRevealCard } from '../components/FlipRevealCard';
import { FLIP_INTERVAL_MS } from '../constants/result';
import {
  cardNumberAtSortIndex,
  evaluateSortedCards,
} from '../services/sync/roomUtils';
import { Room, User } from '../types/room';

interface Props {
  room: Room;
  self: User;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

type Phase = 'flipping' | 'done';

export function ResultScreen({
  room,
  self,
  onPlayAgain,
  onBackToLobby,
}: Props) {
  const outcome = useMemo(() => evaluateSortedCards(room), [room]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [crackedIndices, setCrackedIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [phase, setPhase] = useState<Phase>('flipping');
  const startedRef = useRef(false);

  const sortEntries = useMemo(
    () =>
      room.sortOrder.map((userId, index) => {
        const user = room.players.find((u) => u.id === userId);
        return {
          userId,
          index,
          user,
          cardNumber: user?.cardNumber ?? 0,
        };
      }),
    [room],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setRevealedCount(0);
    setCrackedIndices(new Set());
    setPhase('flipping');
  }, [room.roomId]);

  useEffect(() => {
    if (phase !== 'flipping') return;

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

  const success = phase === 'done' && outcome.success;
  const failed = phase === 'done' && !outcome.success;
  const isHost = self.id === room.hostId;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomId}>房间 {room.roomId}</Text>
        <Pressable onPress={onBackToLobby} hitSlop={8}>
          <Text style={styles.backLink}>返回大厅</Text>
        </Pressable>
      </View>

      <View style={styles.topicBox}>
        <Text style={styles.topicLabel}>本轮题目</Text>
        <Text style={styles.topicText}>{room.topic}</Text>
      </View>

      <Text style={styles.sectionTitle}>
        {phase === 'flipping' ? '正在按顺序翻牌…' : '验证完成'}
      </Text>
      <Text style={styles.sectionHint}>
        {phase === 'flipping'
          ? '从左到右依次翻开，数字必须严格递增'
          : success
            ? '所有数字按从小到大排列'
            : '出现逆序，有牌已裂开'}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardStrip}
      >
        {sortEntries.map(({ userId, index, user, cardNumber }) => {
          if (!user) return null;
          return (
            <FlipRevealCard
              key={userId}
              index={index}
              name={user.name}
              avatarId={user.avatarId}
              cardNumber={cardNumber}
              revealed={index < revealedCount}
              cracked={crackedIndices.has(index)}
            />
          );
        })}
      </ScrollView>

      {phase === 'done' ? (
        <View
          style={[
            styles.resultBanner,
            success ? styles.resultSuccess : styles.resultFail,
          ]}
        >
          <Text style={styles.resultEmoji}>{success ? '🎉' : '💔'}</Text>
          <Text
            style={[
              styles.resultTitle,
              success ? styles.resultTitleSuccess : styles.resultTitleFail,
            ]}
          >
            {success ? 'SUCCESS - 挑战成功' : 'FAIL - 挑战失败'}
          </Text>
          <Text style={styles.resultEmoji}>{success ? '🎉' : '💔'}</Text>
        </View>
      ) : (
        <View style={styles.flippingHint}>
          <Text style={styles.flippingHintText}>
            已翻开 {revealedCount}/{room.sortOrder.length}
          </Text>
        </View>
      )}

      {phase === 'done' ? (
        <View style={styles.actions}>
          <Pressable style={styles.playAgainBtn} onPress={onPlayAgain}>
            <Text style={styles.playAgainText}>再来一局</Text>
          </Pressable>
          {!isHost ? (
            <Text style={styles.waitHostHint}>
              点击后回到等待页，需房主再次开始游戏
            </Text>
          ) : null}
          <Pressable style={styles.lobbyBtn} onPress={onBackToLobby}>
            <Text style={styles.lobbyBtnText}>返回大厅</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomId: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  backLink: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
  },
  topicBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  topicLabel: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 6,
  },
  topicText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardStrip: {
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 24,
  },
  flippingHint: {
    alignItems: 'center',
    marginBottom: 16,
  },
  flippingHintText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
  },
  resultBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  resultSuccess: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#6ee7b7',
  },
  resultFail: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  resultEmoji: {
    fontSize: 28,
    marginVertical: 4,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 8,
  },
  resultTitleSuccess: {
    color: '#047857',
  },
  resultTitleFail: {
    color: '#b91c1c',
  },
  actions: {
    gap: 12,
  },
  playAgainBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  playAgainText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  waitHostHint: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  lobbyBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lobbyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
