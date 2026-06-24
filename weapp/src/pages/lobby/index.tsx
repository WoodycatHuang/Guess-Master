import { useLoad, useRouter } from '@tarojs/taro';
import { useState } from 'react';
import { View, Input, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AVATAR_EMOJIS } from '@shared/constants/avatars';
import { useRoomSync } from '../../hooks';
import { isRemoteSyncEnabled } from '../../services';
import { loadProfile, saveProfile, persistSelf } from '../../services/session';
import './index.scss';

export default function LobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState(1);
  const [roomIdInput, setRoomIdInput] = useState('');
  const { createRoom, joinRoom } = useRoomSync(null);

  useLoad(() => {
    const profile = loadProfile();
    setNickname(profile.nickname);
    setAvatarId(profile.avatarId);
    const sharedRoom = router.params.roomId;
    if (sharedRoom) {
      setRoomIdInput(sharedRoom.toUpperCase());
    }
  });

  const profile = () => {
    saveProfile({ nickname: nickname.trim(), avatarId });
    return { name: nickname.trim(), avatarId };
  };

  const goRoom = (roomId: string, entryMessage?: string) => {
    const query = entryMessage
      ? `roomId=${roomId}&msg=${encodeURIComponent(entryMessage)}`
      : `roomId=${roomId}`;
    Taro.navigateTo({ url: `/pages/room/index?${query}` });
  };

  const handleCreate = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    try {
      const result = await createRoom(profile());
      persistSelf(result.self.id, result.room.roomId);
      goRoom(result.room.roomId);
    } catch (e) {
      Taro.showToast({
        title: e instanceof Error ? e.message : '创建失败',
        icon: 'none',
      });
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!roomIdInput.trim()) {
      Taro.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    try {
      const result = await joinRoom({
        ...profile(),
        roomId: roomIdInput.trim(),
      });
      if ('code' in result) {
        const hint = !isRemoteSyncEnabled()
          ? '（当前为单机演示，请用另一台设备或配置服务器）'
          : '';
        Taro.showToast({ title: result.message + hint, icon: 'none' });
        return;
      }
      persistSelf(result.self.id, result.room.roomId);
      goRoom(result.room.roomId, result.message);
    } catch (e) {
      Taro.showToast({
        title: e instanceof Error ? e.message : '加入失败',
        icon: 'none',
      });
    }
  };

  return (
    <View className="app-shell" style={{ backgroundColor: '#0D0E15', minHeight: '100vh' }}>
      <Text className="pixel-title" style={{ color: '#39FF14', display: 'block' }}>
        GUESS MASTER
      </Text>
      <Text className="pixel-sub" style={{ color: '#8B9B8A', display: 'block' }}>
        // LOBBY
      </Text>

      <View className="panel" style={{ marginTop: '32px' }}>
        <Input
          className="input"
          placeholder="你的昵称"
          placeholderClass="muted"
          value={nickname}
          onInput={(e) => setNickname(e.detail.value)}
          maxlength={12}
        />

        <View className="avatar-grid">
          {AVATAR_EMOJIS.map((emoji, index) => {
            const id = index + 1;
            return (
              <View
                key={id}
                className={`avatar-cell ${avatarId === id ? 'avatar-cell--selected' : ''}`}
                onClick={() => setAvatarId(id)}
              >
                {emoji}
              </View>
            );
          })}
        </View>

        <View className="row">
          <Input
            className="input flex1"
            placeholder="ROOM ID"
            placeholderClass="muted"
            value={roomIdInput}
            onInput={(e) => setRoomIdInput(e.detail.value.toUpperCase())}
            maxlength={6}
          />
          <View className="btn btn-secondary flex1" onClick={handleJoin}>
            加入房间
          </View>
        </View>

        <View className="btn btn-primary" onClick={handleCreate}>
          创建房间
        </View>

        <Text className="muted">
          {isRemoteSyncEnabled()
            ? '已连接联机服务器'
            : '演示模式：单机可测界面，真联机需配置服务器'}
        </Text>
      </View>
    </View>
  );
}
