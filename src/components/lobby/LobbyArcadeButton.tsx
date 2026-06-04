import { Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';
import { PixelText } from '../ui/PixelText';
import { theme } from '../../theme';

type Variant = 'primary' | 'secondary';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  subtitle?: string;
  variant?: Variant;
  fullWidth?: boolean;
  /** 更扁的样式，用于大厅创建房间按钮 */
  flat?: boolean;
}

export function LobbyArcadeButton({
  label,
  subtitle,
  variant = 'primary',
  fullWidth = true,
  flat = false,
  disabled,
  style,
  ...rest
}: Props) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => {
        const inverted = pressed && !disabled;
        return [
          styles.base,
          flat && styles.flat,
          fullWidth && styles.fullWidth,
          variant === 'primary' ? styles.primary : styles.secondary,
          inverted && variant === 'primary' && styles.primaryPressed,
          inverted && variant === 'secondary' && styles.secondaryPressed,
          disabled && styles.disabled,
          style as ViewStyle,
        ];
      }}
      {...rest}
    >
      {({ pressed }) => {
        const inverted = pressed && !disabled;
        const mainTone =
          disabled
            ? 'muted'
            : inverted
              ? variant === 'primary'
                ? 'primary'
                : 'onAccent'
              : variant === 'primary'
                ? 'onAccent'
                : 'primary';
        return (
          <View style={styles.inner}>
            <PixelText variant="bodyCn" tone={mainTone} style={styles.labelText}>
              {label}
            </PixelText>
            {subtitle ? (
              <PixelText
                variant="captionLatin"
                tone={disabled ? 'muted' : inverted ? 'onAccent' : 'secondary'}
                style={[styles.subtitle, flat && styles.subtitleFlat]}
              >
                {subtitle}
              </PixelText>
            ) : null}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: theme.borders.width,
    borderRadius: theme.borders.radius,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  flat: {
    minHeight: 40,
    paddingVertical: theme.spacing.xs + 2,
  },
  fullWidth: {
    width: '100%',
  },
  inner: {
    alignItems: 'center',
  },
  labelText: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    letterSpacing: 1,
  },
  subtitleFlat: {
    marginTop: 2,
  },
  primary: {
    backgroundColor: theme.colors.neonGreen,
    borderColor: theme.colors.neonGreen,
  },
  primaryPressed: {
    backgroundColor: theme.colors.backgroundInput,
    borderColor: theme.colors.neonGreen,
    transform: [{ translateY: 2 }],
  },
  secondary: {
    backgroundColor: theme.colors.backgroundInput,
    borderColor: theme.colors.neonGreen,
  },
  secondaryPressed: {
    backgroundColor: theme.colors.neonGreen,
    borderColor: theme.colors.neonGreen,
    transform: [{ translateY: 2 }],
  },
  disabled: {
    borderColor: theme.colors.borderMuted,
    backgroundColor: theme.colors.backgroundElevated,
    opacity: 0.45,
  },
});
