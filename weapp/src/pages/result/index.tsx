import Taro, { useRouter } from '@tarojs/taro';
import { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { getAvatarEmoji } from '@shared/constants/avatars';
import { evaluateSortedCards } from '@shared/services/sync/roomUtils';
import { useRoomSync } from '../../hooks';
import { loadSession } from '../../services/session';
import './index.scss';

export default function ResultPage() {
  const router = useRouter();
  const roomId = router.params.roomId ?? '';
  const { room, self, setSelf, playAgain } = useRoomSync(roomId || null);

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
    if (!room || !self) return;
    if (room.status === 'waiting') {
      Taro.redirectTo({ url: `/pages/room/index?roomId=${room.roomId}` });
    } else if (room.status === 'gaming') {
      Taro.redirectTo({ url: `/pages/game/index?roomId=${room.roomId}` });
    }
  }, [room?.status, room?.roomId, self]);

  const handlePlayAgain = async () => {
    const result = await playAgain();
    if (result && 'code' in result) {
      Taro.showToast({ title: result.message, icon: 'none' });
    }
  };

  const handleBackRoom = () => {
    Taro.redirectTo({ url: `/pages/room/index?roomId=${roomId}` });
  };

  if (!room || !self) {
    return (
      <View className="app-shell">
        <Text className="muted">加载结果…</Text>
      </View>
    );
  }

  const { success, crackIndex } = evaluateSortedCards(room);

  return (
    <View className="app-shell">
      <View className="header-row">
        <Text className="pixel-sub">ROOM {room.roomId}</Text>
      </View>

      <View className="panel">
        <Text className="pixel-sub">TOPIC // 本轮题目</Text>
        <Text className="topic-title">{room.topic}</Text>
        <View className="topic-scale">
          <Text>{room.topicLowLabel}</Text>
          <Text>{room.topicHighLabel}</Text>
        </View>
      </View>

      <Text className={success ? 'result-success' : 'result-fail'}>
        {success ? '排序成功！' : '排序失败'}
      </Text>

      <View className="panel" style={{ marginTop: '24px' }}>
        {room.sortOrder.map((userId, index) => {
          const user = room.players.find((u) => u.id === userId);
          if (!user) return null;
          const isCrack = crackIndex === index;
          return (
            <View key={userId} className="sort-item">
              <Text className="player-emoji">{getAvatarEmoji(user.avatarId)}</Text>
              <Text className="flex1">{user.name}</Text>
              <Text style={{ color: isCrack ? '#ff0055' : '#39ff14' }}>
                {user.cardNumber}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="btn btn-primary" onClick={handlePlayAgain}>
        再来一局
      </View>
      <View className="btn btn-secondary" onClick={handleBackRoom}>
        返回房间
      </View>
    </View>
  );
}
