import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { getAvatarEmoji } from '../constants/avatars';
import { PixelText } from './ui/PixelText';
import { theme } from '../theme';

interface Props {
  index: number;
  name: string;
  avatarId: number;
  cardNumber: number;
  revealed: boolean;
  cracked: boolean;
}

export function FlipRevealCard({
  index,
  name,
  avatarId,
  cardNumber,
  revealed,
  cracked,
}: Props) {
  const flip = useSharedValue(0);
  const crackShake = useSharedValue(0);

  useEffect(() => {
    if (!revealed) return;
    flip.value = withSpring(1, { damping: 14, stiffness: 120 });
    if (cracked) {
      crackShake.value = withSequence(
        withTiming(1, { duration: 70 }),
        withTiming(-1, { duration: 70 }),
        withTiming(1, { duration: 70 }),
        withTiming(0, { duration: 70 }),
      );
    }
  }, [revealed, cracked, flip, crackShake]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.88 + flip.value * 0.12 },
      { translateX: crackShake.value * 8 },
      { rotate: `${crackShake.value * 4}deg` },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <PixelText variant="captionLatin" tone="muted">
        {index + 1}
      </PixelText>
      <Animated.View
        style={[
          styles.card,
          revealed && styles.cardRevealed,
          cracked && styles.cardCracked,
          cardStyle,
        ]}
      >
        {!revealed ? (
          <View style={styles.back}>
            <Text style={styles.backEmoji}>{getAvatarEmoji(avatarId)}</Text>
            <PixelText
              variant="captionCn"
              tone="muted"
              numberOfLines={1}
              style={styles.backLabel}
            >
              {name}
            </PixelText>
          </View>
        ) : (
          <View style={styles.front}>
            <PixelText
              variant="titleLatin"
              tone={cracked ? 'fail' : 'primary'}
              style={styles.number}
            >
              {cardNumber}
            </PixelText>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 88,
    marginTop: theme.spacing.xs + 2,
  },
  card: {
    width: 80,
    height: 108,
    borderRadius: theme.borders.radius,
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderMuted,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRevealed: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.neonGreen,
  },
  cardCracked: {
    borderColor: theme.colors.fail,
    backgroundColor: 'rgba(255, 0, 85, 0.12)',
  },
  back: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  backEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  backLabel: {
    maxWidth: 72,
    textAlign: 'center',
  },
  front: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 28,
    lineHeight: 34,
  },
});
