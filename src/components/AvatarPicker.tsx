import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AVATAR_EMOJIS } from '../constants/avatars';

interface Props {
  selectedId: number;
  onSelect: (avatarId: number) => void;
}

export function AvatarPicker({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {AVATAR_EMOJIS.map((emoji, index) => {
        const id = index + 1;
        const selected = id === selectedId;
        return (
          <Pressable
            key={id}
            style={[styles.item, selected && styles.itemSelected]}
            onPress={() => onSelect(id)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  item: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemSelected: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  emoji: {
    fontSize: 28,
  },
});
