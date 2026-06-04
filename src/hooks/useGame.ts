import { useCallback, useState } from 'react';
import { calculateScore, randomTarget, DIFFICULTIES } from '../constants/difficulty';
import { Difficulty, GameState } from '../types/game';

const INITIAL_STATE: GameState = {
  phase: 'menu',
  difficulty: 'medium',
  target: 0,
  attempts: 0,
  maxAttempts: 10,
  min: 1,
  max: 100,
  lastGuess: null,
  hint: '',
  score: 0,
  gamesWon: 0,
  gamesPlayed: 0,
};

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const startGame = useCallback((difficulty: Difficulty) => {
    const config = DIFFICULTIES[difficulty];
    setState((prev) => ({
      ...prev,
      phase: 'playing',
      difficulty,
      target: randomTarget(config.min, config.max),
      attempts: 0,
      maxAttempts: config.maxAttempts,
      min: config.min,
      max: config.max,
      lastGuess: null,
      hint: `我想了一个 ${config.min} 到 ${config.max} 之间的数字。`,
    }));
  }, []);

  const submitGuess = useCallback((raw: string) => {
    const guess = parseInt(raw, 10);
    if (Number.isNaN(guess)) return { error: '请输入有效数字' };

    setState((prev) => {
      if (prev.phase !== 'playing') return prev;
      if (guess < prev.min || guess > prev.max) {
        return {
          ...prev,
          hint: `请在 ${prev.min} 到 ${prev.max} 之间！`,
        };
      }

      const attempts = prev.attempts + 1;

      if (guess === prev.target) {
        const score =
          prev.score +
          calculateScore(prev.difficulty, attempts, prev.maxAttempts);
        return {
          ...prev,
          phase: 'won',
          attempts,
          lastGuess: guess,
          hint: '🎉 猜对了！',
          score,
          gamesWon: prev.gamesWon + 1,
          gamesPlayed: prev.gamesPlayed + 1,
        };
      }

      if (attempts >= prev.maxAttempts) {
        return {
          ...prev,
          phase: 'lost',
          attempts,
          lastGuess: guess,
          hint: `次数用完了！答案是 ${prev.target}。`,
          gamesPlayed: prev.gamesPlayed + 1,
        };
      }

      const direction = guess < prev.target ? '更大' : '更小';
      const remaining = prev.maxAttempts - attempts;
      return {
        ...prev,
        attempts,
        lastGuess: guess,
        hint: `${direction}！还剩 ${remaining} 次机会。`,
      };
    });

    return { error: null };
  }, []);

  const backToMenu = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'menu', hint: '' }));
  }, []);

  return { state, startGame, submitGuess, backToMenu };
}
