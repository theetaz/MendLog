// shared.jsx — shared UI: photo placeholder, job card, contribution grid, calendar

// Photo placeholder — drawn image of a machine/part
function PhotoBox({ seed = 0, size, style }) {
  // Deterministic "industrial photo" placeholders using CSS gradients
  const variants = [
    { bg: 'linear-gradient(135deg, #4a5568 0%, #2d3748 60%, #1a202c 100%)', el: { c: '#e2a900', pos: '55% 50%' } },
    { bg: 'linear-gradient(160deg, #6b7280 0%, #374151 100%)', el: { c: '#c2410c', pos: '40% 60%' } },
    { bg: 'linear-gradient(140deg, #9ca3af 0%, #4b5563 100%)', el: { c: '#1e3a5f', pos: '60% 45%' } },
    { bg: 'linear-gradient(130deg, #78716c 0%, #292524 100%)', el: { c: '#a16207', pos: '50% 55%' } },
    { bg: 'linear-gradient(150deg, #52525b 0%, #27272a 100%)', el: { c: '#166534', pos: '45% 50%' } },
  ];
  const v = variants[seed % variants.length];
  return (
    <div style={{
      width: size || '100%', height: size || '100%',
      background: v.bg, position: 'relative', overflow: 'hidden',
      borderRadius: 10, ...style,
    }}>
      {/* fake machine part */}
      <div style={{
        position: 'absolute', left: v.el.pos.split(' ')[0], top: v.el.pos.split(' ')[1],
        width: '38%', height: '28%', transform: 'translate(-50%,-50%) rotate(-8deg)',
        background: `linear-gradient(180deg, ${v.el.c}, ${v.el.c}aa)`,
        borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}/>
      <div style={{
        position: 'absolute', left: '30%', top: '70%',
        width: '20%', height: '4%', background: '#fff3', borderRadius: 2,
      }}/>
      {/* grain */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 30% 20%, #ffffff22, transparent 50%)',
      }}/>
    </div>
  );
}

// ─── Job card (3 variants: horizontal / full / compact) ─────────────────
function JobCard({ job, variant = 'full', onClick, dark = false }) {
  const statusMap = {
    complete: { bg: T.emeraldSoft, fg: '#0D6B39', label: 'Complete' },
    'awaiting-tl': { bg: T.amberSoft, fg: '#8C4A00', label: 'Awaiting TL' },
    open: { bg: T.lineSoft, fg: T.muteDeep, label: 'Open' },
    error: { bg: T.redSoft, fg: '#8B1C1C', label: 'Error' },
  };
  const s = statusMap[job.status] || statusMap.complete;

  if (variant === 'compact') {
    return (
      <div onClick={onClick} style={{
        background: dark ? T.darkSurface : '#fff',
        border: `1px solid ${dark ? T.darkLine : T.line}`,
        borderRadius: 12, padding: 10, display: 'flex', gap: 10, cursor: 'pointer',
      }}>
        <PhotoBox seed={job.id} size={42} style={{ borderRadius: 8, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: T.mute, fontFamily: MONO }}>#{job.id}</span>
            <LangBadge lang={job.lang} style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}/>
            <Pill bg={s.bg} color={s.fg} style={{ fontSize: 9.5, padding: '1px 6px', marginLeft: 'auto' }}>{s.label}</Pill>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: dark ? T.darkText : T.text, letterSpacing: -0.15, lineHeight: 1.25 }}>{job.machine}</div>
          <div style={{ fontSize: 11, color: T.mute, marginTop: 1 }}>{job.idle} idle</div>
        </div>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div onClick={onClick} style={{
        background: dark ? T.darkSurface : '#fff',
        border: `1px solid ${dark ? T.darkLine : T.line}`,
        borderRadius: 14, padding: 14, display: 'flex', gap: 14, cursor: 'pointer', alignItems: 'center',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 10, background: T.navy, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12.5,
          flexShrink: 0,
        }}>{job.time}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: dark ? T.darkText : T.text, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.machine}</div>
          <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>{job.dept} · {job.idle} idle</div>
        </div>
        <Pill bg={s.bg} color={s.fg}>{s.label}</Pill>
      </div>
    );
  }

  // full
  return (
    <div onClick={onClick} style={{
      background: dark ? T.darkSurface : '#fff',
      border: `1px solid ${dark ? T.darkLine : T.line}`,
      borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
      display: 'flex',
    }}>
      <div style={{ flex: 1, padding: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.mute, letterSpacing: 0.3 }}>#{job.id}</span>
          <Pill bg={s.bg} color={s.fg} style={{ fontSize: 10, padding: '2px 7px' }}>{s.label}</Pill>
          <LangBadge lang={job.lang} style={{ marginLeft: 'auto' }}/>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: dark ? T.darkText : T.text, letterSpacing: -0.2 }}>{job.machine}</div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 2 }}>{job.dept} · {job.time} · {job.idle} idle</div>
        <div style={{
          fontSize: 12.5, color: T.textDim, marginTop: 8, lineHeight: 1.45,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{job.rootCause}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 11, color: T.mute }}>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Icon name="photo" size={12}/>{job.photos}</span>
          <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}><Icon name="mic" size={12}/>{job.clips}</span>
        </div>
      </div>
      <PhotoBox seed={job.id} style={{ width: 96, height: 'auto', borderRadius: 0 }}/>
    </div>
  );
}

