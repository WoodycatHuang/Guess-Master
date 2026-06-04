import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { getAvatarEmoji } from '../constants/avatars';
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
          <Text style={styles.index}>{index + 1}</Text>
          <Text style={styles.avatar}>{getAvatarEmoji(user.avatarId)}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.dragHint}>长按拖动</Text>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>排序区</Text>
      <Text style={styles.hint}>
        按数字从小到大排列。长按头像拖动到目标位置。
      </Text>

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

      <Pressable style={styles.submitBtn} onPress={onSubmitSort}>
        <Text style={styles.submitText}>排序完成，准备开车</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
    marginBottom: 12,
  },
  listContainer: {
    flexGrow: 0,
  },
  strip: {
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sortCell: {
    width: 88,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortCellActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  index: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  avatar: {
    fontSize: 36,
    marginVertical: 4,
  },
  name: {
    fontSize: 11,
    color: '#4b5563',
    maxWidth: 80,
    textAlign: 'center',
  },
  dragHint: {
    fontSize: 10,
    color: '#a5b4fc',
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
