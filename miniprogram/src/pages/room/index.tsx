import Taro, { useLoad, useRouter, useShareAppMessage } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { useRoomSync } from '../../hooks';
import { isRemoteSyncEnabled } from '../../services';
import { clearSession, loadSession } from '../../services/session';
import { User } from '@shared/types/room';
import './index.scss';

export default function RoomPage() {
  const router = useRouter();
  const roomId = router.params.roomId ?? '';
  const entryMessage = router.params.msg
    ? decodeURIComponent(router.params.msg)
    : undefined;

  const {
    room,
    self,
    setSelf,
    leaveRoom,
    startGame,
    addMockGuests,
  } = useRoomSync(roomId || null);

  const [ready, setReady] = useState(false);

  useLoad(() => {
    if (!roomId) {
      Taro.showToast({ title: '房间号无效', icon: 'none' });
      Taro.redirectTo({ url: '/pages/lobby/index' });
    }
  });

  useEffect(() => {
    const session = loadSession();
    if (!self && session && room) {
      const found =
        room.players.find((u) => u.id === session.userId) ??
        room.spectators.find((u) => u.id === session.userId);
      if (found) {
        setSelf({ ...found });
      }
    }
    if (room && self) setReady(true);
  }, [room, self, setSelf]);

  useEffect(() => {
    if (!room || !self) return;
    if (room.status === 'gaming') {
      Taro.redirectTo({ url: `/pages/game/index?roomId=${room.roomId}` });
    } else if (room.status === 'verifying') {
      Taro.redirectTo({ url: `/pages/result/index?roomId=${room.roomId}` });
    }
  }, [room?.status, room?.roomId, self]);

  useShareAppMessage(() => ({
    title: `来一起玩脑波专家！房间号 ${room?.roomId ?? roomId}`,
    path: `/pages/lobby/index?roomId=${room?.roomId ?? roomId}`,
    imageUrl: '/assets/share-500x400.png',
  }));

  const handleLeave = async () => {
    await leaveRoom();
    clearSession();
    Taro.redirectTo({ url: '/pages/lobby/index' });
  };

  const handleStart = async () => {
    const result = await startGame();
    if (result && 'code' in result) {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  };

  const handleAddTestPlayers = async () => {
    await addMockGuests(2);
  };

  if (!ready || !room || !self) {
    return (
      <View className="app-shell">
        <Text className="muted">加载房间…</Text>
      </View>
    );
  }

  const isHost = self.id === room.hostId;
  const isSpectator = self.role === 'Spectator';
  const canStart = room.players.length >= 2;
  const sortedPlayers = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <View className="app-shell">
      <View className="header-row">
        <Text className="pixel-sub">ROOM {room.roomId}</Text>
        <Text className="link" onClick={handleLeave}>
          退回大厅
        </Text>
      </View>

      {entryMessage ? (
        <View className="panel banner-warn">
          <Text>{entryMessage}</Text>
          <Text className="muted">你正在旁观</Text>
        </View>
      ) : null}

      <Text className="pixel-title">{isSpectator ? '观战中' : '等待开始'}</Text>
      <Text className="pixel-sub">
        {room.players.length}/10 玩家
        {room.spectators.length > 0 ? ` · ${room.spectators.length} 旁观` : ''}
      </Text>

      <View className="player-grid" style={{ marginTop: '24px' }}>
        {sortedPlayers.map((u: User) => (
          <View
            key={u.id}
            className={`player-cell ${u.id === room.hostId ? 'player-cell--host' : ''}`}
          >
            <Text className="player-emoji">{getAvatarEmoji(u.avatarId)}</Text>
            <Text className="player-name">
              {u.name}
              {u.id === self.id ? '（你）' : ''}
              {u.id === room.hostId ? ' · 房主' : ''}
            </Text>
          </View>
        ))}
      </View>

      {!isRemoteSyncEnabled() && isHost && room.players.length < 2 ? (
        <View className="btn btn-secondary" onClick={handleAddTestPlayers}>
          添加测试玩家（仅演示模式）
        </View>
      ) : null}

      {isHost && !isSpectator ? (
        <View
          className={`btn btn-primary ${canStart ? '' : 'btn-secondary'}`}
          onClick={canStart ? handleStart : undefined}
        >
          {canStart ? '开始游戏' : '至少 2 人才能开始'}
        </View>
      ) : null}

      <Button openType="share" className="btn btn-primary">
        邀请好友
      </Button>
    </View>
  );
}
