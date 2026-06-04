import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { theme } from '../../theme';

interface Props extends TextInputProps {}

export function PixelInput({ style, placeholderTextColor, ...rest }: Props) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor ?? theme.colors.textMuted}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderDim,
    borderRadius: theme.borders.radius,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontFamily: theme.fontFamily.cn,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
});
