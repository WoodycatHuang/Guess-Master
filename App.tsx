import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoomSync } from './src/hooks/useRoomSync';
import { GameScreen } from './src/screens/GameScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { ResultPlaceholderScreen } from './src/screens/ResultPlaceholderScreen';
import { RoomWaitingScreen } from './src/screens/RoomWaitingScreen';

type Screen = 'lobby' | 'room';

export default function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [entryMessage, setEntryMessage] = useState<string | undefined>();
  const roomEverLoaded = useRef(false);

  const {
    room,
    self,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    updateSortOrder,
    submitSort,
    addMockGuests,
  } = useRoomSync(activeRoomId);

  useEffect(() => {
    if (room) {
      roomEverLoaded.current = true;
    }
  }, [room]);

  const handleEnterRoom = (roomId: string, message?: string) => {
    roomEverLoaded.current = false;
    setActiveRoomId(roomId);
    setEntryMessage(message);
    setScreen('room');
  };

  const handleBackToLobby = () => {
    leaveRoom();
    setActiveRoomId(null);
    setEntryMessage(undefined);
    setScreen('lobby');
    roomEverLoaded.current = false;
  };

  const handleStartGame = () => {
    const result = startGame();
    if (!result) return;
    if ('code' in result) {
      Alert.alert('无法开始', result.message);
    }
  };

  const handleAddMockGuests = () => {
    if (!room) return;
    const result = addMockGuests(1, room.roomId);
    if (!result) {
      Alert.alert('添加失败', '无法添加模拟玩家，请确认房间处于等待状态');
    }
  };

  const handleMoveSort = (order: string[]) => {
    const result = updateSortOrder(order);
    if (result && 'code' in result) {
      Alert.alert('排序失败', result.message);
    }
  };

  const handleSubmitSort = () => {
    const result = submitSort();
    if (!result) return;
    if ('code' in result) {
      Alert.alert('提交失败', result.message);
    }
  };

  const renderRoom = () => {
    if (!room || !self) {
      if (roomEverLoaded.current) {
        return (
          <View style={styles.dissolved}>
            <Text style={styles.dissolvedTitle}>房间已解散</Text>
            <Text style={styles.dissolvedHint}>房主已离开，房间已关闭</Text>
            <Pressable style={styles.dissolvedBtn} onPress={handleBackToLobby}>
              <Text style={styles.dissolvedBtnText}>退回大厅</Text>
            </Pressable>
          </View>
        );
      }

      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      );
    }

    if (room.status === 'waiting') {
      return (
        <RoomWaitingScreen
          room={room}
          self={self}
          entryMessage={entryMessage}
          onStartGame={handleStartGame}
          onAddMockGuests={handleAddMockGuests}
          onBackToLobby={handleBackToLobby}
        />
      );
    }

    if (room.status === 'gaming') {
      return (
        <GameScreen
          room={room}
          self={self}
          onMoveSort={handleMoveSort}
          onSubmitSort={handleSubmitSort}
          onBackToLobby={handleBackToLobby}
        />
      );
    }

    return (
      <ResultPlaceholderScreen
        room={room}
        self={self}
        onBackToLobby={handleBackToLobby}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        {screen === 'lobby' ? (
          <LobbyScreen
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onEnterRoom={handleEnterRoom}
          />
        ) : (
          renderRoom()
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dissolved: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dissolvedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  dissolvedHint: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  dissolvedBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  dissolvedBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
