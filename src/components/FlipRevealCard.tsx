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
  const crackPulse = useSharedValue(0);

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
      crackPulse.value = withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(0.35, { duration: 200 }),
      );
    }
  }, [revealed, cracked, flip, crackShake, crackPulse]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 0.88 + flip.value * 0.12 },
      { translateX: crackShake.value * 8 },
      { rotate: `${crackShake.value * 4}deg` },
    ],
  }));

  const crackOverlayStyle = useAnimatedStyle(() => ({
    opacity: crackPulse.value,
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.index}>{index + 1}</Text>
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
            <Text style={styles.backLabel} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ) : (
          <View style={styles.front}>
            <Text style={styles.number}>{cardNumber}</Text>
            {cracked ? <Text style={styles.crackEmoji}>💥</Text> : null}
          </View>
        )}
        {cracked && revealed ? (
          <Animated.View style={[styles.crackOverlay, crackOverlayStyle]}>
            <Text style={styles.crackText}>裂开</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: 88,
  },
  index: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 6,
  },
  card: {
    width: 80,
    height: 108,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRevealed: {
    backgroundColor: '#eef2ff',
    borderColor: '#a5b4fc',
  },
  cardCracked: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  back: {
    alignItems: 'center',
    padding: 8,
  },
  backEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  backLabel: {
    fontSize: 10,
    color: '#6b7280',
    maxWidth: 72,
    textAlign: 'center',
  },
  front: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 36,
    fontWeight: '800',
    color: '#4f46e5',
  },
  crackEmoji: {
    fontSize: 18,
    marginTop: 2,
  },
  crackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crackText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#b91c1c',
    transform: [{ rotate: '-12deg' }],
  },
});
