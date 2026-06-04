import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoomSync } from '../hooks/useRoomSync';

/**
 * M1 验收用临时调试页 — M2 正式大厅完成后可移除
 */
export function SyncDebugScreen() {
  const [nickname, setNickname] = useState('小明');
  const [avatarId, setAvatarId] = useState('1');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState('');

  const { room, self, createRoom, joinRoom, leaveRoom, addMockGuests } =
    useRoomSync(activeRoomId);

  const avatar = Math.min(28, Math.max(1, parseInt(avatarId, 10) || 1));

  const handleCreate = async () => {
    const { room: created } = await createRoom({ name: nickname, avatarId: avatar });
    setActiveRoomId(created.roomId);
    setJoinRoomId(created.roomId);
    setLastMessage(`已创建房间：${created.roomId}，你是 Host`);
  };

  const handleJoin = async () => {
    const result = await joinRoom({
      roomId: joinRoomId.trim(),
      name: nickname,
      avatarId: avatar,
    });
    if ('code' in result) {
      setLastMessage(result.message);
      return;
    }
    setActiveRoomId(result.room.roomId);
    const role =
      result.as === 'spectator'
        ? `旁观者${result.message ? `（${result.message}）` : ''}`
        : result.self.role === 'Host'
          ? 'Host'
          : 'Guest';
    setLastMessage(`加入成功，身份：${role}`);
  };

  const handleLeave = async () => {
    await leaveRoom();
    setActiveRoomId(null);
    setLastMessage('已离开房间');
  };

  const handleAddMocks = async () => {
    const updated = await addMockGuests(3);
    if (updated) {
      setLastMessage(`已添加模拟玩家，当前 ${updated.players.length} 人`);
    }
  };

  const handleFillRoom = async () => {
    await addMockGuests(20);
    setLastMessage('尝试填满房间（最多 10 玩家）');
  };

  const handleSetGaming = () => {
    setLastMessage('请由房主在等待页「开始游戏」进入 gaming 状态');
  };

  const roleLabel = (role: string) => {
    if (role === 'Host') return '房主';
    if (role === 'Guest') return '玩家';
    return '旁观';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.badge}>M1 调试页</Text>
      <Text style={styles.title}>同步层验收</Text>
      <Text style={styles.hint}>
        本页仅用于验证「创建 / 加入 / 订阅 / 离开 / Host 继承」，正式大厅在 M2 实现。
      </Text>

      <Text style={styles.label}>昵称</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
      />

      <Text style={styles.label}>头像 ID（1-28）</Text>
      <TextInput
        style={styles.input}
        value={avatarId}
        onChangeText={setAvatarId}
        keyboardType="number-pad"
      />

      <View style={styles.row}>
        <Pressable style={styles.btnPrimary} onPress={handleCreate}>
          <Text style={styles.btnText}>创建房间</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>房间号</Text>
      <TextInput
        style={styles.input}
        value={joinRoomId}
        onChangeText={setJoinRoomId}
        autoCapitalize="characters"
      />
      <Pressable style={styles.btnSecondary} onPress={handleJoin}>
        <Text style={styles.btnTextSecondary}>加入房间</Text>
      </Pressable>

      {activeRoomId && (
        <>
          <View style={styles.divider} />
          <Text style={styles.section}>当前房间：{activeRoomId}</Text>
          <Text style={styles.meta}>
            状态：{room?.status ?? '-'} · 我的身份：
            {self ? roleLabel(self.role) : '-'}
          </Text>
          {lastMessage ? (
            <Text style={styles.message}>{lastMessage}</Text>
          ) : null}

          <Text style={styles.subsection}>玩家（{room?.players.length ?? 0}/10）</Text>
          {room?.players.map((u) => (
            <Text key={u.id} style={styles.userLine}>
              {roleLabel(u.role)} · {u.name} · 头像{u.avatarId}
              {u.id === room.hostId ? ' ★' : ''}
            </Text>
          ))}

          <Text style={styles.subsection}>
            旁观者（{room?.spectators.length ?? 0}，无上限）
          </Text>
          {room?.spectators.map((u) => (
            <Text key={u.id} style={styles.userLine}>
              {u.name} · 头像{u.avatarId}
            </Text>
          ))}

          <View style={styles.row}>
            <Pressable style={styles.btnSecondary} onPress={handleAddMocks}>
              <Text style={styles.btnTextSecondary}>+3 模拟玩家</Text>
            </Pressable>
            <Pressable style={styles.btnSecondary} onPress={handleFillRoom}>
              <Text style={styles.btnTextSecondary}>填满房间</Text>
            </Pressable>
          </View>

          <Pressable style={styles.btnWarn} onPress={handleSetGaming}>
            <Text style={styles.btnText}>模拟「游戏进行中」</Text>
          </Pressable>

          <Pressable style={styles.btnDanger} onPress={handleLeave}>
            <Text style={styles.btnText}>离开房间</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnWarn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnTextSecondary: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    color: '#059669',
    marginTop: 8,
    fontWeight: '500',
  },
  subsection: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 6,
  },
  userLine: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
});
