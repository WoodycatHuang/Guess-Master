import { AVATAR_EMOJIS } from '@shared/constants/avatars';

interface Props {
  selectedId: number;
  onSelect: (id: number) => void;
}

export function AvatarGrid({ selectedId, onSelect }: Props) {
  return (
    <div className="avatar-grid" role="listbox" aria-label="选择头像">
      {AVATAR_EMOJIS.map((emoji, i) => {
        const id = i + 1;
        const selected = id === selectedId;
        return (
          <button
            key={id}
            type="button"
            role="option"
            aria-selected={selected}
            className={`avatar-cell${selected ? ' avatar-cell--selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
}