// ─── Contribution grid ──────────────────────────────────────────────────
function ContributionGrid({ variant = 'compact', onCellTap, weeks = 12, data }) {
  const cells = data || genActivity(weeks);
  // group into weeks of 7
  const cols = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
  const cellSize = variant === 'full' ? 11 : 12;
  const gap = variant === 'full' ? 3 : 3;

  // month labels
  const monthLabels = [];
  if (variant === 'full') {
    let lastMonth = -1;
    cols.forEach((col, i) => {
      const d = new Date(col[0].date);
      if (d.getMonth() !== lastMonth) {
        monthLabels.push({ i, m: d.toLocaleString('en', { month: 'short' }) });
        lastMonth = d.getMonth();
      }
    });
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {variant === 'full' && (
        <div style={{
          display: 'flex', height: 14, fontSize: 10, color: T.mute, fontWeight: 600,
          letterSpacing: 0.3, marginLeft: 22, marginBottom: 2,
        }}>
          {monthLabels.map((m, i) => {
            const next = monthLabels[i + 1];
            const w = ((next ? next.i : cols.length) - m.i) * (cellSize + gap);
            return <div key={i} style={{ width: w, flexShrink: 0 }}>{m.m}</div>;
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap }}>
        {variant === 'full' && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap, marginRight: 4,
            fontSize: 9, color: T.mute, fontWeight: 600, justifyContent: 'space-between',
            width: 18, paddingTop: 2,
          }}>
            <span style={{ height: cellSize }}></span>
            <span style={{ height: cellSize }}>Mon</span>
            <span style={{ height: cellSize }}></span>
            <span style={{ height: cellSize }}>Wed</span>
            <span style={{ height: cellSize }}></span>
            <span style={{ height: cellSize }}>Fri</span>
            <span style={{ height: cellSize }}></span>
          </div>
        )}
        {cols.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap }}>
            {col.map((cell, ri) => (
              <div key={ri}
                onClick={() => onCellTap && onCellTap(cell)}
                title={`${cell.date}: ${cell.count} jobs`}
                style={{
                  width: cellSize, height: cellSize, borderRadius: 3,
                  background: heatColor(cell.count),
                  cursor: onCellTap ? 'pointer' : 'default',
                }}/>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Waveform bars ──────────────────────────────────────────────────────
function Waveform({ active = false, count = 28, style, color = '#fff' }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 32, ...style }}>
      {Array.from({ length: count }).map((_, i) => {
        const base = 6 + Math.abs(Math.sin(i * 0.9 + i * 0.3)) * 22;
        const h = active ? base : base * 0.6;
        return (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2, background: color,
            opacity: 0.55 + Math.abs(Math.sin(i * 1.7)) * 0.4,
            animation: active ? `wf ${0.4 + (i % 5) * 0.15}s ease-in-out ${i * 0.02}s infinite alternate` : 'none',
          }}/>
        );
      })}
      <style>{`@keyframes wf { from { transform: scaleY(0.5); } to { transform: scaleY(1.3); } }`}</style>
    </div>
  );
}

// ─── Signature scribble svg ─────────────────────────────────────────────
function Signature({ color = T.navy }) {
  return (
    <svg viewBox="0 0 220 50" width="100%" height="60" style={{ display: 'block' }}>
      <path d="M10 35 Q 18 10, 30 30 T 55 30 Q 65 25, 75 35 T 100 15 Q 115 40, 130 25 T 165 30 Q 180 15, 200 35"
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

Object.assign(window, { PhotoBox, JobCard, ContributionGrid, Waveform, Signature });
