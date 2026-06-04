import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { calculateScore, DIFFICULTIES } from '../constants/difficulty';
import { GameState } from '../types/game';

interface Props {
  state: GameState;
  onGuess: (value: string) => { error: string | null };
  onBack: () => void;
}

export function GameScreen({ state, onGuess, onBack }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const config = DIFFICULTIES[state.difficulty];
  const progress = state.attempts / state.maxAttempts;
  const isFinished = state.phase === 'won' || state.phase === 'lost';

  const handleSubmit = () => {
    Keyboard.dismiss();
    const result = onGuess(input);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError('');
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>← 菜单</Text>
        </Pressable>
        <Text style={styles.difficulty}>
          {config.emoji} {config.label}
        </Text>
      </View>

      <View style={styles.rangeBadge}>
        <Text style={styles.rangeText}>
          {state.min} – {state.max}
        </Text>
      </View>

      <View style={styles.attemptsBar}>
        <View style={[styles.attemptsFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.attemptsLabel}>
        {state.attempts} / {state.maxAttempts} 次尝试
      </Text>

      <View style={styles.hintBox}>
        <Text style={styles.hint}>{state.hint}</Text>
        {state.lastGuess !== null && !isFinished && (
          <Text style={styles.lastGuess}>上次猜测：{state.lastGuess}</Text>
        )}
      </View>

      {isFinished ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultEmoji}>
            {state.phase === 'won' ? '🏆' : '😔'}
          </Text>
          <Text style={styles.resultTitle}>
            {state.phase === 'won' ? '胜利！' : '游戏结束'}
          </Text>
          {state.phase === 'won' && (
            <Text style={styles.resultScore}>
              +{calculateRoundScore(state)} 分
            </Text>
          )}
          {state.phase === 'lost' && (
            <Text style={styles.resultAnswer}>答案是：{state.target}</Text>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.playAgainBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={onBack}
          >
            <Text style={styles.playAgainText}>返回菜单</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`${state.min} – ${state.max}`}
            placeholderTextColor="#cbd5e1"
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            maxLength={3}
          />
          <Pressable
            style={({ pressed }) => [
              styles.guessBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.guessBtnText}>猜</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

function calculateRoundScore(state: GameState): number {
  return calculateScore(state.difficulty, state.attempts, state.maxAttempts);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  back: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  difficulty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  rangeBadge: {
    alignSelf: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 24,
  },
  rangeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: 1,
  },
  attemptsBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  attemptsFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  attemptsLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 32,
  },
  hintBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 32,
  },
  hint: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 32,
  },
  lastGuess: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  guessBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 16,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  guessBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.85,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  resultBox: {
    alignItems: 'center',
    gap: 8,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
  },
  resultScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 16,
  },
  resultAnswer: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 16,
  },
  playAgainBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
