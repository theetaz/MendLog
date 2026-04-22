import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import { fonts } from '../../design/tokens';

const NAVY = '#1E3A5F';
const NAVY_DEEP = '#15293F';
const NAVY_LIGHT = '#2B4C74';
const YELLOW = '#F5B800';
const INK = '#0E0E0E';

const DURATION_MS = 3400;
const PATH_LEN = 3400;
const HOLD_MS = 450;
const FADE_MS = 400;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const easeInOut = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

interface AnimatedSplashProps {
  onFinish(): void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const [t, setT] = useState(0);
  const [fading, setFading] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start.current;
      const next = Math.min(1, elapsed / DURATION_MS);
      setT(next);
      if (next < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          if (cancelled) return;
          setFading(true);
          setTimeout(() => {
            if (!cancelled) onFinish();
          }, FADE_MS);
        }, HOLD_MS);
      }
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [onFinish]);

  const plate = clamp((t - 0) / 0.1);
  const draw = clamp((t - 0.08) / 0.45);
  const rot = easeInOut(clamp((t - 0.38) / 0.22)) * 10;
  const word = clamp((t - 0.55) / 0.22);
  const tag = clamp((t - 0.78) / 0.14);
  const stripes = clamp((t - 0.8) / 0.15);

  const plateScale = 0.92 + plate * 0.08;
  const dashOffset = PATH_LEN * (1 - draw);

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.root,
        { opacity: fading ? 0 : 1 },
      ]}
      pointerEvents={fading ? 'none' : 'auto'}
    >
      <View style={styles.vignette} />

      <View
        style={[
          styles.markWrap,
          {
            opacity: plate,
            transform: [{ scale: plateScale }],
          },
        ]}
      >
        <Svg viewBox="0 0 1024 1024" width={220} height={220}>
          <Defs>
            <LinearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={NAVY_LIGHT} />
              <Stop offset="1" stopColor={NAVY_DEEP} />
            </LinearGradient>
            <LinearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#ffffff" stopOpacity={0.12} />
              <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={1024} height={1024} rx={232} fill="url(#plate)" />
          <Rect x={0} y={0} width={1024} height={1024} rx={232} fill="url(#sheen)" />
          <Rect
            x={8}
            y={8}
            width={1008}
            height={1008}
            rx={224}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={0.06}
            strokeWidth={2}
          />
          <Path
            d="M 300 280 L 300 380 L 390 470 L 470 470 L 470 390 L 380 300 L 280 300 Z"
            fill="none"
            stroke={YELLOW}
            strokeWidth={72}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={PATH_LEN}
            strokeDashoffset={dashOffset}
            transform={`rotate(${rot} 512 512)`}
          />
          <Path
            d="M 450 490 L 600 640 L 760 440"
            fill="none"
            stroke={YELLOW}
            strokeWidth={72}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={PATH_LEN}
            strokeDashoffset={dashOffset}
            transform={`rotate(${rot} 512 512)`}
          />
          <Circle cx={378} cy={378} r={18} fill={YELLOW} opacity={draw} />
        </Svg>
      </View>

      <View
        style={[
          styles.wordmarkWrap,
          {
            opacity: word,
            transform: [{ translateY: (1 - word) * 8 }],
          },
        ]}
      >
        <Text style={styles.wordmark}>
          Mend<Text style={styles.wordmarkAccent}>Log</Text>
        </Text>
      </View>

      <View style={[styles.taglineWrap, { opacity: tag }]}>
        <Text style={styles.tagline}>Field journal for fixers</Text>
      </View>

      <View style={[styles.footerWrap, { opacity: tag * 0.7 }]}>
        <Text style={styles.footer}>v1.0 · kramski ops</Text>
      </View>

      <HazardStripes opacity={stripes} />
    </View>
  );
}

function HazardStripes({ opacity }: { opacity: number }) {
  // Diagonal stripes along the bottom edge. Keep it thin (10px) so it reads as industrial trim.
  const STRIPE = 14;
  const COUNT = 48;
  return (
    <View style={[styles.stripes, { opacity }]}>
      <View style={styles.stripesInner}>
        {Array.from({ length: COUNT }).map((_, i) => (
          <View
            key={i}
            style={{
              width: STRIPE,
              height: '100%',
              backgroundColor: i % 2 === 0 ? YELLOW : INK,
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NAVY_DEEP,
    opacity: 0.35,
  },
  markWrap: {
    position: 'absolute',
    top: '36%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 30,
    elevation: 18,
  },
  wordmarkWrap: {
    position: 'absolute',
    top: '62%',
    width: '100%',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 42,
    color: '#ffffff',
    letterSpacing: -1.4,
    lineHeight: 44,
  },
  wordmarkAccent: {
    color: YELLOW,
  },
  taglineWrap: {
    position: 'absolute',
    top: '70%',
    width: '100%',
    alignItems: 'center',
  },
  tagline: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerWrap: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
  },
  footer: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  stripes: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 10,
    overflow: 'hidden',
  },
  stripesInner: {
    flexDirection: 'row',
    height: '200%',
    transform: [{ rotate: '-45deg' }, { translateY: -5 }],
    width: '200%',
  },
});
