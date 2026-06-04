import { Difficulty, DifficultyConfig } from '../types/game';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { label: '简单', min: 1, max: 50, maxAttempts: 8, emoji: '🌱' },
  medium: { label: '中等', min: 1, max: 100, maxAttempts: 10, emoji: '🔥' },
  hard: { label: '困难', min: 1, max: 500, maxAttempts: 12, emoji: '💎' },
};

export function calculateScore(
  difficulty: Difficulty,
  attemptsUsed: number,
  maxAttempts: number,
): number {
  const base = { easy: 100, medium: 250, hard: 500 }[difficulty];
  const remaining = maxAttempts - attemptsUsed + 1;
  return Math.round(base * (remaining / maxAttempts));
}

export function randomTarget(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
