// screens-a.jsx — Splash, Sign In, Permissions, Home, New Job (3 steps), Camera, Voice sheet

// ─── 1. Splash ───────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div style={{
      flex: 1, background: T.ink, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 18, background: T.yellow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 6px ${T.yellow}22`,
      }}>
        <Icon name="wrench" size={38} color={T.ink} weight={2.2}/>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>MendLog</div>
        <div style={{ color: '#6a655a', fontSize: 12, fontWeight: 500, marginTop: 4 }}>Field journal for fixers.</div>
      </div>
      <div style={{ position: 'absolute', bottom: 40, color: '#6a655a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        v0.1 · Syncing session…
      </div>
    </div>
  );
}

// ─── 2. Sign In ──────────────────────────────────────────────────────────
function SignInScreen() {
  return (
    <>
      <StatusBar/>
      <Screen padded={true} style={{ padding: '32px 24px 24px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: T.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 48,
        }}>
          <Icon name="wrench" size={22} color={T.yellow} weight={2.2}/>
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.15 }}>Welcome back.</div>
        <div style={{ fontSize: 13, color: T.textDim, marginTop: 6, lineHeight: 1.5 }}>
          Sign in with the email your supervisor provisioned.
        </div>
        <div style={{ marginTop: 36 }}>
          <label style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: T.muteDeep }}>Email</label>
          <div style={{
            border: `1px solid ${T.line}`, borderRadius: 10, padding: '12px 13px',
            marginTop: 5, background: '#fff', fontSize: 13.5, color: T.text,
          }}>nuwan.p@kramski.lk</div>
          <label style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: T.muteDeep, marginTop: 14, display: 'block' }}>Password</label>
          <div style={{
            border: `1.5px solid ${T.navy}`, borderRadius: 10, padding: '12px 13px',
            marginTop: 5, background: '#fff', fontSize: 13.5, color: T.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>••••••••••</span>
            <Icon name="eye" size={18} color={T.mute}/>
          </div>
        </div>
        <Btn kind="primary" size="lg" block style={{ marginTop: 24 }}>Sign in</Btn>
        <div style={{ textAlign: 'center', margin: '18px 0', fontSize: 12, color: T.mute, letterSpacing: 0.5 }}>OR</div>
        <Btn kind="ghost" size="lg" block icon="link">Send me a magic link</Btn>
        <div style={{
          marginTop: 28, padding: 14, borderRadius: 12, background: T.lineSoft,
          fontSize: 12.5, color: T.textDim, lineHeight: 1.55,
        }}>
          <strong style={{ color: T.text }}>First time?</strong> Your admin sets up accounts —
          there's no sign-up here. Ask your supervisor for an invite.
        </div>
      </Screen>
      <GestureBar/>
    </>
  );
}

// ─── 3. Permissions onboarding ───────────────────────────────────────────
function PermissionsScreen({ step = 1 }) {
  const perms = [
    { icon: 'mic', title: 'Microphone', reason: 'Record voice memos in Sinhala or English while you fix things.', cta: 'Grant mic access' },
    { icon: 'camera', title: 'Camera', reason: 'Capture photos of the fault, parts, and finished repair.', cta: 'Grant camera access' },
    { icon: 'photo', title: 'Photo library', reason: 'Attach existing photos when you already took some.', cta: 'Grant library access', skip: true },
  ];
  const p = perms[step - 1];
  return (
    <>
      <StatusBar/>
      <Screen padded={true} style={{ padding: '24px 24px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {perms.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2, flex: 1,
              background: i < step ? T.navy : T.line,
            }}/>
          ))}
        </div>
        <div style={{
          width: 96, height: 96, borderRadius: 24, background: T.yellow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '32px auto 28px',
        }}>
          <Icon name={p.icon} size={48} color={T.ink} weight={2}/>
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, textAlign: 'center' }}>{p.title}</div>
        <div style={{ fontSize: 13.5, color: T.textDim, textAlign: 'center', marginTop: 10, lineHeight: 1.5, padding: '0 8px' }}>
          {p.reason}
        </div>
        <div style={{ flex: 1 }}/>
        <Btn kind="navy" size="lg" block>{p.cta}</Btn>
        {p.skip && (
          <Btn kind="ghost" size="md" block style={{ marginTop: 10, border: 'none', color: T.mute }}>Skip for now</Btn>
        )}
        <div style={{ fontSize: 11, color: T.mute, textAlign: 'center', marginTop: 16 }}>Step {step} of 3</div>
      </Screen>
      <GestureBar/>
    </>
  );
}

// ─── 4. Home ─────────────────────────────────────────────────────────────
function HomeScreen({ onTab = () => {}, onOpenJob = () => {}, onOpenDay = () => {} }) {
  const todayJobs = JOBS.filter(j => j.date === '2026-03-15');
  return (
    <>
      <StatusBar/>
      <AppBar title="Hello, Nuwan" subtitle="Wednesday · 15 March" sync="pending"
        left={<div style={{ width: 40, height: 40, borderRadius: 12, background: T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>NP</div>}
      />
      <Screen>
        {/* Today card */}
        <div style={{
          background: T.ink, color: '#fff', borderRadius: 20, padding: 20, marginTop: 8,
          backgroundImage: `radial-gradient(circle at 90% 10%, ${T.yellow}22, transparent 50%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: '#a8a499', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Today</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1 }}>3</span>
                <span style={{ fontSize: 13, color: '#d2cec0', fontWeight: 500 }}>jobs</span>
              </div>
            </div>
            <div onClick={() => onOpenDay('2026-03-15')} style={{
              fontSize: 12, color: T.yellow, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
            }}>See full day <Icon name="chevron_right" size={14}/></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {todayJobs.map(j => (
              <div key={j.id} onClick={() => onOpenJob(j.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                background: '#ffffff0a', borderRadius: 10, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.yellow, fontFamily: MONO, minWidth: 44 }}>{j.time}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.machine}</span>
                <Icon name="chevron_right" size={16} color="#66625a"/>
              </div>
            ))}
          </div>
        </div>

        {/* Contribution grid (compact) */}
        <div style={{ marginTop: 20 }}>
          <SectionLabel right={<span onClick={() => onTab('me')} style={{ fontSize: 11, color: T.navy, fontWeight: 700, cursor: 'pointer' }}>See full year →</span>}>Activity — last 12 weeks</SectionLabel>
          <Card padded={false} style={{ padding: 16 }}>
            <ContributionGrid variant="compact" weeks={12} onCellTap={c => onOpenDay(c.date)}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 10.5, color: T.mute, fontWeight: 600 }}>
              <span>Less</span>
              {[0, 1, 3, 6, 8].map((n, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: heatColor(n) }}/>)}
              <span>More</span>
              <span style={{ marginLeft: 'auto', color: T.muteDeep }}>🔥 3-day streak</span>
            </div>
          </Card>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
          {[
            { l: 'This week', v: '11', s: 'jobs' },
            { l: 'Avg idle', v: '2.4h', s: 'per job' },
            { l: 'Streak', v: '3', s: 'days' },
          ].map((s, i) => (
            <Card key={i} style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: T.mute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4, marginTop: 3 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: T.mute }}>{s.s}</div>
            </Card>
          ))}
        </div>

        {/* Primary FAB duplicate */}
        <Btn kind="primary" size="lg" block icon="plus" style={{ marginTop: 20 }} onClick={() => onTab('new')}>
          New Job
        </Btn>
        <div style={{ height: 12 }}/>
      </Screen>
      <TabBar active="home" onTab={onTab}/>
      <GestureBar/>
    </>
  );
}

