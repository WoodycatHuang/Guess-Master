import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AVATAR_EMOJIS } from '../constants/avatars';
import { theme } from '../theme';

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
    gap: theme.spacing.sm + 2,
    justifyContent: 'center',
  },
  item: {
    width: 52,
    height: 52,
    borderRadius: theme.borders.radius,
    backgroundColor: theme.colors.backgroundElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderMuted,
  },
  itemSelected: {
    borderColor: theme.colors.neonGreen,
    backgroundColor: theme.colors.overlay,
  },
  emoji: {
    fontSize: 28,
  },
});
