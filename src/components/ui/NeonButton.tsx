import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { PixelText } from './PixelText';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  latin?: boolean;
  fullWidth?: boolean;
}

export function NeonButton({
  label,
  variant = 'primary',
  latin = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        variantStyles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...rest}
    >
      <PixelText
        variant={latin ? 'bodyLatin' : 'bodyCn'}
        tone={
          disabled
            ? 'muted'
            : variant === 'primary'
              ? 'onAccent'
              : 'primary'
        }
      >
        {label}
      </PixelText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: theme.borders.width,
    borderRadius: theme.borders.radius,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  disabled: {
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.backgroundElevated,
    opacity: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: theme.colors.neonGreen,
    borderColor: theme.colors.neonGreen,
  },
  secondary: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.neonGreen,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.borderDim,
  },
});
