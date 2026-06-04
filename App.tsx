import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PixelText, ScreenShell } from './src/components/ui';
import { useAppFonts } from './src/hooks/useAppFonts';
import { useRoomSync } from './src/hooks/useRoomSync';
import { GameActionError } from './src/services/sync/RoomSyncService';
import { GameScreen } from './src/screens/GameScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { RoomWaitingScreen } from './src/screens/RoomWaitingScreen';
import { theme } from './src/theme';

type Screen = 'lobby' | 'room';

export default function App() {
  const { loaded: fontsLoaded, error: fontsError } = useAppFonts();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [entryMessage, setEntryMessage] = useState<string | undefined>();
  const [lobbyNickname, setLobbyNickname] = useState('');
  const [lobbyAvatarId, setLobbyAvatarId] = useState(1);
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
    playAgain,
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
    if (self) {
      setLobbyNickname(self.name);
      setLobbyAvatarId(self.avatarId);
    }
    void leaveRoom();
    setActiveRoomId(null);
    setEntryMessage(undefined);
    setScreen('lobby');
    roomEverLoaded.current = false;
  };

  const handleStartGame = async () => {
    const result = await startGame();
    if (!result) return;
    if ('code' in result) {
      Alert.alert('无法开始', result.message);
    }
  };

  const handleAddMockGuests = async () => {
    if (!room) return;
    const result = await addMockGuests(1, room.roomId);
    if (!result) {
      Alert.alert('添加失败', '无法添加模拟玩家，请确认房间处于等待状态');
    }
  };

  const handleMoveSort = async (
    order: string[],
  ): Promise<GameActionError | null> => {
    const result = await updateSortOrder(order);
    if (result) {
      Alert.alert('排序失败', result.message);
    }
    return result;
  };

  const handleSubmitSort = async () => {
    const result = await submitSort();
    if (!result) return;
    if ('code' in result) {
      Alert.alert('提交失败', result.message);
    }
  };

  const handlePlayAgain = async () => {
    const result = await playAgain();
    if (!result) return;
    if ('code' in result) {
      Alert.alert('无法再来一局', result.message);
    }
  };

  const renderRoom = () => {
    if (!room || !self) {
      if (roomEverLoaded.current) {
        return (
          <View style={styles.dissolved}>
            <PixelText variant="titleCn" tone="fail">
              房间已解散
            </PixelText>
            <PixelText variant="bodyCn" tone="secondary" style={styles.dissolvedHint}>
              房主已离开，房间已关闭
            </PixelText>
            <Pressable style={styles.dissolvedBtn} onPress={handleBackToLobby}>
              <PixelText variant="bodyCn" tone="onAccent">
                退回大厅
              </PixelText>
            </Pressable>
          </View>
        );
      }

      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.neonGreen} />
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
      <ResultScreen
        room={room}
        self={self}
        onPlayAgain={handlePlayAgain}
        onBackToLobby={handleBackToLobby}
      />
    );
  };

  if (fontsError) {
    return (
      <ScreenShell style={styles.center}>
        <Text style={styles.bootText}>字体加载失败</Text>
      </ScreenShell>
    );
  }

  if (!fontsLoaded) {
    return (
      <ScreenShell style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.neonGreen} />
        <Text style={styles.bootText}>LOADING...</Text>
      </ScreenShell>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ScreenShell>
        <StatusBar style="light" />
        {screen === 'lobby' ? (
          <LobbyScreen
            nickname={lobbyNickname}
            avatarId={lobbyAvatarId}
            onNicknameChange={setLobbyNickname}
            onAvatarIdChange={setLobbyAvatarId}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onEnterRoom={handleEnterRoom}
          />
        ) : (
          renderRoom()
        )}
      </ScreenShell>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  bootText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  dissolved: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  dissolvedHint: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  dissolvedBtn: {
    backgroundColor: theme.colors.neonGreen,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.neonGreen,
    borderRadius: theme.borders.radius,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
});
