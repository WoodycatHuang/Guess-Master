import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlipRevealCard } from '../components/FlipRevealCard';
import { TopicCard } from '../components/TopicCard';
import { NeonButton, PixelText } from '../components/ui';
import { FLIP_INTERVAL_MS } from '../constants/result';
import {
  cardNumberAtSortIndex,
  evaluateSortedCards,
} from '../services/sync/roomUtils';
import { theme } from '../theme';
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
  const isHost = self.id === room.hostId;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <PixelText variant="bodyLatin" tone="secondary">
          ROOM {room.roomId}
        </PixelText>
        <Pressable onPress={onBackToLobby} hitSlop={8}>
          <PixelText variant="labelCn" tone="primary">
            返回大厅
          </PixelText>
        </Pressable>
      </View>

      <TopicCard
        title={room.topic}
        lowLabel={room.topicLowLabel}
        highLabel={room.topicHighLabel}
        style={styles.topicBox}
      />

      <PixelText variant="titleCn" tone="primary">
        {phase === 'flipping' ? '正在按顺序翻牌…' : '验证完成'}
      </PixelText>
      <PixelText variant="captionCn" tone="muted" style={styles.sectionHint}>
        {phase === 'flipping'
          ? '从左到右依次翻开，数字必须严格递增'
          : success
            ? '所有数字按从小到大排列'
            : '出现逆序，错误位置已标红'}
      </PixelText>

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
          <PixelText
            variant="titleLatin"
            tone={success ? 'success' : 'fail'}
            style={styles.resultTitle}
          >
            {success ? '✓ SUCCESS' : '✕ FAIL'}
          </PixelText>
          <PixelText
            variant="bodyCn"
            tone={success ? 'success' : 'fail'}
            style={styles.resultSubtitle}
          >
            {success ? '挑战成功' : '挑战失败'}
          </PixelText>
        </View>
      ) : (
        <View style={styles.flippingHint}>
          <PixelText variant="bodyLatin" tone="primary">
            {revealedCount}/{room.sortOrder.length} REVEALED
          </PixelText>
        </View>
      )}

      {phase === 'done' ? (
        <View style={styles.actions}>
          <NeonButton label="再来一局" variant="primary" onPress={onPlayAgain} />
          {!isHost ? (
            <PixelText variant="captionCn" tone="muted" style={styles.waitHostHint}>
              点击后回到等待页，需房主再次开始游戏
            </PixelText>
          ) : null}
          <NeonButton
            label="返回大厅"
            variant="secondary"
            onPress={onBackToLobby}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg - 4,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  topicBox: {
    marginBottom: theme.spacing.lg - 4,
  },
  sectionHint: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  cardStrip: {
    gap: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  flippingHint: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultBanner: {
    borderWidth: theme.borders.width,
    borderRadius: theme.borders.radius,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundElevated,
  },
  resultSuccess: {
    borderColor: theme.colors.success,
    backgroundColor: 'rgba(0, 255, 255, 0.06)',
  },
  resultFail: {
    borderColor: theme.colors.fail,
    backgroundColor: 'rgba(255, 0, 85, 0.08)',
  },
  resultTitle: {
    textAlign: 'center',
    letterSpacing: 2,
    marginVertical: theme.spacing.xs,
  },
  resultSubtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  actions: {
    gap: theme.spacing.sm + 4,
  },
  waitHostHint: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
