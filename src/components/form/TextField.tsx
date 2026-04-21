import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radii, spacing } from '../../design/tokens';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
}

export function TextField({ label, required, error, hint, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        placeholderTextColor={colors.mute}
        {...rest}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muteDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  required: { color: colors.red },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  inputError: { borderColor: colors.red },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
  hintText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
  },
});
