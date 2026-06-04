import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getAvatarEmoji } from '../constants/avatars';
import { Room, User } from '../types/room';

interface Props {
  room: Room;
  self: User;
  onBackToLobby: () => void;
}

/**
 * M5 结果验证页占位 — Host 提交排序后进入
 */
export function ResultPlaceholderScreen({ room, self, onBackToLobby }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.badge}>M5 验证页占位</Text>
      <Text style={styles.roomId}>房间 {room.roomId}</Text>
      <Text style={styles.title}>准备验证排序结果</Text>
      <Text style={styles.hint}>
        翻牌动画、SUCCESS / FAIL 判定将在 M5 实现。
      </Text>

      <Text style={styles.section}>当前排序（仅序号，数字未公开）</Text>
      <View style={styles.orderRow}>
        {room.sortOrder.map((userId, index) => {
          const user = room.players.find((u) => u.id === userId);
          if (!user) return null;
          return (
            <View key={userId} style={styles.orderCell}>
              <Text style={styles.orderIndex}>{index + 1}</Text>
              <Text style={styles.orderAvatar}>
                {getAvatarEmoji(user.avatarId)}
              </Text>
            </View>
          );
        })}
      </View>

      {self.role !== 'Spectator' && (
        <Text style={styles.role}>
          你的数字：{room.players.find((u) => u.id === self.id)?.cardNumber ?? '-'}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: 11,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  roomId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  orderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  orderCell: {
    alignItems: 'center',
  },
  orderIndex: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  orderAvatar: {
    fontSize: 40,
  },
  role: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 24,
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
