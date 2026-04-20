// tokens.jsx — shared design tokens, icons, and primitives for MendLog

const T = {
  // Palette (from brief)
  ink: '#0E0E0E',
  navy: '#1E3A5F',
  navyDeep: '#15293F',
  navySoft: '#2B4C74',
  yellow: '#F5B800',
  yellowDeep: '#D99E00',
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  line: '#E6E3DA',
  lineSoft: '#EEEBE2',
  mute: '#8E8A7D',
  muteDeep: '#5F5C54',
  text: '#141414',
  textDim: '#4E4A42',
  // Status
  emerald: '#1F9D55',
  emeraldSoft: '#D6F0DF',
  amber: '#D97706',
  amberSoft: '#FDEBCC',
  red: '#C53030',
  redSoft: '#F8D7D7',
  // Activity heatmap (emerald ramp)
  heat0: '#ECE9DF',
  heat1: '#C8E9D4',
  heat2: '#8FD1AC',
  heat3: '#4EB07C',
  heat4: '#1F7A46',
  // dark
  darkBg: '#0E0E0E',
  darkSurface: '#161616',
  darkLine: '#242424',
  darkText: '#F3F2EE',
  darkMute: '#8A8679',
};

const FONT = "'IBM Plex Sans', 'Inter', -apple-system, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// ─── Phosphor-style inline icons (stroke 1.75, currentColor) ──────────────
function Icon({ name, size = 22, color = 'currentColor', weight = 1.75, style }) {
  const s = { width: size, height: size, display: 'inline-block', flexShrink: 0, ...style };
  const p = { fill: 'none', stroke: color, strokeWidth: weight, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" {...p}/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...p}/></>,
    camera: <><path d="M4 7h3l2-2h6l2 2h3v12H4z" {...p}/><circle cx="12" cy="13" r="3.5" {...p}/></>,
    plus: <path d="M12 5v14M5 12h14" {...p}/>,
    search: <><circle cx="11" cy="11" r="7" {...p}/><path d="m21 21-5-5" {...p}/></>,
    home: <path d="M3 10.5 12 3l9 7.5V21h-6v-7h-6v7H3z" {...p}/>,
    list: <path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01" {...p}/>,
    user: <><circle cx="12" cy="8" r="4" {...p}/><path d="M4 21a8 8 0 0 1 16 0" {...p}/></>,
    bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 10H3c0-3 3-3 3-10zM9 21a3 3 0 0 0 6 0" {...p}/>,
    arrow_left: <path d="M19 12H5M12 5l-7 7 7 7" {...p}/>,
    arrow_right: <path d="M5 12h14M12 5l7 7-7 7" {...p}/>,
    arrow_down: <path d="M12 5v14M5 12l7 7 7-7" {...p}/>,
    chevron_down: <path d="m6 9 6 6 6-6" {...p}/>,
    chevron_right: <path d="m9 6 6 6-6 6" {...p}/>,
    chevron_left: <path d="m15 6-6 6 6 6" {...p}/>,
    x: <path d="M18 6 6 18M6 6l12 12" {...p}/>,
    check: <path d="m5 12 5 5L20 6" {...p}/>,
    check_circle: <><circle cx="12" cy="12" r="9" {...p}/><path d="m8 12 3 3 5-6" {...p}/></>,
    sparkle: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" {...p}/>,
    wave: <path d="M3 12h2l2-6 2 12 2-9 2 6 2-3 2 4 2-2h2" {...p}/>,
    play: <path d="M7 5v14l12-7z" {...p} fill={color}/>,
    pause: <path d="M8 5v14M16 5v14" {...p}/>,
    record: <><circle cx="12" cy="12" r="9" {...p}/><circle cx="12" cy="12" r="4" fill={color}/></>,
    photo: <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><circle cx="8.5" cy="10" r="1.5" {...p}/><path d="m3 17 5-5 4 4 3-3 6 6" {...p}/></>,
    flash: <path d="M13 3 4 14h7l-1 7 9-11h-7z" {...p}/>,
    cloud: <path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 13h-1a4 4 0 0 1 0 8H7z" {...p}/>,
    cloud_off: <><path d="m3 3 18 18" {...p}/><path d="M7 18a5 5 0 0 1-1-9.9M20 16a4 4 0 0 0-2.5-7.6" {...p}/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" {...p}/><path d="M3 10h18M8 3v4M16 3v4" {...p}/></>,
    filter: <path d="M4 5h16l-6 8v6l-4-2v-4z" {...p}/>,
    edit: <path d="M4 20h4L20 8l-4-4L4 16z" {...p}/>,
    share: <><circle cx="6" cy="12" r="2.5" {...p}/><circle cx="18" cy="6" r="2.5" {...p}/><circle cx="18" cy="18" r="2.5" {...p}/><path d="m8 11 8-4M8 13l8 4" {...p}/></>,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 19h16" {...p}/>,
    settings: <><circle cx="12" cy="12" r="3" {...p}/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" {...p}/></>,
    warning: <><path d="M12 3 2 21h20z" {...p}/><path d="M12 10v5M12 18h.01" {...p}/></>,
    info: <><circle cx="12" cy="12" r="9" {...p}/><path d="M12 8h.01M11 12h1v5h1" {...p}/></>,
    trash: <path d="M4 7h16M9 7V4h6v3M6 7v13h12V7M10 11v6M14 11v6" {...p}/>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" {...p}/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" {...p}/></>,
    refresh: <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" {...p}/>,
    wifi_off: <path d="m3 3 18 18M5 12a12 12 0 0 1 5-3M19 12a12 12 0 0 0-5-3M8.5 16.5a6 6 0 0 1 7 0M12 20h.01" {...p}/>,
    signature: <path d="M3 18c3 0 3-10 6-10s3 10 6 10M15 18h6" {...p}/>,
    factory: <><path d="M3 21V10l5 3V10l5 3V6l5 3v12z" {...p}/><path d="M8 21v-4M13 21v-4M18 21v-4" {...p}/></>,
    gear: <><circle cx="12" cy="12" r="3" {...p}/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" {...p}/></>,
    logout: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" {...p}/>,
    globe: <><circle cx="12" cy="12" r="9" {...p}/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...p}/></>,
    pdf: <><path d="M6 3h9l5 5v13H6z" {...p}/><path d="M15 3v5h5" {...p}/></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" {...p}/><circle cx="12" cy="12" r="3" {...p}/></>,
    menu_dots: <><circle cx="12" cy="6" r="1.2" fill={color}/><circle cx="12" cy="12" r="1.2" fill={color}/><circle cx="12" cy="18" r="1.2" fill={color}/></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" {...p}/><path d="M8 11V7a4 4 0 0 1 8 0v4" {...p}/></>,
    link: <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1-1" {...p}/>,
    spinner: <><circle cx="12" cy="12" r="9" {...p} opacity="0.2"/><path d="M21 12a9 9 0 0 0-9-9" {...p}/></>,
    send: <path d="m4 20 17-8L4 4l3 8zM7 12h14" {...p}/>,
    clock: <><circle cx="12" cy="12" r="9" {...p}/><path d="M12 7v5l3 2" {...p}/></>,
    wrench: <path d="m14.7 6.3 3-3a5 5 0 0 0-7 7L3 18.3 5.7 21l8-8a5 5 0 0 0 7-7l-3 3-2-.7z" {...p}/>,
  };
  return <svg viewBox="0 0 24 24" style={s} aria-hidden="true">{paths[name]}</svg>;
}

