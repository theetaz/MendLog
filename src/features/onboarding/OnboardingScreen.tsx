import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Btn, Icon } from '../../design/components';
import { colors, fonts, radii, spacing } from '../../design/tokens';
import type { PermissionOutcome, PermissionRequester } from './permissionRequesters';
import { defaultRequester } from './permissionRequesters';
import { PERMISSION_SLIDES, type PermissionSlide } from './permissionSlides';

interface OnboardingScreenProps {
  onComplete(results: Record<string, PermissionOutcome>): void;
  request?: PermissionRequester;
}

export function OnboardingScreen({ onComplete, request = defaultRequester }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<PermissionSlide>>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Record<string, PermissionOutcome>>({});

  const slides = PERMISSION_SLIDES;
  const current = slides[index];
  const isLast = index === slides.length - 1;

  const recordAndAdvance = useCallback(
    (outcome: PermissionOutcome) => {
      const next = { ...results, [current.key]: outcome };
      setResults(next);
      if (isLast) {
        onComplete(next);
        return;
      }
      const nextIndex = index + 1;
      setIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    },
    [results, current.key, isLast, onComplete, index],
  );

  const handleGrant = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await request(current.key);
      recordAndAdvance(outcome);
    } finally {
      setBusy(false);
    }
  }, [busy, current.key, request, recordAndAdvance]);

  const handleSkip = useCallback(() => {
    recordAndAdvance('skipped');
  }, [recordAndAdvance]);

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<PermissionSlide>) => (
      <View style={[styles.slide, { width }]} testID={`onboarding-slide-${item.key}`}>
        <View style={styles.iconWrap}>
          <Icon name={item.icon} size={48} color={colors.yellow} weight={1.8} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <View style={styles.rationaleWrap}>
          <Text style={styles.rationale}>{item.rationale}</Text>
        </View>
      </View>
    ),
    [width],
  );

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>MendLog</Text>
        <View style={styles.progress} accessibilityLabel={`Step ${index + 1} of ${slides.length}`}>
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[styles.progressDot, i <= index && styles.progressDotActive]}
            />
          ))}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={1}
        windowSize={2}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      <View style={styles.footer}>
        <Btn
          kind="primary"
          size="lg"
          block
          disabled={busy}
          onPress={handleGrant}
          testID="onboarding-grant"
        >
          {busy ? 'Requesting…' : isLast ? 'Allow & finish' : 'Allow'}
        </Btn>
        {current.canSkip ? (
          <Pressable onPress={handleSkip} disabled={busy} style={styles.skipBtn} testID="onboarding-skip">
            <Text style={styles.skipText}>Not now</Text>
          </Pressable>
        ) : (
          <View style={styles.footerHint}>
            <Text style={styles.footerHintText}>
              Required — MendLog is voice-first. You can change this in Settings later.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.yellow,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2A2A2A',
  },
  progressDotActive: {
    backgroundColor: colors.yellow,
  },
  slide: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl * 2,
    gap: spacing.lg,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: radii.xl,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: '#F3F2EE',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15.5,
    lineHeight: 23,
    color: '#BEBBB0',
  },
  rationaleWrap: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: '#1A1A1A',
    alignSelf: 'flex-start',
  },
  rationale: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.1,
    color: colors.yellow,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  skipBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: '#8A8679',
  },
  footerHint: {
    alignSelf: 'center',
    maxWidth: 320,
  },
  footerHintText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: '#8A8679',
  },
});
