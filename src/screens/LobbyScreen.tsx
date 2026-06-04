import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  LobbyArcadeButton,
  LobbyAvatarGrid,
  LobbyLogo,
  LobbyMemberToggle,
  LobbyNicknameField,
} from '../components/lobby';
import { PixelText } from '../components/ui';
import { isRemoteSyncEnabled } from '../services/sync';
import { theme } from '../theme';
import { CreateRoomResult, JoinRoomError, JoinRoomResult } from '../types/room';

interface Props {
  nickname: string;
  avatarId: number;
  onNicknameChange: (name: string) => void;
  onAvatarIdChange: (id: number) => void;
  onCreateRoom: (input: {
    name: string;
    avatarId: number;
  }) => Promise<CreateRoomResult>;
  onJoinRoom: (input: {
    roomId: string;
    name: string;
    avatarId: number;
  }) => Promise<JoinRoomResult | JoinRoomError>;
  onEnterRoom: (roomId: string, entryMessage?: string) => void;
}

export function LobbyScreen({
  nickname,
  avatarId,
  onNicknameChange,
  onAvatarIdChange,
  onCreateRoom,
  onJoinRoom,
  onEnterRoom,
}: Props) {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [isMockMember, setIsMockMember] = useState(false);
  const [roomFocused, setRoomFocused] = useState(false);

  const profile = () => ({
    name: nickname.trim(),
    avatarId,
  });

  const handleCreate = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    if (!isMockMember) {
      Alert.alert('需要会员', '需要会员才能创建房间');
      return;
    }
    try {
      const result = await onCreateRoom(profile());
      onEnterRoom(result.room.roomId);
    } catch (e) {
      const detail = e instanceof Error ? e.message : '未知错误';
      Alert.alert('创建失败', detail);
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    if (!roomIdInput.trim()) {
      Alert.alert('提示', '请输入房间号');
      return;
    }
    try {
      const result = await onJoinRoom({
        ...profile(),
        roomId: roomIdInput.trim(),
      });
      if ('code' in result) {
        const hint = !isRemoteSyncEnabled()
          ? '\n\n当前为单机模式，房间只存在于创建设备。多台手机联机请先启动 sync-server。'
          : '';
        Alert.alert('加入失败', result.message + hint);
        return;
      }
      onEnterRoom(result.room.roomId, result.message);
    } catch (e) {
      const detail = e instanceof Error ? e.message : '未知错误';
      Alert.alert('加入失败', detail);
    }
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
        <View style={styles.content}>
          <LobbyLogo />

          <LobbyNicknameField value={nickname} onChangeText={onNicknameChange} />

          <LobbyAvatarGrid selectedId={avatarId} onSelect={onAvatarIdChange} />

          <View style={styles.actionRow}>
            <TextInput
              style={[
                styles.roomInput,
                styles.narrowCell,
                roomFocused && styles.roomInputFocused,
              ]}
              placeholder="[ ROOM ID ]"
              placeholderTextColor={theme.colors.textMuted}
              value={roomIdInput}
              onChangeText={setRoomIdInput}
              onFocus={() => setRoomFocused(true)}
              onBlur={() => setRoomFocused(false)}
              autoCapitalize="characters"
              maxLength={6}
            />
            <LobbyArcadeButton
              label="加入房间"
              variant="secondary"
              fullWidth={false}
              onPress={handleJoin}
              style={styles.wideButton}
            />
          </View>

          <View style={[styles.actionRow, styles.createRow]}>
            <LobbyMemberToggle
              checked={isMockMember}
              onToggle={() => setIsMockMember((v) => !v)}
              compact
            />
            <LobbyArcadeButton
              label="创建房间"
              subtitle="[ PRESS START ]"
              variant="primary"
              fullWidth={false}
              flat
              onPress={handleCreate}
              style={styles.wideButton}
            />
          </View>

          <PixelText variant="captionCn" tone="muted" style={styles.hint}>
            创建房间需勾选模拟会员
          </PixelText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm + 4,
  },
  narrowCell: {
    flex: 1,
  },
  wideButton: {
    flex: 1.3,
  },
  createRow: {
    alignItems: 'center',
  },
  roomInput: {
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.neonGreen,
    borderRadius: theme.borders.radius,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm + 4,
    fontFamily: theme.fontFamily.latin,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
    minHeight: 52,
    textAlign: 'center',
  },
  roomInputFocused: {
    borderWidth: 3,
    borderColor: theme.colors.success,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
  hint: {
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