// ─── 5. New Job — Step 1: Capture ────────────────────────────────────────
function NewJobCapture({ onNext, onBack, onOpenCam, onOpenVoice, photos = 2, clips = 1, recording = false }) {
  const photoSlots = Array.from({ length: 4 });
  return (
    <>
      <StatusBar/>
      <AppBar
        title="New Job"
        subtitle="Step 1 of 3 · Capture"
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="x" size={22}/></button>}
        right={<Pill bg={T.lineSoft} color={T.muteDeep}>Draft</Pill>}
      />
      <Screen>
        {/* Photo grid */}
        <SectionLabel right={<span style={{ fontSize: 11, color: T.mute, fontWeight: 500 }}>{photos}/12</span>}>Photos</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <button onClick={onOpenCam} style={{
            aspectRatio: '1', border: `1.5px dashed ${T.navy}`, borderRadius: 10, background: '#E8EFF7',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer',
          }}>
            <Icon name="camera" size={20} color={T.navy}/>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.navy }}>Add</span>
          </button>
          {photoSlots.slice(0, photos).map((_, i) => (
            <PhotoBox key={i} seed={i + 12} style={{ aspectRatio: '1' }}/>
          ))}
        </div>

        {/* Record area */}
        <div style={{
          marginTop: 28, padding: '28px 16px 20px',
          background: '#fff', border: `1px solid ${T.line}`, borderRadius: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11.5, color: T.mute, fontWeight: 600, marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {recording ? 'Recording' : 'Speak the job'}
          </div>
          <button onClick={onOpenVoice} style={{
            width: 136, height: 136, borderRadius: '50%',
            background: recording ? T.red : T.yellow,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: recording
              ? `0 0 0 8px ${T.red}22, 0 0 0 16px ${T.red}10`
              : `0 12px 40px -8px ${T.yellow}99`,
            position: 'relative',
            animation: recording ? 'pulsing 1.5s ease-in-out infinite' : 'none',
          }}>
            <Icon name={recording ? 'record' : 'mic'} size={56} color={T.ink} weight={2}/>
            <style>{`@keyframes pulsing { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }`}</style>
          </button>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 20, letterSpacing: -0.2, color: T.text, whiteSpace: 'nowrap' }}>
            {recording ? '0:14' : 'Tap to record'}
          </div>
          {recording && (
            <>
              <Waveform active color={T.navy} style={{ marginTop: 10 }}/>
              <Pill bg="#EAD8F0" color="#6A1E88" style={{ marginTop: 10 }}>Detected: සිංහල</Pill>
            </>
          )}
          {!recording && (
            <div style={{ fontSize: 11.5, color: T.mute, marginTop: 6, whiteSpace: 'nowrap' }}>Tap to toggle · gloves-friendly</div>
          )}
        </div>

        {/* Existing clips */}
        {clips > 0 && (
          <>
            <SectionLabel>Voice clips ({clips})</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Card padded={false} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={{ width: 34, height: 34, borderRadius: '50%', background: T.navy, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  <Icon name="play" size={14} color="#fff"/>
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Clip 01 · 0:42</div>
                  <div style={{ fontSize: 11, color: T.emerald, fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="check" size={11}/> Transcribed
                  </div>
                </div>
                <LangBadge lang="si"/>
              </Card>
              <Card padded={false} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button style={{ width: 34, height: 34, borderRadius: '50%', background: T.lineSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="spinner" size={14} color={T.muteDeep} style={{ animation: 'spin 1.5s linear infinite' }}/>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Clip 02 · 0:18</div>
                  <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginTop: 2 }}>Transcribing…</div>
                </div>
                <LangBadge lang="en"/>
              </Card>
            </div>
          </>
        )}

        {/* Quick chips */}
        <SectionLabel>Machine</SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Injection Molder #3', 'CNC Lathe B-7', 'Conveyor Line 2', '+ other'].map((m, i) => (
            <div key={i} style={{
              padding: '9px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
              background: i === 0 ? T.navy : '#fff', color: i === 0 ? '#fff' : T.text,
              border: `1px solid ${i === 0 ? T.navy : T.line}`, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>{m}</div>
          ))}
        </div>
        <SectionLabel>Department</SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Moulding', 'Machining', 'Packaging', '+'].map((m, i) => (
            <div key={i} style={{
              padding: '10px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: i === 0 ? T.navy : '#fff', color: i === 0 ? '#fff' : T.text,
              border: `1px solid ${i === 0 ? T.navy : T.line}`, cursor: 'pointer',
            }}>{m}</div>
          ))}
        </div>
        <div style={{ height: 80 }}/>
      </Screen>
      <div style={{ padding: '10px 20px 8px', background: '#fff', borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
        <Btn kind="primary" size="lg" block onClick={onNext} icon="arrow_right" style={{ flexDirection: 'row-reverse', whiteSpace: 'nowrap' }}>
          Review &amp; file
        </Btn>
      </div>
      <GestureBar/>
    </>
  );
}

