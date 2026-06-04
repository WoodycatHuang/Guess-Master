import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Room, User } from '../types/room';

interface Props {
  room: Room;
  self: User;
  onBackToLobby: () => void;
}

/**
 * M4 游戏页占位 — Host 在 M3 点击「开始游戏」后进入
 */
export function GamingPlaceholderScreen({ room, self, onBackToLobby }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.roomId}>房间 {room.roomId}</Text>
      <Text style={styles.badge}>M4 游戏页占位</Text>
      <Text style={styles.title}>游戏进行中</Text>
      <Text style={styles.hint}>
        题目、发牌、排序等功能将在 M4 实现。{'\n'}
        当前房间状态：{room.status}
      </Text>
      {self.role === 'Spectator' ? (
        <Text style={styles.role}>身份：旁观者 · 请观战</Text>
      ) : (
        <Text style={styles.role}>
          身份：{self.role === 'Host' ? '房主' : '玩家'}
        </Text>
      )}
      <Pressable style={styles.backBtn} onPress={onBackToLobby}>
        <Text style={styles.backBtnText}>退回大厅</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
  },
  hint: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  role: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 32,
  },
  backBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
