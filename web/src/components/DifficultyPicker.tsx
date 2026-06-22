import type { GameDifficulty } from '@shared/types/room';
import { canStartHardMode } from '@shared/constants/game';
import { Button } from './Button';

interface Props {
  open: boolean;
  playerCount: number;
  onSelect: (d: GameDifficulty) => void;
  onClose: () => void;
}

export function DifficultyPicker({ open, playerCount, onSelect, onClose }: Props) {
  if (!open) return null;

  const hardOk = canStartHardMode(playerCount);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="diff-title">
      <div className="modal panel">
        <h2 id="diff-title" className="modal-title">
          选择难度
        </h2>
        <p className="hint" style={{ marginBottom: 16 }}>
          简单：每人 1 张牌 · 困难：每人 2 张牌（最多 5 人）
        </p>
        <Button className="btn--block" onClick={() => onSelect('easy')}>
          简单模式
        </Button>
        <Button
          className="btn--block"
          variant="secondary"
          disabled={!hardOk}
          onClick={() => onSelect('hard')}
          style={{ marginTop: 8 }}
        >
          困难模式{hardOk ? '' : '（需 ≤5 人）'}
        </Button>
        <button type="button" className="link-btn" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  );
}
