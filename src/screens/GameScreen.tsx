import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HostSortPanel } from '../components/HostSortPanel';
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
        <Text style={styles.roomId}>房间 {room.roomId}</Text>
        <Pressable onPress={onBackToLobby} hitSlop={8}>
          <Text style={styles.back}>退回大厅</Text>
        </Pressable>
      </View>

      <View style={styles.topicBox}>
        <Text style={styles.topicLabel}>本轮题目</Text>
        <Text style={styles.topicText}>{room.topic}</Text>
      </View>

      {isPlayer && myCard !== null && (
        <View style={styles.cardBox}>
          <Text style={styles.cardLabel}>你的数字牌</Text>
          <Text style={styles.cardNumber}>{myCard}</Text>
          <Text style={styles.cardHint}>只有你能看到这张牌</Text>
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
        <View style={styles.waitPanel}>
          <Text style={styles.waitText}>房主正在努力排序中…</Text>
        </View>
      )}

      {isSpectator && (
        <View style={styles.waitPanel}>
          <Text style={styles.waitText}>游戏进行中，请观战</Text>
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
  back: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
  },
  topicBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  topicLabel: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 26,
  },
  cardBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  cardLabel: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#4f46e5',
    marginVertical: 8,
  },
  cardHint: {
    fontSize: 12,
    color: '#818cf8',
  },
  waitPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  waitText: {
    fontSize: 17,
    color: '#6b7280',
    fontWeight: '500',
  },
});
