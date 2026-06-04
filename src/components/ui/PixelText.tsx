import { ReactNode } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { theme } from '../../theme';

type Variant =
  | 'displayLatin'
  | 'titleLatin'
  | 'bodyLatin'
  | 'captionLatin'
  | 'titleCn'
  | 'bodyCn'
  | 'labelCn'
  | 'captionCn';

type Tone = 'primary' | 'secondary' | 'muted' | 'success' | 'fail' | 'onAccent';

interface Props extends TextProps {
  variant?: Variant;
  tone?: Tone;
  children: ReactNode;
}

const toneColors: Record<Tone, string> = {
  primary: theme.colors.textPrimary,
  secondary: theme.colors.textSecondary,
  muted: theme.colors.textMuted,
  success: theme.colors.success,
  fail: theme.colors.fail,
  onAccent: theme.colors.textOnAccent,
};

export function PixelText({
  variant = 'bodyCn',
  tone = 'primary',
  style,
  children,
  ...rest
}: Props) {
  return (
    <Text
      style={[
        theme.textVariants[variant],
        styles.base,
        { color: toneColors[tone] },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