// ─── Generic pill/badge ───────────────────────────────────────────────────
function Pill({ children, bg = T.lineSoft, color = T.textDim, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
      background: bg, color, letterSpacing: 0.1, whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  );
}

// Status dot
function Dot({ color = T.emerald, size = 8, style }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', ...style }}/>;
}

// Sync status dot used in top bars
function SyncDot({ state = 'synced', style }) {
  const map = {
    synced: { c: T.emerald, t: 'Synced' },
    pending: { c: T.amber, t: 'Pending' },
    offline: { c: T.red, t: 'Offline' },
  }[state];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{
        width: 9, height: 9, borderRadius: '50%', background: map.c,
        boxShadow: `0 0 0 3px ${map.c}22`,
      }}/>
      <span style={{ fontSize: 11, color: T.muteDeep, fontWeight: 500 }}>{map.t}</span>
    </span>
  );
}

// ─── Mobile status bar (replaces stock one for our custom look) ──────────
function StatusBar({ dark = false, time = '09:42' }) {
  const c = dark ? '#fff' : T.ink;
  return (
    <div style={{
      height: 28, padding: '0 18px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', color: c, fontFamily: FONT, fontSize: 13, fontWeight: 600,
      flexShrink: 0,
    }}>
      <span>{time}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="15" height="11" viewBox="0 0 15 11"><path d="M1 7l2-2 2 2 2-3 2 3 2-4 2 4 2-5" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>
        <svg width="14" height="11" viewBox="0 0 14 11"><path d="M1 6a9 9 0 0 1 12 0M3 8a6 6 0 0 1 8 0M7 10v.01" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x="1" y="1" width="18" height="9" rx="2" fill="none" stroke={c} strokeOpacity="0.5"/><rect x="3" y="3" width="13" height="5" rx="1" fill={c}/><rect x="20" y="4" width="1.5" height="3" rx="0.5" fill={c} opacity="0.5"/></svg>
      </div>
    </div>
  );
}

