import { StyleSheet, View } from 'react-native';
import { PixelText } from '../ui/PixelText';
import { theme } from '../../theme';

export function LobbyLogo() {
  return (
    <View style={styles.wrap}>
      <PixelText variant="displayLatin" tone="primary" style={styles.logo}>
        GUESS MASTER
      </PixelText>
      <PixelText variant="captionLatin" tone="muted" style={styles.tag}>
        // LOBBY
      </PixelText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  logo: {
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: theme.colors.neonGreen,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tag: {
    marginTop: theme.spacing.xs,
    letterSpacing: 2,
  },
});
