import { useCallback, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn, Icon } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';

interface LoginScreenProps {
  onSubmit(email: string, password: string): Promise<{ error?: string }>;
  testID?: string;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginScreen({ onSubmit, testID }: LoginScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const emailOk = isValidEmail(email);
  const canSubmit = emailOk && password.length > 0 && !submitting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(email, password);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, email, password, onSubmit]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID={testID}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.brandMark}>
              <Icon name="wrench" size={28} color={colors.ink} weight={1.9} />
            </View>
            <Text style={styles.brandName}>MendLog</Text>
            <Text style={styles.brandTag}>Voice-first repair journal</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              First time? Your admin invited you — use the email they set up.
            </Text>

            {error ? (
              <View style={styles.errorBanner} testID="login-error">
                <Icon name="warning" size={16} color={colors.red} weight={2} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Field label="Email" styles={styles}>
              <TextInput
                testID="login-email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="you@factory.lk"
                placeholderTextColor={colors.mute}
                style={styles.input}
              />
            </Field>

            <Field label="Password" styles={styles}>
              <View style={styles.passwordRow}>
                <TextInput
                  ref={passwordRef}
                  testID="login-password"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  placeholder="Your password"
                  placeholderTextColor={colors.mute}
                  style={[styles.input, styles.passwordInput]}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  testID="login-toggle-password"
                >
                  <Icon name="eye" size={18} color={colors.muteDeep} weight={1.8} />
                </Pressable>
              </View>
            </Field>

            <Btn
              kind="primary"
              size="lg"
              block
              disabled={!canSubmit}
              onPress={handleSubmit}
              testID="login-submit"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Btn>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Having trouble? Ask your team leader — accounts are provisioned by admin.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  styles,
}: {
  label: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xxl,
  },
  header: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: spacing.xs,
  },
  brandTag: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },
  form: {
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    letterSpacing: -0.8,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muteDeep,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
    borderRadius: radii.md,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.red,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.muteDeep,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    height: 52,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.mute,
    textAlign: 'center',
  },
});
