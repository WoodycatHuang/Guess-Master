import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRoomSync } from './src/hooks/useRoomSync';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { RoomEntryPlaceholderScreen } from './src/screens/RoomEntryPlaceholderScreen';

type Screen = 'lobby' | 'room';

export default function App() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [entryMessage, setEntryMessage] = useState<string | undefined>();

  const { room, self, createRoom, joinRoom, leaveRoom } =
    useRoomSync(activeRoomId);

  const handleEnterRoom = (roomId: string, message?: string) => {
    setActiveRoomId(roomId);
    setEntryMessage(message);
    setScreen('room');
  };

  const handleBackToLobby = () => {
    leaveRoom();
    setActiveRoomId(null);
    setEntryMessage(undefined);
    setScreen('lobby');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {screen === 'lobby' ? (
        <LobbyScreen
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onEnterRoom={handleEnterRoom}
        />
      ) : (
        <RoomEntryPlaceholderScreen
          room={room}
          self={self}
          entryMessage={entryMessage}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
});
