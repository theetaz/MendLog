// screens-b.jsx — New Job Review/Signoff, Jobs List+Calendar, Day View, Job Detail

// ─── 6. New Job — Step 2: Review ─────────────────────────────────────────
function NewJobReview({ onBack, onNext }) {
  const Field = ({ label, value, filled = true, multi, placeholder, tap }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 6px', marginBottom: 5 }}>
        <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muteDeep, whiteSpace: 'nowrap' }}>{label}</label>
        {filled && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 999, background: '#F0E9FB', color: '#6A4BB7', fontSize: 9.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <Icon name="sparkle" size={9}/> AI
          </span>
        )}
        {!filled && !value && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: T.amber, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <Icon name="warning" size={10}/> tap to type
          </span>
        )}
      </div>
      <div style={{
        background: '#fff', border: `1px solid ${T.line}`, borderRadius: 12,
        padding: multi ? '12px 14px' : '13px 14px',
        fontSize: 14, lineHeight: 1.5, color: value ? T.text : T.mute, minHeight: multi ? 68 : 46,
      }}>
        {value || placeholder}
      </div>
    </div>
  );

  return (
    <>
      <StatusBar/>
      <AppBar
        title="Review"
        subtitle="Step 2 of 3 · AI filled these in"
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="arrow_left" size={22}/></button>}
        right={<Pill bg="#F0E9FB" color="#6A4BB7"><Icon name="sparkle" size={12}/> AI</Pill>}
      />
      <Screen>
        <Field label="Machine" value="Injection Molder #3"/>
        <Field label="Department" value="Moulding"/>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Inventory #" value="INV-0331"/></div>
          <div style={{ flex: 1 }}><Field label="Reported" filled={false} value="15 Mar · 09:14"/></div>
        </div>
        <Field label="Description of failure" multi
          value="Machine stopped mid-cycle. Loud hiss from rear hydraulic unit, no movement on mold close."/>
        <Field label="Root cause" multi
          value="Hydraulic seal failure on main cylinder — pressure dropped below spec."/>
        <Field label="Corrective action" multi
          value="Drained hydraulic reservoir, replaced main cylinder seal kit (part HC-0831), refilled with ISO 46 fluid. Ran 5 dry cycles, pressure holds at 8 bar."/>
        <Field label="Remarks" multi filled={false} placeholder="couldn't fill — tap to type"/>

        {/* ABCD breakdown */}
        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muteDeep, marginBottom: 8 }}>
            Idle time breakdown (hh:mm)
          </div>
          <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
            {[
              ['A', 'Man power', '0:20', true],
              ['B', 'Identification', '0:35', true],
              ['C', 'Spare parts', '2:15', true],
              ['D', 'Restoration', '1:10', true],
            ].map(([k, l, v, f], i) => (
              <div key={k} style={{
                display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12,
                borderTop: i === 0 ? 'none' : `1px solid ${T.line}`,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, background: T.ink, color: T.yellow,
                  fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{k}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text }}>{l}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: T.text }}>{v}</div>
                {f && <Icon name="sparkle" size={12} color="#6A4BB7"/>}
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12,
              background: T.lineSoft, borderTop: `1px solid ${T.line}`,
            }}>
              <div style={{ flex: 1, fontSize: 12.5, fontWeight: 600 }}>Total idle time <span style={{ fontWeight: 500, color: T.mute, fontSize: 11 }}>· auto A+B+C+D</span></div>
              <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: T.navy }}>4:20</div>
            </div>
          </div>
        </div>

        <Field label="Completion time" value="15 Mar · 13:34" filled={false}/>
        <div style={{ height: 60 }}/>
      </Screen>
      <div style={{ padding: '10px 20px 8px', background: '#fff', borderTop: `1px solid ${T.line}`, display: 'flex', gap: 10, flexShrink: 0 }}>
        <Btn kind="ghost" size="lg" style={{ flex: 1, minWidth: 0, padding: '15px 10px' }} onClick={onBack} icon="mic">Redo</Btn>
        <Btn kind="primary" size="lg" style={{ flex: 2, minWidth: 0 }} onClick={onNext}>Save job</Btn>
      </div>
      <GestureBar/>
    </>
  );
}

