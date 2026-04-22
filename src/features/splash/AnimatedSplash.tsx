import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '../../design/tokens';
import { useTheme } from '../theme/ThemeProvider';

// The icon must match the native-splash size exactly so the cross-fade between
// native splash and this overlay is invisible. Native splash config lives in
// app.json → expo-splash-screen.imageWidth (180).
const ICON_SIZE = 180;

const YELLOW = '#F5B800';
const NAVY_LIGHT = '#1E3A5F';
const NAVY_DARK = '#15293F';

const HOLD_MS = 520;
const EXIT_MS = 340;

interface AnimatedSplashProps {
  onFinish(): void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const { scheme } = useTheme();
  const bg = scheme === 'dark' ? NAVY_DARK : NAVY_LIGHT;

  const iconScale = useSharedValue(1);
  const wordOpacity = useSharedValue(0);
  const wordY = useSharedValue(14);
  const tagOpacity = useSharedValue(0);
  const rootOpacity = useSharedValue(1);

  useEffect(() => {
    // Subtle breathe on the icon — gives the handoff life without a jump.
    iconScale.value = withSequence(
      withTiming(1.04, { duration: 520, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 380, easing: Easing.inOut(Easing.cubic) }),
    );

    wordOpacity.value = withDelay(
      240,
      withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) }),
    );
    wordY.value = withDelay(
      240,
      withTiming(0, { duration: 440, easing: Easing.out(Easing.cubic) }),
    );

    tagOpacity.value = withDelay(
      520,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );

    rootOpacity.value = withDelay(
      240 + 380 + HOLD_MS,
      withTiming(0, { duration: EXIT_MS, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }),
    );
  }, [iconScale, wordOpacity, wordY, tagOpacity, rootOpacity, onFinish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordOpacity.value,
    transform: [{ translateY: wordY.value }],
  }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: bg }, rootStyle]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Image
          source={require('../../../assets/images/splash-icon.png')}
          style={styles.icon}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.wordmarkWrap, wordStyle]}>
        <Text style={styles.wordmark}>
          Mend<Text style={styles.wordmarkAccent}>Log</Text>
        </Text>
      </Animated.View>

      <Animated.View style={[styles.taglineWrap, tagStyle]}>
        <Text style={styles.tagline}>Field journal for fixers</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  wordmarkWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: ICON_SIZE / 2 + 28,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 38,
    color: '#ffffff',
    letterSpacing: -1.2,
  },
  wordmarkAccent: {
    color: YELLOW,
  },
  taglineWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: ICON_SIZE / 2 + 80,
    alignItems: 'center',
  },
  tagline: {
    fontFamily: fonts.sansMedium,
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
