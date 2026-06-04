export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase = 'menu' | 'playing' | 'won' | 'lost';

export interface DifficultyConfig {
  label: string;
  min: number;
  max: number;
  maxAttempts: number;
  emoji: string;
}

export interface GameState {
  phase: GamePhase;
  difficulty: Difficulty;
  target: number;
  attempts: number;
  maxAttempts: number;
  min: number;
  max: number;
  lastGuess: number | null;
  hint: string;
  score: number;
  gamesWon: number;
  gamesPlayed: number;
}
