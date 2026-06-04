import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HostSortPanel } from '../components/HostSortPanel';
import { PixelPanel, PixelText } from '../components/ui';
import { theme } from '../theme';
import { Room, User } from '../types/room';

interface Props {
  room: Room;
  self: User;
  onMoveSort: (order: string[]) => void;
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
  const isHost = self.id === room.hostId;
  const isPlayer = self.role === 'Host' || self.role === 'Guest';
  const isSpectator = self.role === 'Spectator';

  const selfInRoom = findPlayer(room, self.id);
  const myCard = selfInRoom?.cardNumber ?? null;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
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

      <PixelPanel style={styles.topicBox}>
        <PixelText variant="captionLatin" tone="muted">
          TOPIC // 本轮题目
        </PixelText>
        <PixelText variant="bodyCn" tone="primary" style={styles.topicText}>
          {room.topic}
        </PixelText>
      </PixelPanel>

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

      {isHost && (
        <HostSortPanel
          room={room}
          sortOrder={room.sortOrder}
          onMoveSort={onMoveSort}
          onSubmitSort={onSubmitSort}
        />
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
    borderColor: theme.colors.borderDim,
  },
  topicText: {
    marginTop: theme.spacing.sm,
    lineHeight: 24,
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
