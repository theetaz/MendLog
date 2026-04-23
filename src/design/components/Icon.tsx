import { View } from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  weight?: number;
  testID?: string;
}

type Renderer = (args: { color: string; weight: number }) => React.ReactNode;

function stroke(color: string, weight: number) {
  return {
    fill: 'none',
    stroke: color,
    strokeWidth: weight,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

const ICONS: Record<string, Renderer> = {
  mic: ({ color, weight }) => (
    <>
      <Rect x={9} y={3} width={6} height={12} rx={3} {...stroke(color, weight)} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...stroke(color, weight)} />
    </>
  ),
  camera: ({ color, weight }) => (
    <>
      <Path d="M4 7h3l2-2h6l2 2h3v12H4z" {...stroke(color, weight)} />
      <Circle cx={12} cy={13} r={3.5} {...stroke(color, weight)} />
    </>
  ),
  plus: ({ color, weight }) => <Path d="M12 5v14M5 12h14" {...stroke(color, weight)} />,
  'chevron-left': ({ color, weight }) => (
    <Path d="M15 18l-6-6 6-6" {...stroke(color, weight)} />
  ),
  'chevron-right': ({ color, weight }) => (
    <Path d="M9 18l6-6-6-6" {...stroke(color, weight)} />
  ),
  search: ({ color, weight }) => (
    <>
      <Circle cx={11} cy={11} r={7} {...stroke(color, weight)} />
      <Path d="m21 21-5-5" {...stroke(color, weight)} />
    </>
  ),
  home: ({ color, weight }) => (
    <Path d="M3 10.5 12 3l9 7.5V21h-6v-7h-6v7H3z" {...stroke(color, weight)} />
  ),
  list: ({ color, weight }) => (
    <Path
      d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01"
      {...stroke(color, weight)}
    />
  ),
  user: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={8} r={4} {...stroke(color, weight)} />
      <Path d="M4 21a8 8 0 0 1 16 0" {...stroke(color, weight)} />
    </>
  ),
  bell: ({ color, weight }) => (
    <Path
      d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 10H3c0-3 3-3 3-10zM9 21a3 3 0 0 0 6 0"
      {...stroke(color, weight)}
    />
  ),
  arrow_left: ({ color, weight }) => (
    <Path d="M19 12H5M12 5l-7 7 7 7" {...stroke(color, weight)} />
  ),
  arrow_right: ({ color, weight }) => (
    <Path d="M5 12h14M12 5l7 7-7 7" {...stroke(color, weight)} />
  ),
  arrow_down: ({ color, weight }) => (
    <Path d="M12 5v14M5 12l7 7 7-7" {...stroke(color, weight)} />
  ),
  chevron_down: ({ color, weight }) => (
    <Path d="m6 9 6 6 6-6" {...stroke(color, weight)} />
  ),
  chevron_right: ({ color, weight }) => (
    <Path d="m9 6 6 6-6 6" {...stroke(color, weight)} />
  ),
  chevron_left: ({ color, weight }) => (
    <Path d="m15 6-6 6 6 6" {...stroke(color, weight)} />
  ),
  x: ({ color, weight }) => <Path d="M18 6 6 18M6 6l12 12" {...stroke(color, weight)} />,
  check: ({ color, weight }) => <Path d="m5 12 5 5L20 6" {...stroke(color, weight)} />,
  check_circle: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={9} {...stroke(color, weight)} />
      <Path d="m8 12 3 3 5-6" {...stroke(color, weight)} />
    </>
  ),
  sparkle: ({ color, weight }) => (
    <Path
      d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"
      {...stroke(color, weight)}
    />
  ),
  wave: ({ color, weight }) => (
    <Path
      d="M3 12h2l2-6 2 12 2-9 2 6 2-3 2 4 2-2h2"
      {...stroke(color, weight)}
    />
  ),
  play: ({ color, weight }) => (
    <Path d="M7 5v14l12-7z" {...stroke(color, weight)} fill={color} />
  ),
  pause: ({ color, weight }) => <Path d="M8 5v14M16 5v14" {...stroke(color, weight)} />,
  record: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={9} {...stroke(color, weight)} />
      <Circle cx={12} cy={12} r={4} fill={color} />
    </>
  ),
  photo: ({ color, weight }) => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} {...stroke(color, weight)} />
      <Circle cx={8.5} cy={10} r={1.5} {...stroke(color, weight)} />
      <Path d="m3 17 5-5 4 4 3-3 6 6" {...stroke(color, weight)} />
    </>
  ),
  flash: ({ color, weight }) => (
    <Path d="M13 3 4 14h7l-1 7 9-11h-7z" {...stroke(color, weight)} />
  ),
  cloud: ({ color, weight }) => (
    <Path
      d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 13h-1a4 4 0 0 1 0 8H7z"
      {...stroke(color, weight)}
    />
  ),
  cloud_off: ({ color, weight }) => (
    <>
      <Path d="m3 3 18 18" {...stroke(color, weight)} />
      <Path d="M7 18a5 5 0 0 1-1-9.9M20 16a4 4 0 0 0-2.5-7.6" {...stroke(color, weight)} />
    </>
  ),
  cloud_check: ({ color, weight }) => (
    <>
      <Path
        d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 13h-1a4 4 0 0 1 0 8H7z"
        {...stroke(color, weight)}
      />
      <Path d="m9 14 2 2 4-4" {...stroke(color, weight)} />
    </>
  ),
  cloud_up: ({ color, weight }) => (
    <>
      <Path
        d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 13h-1a4 4 0 0 1 0 8H7z"
        {...stroke(color, weight)}
      />
      <Path d="M12 18v-6m-3 3 3-3 3 3" {...stroke(color, weight)} />
    </>
  ),
  cloud_dots: ({ color, weight }) => (
    <>
      <Path
        d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 13h-1a4 4 0 0 1 0 8H7z"
        {...stroke(color, weight)}
      />
      <Circle cx={9} cy={15} r={0.8} fill={color} />
      <Circle cx={12} cy={15} r={0.8} fill={color} />
      <Circle cx={15} cy={15} r={0.8} fill={color} />
    </>
  ),
  cloud_alert: ({ color, weight }) => (
    <>
      <Path
        d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 13h-1a4 4 0 0 1 0 8H7z"
        {...stroke(color, weight)}
      />
      <Path d="M12 11v3M12 17h.01" {...stroke(color, weight)} />
    </>
  ),
  calendar: ({ color, weight }) => (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={2} {...stroke(color, weight)} />
      <Path d="M3 10h18M8 3v4M16 3v4" {...stroke(color, weight)} />
    </>
  ),
  filter: ({ color, weight }) => (
    <Path d="M4 5h16l-6 8v6l-4-2v-4z" {...stroke(color, weight)} />
  ),
  edit: ({ color, weight }) => (
    <Path d="M4 20h4L20 8l-4-4L4 16z" {...stroke(color, weight)} />
  ),
  share: ({ color, weight }) => (
    <>
      <Circle cx={6} cy={12} r={2.5} {...stroke(color, weight)} />
      <Circle cx={18} cy={6} r={2.5} {...stroke(color, weight)} />
      <Circle cx={18} cy={18} r={2.5} {...stroke(color, weight)} />
      <Path d="m8 11 8-4M8 13l8 4" {...stroke(color, weight)} />
    </>
  ),
  download: ({ color, weight }) => (
    <Path d="M12 3v12m-5-5 5 5 5-5M4 19h16" {...stroke(color, weight)} />
  ),
  warning: ({ color, weight }) => (
    <>
      <Path d="M12 3 2 21h20z" {...stroke(color, weight)} />
      <Path d="M12 10v5M12 18h.01" {...stroke(color, weight)} />
    </>
  ),
  info: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={9} {...stroke(color, weight)} />
      <Path d="M12 8h.01M11 12h1v5h1" {...stroke(color, weight)} />
    </>
  ),
  trash: ({ color, weight }) => (
    <Path
      d="M4 7h16M9 7V4h6v3M6 7v13h12V7M10 11v6M14 11v6"
      {...stroke(color, weight)}
    />
  ),
  copy: ({ color, weight }) => (
    <>
      <Rect x={8} y={8} width={12} height={12} rx={2} {...stroke(color, weight)} />
      <Path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" {...stroke(color, weight)} />
    </>
  ),
  refresh: ({ color, weight }) => (
    <Path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" {...stroke(color, weight)} />
  ),
  wifi_off: ({ color, weight }) => (
    <Path
      d="m3 3 18 18M5 12a12 12 0 0 1 5-3M19 12a12 12 0 0 0-5-3M8.5 16.5a6 6 0 0 1 7 0M12 20h.01"
      {...stroke(color, weight)}
    />
  ),
  signature: ({ color, weight }) => (
    <Path d="M3 18c3 0 3-10 6-10s3 10 6 10M15 18h6" {...stroke(color, weight)} />
  ),
  factory: ({ color, weight }) => (
    <>
      <Path d="M3 21V10l5 3V10l5 3V6l5 3v12z" {...stroke(color, weight)} />
      <Path d="M8 21v-4M13 21v-4M18 21v-4" {...stroke(color, weight)} />
    </>
  ),
  gear: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={3} {...stroke(color, weight)} />
      <Path
        d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        {...stroke(color, weight)}
      />
    </>
  ),
  logout: ({ color, weight }) => (
    <Path
      d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
      {...stroke(color, weight)}
    />
  ),
  globe: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={9} {...stroke(color, weight)} />
      <Path
        d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
        {...stroke(color, weight)}
      />
    </>
  ),
  pdf: ({ color, weight }) => (
    <>
      <Path d="M6 3h9l5 5v13H6z" {...stroke(color, weight)} />
      <Path d="M15 3v5h5" {...stroke(color, weight)} />
    </>
  ),
  eye: ({ color, weight }) => (
    <>
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...stroke(color, weight)} />
      <Circle cx={12} cy={12} r={3} {...stroke(color, weight)} />
    </>
  ),
  menu_dots: ({ color }) => (
    <>
      <Circle cx={12} cy={6} r={1.2} fill={color} />
      <Circle cx={12} cy={12} r={1.2} fill={color} />
      <Circle cx={12} cy={18} r={1.2} fill={color} />
    </>
  ),
  lock: ({ color, weight }) => (
    <>
      <Rect x={5} y={11} width={14} height={10} rx={2} {...stroke(color, weight)} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" {...stroke(color, weight)} />
    </>
  ),
  link: ({ color, weight }) => (
    <Path
      d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1-1"
      {...stroke(color, weight)}
    />
  ),
  spinner: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={9} {...stroke(color, weight)} opacity={0.2} />
      <Path d="M21 12a9 9 0 0 0-9-9" {...stroke(color, weight)} />
    </>
  ),
  send: ({ color, weight }) => (
    <Path d="m4 20 17-8L4 4l3 8zM7 12h14" {...stroke(color, weight)} />
  ),
  clock: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={9} {...stroke(color, weight)} />
      <Path d="M12 7v5l3 2" {...stroke(color, weight)} />
    </>
  ),
  wrench: ({ color, weight }) => (
    <Path
      d="m14.7 6.3 3-3a5 5 0 0 0-7 7L3 18.3 5.7 21l8-8a5 5 0 0 0 7-7l-3 3-2-.7z"
      {...stroke(color, weight)}
    />
  ),
  settings: ({ color, weight }) => (
    <>
      <Circle cx={12} cy={12} r={3} {...stroke(color, weight)} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
        {...stroke(color, weight)}
      />
    </>
  ),
};

export const ICON_NAMES = Object.keys(ICONS) as (keyof typeof ICONS)[];
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color = '#000', weight = 1.75, testID }: IconProps) {
  const renderer = ICONS[name];
  if (!renderer) return null;
  return (
    <View testID={testID} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {renderer({ color, weight })}
      </Svg>
    </View>
  );
}