// ─── 10. Camera full-screen ──────────────────────────────────────────────
function CameraScreen({ onClose, count = 3 }) {
  return (
    <>
      <StatusBar dark/>
      <div style={{
        flex: 1, background: '#000', position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* viewfinder */}
        <div style={{
          flex: 1, position: 'relative',
          backgroundImage: `radial-gradient(circle at 55% 45%, #333, #000 70%)`,
        }}>
          {/* faux machine visible */}
          <div style={{
            position: 'absolute', left: '30%', top: '40%', width: '45%', height: '28%',
            background: 'linear-gradient(140deg, #6b7280, #374151)',
            borderRadius: 6, transform: 'rotate(-6deg)', opacity: 0.9,
            boxShadow: '0 0 60px rgba(0,0,0,0.8)',
          }}/>
          {/* top controls */}
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 16px' }}>
            <button onClick={onClose} style={{
              width: 40, height: 40, borderRadius: '50%', background: '#00000088',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}><Icon name="x" size={22} color="#fff"/></button>
            <button style={{
              width: 40, height: 40, borderRadius: '50%', background: '#00000088',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}><Icon name="flash" size={20} color={T.yellow}/></button>
          </div>
          {/* focus frame */}
          <div style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: 80, height: 80, border: '2px solid #ffffff66', borderRadius: 6,
          }}/>
        </div>
        {/* thumb strip + shutter */}
        <div style={{ padding: '14px 16px 24px', background: '#000', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {Array.from({ length: count }).map((_, i) => (
              <PhotoBox key={i} seed={i + 20} size={54} style={{ borderRadius: 6, border: '2px solid #fff', flexShrink: 0 }}/>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 52 }}/>
            <button style={{
              width: 78, height: 78, borderRadius: '50%', background: '#fff',
              border: '4px solid #fff', boxShadow: '0 0 0 4px #ffffff44',
              cursor: 'pointer',
            }}/>
            <button style={{
              padding: '10px 14px', borderRadius: 999, background: T.yellow,
              border: 'none', fontSize: 12.5, fontWeight: 600, color: T.ink, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
            }}>Done · {count} <Icon name="check" size={14} weight={2.4}/></button>
          </div>
        </div>
      </div>
      <GestureBar dark/>
    </>
  );
}

// ─── 11. Voice Recorder Sheet ────────────────────────────────────────────
function VoiceSheet({ onClose }) {
  return (
    <>
      <StatusBar/>
      {/* dimmed underlay */}
      <div style={{ flex: 1, background: '#000000cc', position: 'relative' }}>
        <div style={{
          padding: '20px 16px 16px', fontSize: 13, color: '#aaa', textAlign: 'center',
        }}>(new-job screen underneath)</div>
        {/* sheet */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '12px 20px 24px',
        }}>
          {/* grabber */}
          <div style={{ width: 40, height: 4, background: T.line, borderRadius: 2, margin: '0 auto 16px' }}/>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pill bg="#EAD8F0" color="#6A1E88" style={{ padding: '6px 12px', fontSize: 12 }}>
              Detected: සිංහල · tap to change
            </Pill>
            <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: T.navy }}>0:24</span>
          </div>

          {/* Record button */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <button style={{
              width: 108, height: 108, borderRadius: '50%', background: T.red, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              boxShadow: `0 0 0 8px ${T.red}22, 0 0 0 18px ${T.red}10`,
              animation: 'pulsing 1.4s ease-in-out infinite',
            }}>
              <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 6 }}/>
            </button>
          </div>

          <Waveform active color={T.navy} count={40} style={{ margin: '12px 0', justifyContent: 'center' }}/>

          {/* Transcript preview */}
          <div style={{
            background: T.lineSoft, borderRadius: 14, padding: 14,
            fontSize: 14, lineHeight: 1.55, color: T.text, minHeight: 88,
          }}>
            <div style={{ fontSize: 11, color: T.muteDeep, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Live transcript</div>
            Oil leaking from hydraulic pump near the base. Replaced gasket, tested five cycles,{' '}
            <span style={{ background: T.yellow + '55', padding: '0 3px', borderRadius: 3 }}>pressure now holding at eight bar</span>
            <span style={{ borderRight: `2px solid ${T.navy}`, marginLeft: 2, animation: 'blink 1s infinite' }}>&nbsp;</span>
            <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn kind="ghost" size="md" style={{ flex: 1, minWidth: 0 }} onClick={onClose}>Cancel</Btn>
            <Btn kind="primary" size="md" style={{ flex: 2, minWidth: 0 }}>Save clip</Btn>
          </div>
        </div>
      </div>
      <GestureBar/>
    </>
  );
}

Object.assign(window, { SplashScreen, SignInScreen, PermissionsScreen, HomeScreen, NewJobCapture, CameraScreen, VoiceSheet });
