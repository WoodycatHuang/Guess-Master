import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AvatarPicker } from '../components/AvatarPicker';
import {
  NeonButton,
  PixelInput,
  PixelText,
} from '../components/ui';
import { theme } from '../theme';
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
        <PixelText variant="titleCn" tone="primary" style={styles.title}>
          猜数大师
        </PixelText>
        <PixelText variant="captionLatin" tone="secondary" style={styles.subtitle}>
          GUESS MASTER // LOBBY
        </PixelText>

        <PixelText variant="labelCn" tone="primary" style={styles.label}>
          你的昵称
        </PixelText>
        <PixelInput
          placeholder="输入昵称（同房间可重复）"
          value={nickname}
          onChangeText={setNickname}
          maxLength={12}
        />

        <PixelText variant="labelCn" tone="primary" style={styles.label}>
          选择头像
        </PixelText>
        <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />

        <Pressable
          style={styles.memberRow}
          onPress={() => setIsMockMember((v) => !v)}
        >
          <View style={[styles.checkbox, isMockMember && styles.checkboxOn]}>
            {isMockMember ? (
              <PixelText variant="captionLatin" tone="onAccent">
                X
              </PixelText>
            ) : null}
          </View>
          <PixelText variant="bodyCn" tone="secondary">
            是否为模拟会员
          </PixelText>
        </Pressable>
        <PixelText variant="captionCn" tone="muted" style={styles.memberHint}>
          创建房间需要勾选模拟会员
        </PixelText>

        <View style={styles.section}>
          <PixelText variant="labelCn" tone="primary" style={styles.label}>
            加入房间
          </PixelText>
          <PixelInput
            placeholder="输入 6 位房间号"
            value={roomIdInput}
            onChangeText={setRoomIdInput}
            autoCapitalize="characters"
            maxLength={6}
            style={styles.roomInput}
          />
          <NeonButton
            label="加入房间"
            variant="secondary"
            onPress={handleJoin}
            style={styles.joinBtn}
          />
        </View>

        <NeonButton
          label="创建房间"
          variant="primary"
          onPress={handleCreate}
          style={styles.createBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  title: {
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    letterSpacing: 0.5,
  },
  label: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm + 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borders.radius,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderDim,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundInput,
  },
  checkboxOn: {
    backgroundColor: theme.colors.neonGreen,
    borderColor: theme.colors.neonGreen,
  },
  memberHint: {
    marginTop: theme.spacing.xs,
    marginLeft: 34,
  },
  section: {
    marginTop: theme.spacing.sm,
  },
  roomInput: {
    fontFamily: theme.fontFamily.latin,
    fontSize: theme.fontSize.md,
    letterSpacing: 2,
  },
  joinBtn: {
    marginTop: theme.spacing.sm + 4,
  },
  createBtn: {
    marginTop: theme.spacing.lg,
  },
});