// Gesture nav bar (bottom pill)
function GestureBar({ dark = false }) {
  return (
    <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 120, height: 4, borderRadius: 2, background: dark ? '#fff' : T.ink, opacity: 0.35 }}/>
    </div>
  );
}

// ─── Phone shell ─────────────────────────────────────────────────────────
function Phone({ children, dark = false, width = 390, height = 820, label, style, sub }) {
  return (
    <div style={{ flexShrink: 0, position: 'relative' }}>
      {label && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 8, paddingBottom: 10,
          fontSize: 12, fontWeight: 600, color: 'rgba(40,30,20,0.78)', letterSpacing: 0.2, whiteSpace: 'nowrap',
        }}>
          {label}
          {sub && <span style={{ marginLeft: 8, fontWeight: 400, color: 'rgba(60,50,40,0.55)' }}>{sub}</span>}
        </div>
      )}
      <div style={{
        width, height, borderRadius: 44, padding: 8,
        background: '#1a1a1a',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.2)',
        position: 'relative',
        ...style,
      }}>
        <div style={{
          width: '100%', height: '100%', borderRadius: 36,
          background: dark ? T.darkBg : T.bg,
          overflow: 'hidden', position: 'relative',
          display: 'flex', flexDirection: 'column',
          fontFamily: FONT, color: dark ? T.darkText : T.text,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Body wrapper for scrollable screen content
function Screen({ children, dark = false, bg, padded = true, style }) {
  return (
    <div style={{
      flex: 1, overflow: 'auto', position: 'relative',
      background: bg || (dark ? T.darkBg : T.bg),
      padding: padded ? '0 20px 24px' : 0,
      ...style,
    }}>{children}</div>
  );
}

// ─── Bottom tab bar ───────────────────────────────────────────────────────
function TabBar({ active = 'home', dark = false, onTab = () => {} }) {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'jobs', label: 'Jobs', icon: 'list' },
    { id: 'new', label: '', icon: 'plus', fab: true },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'me', label: 'Me', icon: 'user' },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
      padding: '8px 14px 10px', gap: 4,
      background: dark ? '#0a0a0a' : '#fff',
      borderTop: `1px solid ${dark ? T.darkLine : T.line}`,
      flexShrink: 0,
    }}>
      {items.map(it => {
        const selected = active === it.id;
        if (it.fab) {
          return (
            <button key={it.id} onClick={() => onTab(it.id)}
              style={{
                border: 'none', background: T.yellow, color: T.ink,
                width: 56, height: 56, borderRadius: 18, marginTop: -14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px -4px ${T.yellow}99, 0 2px 4px rgba(0,0,0,0.1)`,
                cursor: 'pointer',
              }}>
              <Icon name="plus" size={28} weight={2.2}/>
            </button>
          );
        }
        return (
          <button key={it.id} onClick={() => onTab(it.id)}
            style={{
              border: 'none', background: 'none', flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '8px 0 4px',
              color: selected ? (dark ? '#fff' : T.navy) : (dark ? T.darkMute : T.mute),
              cursor: 'pointer',
            }}>
            <Icon name={it.icon} size={20} weight={selected ? 2 : 1.5}/>
            <span style={{ fontSize: 10, fontWeight: selected ? 600 : 500, letterSpacing: 0.1 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── App top bar (title + sync dot) ──────────────────────────────────────
function AppBar({ title, subtitle, left, right, dark = false, sync = 'synced', bg }) {
  return (
    <div style={{
      padding: '10px 18px 10px',
      background: bg || (dark ? T.darkBg : T.bg),
      display: 'flex', alignItems: 'center', gap: 10,
      flexShrink: 0,
    }}>
      {left}
      <div style={{ flex: 1, minWidth: 0 }}>
        {subtitle && <div style={{ fontSize: 11, color: T.mute, fontWeight: 500, marginBottom: 1, letterSpacing: 0.05 }}>{subtitle}</div>}
        <div style={{
          fontSize: 17, fontWeight: 600, letterSpacing: -0.35, lineHeight: 1.15,
          color: dark ? T.darkText : T.text,
          textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden',
        }}>{title}</div>
      </div>
      {right !== undefined ? right : <SyncDot state={sync}/>}
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────
function Btn({ children, kind = 'primary', onClick, icon, style, block, dark = false, size = 'md' }) {
  const sizes = { md: { py: 12, fs: 13.5, r: 11 }, lg: { py: 15, fs: 14.5, r: 13 }, sm: { py: 8, fs: 12, r: 9 } };
  const sz = sizes[size];
  const kinds = {
    primary: { bg: T.yellow, color: T.ink, border: 'transparent' },
    navy: { bg: T.navy, color: '#fff', border: 'transparent' },
    ghost: { bg: 'transparent', color: dark ? T.darkText : T.text, border: dark ? T.darkLine : T.line },
    danger: { bg: T.red, color: '#fff', border: 'transparent' },
    soft: { bg: dark ? '#1a1a1a' : '#F1EEE6', color: dark ? T.darkText : T.text, border: 'transparent' },
  };
  const k = kinds[kind];
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      padding: `${sz.py}px 18px`, borderRadius: sz.r,
      fontSize: sz.fs, fontWeight: 600, letterSpacing: -0.1,
      background: k.bg, color: k.color, border: `1px solid ${k.border}`,
      cursor: 'pointer', width: block ? '100%' : 'auto',
      fontFamily: FONT, lineHeight: 1, whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon && <Icon name={icon} size={16} weight={1.9}/>}
      {children}
    </button>
  );
}

// ─── Common card ─────────────────────────────────────────────────────────
function Card({ children, style, onClick, dark = false, padded = true }) {
  return (
    <div onClick={onClick} style={{
      background: dark ? T.darkSurface : '#fff',
      border: `1px solid ${dark ? T.darkLine : T.line}`,
      borderRadius: 12, padding: padded ? 14 : 0,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// ─── Section label ───────────────────────────────────────────────────────
function SectionLabel({ children, right, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2,
      color: T.muteDeep, margin: '18px 0 8px', whiteSpace: 'nowrap', ...style,
    }}>
      <span>{children}</span>
      {right}
    </div>
  );
}

// ─── Language badge (සිං / EN) ───────────────────────────────────────────
function LangBadge({ lang = 'en', style }) {
  const isSi = lang === 'si';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 28, height: 20, padding: '0 6px', borderRadius: 6,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.2,
      background: isSi ? '#EAD8F0' : '#D8E7F5',
      color: isSi ? '#6A1E88' : T.navy,
      fontFamily: isSi ? "'Noto Sans Sinhala', 'Iskoola Pota', " + FONT : FONT,
      ...style,
    }}>{isSi ? 'සිං' : 'EN'}</span>
  );
}

Object.assign(window, { T, FONT, MONO, Icon, Pill, Dot, SyncDot, StatusBar, GestureBar, Phone, Screen, TabBar, AppBar, Btn, Card, SectionLabel, LangBadge });
