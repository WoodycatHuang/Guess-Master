import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAvatarEmoji } from '../constants/avatars';
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

  const handleAddMocks = () => {
    onAddMockGuests();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roomId}>房间 {room.roomId}</Text>
        <Pressable onPress={onBackToLobby} hitSlop={8}>
          <Text style={styles.backLink}>退回大厅</Text>
        </Pressable>
      </View>

      {entryMessage ? (
        <View style={styles.bannerWarn}>
          <Text style={styles.bannerText}>{entryMessage}</Text>
          <Text style={styles.bannerSub}>你正在旁观</Text>
        </View>
      ) : null}

      <Text style={styles.title}>
        {isSpectator ? '观战中' : '等待开始'}
      </Text>
      <Text style={styles.subtitle}>
        {room.players.length}/10 名玩家
        {room.spectators.length > 0
          ? ` · ${room.spectators.length} 位旁观者`
          : ''}
      </Text>

      <View style={styles.grid}>
        {sortedPlayers.map((u) => (
          <View key={u.id} style={styles.cell}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatar}>{getAvatarEmoji(u.avatarId)}</Text>
              {u.id === room.hostId ? (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>主</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {u.name}
            </Text>
          </View>
        ))}
      </View>

      {isHost && (
        <View style={styles.hostPanel}>
          <Pressable
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
          >
            <Text
              style={[
                styles.startBtnText,
                !canStart && styles.startBtnTextDisabled,
              ]}
            >
              开始游戏
            </Text>
          </Pressable>
          {!canStart ? (
            <Text style={styles.startHint}>至少需要 2 名玩家才能开始</Text>
          ) : null}

          <Pressable style={styles.mockBtn} onPress={handleAddMocks}>
            <Text style={styles.mockBtnText}>+ 添加模拟玩家（测试用）</Text>
          </Pressable>
        </View>
      )}

      {self.role === 'Guest' && (
        <View style={styles.guestPanel}>
          <Text style={styles.guestText}>等待房主开启游戏…</Text>
        </View>
      )}

      {isSpectator && (
        <View style={styles.guestPanel}>
          <Text style={styles.guestText}>游戏尚未开始，请观战</Text>
        </View>
      )}
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
  bannerWarn: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c2410c',
  },
  bannerSub: {
    fontSize: 13,
    color: '#ea580c',
    marginTop: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 28,
  },
  cell: {
    width: 72,
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    fontSize: 44,
  },
  hostBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    backgroundColor: '#f59e0b',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  name: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 72,
  },
  hostPanel: {
    gap: 8,
  },
  startBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  startBtnDisabled: {
    backgroundColor: '#e5e7eb',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  startBtnTextDisabled: {
    color: '#9ca3af',
  },
  startHint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
  },
  mockBtn: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mockBtnText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  guestPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 17,
    color: '#6b7280',
    fontWeight: '500',
  },
});
