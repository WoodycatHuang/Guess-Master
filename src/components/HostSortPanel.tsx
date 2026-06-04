import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { getAvatarEmoji } from '../constants/avatars';
import { NeonButton, PixelPanel, PixelText } from './ui';
import { theme } from '../theme';
import { Room } from '../types/room';

interface SortItem {
  key: string;
}

interface Props {
  room: Room;
  sortOrder: string[];
  onMoveSort: (order: string[]) => void;
  onSubmitSort: () => void;
}

export function HostSortPanel({
  room,
  sortOrder,
  onMoveSort,
  onSubmitSort,
}: Props) {
  const data = useMemo(
    () => sortOrder.map((id) => ({ key: id })),
    [sortOrder],
  );

  const renderItem = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<SortItem>) => {
    const user = room.players.find((u) => u.id === item.key);
    if (!user) return null;
    const index = getIndex() ?? 0;

    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          disabled={isActive}
          style={[styles.sortCell, isActive && styles.sortCellActive]}
        >
          <PixelText variant="captionLatin" tone="muted">
            {index + 1}
          </PixelText>
          <Text style={styles.avatar}>{getAvatarEmoji(user.avatarId)}</Text>
          <PixelText
            variant="captionCn"
            tone="secondary"
            numberOfLines={1}
            style={styles.name}
          >
            {user.name}
          </PixelText>
          <PixelText variant="captionLatin" tone="muted" style={styles.dragHint}>
            HOLD
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
        按数字从小到大排列。长按头像拖动到目标位置。
      </PixelText>

      <DraggableFlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.key}
        onDragEnd={({ data: next }) => onMoveSort(next.map((i) => i.key))}
        renderItem={renderItem}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.strip}
        showsHorizontalScrollIndicator={false}
        activationDistance={8}
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
  dragHint: {
    marginTop: theme.spacing.xs + 2,
    letterSpacing: 0.5,
  },
  submitBtn: {
    marginTop: theme.spacing.sm + 4,
  },
});
