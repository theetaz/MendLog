import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, Btn, Icon, SectionLabel } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import type { JobsRepository } from '../../repositories/JobsRepository';
import { formatIdle } from '../../utils/idle';
import { useTheme, type ThemeMode } from '../theme/ThemeProvider';
import { useProfileData } from './useProfileData';

interface MeScreenProps {
  email: string | null;
  displayName?: string;
  memberSince?: string;
  repo?: JobsRepository | null;
  onSignOut(): Promise<void> | void;
  onOpenJobs?(): void;
  onUpdateDisplayName?(name: string): Promise<void>;
  confirmSignOut?: (onConfirm: () => void) => void;
}

function avatarInitial(name: string | null | undefined, email: string | null) {
  const src = (name ?? email ?? '?').trim();
  return src.charAt(0).toUpperCase() || '?';
}

function formatMemberSince(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
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
  memberSince,
  repo,
  onSignOut,
  onOpenJobs,
  onUpdateDisplayName,
  confirmSignOut = defaultConfirm,
}: MeScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(displayName ?? '');
  const [savingName, setSavingName] = useState(false);
  const data = useProfileData(repo ?? null);
  const { mode, setMode } = useTheme();

  useEffect(() => {
    if (!editingName) setNameDraft(displayName ?? '');
  }, [displayName, editingName]);

  const startEditName = useCallback(() => {
    setNameDraft(displayName ?? '');
    setEditingName(true);
  }, [displayName]);

  const cancelEditName = useCallback(() => {
    setEditingName(false);
    setNameDraft(displayName ?? '');
  }, [displayName]);

  const saveEditName = useCallback(async () => {
    if (!onUpdateDisplayName || savingName) return;
    const next = nameDraft.trim();
    if (!next) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    if (next === (displayName ?? '').trim()) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await onUpdateDisplayName(next);
      setEditingName(false);
    } catch (e) {
      Alert.alert(
        'Could not update name',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setSavingName(false);
    }
  }, [displayName, nameDraft, onUpdateDisplayName, savingName]);

  useFocusEffect(
    useCallback(() => {
      if (repo) data.reload();
    }, [data.reload, repo]),
  );

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

  const handleRefresh = useCallback(async () => {
    if (!repo) return;
    setRefreshing(true);
    data.reload();
    setTimeout(() => setRefreshing(false), 350);
  }, [data, repo]);

  const memberSinceLabel = formatMemberSince(memberSince);
  const hasJobs = data.jobs.length > 0;

  return (
    <View style={styles.container}>
      <AppBar title="Me" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          repo ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.navy}
            />
          ) : undefined
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial(displayName, email)}</Text>
          </View>
          <View style={styles.profileText}>
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  style={styles.nameInput}
                  autoFocus
                  maxLength={60}
                  placeholder="Your name"
                  placeholderTextColor={colors.mute}
                  editable={!savingName}
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={saveEditName}
                  testID="me-name-input"
                />
                <Pressable
                  onPress={cancelEditName}
                  disabled={savingName}
                  hitSlop={8}
                  style={styles.nameIconBtn}
                  testID="me-name-cancel"
                >
                  <Icon name="x" size={18} color={colors.mute} weight={2} />
                </Pressable>
                <Pressable
                  onPress={saveEditName}
                  disabled={savingName}
                  hitSlop={8}
                  style={styles.nameIconBtn}
                  testID="me-name-save"
                >
                  {savingName ? (
                    <ActivityIndicator size="small" color={colors.navy} />
                  ) : (
                    <Icon name="check" size={18} color={colors.navy} weight={2} />
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {displayName ?? 'Technician'}
                </Text>
                {onUpdateDisplayName && (
                  <Pressable
                    onPress={startEditName}
                    hitSlop={8}
                    style={styles.nameIconBtn}
                    testID="me-edit-name"
                  >
                    <Icon name="edit" size={16} color={colors.mute} weight={1.8} />
                  </Pressable>
                )}
              </View>
            )}
            <Text style={styles.email} numberOfLines={1}>
              {email ?? 'No email on this session'}
            </Text>
            {memberSinceLabel && (
              <Text style={styles.memberSince}>Member since {memberSinceLabel}</Text>
            )}
          </View>
        </View>

        {repo && (
          <>
            <SectionLabel>
              {data.loading
                ? 'Activity · loading…'
                : `Activity · ${data.stats.totalJobs} ${
                    data.stats.totalJobs === 1 ? 'job' : 'jobs'
                  } in the last year`}
            </SectionLabel>

            {data.loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={colors.navy} />
              </View>
            ) : data.error ? (
              <View style={styles.errorCard}>
                <Icon name="warning" size={14} color={colors.red} weight={2} />
                <Text style={styles.errorText}>{data.error.message}</Text>
              </View>
            ) : (
              <>
                {hasJobs && (
                  <View style={styles.streakRow}>
                    <Icon name="flash" size={14} color={colors.amber} weight={2} />
                    <Text style={styles.streakText}>
                      Longest streak · {data.streaks.longestStreak}{' '}
                      {data.streaks.longestStreak === 1 ? 'day' : 'days'}
                      {'  ·  '}
                      Current · {data.streaks.currentStreak}{' '}
                      {data.streaks.currentStreak === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                )}

                <SectionLabel>Stats</SectionLabel>
                <View style={styles.statGrid}>
                  <StatTile
                    label="Total jobs"
                    value={String(data.stats.totalJobs)}
                    styles={styles}
                  />
                  <StatTile
                    label="Avg idle"
                    value={
                      data.stats.avgIdleMinutes > 0
                        ? formatIdle(data.stats.avgIdleMinutes)
                        : '—'
                    }
                    styles={styles}
                  />
                  <StatTile
                    label="Top machine"
                    value={data.stats.topMachine?.name ?? '—'}
                    sub={
                      data.stats.topMachine
                        ? `${data.stats.topMachine.count} ${
                            data.stats.topMachine.count === 1 ? 'job' : 'jobs'
                          }`
                        : undefined
                    }
                    styles={styles}
                  />
                  <StatTile
                    label="Top department"
                    value={data.stats.topDept?.name ?? '—'}
                    sub={
                      data.stats.topDept
                        ? `${data.stats.topDept.count} ${
                            data.stats.topDept.count === 1 ? 'job' : 'jobs'
                          }`
                        : undefined
                    }
                    styles={styles}
                  />
                </View>

                {onOpenJobs && (
                  <Pressable
                    onPress={onOpenJobs}
                    style={({ pressed }) => [
                      styles.openCalendarBtn,
                      pressed && styles.pressed,
                    ]}
                    testID="me-open-jobs"
                  >
                    <Icon name="calendar" size={16} color={colors.navy} weight={2} />
                    <Text style={styles.openCalendarText}>Open jobs calendar</Text>
                  </Pressable>
                )}
              </>
            )}
          </>
        )}

        <SectionLabel>Appearance</SectionLabel>
        <View style={styles.segmentedWrap}>
          <ThemeSegment label="System" active={mode === 'system'} onPress={() => setMode('system')} styles={styles} />
          <ThemeSegment label="Light" active={mode === 'light'} onPress={() => setMode('light')} styles={styles} />
          <ThemeSegment label="Dark" active={mode === 'dark'} onPress={() => setMode('dark')} styles={styles} />
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
            <Text style={styles.metaText}>Version 1.0.0 · MendLog</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({
  label,
  value,
  sub,
  styles,
}: {
  label: string;
  value: string;
  sub?: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

function ThemeSegment({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress(): void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        active && styles.segmentActive,
        pressed && styles.pressed,
      ]}
      testID={`me-theme-${label.toLowerCase()}`}
    >
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: spacing.xl, gap: spacing.sm },
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      padding: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
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
    profileText: { flex: 1, minWidth: 0, gap: 2 },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    nameEditRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    nameInput: {
      flex: 1,
      fontFamily: fonts.sansSemiBold,
      fontSize: 18,
      letterSpacing: -0.4,
      color: colors.text,
      paddingVertical: 2,
      paddingHorizontal: 0,
      margin: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.navy,
    },
    nameIconBtn: {
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      flex: 1,
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
    memberSince: {
      fontFamily: fonts.sans,
      fontSize: 11.5,
      color: colors.mute,
      marginTop: 2,
    },
    loadingCard: {
      padding: spacing.lg,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.lineSoft,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.red,
      backgroundColor: colors.redSoft,
    },
    errorText: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 13,
      color: colors.red,
    },
    streakRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    streakText: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muteDeep,
    },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    statTile: {
      width: '48.5%',
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      gap: 4,
    },
    statLabel: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 10.5,
      color: colors.muteDeep,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    statValue: {
      fontFamily: fonts.sansBold,
      fontSize: 18,
      letterSpacing: -0.4,
      color: colors.text,
    },
    statSub: {
      fontFamily: fonts.sans,
      fontSize: 11.5,
      color: colors.mute,
    },
    openCalendarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      marginTop: spacing.xs,
    },
    pressed: { opacity: 0.85 },
    openCalendarText: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13,
      color: colors.navy,
      letterSpacing: 0.3,
    },

    segmentedWrap: {
      flexDirection: 'row',
      gap: 0,
      padding: 3,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignSelf: 'flex-start',
    },
    segment: {
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      borderRadius: radii.pill,
    },
    segmentActive: { backgroundColor: colors.navy },
    segmentLabel: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 12,
      color: colors.navy,
      letterSpacing: 0.3,
    },
    segmentLabelActive: { color: '#fff' },

    actions: { gap: spacing.md },
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
