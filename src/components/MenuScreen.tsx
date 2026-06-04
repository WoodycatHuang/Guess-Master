import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES } from '../constants/difficulty';
import { Difficulty } from '../types/game';

interface Props {
  score: number;
  gamesWon: number;
  gamesPlayed: number;
  onSelect: (difficulty: Difficulty) => void;
}

export function MenuScreen({ score, gamesWon, gamesPlayed, onSelect }: Props) {
  const winRate =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>猜数大师</Text>
      <Text style={styles.subtitle}>选择难度开始游戏</Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{score}</Text>
          <Text style={styles.statLabel}>得分</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{gamesWon}</Text>
          <Text style={styles.statLabel}>胜场</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{winRate}%</Text>
          <Text style={styles.statLabel}>胜率</Text>
        </View>
      </View>

      <View style={styles.cards}>
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((key) => {
          const d = DIFFICULTIES[key];
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() => onSelect(key)}
            >
              <Text style={styles.cardEmoji}>{d.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{d.label}</Text>
                <Text style={styles.cardDesc}>
                  {d.min}–{d.max} · {d.maxAttempts} 次机会
                </Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a2e',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4f46e5',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontWeight: '500',
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  cardDesc: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  cardArrow: {
    fontSize: 28,
    color: '#c7d2fe',
    fontWeight: '300',
  },
});