// ─── 7. New Job — Step 3: Sign-off ───────────────────────────────────────
function NewJobSignoff({ onBack, onFile }) {
  const [saved, setSaved] = React.useState(true);
  return (
    <>
      <StatusBar/>
      <AppBar title="Sign-off" subtitle="Step 3 of 3"
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="arrow_left" size={22}/></button>}
      />
      <Screen>
        <SectionLabel>Technician</SectionLabel>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>NP</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.1, lineHeight: 1.2 }}>Nuwan Perera</div>
              <div style={{ fontSize: 10.5, color: T.mute, marginTop: 1 }}>Maint. Tech · #0417</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: T.textDim, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <div style={{
                width: 32, height: 18, borderRadius: 9, background: saved ? T.emerald : T.line, position: 'relative', transition: '.2s',
              }} onClick={() => setSaved(!saved)}>
                <div style={{ position: 'absolute', top: 2, left: saved ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: '.2s' }}/>
              </div>
              Saved
            </label>
          </div>
          <div style={{ border: `1px dashed ${T.line}`, borderRadius: 10, background: T.lineSoft, padding: '8px 12px' }}>
            <Signature/>
            <div style={{ fontSize: 10, color: T.mute, textAlign: 'right', marginTop: -4 }}>Signed 13:34 · 15 Mar</div>
          </div>
        </Card>

        <SectionLabel>Team Leader</SectionLabel>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Needs TL sign-off</div>
          <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14, lineHeight: 1.5 }}>Pick whichever is easiest — send a link, pass the phone, or file as awaiting.</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { icon: 'share', l: 'Share signing link', s: 'SMS or WhatsApp' },
              { icon: 'mic', l: 'Pass the phone', s: 'TL signs here' },
              { icon: 'clock', l: 'File as awaiting TL', s: 'sign off later' },
            ].map((o, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                border: `1px solid ${i === 0 ? T.navy : T.line}`, borderRadius: 12, cursor: 'pointer',
                background: i === 0 ? '#E8EFF7' : '#fff',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, background: i === 0 ? T.navy : T.lineSoft,
                  color: i === 0 ? '#fff' : T.muteDeep,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name={o.icon} size={16}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>{o.l}</div>
                  <div style={{ fontSize: 10.5, color: T.mute, marginTop: 1 }}>{o.s}</div>
                </div>
                {i === 0 && <Icon name="check_circle" size={18} color={T.navy}/>}
              </div>
            ))}
          </div>
        </Card>

        <div style={{ height: 80 }}/>
      </Screen>
      <div style={{ padding: '10px 20px 8px', background: '#fff', borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <Btn kind="primary" size="lg" block onClick={onFile}>File this job</Btn>
      </div>
      <GestureBar/>
    </>
  );
}

