import { getAvatarEmoji } from '@shared/constants/avatars';
import { parseSortSlot, sortSlotBorderColor } from '@shared/services/sync/sortSlots';
import type { Room, User } from '@shared/types/room';

interface Props {
  room: Room;
  sortOrder: string[];
}

function resolvePlayer(room: Room, token: string): User | undefined {
  const userId = room.difficulty === 'hard' ? parseSortSlot(token).userId : token;
  return room.players.find((u) => u.id === userId);
}

export function SortWatchPanel({ room, sortOrder }: Props) {
  return (
    <div className="sort-panel sort-panel--readonly">
      <h3 className="sort-panel__title">当前排序</h3>
      <p className="sort-panel__hint">房主拖动时，这里会实时同步更新</p>
      <div className="sort-strip">
        {sortOrder.map((token, index) => {
          const user = resolvePlayer(room, token);
          if (!user) return null;
          const borderColor =
            room.difficulty === 'hard'
              ? sortSlotBorderColor(parseSortSlot(token).cardIndex)
              : undefined;
          return (
            <div
              key={`${token}-${index}`}
              className="sort-cell sort-cell--readonly"
              style={borderColor ? { borderColor } : undefined}
            >
              <span className="sort-cell__emoji">{getAvatarEmoji(user.avatarId)}</span>
              <span className="sort-cell__name">{user.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
