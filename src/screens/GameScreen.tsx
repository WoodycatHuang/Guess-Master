import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HostSortPanel } from '../components/HostSortPanel';
import { TopicCard } from '../components/TopicCard';
import { PixelPanel, PixelText } from '../components/ui';
import { GameActionError } from '../services/sync/RoomSyncService';
import { theme } from '../theme';
import { Room, User } from '../types/room';

interface Props {
  room: Room;
  self: User;
  onMoveSort: (order: string[]) => Promise<GameActionError | null>;
  onSubmitSort: () => void;
  onBackToLobby: () => void;
}

function findPlayer(room: Room, userId: string): User | undefined {
  return room.players.find((u) => u.id === userId);
}

export function GameScreen({
  room,
  self,
  onMoveSort,
  onSubmitSort,
  onBackToLobby,
}: Props) {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const isHost = self.id === room.hostId;
  const isPlayer = self.role === 'Host' || self.role === 'Guest';
  const isSpectator = self.role === 'Spectator';

  const selfInRoom = findPlayer(room, self.id);
  const myCard = selfInRoom?.cardNumber ?? null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        scrollEnabled={scrollEnabled}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <PixelText variant="bodyLatin" tone="secondary">
            ROOM {room.roomId}
          </PixelText>
          <Pressable onPress={onBackToLobby} hitSlop={8}>
            <PixelText variant="labelCn" tone="primary">
              退回大厅
            </PixelText>
          </Pressable>
        </View>

        {isPlayer && (
          <PixelText variant="captionCn" tone="muted" style={styles.gameHint}>
            请尽量不要使用形容词，而是使用名词/名字来描述你的卡牌
          </PixelText>
        )}

        <TopicCard
          title={room.topic}
          lowLabel={room.topicLowLabel}
          highLabel={room.topicHighLabel}
          style={styles.topicBox}
        />

        {isPlayer && myCard !== null && (
          <View style={styles.cardBox}>
            <PixelText variant="captionLatin" tone="secondary">
              YOUR CARD
            </PixelText>
            <PixelText variant="displayLatin" tone="primary" style={styles.cardNumber}>
              {myCard}
            </PixelText>
            <PixelText variant="captionCn" tone="muted" style={styles.cardHint}>
              只有你能看到这张牌
            </PixelText>
          </View>
        )}

        {!isHost && isPlayer && (
          <PixelPanel style={styles.waitPanel}>
            <PixelText variant="bodyCn" tone="secondary" style={styles.waitText}>
              房主正在努力排序中…
            </PixelText>
          </PixelPanel>
        )}

        {isSpectator && (
          <PixelPanel style={styles.waitPanel}>
            <PixelText variant="bodyCn" tone="secondary" style={styles.waitText}>
              游戏进行中，请观战
            </PixelText>
          </PixelPanel>
        )}
      </ScrollView>

      {isHost && (
        <View style={styles.sortDock}>
          <HostSortPanel
            room={room}
            sortOrder={room.sortOrder}
            onMoveSort={onMoveSort}
            onSubmitSort={onSubmitSort}
            onDragActiveChange={(active) => setScrollEnabled(!active)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  container: {
    padding: theme.spacing.lg - 4,
    paddingBottom: theme.spacing.md,
  },
  sortDock: {
    paddingHorizontal: theme.spacing.lg - 4,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: theme.borders.widthThin,
    borderTopColor: theme.colors.borderDim,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  gameHint: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  topicBox: {
    marginBottom: theme.spacing.lg - 4,
  },
  cardBox: {
    backgroundColor: theme.colors.backgroundElevated,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.neonGreen,
    borderRadius: theme.borders.radius,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardNumber: {
    fontSize: 56,
    lineHeight: 64,
    marginVertical: theme.spacing.sm,
    letterSpacing: 2,
  },
  cardHint: {
    textAlign: 'center',
  },
  waitPanel: {
    alignItems: 'center',
    borderColor: theme.colors.borderDim,
    paddingVertical: theme.spacing.lg + 4,
  },
  waitText: {
    textAlign: 'center',
  },
});
