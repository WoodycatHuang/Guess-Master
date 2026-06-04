import { StyleSheet, View, ViewStyle } from 'react-native';
import { PixelPanel, PixelText } from './ui';
import { theme } from '../theme';

interface Props {
  title: string;
  lowLabel: string;
  highLabel: string;
  style?: ViewStyle;
}

export function TopicCard({ title, lowLabel, highLabel, style }: Props) {
  return (
    <PixelPanel style={[styles.box, style]}>
      <PixelText variant="captionLatin" tone="muted" style={styles.label}>
        TOPIC // 本轮题目
      </PixelText>

      <View style={styles.titleWrap}>
        <PixelText variant="bodyCn" tone="primary" style={styles.title}>
          {title}
        </PixelText>
      </View>

      <View style={styles.scaleRow}>
        <PixelText variant="captionCn" tone="secondary">
          {lowLabel}
        </PixelText>
        <PixelText variant="captionCn" tone="secondary">
          {highLabel}
        </PixelText>
      </View>
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  box: {
    borderColor: theme.colors.borderDim,
    minHeight: 120,
    paddingBottom: theme.spacing.sm + 4,
  },
  label: {
    alignSelf: 'flex-start',
  },
  titleWrap: {
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    textAlign: 'center',
    lineHeight: 26,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
});
