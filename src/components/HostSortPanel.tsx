import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { getAvatarEmoji } from '../constants/avatars';
import { GameActionError } from '../services/sync/RoomSyncService';
import { NeonButton, PixelPanel, PixelText } from './ui';
import { theme } from '../theme';
import { Room } from '../types/room';

interface SortItem {
  key: string;
}

interface Props {
  room: Room;
  sortOrder: string[];
  onMoveSort: (order: string[]) => Promise<GameActionError | null>;
  onSubmitSort: () => void;
  onDragActiveChange?: (active: boolean) => void;
}

function toItems(order: string[]): SortItem[] {
  return order.map((id) => ({ key: id }));
}

export function HostSortPanel({
  room,
  sortOrder,
  onMoveSort,
  onSubmitSort,
  onDragActiveChange,
}: Props) {
  /** 只在开局/玩家变更时从服务端初始化，拖动期间不再被 props 覆盖 */
  const playersKey = room.players.map((p) => p.id).join('|');

  const [items, setItems] = useState<SortItem[]>(() => toItems(sortOrder));

  useEffect(() => {
    setItems(toItems(sortOrder));
  }, [playersKey]);

  const handleDragBegin = () => {
    onDragActiveChange?.(true);
  };

  const handleDragEnd = async ({ data: next }: { data: SortItem[] }) => {
    onDragActiveChange?.(false);

    const order = next.map((i) => i.key);
    setItems(next);

    const result = await onMoveSort(order);
    if (result) {
      setItems(toItems(sortOrder));
    }
  };

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<SortItem>) => {
    const user = room.players.find((u) => u.id === item.key);
    if (!user) return null;

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          disabled={isActive}
          style={[styles.sortCell, isActive && styles.sortCellActive]}
        >
          <Text style={styles.avatar}>{getAvatarEmoji(user.avatarId)}</Text>
          <PixelText
            variant="captionCn"
            tone="secondary"
            numberOfLines={1}
            style={styles.name}
          >
            {user.name}
          </PixelText>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <PixelPanel style={styles.panel}>
      <PixelText variant="titleCn" tone="primary">
        排序区
      </PixelText>
      <PixelText variant="captionCn" tone="muted" style={styles.hint}>
        按手牌数字从小到大，从左到右排列。长按头像拖动。
      </PixelText>

      <DraggableFlatList
        horizontal
        data={items}
        extraData={items.map((i) => i.key).join('|')}
        keyExtractor={(item) => item.key}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        renderItem={renderItem}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.strip}
        showsHorizontalScrollIndicator={false}
        activationDistance={10}
        autoscrollThreshold={80}
        dragItemOverflow
        removeClippedSubviews={false}
      />

      <NeonButton
        label="排序完成，准备开车"
        variant="primary"
        onPress={onSubmitSort}
        style={styles.submitBtn}
      />
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.borderDim,
  },
  hint: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm + 4,
    lineHeight: 18,
  },
  listContainer: {
    flexGrow: 0,
  },
  strip: {
    gap: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  sortCell: {
    width: 88,
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borders.radius,
    padding: theme.spacing.sm + 2,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderMuted,
  },
  sortCellActive: {
    backgroundColor: theme.colors.overlay,
    borderColor: theme.colors.neonGreen,
  },
  avatar: {
    fontSize: 32,
    marginVertical: theme.spacing.xs,
  },
  name: {
    maxWidth: 80,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: theme.spacing.sm + 4,
  },
});
