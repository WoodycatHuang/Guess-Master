import { Pressable, StyleSheet, View } from 'react-native';
import { PixelText } from '../ui/PixelText';
import { theme } from '../../theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  /** 与创建按钮并排时使用 */
  compact?: boolean;
}

export function LobbyMemberToggle({ checked, onToggle, compact = false }: Props) {
  return (
    <Pressable
      style={[styles.row, compact && styles.rowCompact]}
      onPress={onToggle}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? (
          <PixelText variant="captionLatin" tone="onAccent">
            X
          </PixelText>
        ) : null}
      </View>
      <PixelText
        variant={compact ? 'captionCn' : 'bodyCn'}
        tone="secondary"
        style={compact && styles.compactLabel}
        numberOfLines={2}
      >
        {compact ? '模拟会员' : '是否为模拟会员'}
      </PixelText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowCompact: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: theme.borders.radius,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.neonGreen,
    backgroundColor: theme.colors.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  boxOn: {
    backgroundColor: theme.colors.neonGreen,
    borderColor: theme.colors.neonGreenDim,
  },
  compactLabel: {
    flex: 1,
    lineHeight: 16,
  },
});
