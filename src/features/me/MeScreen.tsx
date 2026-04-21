import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, Btn, Icon, SectionLabel } from '../../design/components';
import { colors, fonts, radii, spacing } from '../../design/tokens';

interface MeScreenProps {
  email: string | null;
  displayName?: string;
  onSignOut(): Promise<void> | void;
  confirmSignOut?: (onConfirm: () => void) => void;
}

function avatarInitial(name: string | null | undefined, email: string | null) {
  const src = (name ?? email ?? '?').trim();
  return src.charAt(0).toUpperCase() || '?';
}

const defaultConfirm = (onConfirm: () => void) => {
  Alert.alert('Sign out?', "You'll need your email and password to come back.", [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: onConfirm },
  ]);
};

export function MeScreen({
  email,
  displayName,
  onSignOut,
  confirmSignOut = defaultConfirm,
}: MeScreenProps) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const handleSignOut = useCallback(() => {
    confirmSignOut(async () => {
      if (busy) return;
      setBusy(true);
      try {
        await onSignOut();
      } finally {
        setBusy(false);
      }
    });
  }, [busy, confirmSignOut, onSignOut]);

  return (
    <View style={styles.container}>
      <AppBar title="Me" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial(displayName, email)}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName ?? 'Technician'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email ?? 'No email on this session'}
            </Text>
          </View>
        </View>

        <SectionLabel>Activity</SectionLabel>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>
            Full 52-week contribution grid + stat tiles land here once real jobs are logged.
          </Text>
        </View>

        <SectionLabel>Account</SectionLabel>
        <View style={styles.actions}>
          <Btn
            kind="ghost"
            size="lg"
            block
            disabled={busy}
            onPress={handleSignOut}
            testID="me-sign-out"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </Btn>
          <View style={styles.metaRow}>
            <Icon name="info" size={14} color={colors.mute} weight={1.8} />
            <Text style={styles.metaText}>
              Version 1.0.0 · MendLog{'  '}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: '#fff',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.text,
  },
  email: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },
  placeholderCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  placeholderText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.mute,
  },
  actions: {
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.mute,
  },
});
