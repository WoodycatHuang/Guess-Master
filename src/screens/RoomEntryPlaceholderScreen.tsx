import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAvatarEmoji } from '../constants/avatars';
import { Room, User } from '../types/room';

interface Props {
  room: Room | null;
  self: User | null;
  entryMessage?: string;
  onBackToLobby: () => void;
}

function roleLabel(role: User['role']): string {
  if (role === 'Host') return '房主';
  if (role === 'Guest') return '玩家';
  return '旁观者';
}

/**
 * M2 占位页 — 验证进入房间流程；M3 将替换为完整「房间·等待」页
 */
export function RoomEntryPlaceholderScreen({
  room,
  self,
  entryMessage,
  onBackToLobby,
}: Props) {
  if (!room || !self) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>加载房间…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.roomId}>房间 {room.roomId}</Text>
      <Text style={styles.badge}>M3 等待页占位</Text>

      {entryMessage ? (
        <View style={styles.bannerWarn}>
          <Text style={styles.bannerText}>{entryMessage}</Text>
          <Text style={styles.bannerSub}>你以旁观者身份进入</Text>
        </View>
      ) : (
        <View style={styles.bannerOk}>
          <Text style={styles.bannerText}>已成功进入房间</Text>
        </View>
      )}

      <View style={styles.selfCard}>
        <Text style={styles.selfEmoji}>{getAvatarEmoji(self.avatarId)}</Text>
        <View>
          <Text style={styles.selfName}>{self.name}</Text>
          <Text style={styles.selfRole}>{roleLabel(self.role)}</Text>
        </View>
      </View>

      <Text style={styles.section}>
        玩家 {room.players.length}/10
      </Text>
      <View style={styles.memberGrid}>
        {room.players.map((u) => (
          <View key={u.id} style={styles.memberCell}>
            <Text style={styles.memberEmoji}>{getAvatarEmoji(u.avatarId)}</Text>
            <Text style={styles.memberName} numberOfLines={1}>
              {u.name}
              {u.id === room.hostId ? ' ★' : ''}
            </Text>
          </View>
        ))}
      </View>

      {room.spectators.length > 0 && (
        <>
          <Text style={styles.section}>
            旁观者 {room.spectators.length}（无上限）
          </Text>
          <View style={styles.memberGrid}>
            {room.spectators.map((u) => (
              <View key={u.id} style={styles.memberCell}>
                <Text style={styles.memberEmoji}>
                  {getAvatarEmoji(u.avatarId)}
                </Text>
                <Text style={styles.memberName} numberOfLines={1}>
                  {u.name}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={styles.hint}>
        完整等待页（开始游戏按钮、成员网格等）将在 M3 实现。
      </Text>

      <Pressable style={styles.backBtn} onPress={onBackToLobby}>
        <Text style={styles.backBtnText}>退回大厅</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    fontSize: 16,
    color: '#6b7280',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  roomId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
    fontSize: 11,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bannerOk: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerWarn: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  bannerSub: {
    fontSize: 13,
    color: '#ea580c',
    marginTop: 4,
  },
  selfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  selfEmoji: {
    fontSize: 40,
  },
  selfName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  selfRole: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 2,
    fontWeight: '500',
  },
  section: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  memberCell: {
    width: 72,
    alignItems: 'center',
  },
  memberEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
