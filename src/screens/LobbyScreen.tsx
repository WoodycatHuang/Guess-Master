import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AvatarPicker } from '../components/AvatarPicker';
import { CreateRoomResult, JoinRoomError, JoinRoomResult } from '../types/room';

interface Props {
  onCreateRoom: (input: {
    name: string;
    avatarId: number;
  }) => CreateRoomResult;
  onJoinRoom: (input: {
    roomId: string;
    name: string;
    avatarId: number;
  }) => JoinRoomResult | JoinRoomError;
  onEnterRoom: (roomId: string, entryMessage?: string) => void;
}

export function LobbyScreen({ onCreateRoom, onJoinRoom, onEnterRoom }: Props) {
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isMockMember, setIsMockMember] = useState(false);

  const profile = () => ({
    name: nickname.trim(),
    avatarId,
  });

  const handleCreate = () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    if (!isMockMember) {
      Alert.alert('需要会员', '需要会员才能创建房间');
      return;
    }
    const result = onCreateRoom(profile());
    onEnterRoom(result.room.roomId);
  };

  const handleJoin = () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    if (!roomIdInput.trim()) {
      Alert.alert('提示', '请输入房间号');
      return;
    }
    const result = onJoinRoom({
      ...profile(),
      roomId: roomIdInput.trim(),
    });
    if ('code' in result) {
      Alert.alert('加入失败', result.message);
      return;
    }
    onEnterRoom(result.room.roomId, result.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>猜数大师</Text>
        <Text style={styles.subtitle}>聚会联机 · 大厅</Text>

        <Text style={styles.label}>你的昵称</Text>
        <TextInput
          style={styles.input}
          placeholder="输入昵称（同房间可重复）"
          placeholderTextColor="#9ca3af"
          value={nickname}
          onChangeText={setNickname}
          maxLength={12}
        />

        <Text style={styles.label}>选择头像</Text>
        <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />

        <Pressable
          style={styles.memberRow}
          onPress={() => setIsMockMember((v) => !v)}
        >
          <View style={[styles.checkbox, isMockMember && styles.checkboxOn]}>
            {isMockMember ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.memberText}>是否为模拟会员</Text>
        </Pressable>
        <Text style={styles.memberHint}>创建房间需要勾选模拟会员</Text>

        <View style={styles.section}>
          <Text style={styles.label}>加入房间</Text>
          <TextInput
            style={styles.input}
            placeholder="输入 6 位房间号"
            placeholderTextColor="#9ca3af"
            value={roomIdInput}
            onChangeText={setRoomIdInput}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Pressable style={styles.btnSecondary} onPress={handleJoin}>
            <Text style={styles.btnSecondaryText}>加入房间</Text>
          </Pressable>
        </View>

        <Pressable style={styles.btnPrimary} onPress={handleCreate}>
          <Text style={styles.btnPrimaryText}>创建房间</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  memberText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  memberHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    marginLeft: 34,
  },
  section: {
    marginTop: 8,
  },
  btnSecondary: {
    backgroundColor: '#eef2ff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  btnSecondaryText: {
    color: '#4f46e5',
    fontSize: 17,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
