import { StyleSheet, View, ViewProps } from 'react-native';
import { theme } from '../../theme';

interface Props extends ViewProps {
  children: React.ReactNode;
}

export function PixelPanel({ children, style, ...rest }: Props) {
  return (
    <View style={[styles.panel, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: theme.colors.backgroundElevated,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.borderDim,
    borderRadius: theme.borders.radius,
    padding: theme.spacing.md,
  },
});
