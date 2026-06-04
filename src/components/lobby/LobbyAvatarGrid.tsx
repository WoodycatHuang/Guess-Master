import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AVATAR_EMOJIS } from '../../constants/avatars';
import { PixelText } from '../ui/PixelText';
import { theme } from '../../theme';

const COLS = 5;
const CELL = 52;

interface ItemProps {
  id: number;
  emoji: string;
  selected: boolean;
  onSelect: (id: number) => void;
}

function AvatarCell({ id, emoji, selected, onSelect }: ItemProps) {
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!selected) return;
    shake.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(-1, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [selected, id, shake]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value * 3 },
      { rotate: `${shake.value * 2}deg` },
    ],
  }));

  return (
    <Pressable onPress={() => onSelect(id)} style={styles.cellWrap}>
      <Animated.View
        style={[
          styles.cell,
          selected && styles.cellSelected,
          animStyle,
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </Animated.View>
    </Pressable>
  );
}

interface Props {
  selectedId: number;
  onSelect: (avatarId: number) => void;
}

export function LobbyAvatarGrid({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.block}>
      <View style={styles.labelBlock}>
        <PixelText variant="labelCn" tone="secondary">
          选择头像
        </PixelText>
        <PixelText variant="captionLatin" tone="muted" style={styles.labelEn}>
          CHOOSE AN AVATAR
        </PixelText>
      </View>
      <View style={styles.grid}>
        {AVATAR_EMOJIS.map((emoji, index) => {
          const id = index + 1;
          return (
            <AvatarCell
              key={id}
              id={id}
              emoji={emoji}
              selected={id === selectedId}
              onSelect={onSelect}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: theme.spacing.lg,
  },
  labelBlock: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  labelEn: {
    marginTop: theme.spacing.xs,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm + 2,
    maxWidth: COLS * CELL + (COLS - 1) * 10,
    alignSelf: 'center',
  },
  cellWrap: {
    width: CELL,
    height: CELL,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: theme.borders.radius,
    backgroundColor: theme.colors.backgroundElevated,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderColor: theme.colors.neonGreen,
    backgroundColor: theme.colors.overlay,
  },
  emoji: {
    fontSize: 26,
  },
});
