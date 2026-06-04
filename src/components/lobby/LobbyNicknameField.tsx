import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { PixelText } from '../ui/PixelText';
import { theme } from '../../theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export function LobbyNicknameField({ value, onChangeText }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.block}>
      <PixelText variant="labelCn" tone="secondary" style={styles.label}>
        你的昵称
      </PixelText>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        placeholder="Enter Your Name"
        placeholderTextColor={theme.colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: theme.spacing.md,
  },
  label: {
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: theme.borders.width,
    borderColor: theme.colors.neonGreen,
    borderRadius: theme.borders.radius,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontFamily: theme.fontFamily.cn,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  inputFocused: {
    borderWidth: 3,
    borderColor: theme.colors.success,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
});
