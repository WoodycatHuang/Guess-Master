import Taro, { useRouter } from '@tarojs/taro';
import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { useRoomSync } from '../../hooks';
import { loadSession } from '../../services/session';
import { User } from '@shared/types/room';
import './index.scss';

export default function GamePage() {
  const router = useRouter();
  const roomId = router.params.roomId ?? '';
  const {
    room,
    self,
    setSelf,
    updateSortOrder,
    submitSort,
  } = useRoomSync(roomId || null);

  const [sortOrder, setSortOrder] = useState<string[]>([]);

  useEffect(() => {
    const session = loadSession();
    if (!self && session && room) {
      const found =
        room.players.find((u) => u.id === session.userId) ??
        room.spectators.find((u) => u.id === session.userId);
      if (found) setSelf({ ...found });
    }
  }, [room, self, setSelf]);

  useEffect(() => {
    if (room?.sortOrder?.length) {
      setSortOrder(room.sortOrder);
    }
  }, [room?.sortOrder.join(',')]);

  useEffect(() => {
    if (!room || !self) return;
    if (room.status === 'waiting') {
      Taro.redirectTo({ url: `/pages/room/index?roomId=${room.roomId}` });
    } else if (room.status === 'verifying') {
      Taro.redirectTo({ url: `/pages/result/index?roomId=${room.roomId}` });
    }
  }, [room?.status, room?.roomId, self]);

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= sortOrder.length) return;
    const copy = [...sortOrder];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setSortOrder(copy);
    await updateSortOrder(copy);
  };

  const handleSubmit = async () => {
    const result = await submitSort();
    if (result && 'code' in result) {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  };

  if (!room || !self) {
    return (
      <View className="app-shell">
        <Text className="muted">加载中…</Text>
      </View>
    );
  }

  const isHost = self.id === room.hostId;
  const isPlayer = self.role === 'Host' || self.role === 'Guest';
  const myCard = room.players.find((u) => u.id === self.id)?.cardNumber ?? null;

  const playersByOrder = sortOrder
    .map((id) => room.players.find((u) => u.id === id))
    .filter(Boolean) as User[];

  return (
    <View className="app-shell">
      <View className="header-row">
        <Text className="pixel-sub">ROOM {room.roomId}</Text>
      </View>

      {isPlayer ? (
        <Text className="muted" style={{ marginBottom: '16px', display: 'block' }}>
          请尽量不要使用形容词，而是使用名词/名字来描述你的卡牌
        </Text>
      ) : null}

      <View className="panel">
        <Text className="pixel-sub">TOPIC // 本轮题目</Text>
        <Text className="topic-title">{room.topic}</Text>
        <View className="topic-scale">
          <Text>{room.topicLowLabel}</Text>
          <Text>{room.topicHighLabel}</Text>
        </View>
      </View>

      {isPlayer && myCard !== null ? (
        <View className="panel">
          <Text className="pixel-sub">YOUR CARD</Text>
          <Text className="card-number">{myCard}</Text>
          <Text className="muted">只有你能看到这张牌</Text>
        </View>
      ) : null}

      {!isHost && isPlayer ? (
        <View className="panel">
          <Text className="pixel-sub">房主正在努力排序中…</Text>
        </View>
      ) : null}

      {isSpectator(self) ? (
        <View className="panel">
          <Text className="pixel-sub">游戏进行中，请观战</Text>
        </View>
      ) : null}

      {isHost ? (
        <View className="panel">
          <Text className="pixel-sub">拖拽排序（用 ↑↓ 调整）</Text>
          {playersByOrder.map((u, index) => (
            <View key={u.id} className="sort-item">
              <Text className="player-emoji">{getAvatarEmoji(u.avatarId)}</Text>
              <Text className="flex1">{u.name}</Text>
              <View className="sort-actions">
                <Text className="sort-btn" onClick={() => move(index, -1)}>
                  ↑
                </Text>
                <Text className="sort-btn" onClick={() => move(index, 1)}>
                  ↓
                </Text>
              </View>
            </View>
          ))}
          <View className="btn btn-primary" onClick={handleSubmit}>
            提交排序
          </View>
        </View>
      ) : null}
    </View>
  );
}

function isSpectator(self: User): boolean {
  return self.role === 'Spectator';
}
