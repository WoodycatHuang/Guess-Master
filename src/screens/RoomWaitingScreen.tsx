import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAvatarEmoji } from '../constants/avatars';
import { NeonButton, PixelPanel, PixelText } from '../components/ui';
import { theme } from '../theme';
import { Room, User } from '../types/room';

interface Props {
  room: Room;
  self: User;
  entryMessage?: string;
  onStartGame: () => void;
  onAddMockGuests: () => void;
  onBackToLobby: () => void;
}

export function RoomWaitingScreen({
  room,
  self,
  entryMessage,
  onStartGame,
  onAddMockGuests,
  onBackToLobby,
}: Props) {
  const isHost = self.role === 'Host';
  const isSpectator = self.role === 'Spectator';
  const canStart = room.players.length >= 2;

  const sortedPlayers = [...room.players].sort(
    (a, b) => a.joinedAt - b.joinedAt,
  );

  const handleStart = () => {
    if (!canStart) return;
    onStartGame();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {entryMessage ? (
        <PixelPanel style={styles.bannerWarn}>
          <PixelText variant="bodyCn" tone="fail">
            {entryMessage}
          </PixelText>
          <PixelText variant="captionCn" tone="secondary" style={styles.bannerSub}>
            你正在旁观
          </PixelText>
        </PixelPanel>
      ) : null}

      <PixelText variant="titleCn" tone="primary" style={styles.title}>
        {isSpectator ? '观战中' : '等待开始'}
      </PixelText>
      <PixelText variant="captionLatin" tone="muted" style={styles.subtitle}>
        {room.players.length}/10 PLAYERS
        {room.spectators.length > 0
          ? ` · ${room.spectators.length} SPECTATORS`
          : ''}
      </PixelText>

      <View style={styles.grid}>
        {sortedPlayers.map((u) => (
          <View key={u.id} style={styles.cell}>
            <View
              style={[
                styles.avatarBox,
                u.id === room.hostId && styles.avatarBoxHost,
              ]}
            >
              <Text style={styles.avatar}>{getAvatarEmoji(u.avatarId)}</Text>
              {u.id === room.hostId ? (
                <View style={styles.hostBadge}>
                  <PixelText variant="captionLatin" tone="onAccent">
                    H
                  </PixelText>
                </View>
              ) : null}
            </View>
            <PixelText
              variant="captionCn"
              tone="secondary"
              numberOfLines={1}
              style={styles.name}
            >
              {u.name}
            </PixelText>
          </View>
        ))}
      </View>

      {isHost && (
        <View style={styles.hostPanel}>
          <NeonButton
            label="开始游戏"
            variant="primary"
            disabled={!canStart}
            onPress={handleStart}
          />
          {!canStart ? (
            <PixelText variant="captionCn" tone="muted" style={styles.startHint}>
              至少需要 2 名玩家才能开始
            </PixelText>
          ) : null}

          <NeonButton
            label="+ 添加模拟玩家（测试用）"
            variant="ghost"
            onPress={onAddMockGuests}
            style={styles.mockBtn}
          />
        </View>
      )}

      {self.role === 'Guest' && (
        <PixelPanel style={styles.statusPanel}>
          <PixelText variant="bodyCn" tone="secondary" style={styles.statusText}>
            等待房主开启游戏…
          </PixelText>
        </PixelPanel>
      )}

      {isSpectator && (
        <PixelPanel style={styles.statusPanel}>
          <PixelText variant="bodyCn" tone="secondary" style={styles.statusText}>
            游戏尚未开始，请观战
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
  bannerWarn: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.fail,
    backgroundColor: 'rgba(255, 0, 85, 0.08)',
  },
  bannerSub: {
    marginTop: theme.spacing.xs,
  },
  title: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg + 4,
  },
  cell: {
    width: 76,
    alignItems: 'center',
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.borders.radius,
    backgroundColor: theme.colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarBoxHost: {
    borderColor: theme.colors.neonYellow,
    backgroundColor: 'rgba(255, 230, 0, 0.06)',
  },
  avatar: {
    fontSize: 32,
  },
  hostBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: theme.colors.neonYellow,
    minWidth: 18,
    height: 18,
    borderWidth: theme.borders.widthThin,
    borderColor: theme.colors.neonYellow,
    borderRadius: theme.borders.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  name: {
    marginTop: theme.spacing.sm - 2,
    textAlign: 'center',
    maxWidth: 76,
  },
  hostPanel: {
    gap: theme.spacing.sm,
  },
  startHint: {
    textAlign: 'center',
  },
  mockBtn: {
    marginTop: theme.spacing.xs,
  },
  statusPanel: {
    alignItems: 'center',
    borderColor: theme.colors.borderDim,
  },
  statusText: {
    textAlign: 'center',
  },
});