// Success toast mini screen
function FiledSuccessScreen() {
  return (
    <>
      <StatusBar/>
      <div style={{ flex: 1, background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: T.emerald,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 10px ${T.emerald}22`,
        }}>
          <Icon name="check" size={44} color="#fff" weight={2.4}/>
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, marginTop: 24 }}>Filed.</div>
        <div style={{ fontSize: 13.5, color: T.textDim, marginTop: 6 }}>Job #127 saved.</div>
        <div style={{ fontSize: 12, color: T.mute, marginTop: 24 }}>Opening detail in 1.5s…</div>
      </div>
      <GestureBar/>
    </>
  );
}

// ─── 8. Jobs (List + Calendar toggle) ────────────────────────────────────
function JobsScreen({ onTab, view = 'list', setView, onOpenJob, onOpenDay }) {
  return (
    <>
      <StatusBar/>
      <AppBar title="Jobs" subtitle={`${JOBS.length} total · 3 today`}
        right={
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <button style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="search" size={18}/></button>
            <button style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="filter" size={18}/></button>
          </div>
        }
      />
      {/* segmented view toggle — sub-row */}
      <div style={{ padding: '2px 18px 10px', background: T.bg, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', background: T.lineSoft, borderRadius: 10, padding: 3 }}>
          {['list', 'calendar'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 11.5, fontWeight: 600,
              background: view === v ? '#fff' : 'transparent', color: view === v ? T.text : T.mute,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit',
            }}>
              <Icon name={v === 'list' ? 'list' : 'calendar'} size={12}/>
              {v === 'list' ? 'List' : 'Calendar'}
            </button>
          ))}
        </div>
      </div>
      <Screen>
        {view === 'list' && (
          <>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: T.muteDeep, padding: '8px 2px' }}>Today</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {JOBS.filter(j => j.date === '2026-03-15').map(j => (
                <JobCard key={j.id} job={j} variant="full" onClick={() => onOpenJob(j.id)}/>
              ))}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: T.muteDeep, padding: '16px 2px 8px' }}>Yesterday</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {JOBS.filter(j => j.date === '2026-03-14').map(j => <JobCard key={j.id} job={j} variant="full" onClick={() => onOpenJob(j.id)}/>)}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: T.muteDeep, padding: '16px 2px 8px' }}>Earlier this week</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {JOBS.filter(j => j.date < '2026-03-14').map(j => <JobCard key={j.id} job={j} variant="full" onClick={() => onOpenJob(j.id)}/>)}
            </div>
            <div style={{ height: 20 }}/>
          </>
        )}
        {view === 'calendar' && <MonthCalendar onOpenDay={onOpenDay}/>}
      </Screen>
      <TabBar active="jobs" onTab={onTab}/>
      <GestureBar/>
    </>
  );
}

function MonthCalendar({ onOpenDay }) {
  const daysInMonth = 31;
  const startDow = 0; // March 2026 starts Sunday — shift to Mon-grid: Sun=6
  // Brief says Mon-Sun rows. March 1 2026 was a Sunday → 6 empty cells before.
  const empty = 6;
  const cells = [];
  for (let i = 0; i < empty; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  // pseudo-counts
  const counts = {};
  cells.forEach(d => { if (d) counts[d] = Math.max(0, Math.floor((Math.sin(d * 2.3) + 1) * 3)); });
  counts[15] = 3; counts[14] = 2; // seed

  return (
    <div style={{ paddingTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}><Icon name="chevron_left" size={20}/></button>
        <div style={{
          padding: '6px 14px', background: '#fff', border: `1px solid ${T.line}`,
          borderRadius: 999, fontSize: 14, fontWeight: 700, display: 'flex', gap: 4, alignItems: 'center',
        }}>March 2026 <Icon name="chevron_down" size={14}/></div>
        <button style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}><Icon name="chevron_right" size={20}/></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 10, color: T.mute, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} style={{ aspectRatio: '1' }}/>;
          const c = counts[d] || 0;
          const isToday = d === 15;
          return (
            <div key={i} onClick={() => onOpenDay && onOpenDay(`2026-03-${String(d).padStart(2,'0')}`)} style={{
              aspectRatio: '1', background: heatColor(c),
              borderRadius: 8, padding: 4, position: 'relative', cursor: 'pointer',
              border: isToday ? `2px solid ${T.navy}` : '1px solid transparent',
              color: c >= 4 ? '#fff' : T.text,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1 }}>{d}</div>
              {c > 0 && (
                <div style={{
                  fontSize: 9, fontWeight: 600, fontFamily: MONO,
                  color: c >= 4 ? '#ffffffcc' : T.muteDeep,
                  lineHeight: 1,
                }}>{c}</div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, fontSize: 11, color: T.mute, fontWeight: 600 }}>
        <span>Less</span>
        {[0, 1, 3, 6, 8].map((n, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: heatColor(n) }}/>)}
        <span>More</span>
        <span style={{ marginLeft: 'auto' }}>Tap any day →</span>
      </div>
    </div>
  );
}

// ─── 8a. Day View ────────────────────────────────────────────────────────
function DayView({ onBack, onOpenJob, date = '2026-03-15' }) {
  const jobs = JOBS.filter(j => j.date === date);
  return (
    <>
      <StatusBar/>
      <div style={{ padding: '14px 20px 16px', background: T.navy, color: '#fff', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
          <Icon name="arrow_left" size={18}/> Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ background: '#ffffff22', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="chevron_left" size={20} color="#fff"/></button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>Wed, 15 March 2026</div>
            <div style={{ fontSize: 10, color: T.yellow, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>Today</div>
          </div>
          <button style={{ background: '#ffffff22', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="chevron_right" size={20} color="#fff"/></button>
        </div>
      </div>
      <Screen>
        {/* summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
          {[
            { l: 'Jobs', v: jobs.length },
            { l: 'Total idle', v: '8h 25m' },
            { l: 'Window', v: '09:14–16:20' },
            { l: 'Machines', v: 3 },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 10.5, color: T.mute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.l}</div>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, fontFamily: MONO, whiteSpace: 'nowrap' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* timeline */}
        <div style={{ marginTop: 22, position: 'relative' }}>
          {jobs.map((j, i) => (
            <React.Fragment key={j.id}>
              <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                <div style={{ width: 40, paddingTop: 12, textAlign: 'right', fontSize: 11, fontWeight: 600, color: T.muteDeep, fontFamily: MONO, flexShrink: 0 }}>{j.time}</div>
                <div style={{ position: 'relative', width: 10, flexShrink: 0 }}>
                  <div style={{ position: 'absolute', left: 4, top: 0, bottom: -8, width: 2, background: T.line }}/>
                  <div style={{ position: 'absolute', left: -1, top: 14, width: 12, height: 12, borderRadius: '50%', background: T.yellow, border: `2px solid #fff`, boxShadow: `0 0 0 1px ${T.line}` }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <JobCard job={j} variant="compact" onClick={() => onOpenJob(j.id)}/>
                </div>
              </div>
              {i < jobs.length - 1 && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}>
                  <div style={{ width: 40 }}/>
                  <div style={{ width: 10, display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 2, height: 20, background: T.line }}/>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.amber, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, fontFamily: MONO }}>
                    <Icon name="clock" size={11}/> 3h 12m idle
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <Btn kind="ghost" size="md" block icon="pdf" style={{ marginTop: 20 }}>Export this day as PDF</Btn>
        <div style={{ height: 16 }}/>
      </Screen>
      <GestureBar/>
    </>
  );
}

