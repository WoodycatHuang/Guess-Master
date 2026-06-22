import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvatarEmoji } from '@shared/constants/avatars';
import type { GameActionError } from '@shared/services/sync/RoomSyncService';
import { parseSortSlot, sortSlotBorderColor } from '@shared/services/sync/sortSlots';
import type { Room, User } from '@shared/types/room';
import { Button } from './Button';

const LONG_PRESS_MS = 120;
const DRAG_THRESHOLD = 8;

interface Props {
  room: Room;
  sortOrder: string[];
  onMoveSort: (order: string[]) => Promise<GameActionError | null>;
  onSubmitSort: () => Promise<void>;
  onDragActiveChange?: (active: boolean) => void;
}

function findPlayer(room: Room, userId: string): User | undefined {
  return room.players.find((u) => u.id === userId);
}

function resolvePlayer(room: Room, token: string): User | undefined {
  const userId = room.difficulty === 'hard' ? parseSortSlot(token).userId : token;
  return findPlayer(room, userId);
}

function indexAtPoint(x: number, y: number, refs: (HTMLElement | null)[]): number | null {
  for (let i = 0; i < refs.length; i++) {
    const el = refs[i];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
  }
  return null;
}

export function HostSortPanel({
  room,
  sortOrder,
  onMoveSort,
  onSubmitSort,
  onDragActiveChange,
}: Props) {
  const syncKey = `${room.difficulty ?? 'easy'}|${room.players.map((p) => p.id).join('|')}`;

  const [items, setItems] = useState<string[]>(() => [...sortOrder]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cellRefs = useRef<(HTMLElement | null)[]>([]);
  const pendingRef = useRef<{
    index: number;
    x: number;
    y: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const dragFromRef = useRef<number | null>(null);
  const itemsRef = useRef(items);

  itemsRef.current = items;
  dragFromRef.current = dragFrom;

  useEffect(() => {
    setItems([...sortOrder]);
  }, [syncKey]);

  const clearPending = useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
    }
  }, []);

  const setDragActive = useCallback(
    (active: boolean) => {
      onDragActiveChange?.(active);
    },
    [onDragActiveChange],
  );

  const reorder = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setItems((prev) => {
      if (from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const finishDrag = useCallback(async () => {
    const from = dragFromRef.current;
    setDragFrom(null);
    setGhost(null);
    setDragActive(false);
    dragFromRef.current = null;

    if (from === null) return;

    const order = itemsRef.current;
    const result = await onMoveSort(order);
    if (result) {
      setError(result.message);
      setItems([...sortOrder]);
    }
  }, [onMoveSort, sortOrder, setDragActive]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      const from = dragFromRef.current;

      if (pending && from === null) {
        const dx = e.clientX - pending.x;
        const dy = e.clientY - pending.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          clearPending();
          dragFromRef.current = pending.index;
          setDragFrom(pending.index);
          setGhost({ x: e.clientX, y: e.clientY });
          setDragActive(true);
        }
        return;
      }

      if (from === null) return;

      setGhost({ x: e.clientX, y: e.clientY });
      const hover = indexAtPoint(e.clientX, e.clientY, cellRefs.current);
      if (hover !== null && hover !== dragFromRef.current) {
        reorder(dragFromRef.current, hover);
        dragFromRef.current = hover;
        setDragFrom(hover);
      }
    };

    const onUp = () => {
      clearPending();
      if (dragFromRef.current !== null) {
        void finishDrag();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      clearPending();
    };
  }, [clearPending, finishDrag, reorder, setDragActive]);

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    if (dragFrom !== null) return;
    setError('');
    clearPending();
    pendingRef.current = {
      index,
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        pendingRef.current = null;
        dragFromRef.current = index;
        setDragFrom(index);
        setGhost({ x: e.clientX, y: e.clientY });
        setDragActive(true);
      }, LONG_PRESS_MS),
    };
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await onSubmitSort();
    } finally {
      setSubmitting(false);
    }
  };

  const hint =
    room.difficulty === 'hard'
      ? '按手牌数字从小到大排列。每人两张牌（绿/青边框）都要参与排序。长按头像拖动。'
      : '按手牌数字从小到大，从左到右排列。长按头像拖动。';

  return (
    <div className="sort-panel">
      <h3 className="sort-panel__title">排序区</h3>
      <p className="sort-panel__hint">{hint}</p>

      {error ? <p className="toast-error">{error}</p> : null}

      <div className="sort-strip" style={{ touchAction: dragFrom !== null ? 'none' : 'auto' }}>
        {items.map((token, index) => {
          const user = resolvePlayer(room, token);
          if (!user) return null;

          const borderColor =
            room.difficulty === 'hard'
              ? sortSlotBorderColor(parseSortSlot(token).cardIndex)
              : undefined;

          const isDragging = dragFrom === index;

          return (
            <div
              key={`${token}-${index}`}
              ref={(el) => {
                cellRefs.current[index] = el;
              }}
              className={`sort-cell${isDragging ? ' sort-cell--placeholder' : ''}`}
              style={borderColor ? { borderColor } : undefined}
              onPointerDown={(e) => handlePointerDown(index, e)}
            >
              <span className="sort-cell__emoji">{getAvatarEmoji(user.avatarId)}</span>
              <span className="sort-cell__name">{user.name}</span>
            </div>
          );
        })}
      </div>

      {ghost !== null && dragFrom !== null && (() => {
        const token = items[dragFrom];
        const user = token ? resolvePlayer(room, token) : undefined;
        if (!user) return null;
        const borderColor =
          room.difficulty === 'hard' && token
            ? sortSlotBorderColor(parseSortSlot(token).cardIndex)
            : undefined;
        return (
          <div
            className="sort-cell sort-cell--ghost"
            style={{
              left: ghost.x,
              top: ghost.y,
              ...(borderColor ? { borderColor } : {}),
            }}
          >
            <span className="sort-cell__emoji">{getAvatarEmoji(user.avatarId)}</span>
            <span className="sort-cell__name">{user.name}</span>
          </div>
        );
      })()}

      <Button
        className="btn--block"
        variant="primary"
        disabled={submitting || dragFrom !== null}
        onClick={() => void handleSubmit()}
      >
        {submitting ? '提交中…' : '排序完成，准备开车'}
      </Button>
    </div>
  );
}
