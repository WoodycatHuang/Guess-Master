import { SafeAreaView, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../theme';

interface Props extends ViewProps {
  children: React.ReactNode;
}

export function ScreenShell({ children, style, ...rest }: Props) {
  return (
    <SafeAreaView style={[styles.shell, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