// ─── 9. Job Detail ───────────────────────────────────────────────────────
function JobDetail({ jobId = 127, onBack }) {
  const j = JOBS.find(x => x.id === jobId) || JOBS[0];
  const ReadField = ({ label, value, filled }) => (
    <div style={{ padding: '12px 14px', borderTop: `1px solid ${T.line}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muteDeep, whiteSpace: 'nowrap' }}>{label}</div>
        {filled && <Icon name="sparkle" size={11} color="#6A4BB7"/>}
      </div>
      <div style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>{value}</div>
    </div>
  );
  return (
    <>
      <StatusBar/>
      <AppBar
        title={j.machine}
        subtitle={`#${j.id} · ${j.dept}`}
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="arrow_left" size={22}/></button>}
        right={<button style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="menu_dots" size={22}/></button>}
      />
      <Screen padded={false}>
        {/* offline banner */}
        {j.status === 'awaiting-tl' && (
          <div style={{ background: T.amberSoft, color: '#8C4A00', padding: '10px 20px', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="cloud_off" size={16}/> Saved locally · will sync when online
          </div>
        )}
        {/* photo carousel */}
        <div style={{ padding: '12px 20px 4px' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
            {Array.from({ length: j.photos }).map((_, i) => (
              <PhotoBox key={i} seed={j.id + i} style={{ width: 240, height: 180, flexShrink: 0 }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            {Array.from({ length: j.photos }).map((_, i) => (
              <div key={i} style={{ width: i === 0 ? 14 : 6, height: 6, borderRadius: 3, background: i === 0 ? T.navy : T.line }}/>
            ))}
          </div>
        </div>

        {/* voice clips strip */}
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: T.muteDeep, marginBottom: 8 }}>Voice clips</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {Array.from({ length: j.clips }).map((_, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: '#fff', border: `1px solid ${T.line}`, borderRadius: 999, flexShrink: 0,
              }}>
                <button style={{ width: 28, height: 28, borderRadius: '50%', background: T.navy, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Icon name="play" size={12} color="#fff"/>
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: MONO }}>0:{i === 0 ? '42' : '18'}</span>
                <LangBadge lang={i === 0 ? 'si' : 'en'}/>
              </div>
            ))}
          </div>
        </div>

        {/* structured fields */}
        <div style={{ margin: '0 20px', background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pill bg={j.status === 'complete' ? T.emeraldSoft : T.amberSoft} color={j.status === 'complete' ? '#0D6B39' : '#8C4A00'}>
                {j.status === 'complete' ? 'Complete' : 'Awaiting TL'}
              </Pill>
              <span style={{ fontSize: 12, color: T.mute }}>· {j.date} · {j.time}</span>
            </div>
          </div>
          <ReadField label="Inventory #" value={j.inv}/>
          <ReadField label="Description" value={j.desc} filled/>
          <ReadField label="Root cause" value={j.rootCause} filled/>
          <ReadField label="Corrective action" value={j.action} filled/>
          {j.remarks && <ReadField label="Remarks" value={j.remarks}/>}
          <div style={{ display: 'flex', borderTop: `1px solid ${T.line}` }}>
            {['A 0:20', 'B 0:35', 'C 2:15', 'D 1:10'].map((v, i) => (
              <div key={i} style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${T.line}` : 'none' }}>
                <div style={{ fontSize: 11, color: T.mute, fontWeight: 700 }}>{v.split(' ')[0]}</div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, marginTop: 2 }}>{v.split(' ')[1]}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 14px', background: T.lineSoft, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Total idle time</span>
            <span style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO, color: T.navy }}>{j.idle}</span>
          </div>
        </div>

        <div style={{ padding: 20, display: 'flex', gap: 8 }}>
          <Btn kind="ghost" size="md" icon="edit" style={{ flex: 1 }}>Edit</Btn>
          <Btn kind="navy" size="md" icon="pdf" style={{ flex: 1 }}>Export</Btn>
          <Btn kind="ghost" size="md" icon="copy" style={{ flex: 1 }}>Duplicate</Btn>
        </div>
      </Screen>
      <GestureBar/>
    </>
  );
}

Object.assign(window, { NewJobReview, NewJobSignoff, FiledSuccessScreen, JobsScreen, MonthCalendar, DayView, JobDetail });
