// screens-c.jsx — Search, Search detail, Profile, Settings, PDF, Sync queue

// ─── 12. Search ──────────────────────────────────────────────────────────
function SearchScreen({ onTab, onOpenResult }) {
  const results = [
    { id: 122, machine: 'Dye Mixer 04', date: '12 Mar 2026', sim: 94, snippet: 'oil leak near hydraulic pump — gasket degraded from heat cycling', lang: 'si' },
    { id: 127, machine: 'Injection Molder #3', date: '15 Mar 2026', sim: 82, snippet: 'hydraulic seal failure on main cylinder — pressure dropped', lang: 'si' },
    { id: 98, machine: 'Hydraulic Press 01', date: '02 Feb 2026', sim: 71, snippet: 'slow retraction, oil residue under the base plate', lang: 'en' },
    { id: 64, machine: 'Dye Mixer 04', date: '11 Dec 2025', sim: 58, snippet: 'pump mounting bolts loose after vibration, retorqued', lang: 'si' },
  ];
  return (
    <>
      <StatusBar/>
      <div style={{ padding: '14px 20px 10px', background: T.bg, flexShrink: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginBottom: 10 }}>Search</div>
        <div style={{
          background: '#fff', border: `1.5px solid ${T.navy}`, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 4px 14px',
        }}>
          <Icon name="search" size={18} color={T.navy}/>
          <div style={{ flex: 1, fontSize: 14, padding: '10px 0', color: T.text }}>
            oil leak hydraulic pump
          </div>
          <span style={{
            background: T.lineSoft, borderRadius: 8, padding: '4px 8px',
            fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="photo" size={12}/> IMG_4427.jpg <Icon name="x" size={12}/>
          </span>
          <button style={{ width: 34, height: 34, borderRadius: 10, background: T.lineSoft, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="camera" size={16}/>
          </button>
        </div>
        <div style={{ fontSize: 11.5, color: T.mute, marginTop: 8, lineHeight: 1.4 }}>
          Describe the fault, paste an error code, or add a photo.
        </div>
      </div>
      <Screen>
        <SectionLabel>4 similar past jobs</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map(r => (
            <div key={r.id} onClick={() => onOpenResult(r.id)} style={{
              background: '#fff', border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.mute }}>#{r.id}</span>
                <LangBadge lang={r.lang}/>
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: T.line, overflow: 'hidden' }}>
                    <div style={{ width: `${r.sim}%`, height: '100%', background: T.emerald }}/>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.emerald, minWidth: 28 }}>{r.sim}%</span>
                </span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: -0.2 }}>{r.machine}</div>
              <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>{r.date}</div>
              <div style={{ fontSize: 13, color: T.textDim, marginTop: 8, lineHeight: 1.5 }}>
                "…{r.snippet.split(' ').map((w, i) => (
                  <span key={i} style={['oil', 'leak', 'hydraulic', 'pump'].includes(w.toLowerCase()) ? { background: T.yellow + '55', padding: '0 2px', borderRadius: 2 } : {}}>{w} </span>
                ))}…"
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 20 }}/>
      </Screen>
      <TabBar active="search" onTab={onTab}/>
      <GestureBar/>
    </>
  );
}

// ─── 13. Search Result Detail ────────────────────────────────────────────
function SearchResultDetail({ onBack, onNewFromResult }) {
  const j = JOBS.find(x => x.id === 122) || JOBS[0];
  return (
    <>
      <StatusBar/>
      <AppBar
        title={j.machine} subtitle="Search result · 94% match"
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="arrow_left" size={22}/></button>}
      />
      <Screen>
        {/* Why this matched */}
        <div style={{
          background: '#F0E9FB', border: `1px solid #D5C5F0`, borderRadius: 14, padding: 14, marginTop: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="sparkle" size={16} color="#6A4BB7"/>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6A4BB7', letterSpacing: 1.2 }}>WHY THIS MATCHED</div>
          </div>
          <div style={{ fontSize: 13, color: '#3D2A6A', lineHeight: 1.55 }}>
            Matched on: <strong>"oil leak near hydraulic pump"</strong>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginTop: 10, fontSize: 13, color: T.text, lineHeight: 1.55, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <button style={{ width: 28, height: 28, borderRadius: '50%', background: T.navy, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
              <Icon name="play" size={12} color="#fff"/>
            </button>
            <div>
              <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, marginBottom: 4 }}>Clip 01 · 0:28 · සිංහල</div>
              "…<span style={{ background: T.yellow + '66', padding: '0 3px', borderRadius: 3 }}>oil leak near hydraulic pump</span>, gasket looked burned on one side, heat discolouration…"
            </div>
          </div>
        </div>

        <SectionLabel>Photos</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => <PhotoBox key={i} seed={j.id + i + 5} style={{ aspectRatio: '1' }}/>)}
        </div>

        <SectionLabel>Diagnosis</SectionLabel>
        <Card>
          <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>Root cause</div>
          <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>{j.rootCause}</div>
          <div style={{ fontSize: 11, color: T.mute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 14 }}>Corrective action</div>
          <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>{j.action}</div>
        </Card>

        <Btn kind="primary" size="lg" block icon="copy" style={{ marginTop: 20 }} onClick={onNewFromResult}>
          Copy diagnosis to new job
        </Btn>
        <div style={{ height: 20 }}/>
      </Screen>
      <GestureBar/>
    </>
  );
}

// ─── 14. Profile / Me ────────────────────────────────────────────────────
function ProfileScreen({ onTab, onOpenDay, onOpenCalendar }) {
  const [year, setYear] = React.useState('this');
  return (
    <>
      <StatusBar/>
      <AppBar title="Me" left={null}/>
      <Screen>
        {/* Header card */}
        <div style={{
          background: T.ink, color: '#fff', borderRadius: 20, padding: 20,
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: T.yellow, color: T.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, flexShrink: 0,
          }}>NP</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3 }}>Nuwan Perera</div>
            <div style={{ fontSize: 12, color: '#b9b5a8' }}>Maintenance Technician · 6 yrs</div>
            <div style={{ fontSize: 11, color: '#7a7568', marginTop: 3 }}>Member since Feb 2024</div>
          </div>
        </div>

        {/* Year selector */}
        <div style={{ display: 'flex', gap: 6, marginTop: 18, overflowX: 'auto' }}>
          {[['this', 'This year'], ['last', '2025'], ['2024', '2024']].map(([k, l]) => (
            <button key={k} onClick={() => setYear(k)} style={{
              padding: '7px 14px', borderRadius: 999, border: `1px solid ${year === k ? T.navy : T.line}`,
              background: year === k ? T.navy : '#fff', color: year === k ? '#fff' : T.text,
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            }}>{l}</button>
          ))}
        </div>

        {/* Full contribution grid */}
        <Card style={{ marginTop: 12, padding: 16 }}>
          <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
            <ContributionGrid variant="full" weeks={52} onCellTap={c => onOpenDay(c.date)}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 11, color: T.mute, fontWeight: 600 }}>
            <span>Less</span>
            {[0, 1, 3, 6, 8].map((n, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: 3, background: heatColor(n) }}/>)}
            <span>More</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, color: T.textDim, lineHeight: 1.5 }}>
            <strong style={{ color: T.text }}>167 jobs</strong> in the last year.
            Longest streak: <strong style={{ color: T.text }}>14 days</strong>.
            Current streak: <strong style={{ color: T.emerald }}>3 days</strong>.
          </div>
        </Card>

        {/* Stat tiles 2x2 */}
        <SectionLabel>Stats</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { l: 'Total jobs', v: '167', s: 'all time' },
            { l: 'Avg idle', v: '2.4h', s: 'per job' },
            { l: 'Top cause', v: 'Seal wear', s: '32 jobs' },
            { l: 'Top machine', v: 'Molder #3', s: '41 jobs' },
          ].map((s, i) => (
            <Card key={i} style={{ padding: 14 }}>
              <div style={{ fontSize: 10, color: T.mute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
              <div style={{ fontSize: 19, fontWeight: 600, marginTop: 3, letterSpacing: -0.3 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: T.mute, marginTop: 2 }}>{s.s}</div>
            </Card>
          ))}
        </div>

        <Btn kind="ghost" size="md" block icon="calendar" style={{ marginTop: 16 }} onClick={onOpenCalendar}>
          Open calendar
        </Btn>
        <div style={{ marginTop: 20, borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
          <div onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px', cursor: 'pointer' }}>
            <Icon name="settings" size={18} color={T.muteDeep}/>
            <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Settings</span>
            <Icon name="chevron_right" size={16} color={T.mute}/>
          </div>
        </div>
        <div style={{ height: 12 }}/>
      </Screen>
      <TabBar active="me" onTab={onTab}/>
      <GestureBar/>
    </>
  );
}

// ─── 15. Settings ────────────────────────────────────────────────────────
function SettingsScreen({ onBack }) {
  const Row = ({ icon, label, value, toggle, danger }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
      borderTop: `1px solid ${T.line}`,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: T.lineSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={danger ? T.red : T.muteDeep}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? T.red : T.text }}>{label}</div>
      </div>
      {toggle ? (
        <div style={{ width: 36, height: 20, borderRadius: 10, background: T.emerald, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 2, left: 18, width: 16, height: 16, borderRadius: '50%', background: '#fff' }}/>
        </div>
      ) : (
        <>
          {value && <span style={{ fontSize: 12, color: T.mute, marginRight: 4 }}>{value}</span>}
          <Icon name="chevron_right" size={16} color={T.mute}/>
        </>
      )}
    </div>
  );
  return (
    <>
      <StatusBar/>
      <AppBar title="Settings"
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="arrow_left" size={22}/></button>}/>
      <Screen>
        <SectionLabel>Account</SectionLabel>
        <Card padded={false}>
          <div style={{ padding: '14px' }}>
            <div style={{ fontSize: 11, color: T.mute, fontWeight: 600 }}>Signed in as</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>nuwan.p@kramski.lk</div>
          </div>
          <Row icon="logout" label="Sign out" danger/>
        </Card>
        <SectionLabel>Language</SectionLabel>
        <Card padded={false}>
          <Row icon="globe" label="App language" value="English"/>
          <Row icon="mic" label="Transcription" value="Auto-detect"/>
        </Card>
        <SectionLabel>Workflow</SectionLabel>
        <Card padded={false}>
          <Row icon="signature" label="Default signature" value="Saved"/>
          <Row icon="cloud" label="Sync status" value="Up to date"/>
          <Row icon="refresh" label="Force sync now"/>
          <Row icon="download" label="Export all data" value="ZIP"/>
        </Card>
        <SectionLabel>About</SectionLabel>
        <Card padded={false}>
          <Row icon="info" label="Version" value="0.1.4"/>
          <Row icon="lock" label="Licenses"/>
        </Card>
        <div style={{ height: 20 }}/>
      </Screen>
      <GestureBar/>
    </>
  );
}

// ─── 16. PDF Export Preview ─────────────────────────────────────────────
function PDFExport({ onBack }) {
  return (
    <>
      <StatusBar dark/>
      <div style={{ background: '#2a2a2a', padding: '14px 20px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="x" size={22} color="#fff"/></button>
        <div style={{ flex: 1, color: '#fff' }}>
          <div style={{ fontSize: 10, color: '#9a9a9a', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Preview</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Job #127 · F-04-041-2-lk</div>
        </div>
        <button style={{ background: '#ffffff22', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="share" size={18} color="#fff"/>
        </button>
      </div>
      <div style={{ flex: 1, background: '#2a2a2a', overflow: 'auto', padding: 20 }}>
        {/* A4 sheet */}
        <div style={{ background: '#fff', padding: '20px 18px', borderRadius: 4, fontSize: 10, color: '#000', lineHeight: 1.4, fontFamily: '"Times New Roman", serif' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>MACHINE BREAKDOWN REPORT</div>
            <div style={{ fontSize: 8, marginTop: 2 }}>Form F-04-041-2-lk · Rev 3</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <tbody>
              {[
                ['Machine', 'Injection Molder #3', 'Inv. #', 'INV-0331'],
                ['Dept.', 'Moulding', 'Date', '15/03/2026'],
                ['Time reported', '09:14', 'Time completed', '13:34'],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ border: '1px solid #000', padding: '4px 6px', fontWeight: j % 2 === 0 ? 700 : 400, width: j % 2 === 0 ? '18%' : '32%' }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 8 }}>
            <div style={{ border: '1px solid #000', padding: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 9 }}>Description of failure</div>
              <div style={{ minHeight: 28, fontSize: 9, marginTop: 3 }}>Machine stopped mid-cycle. Loud hiss from rear hydraulic unit.</div>
            </div>
            <div style={{ border: '1px solid #000', padding: 6, borderTop: 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 9 }}>Root cause</div>
              <div style={{ minHeight: 28, fontSize: 9, marginTop: 3 }}>Hydraulic seal failure on main cylinder.</div>
            </div>
            <div style={{ border: '1px solid #000', padding: 6, borderTop: 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 9 }}>Corrective action</div>
              <div style={{ minHeight: 36, fontSize: 9, marginTop: 3 }}>Replaced main cylinder seal kit (HC-0831), refilled ISO 46, ran 5 dry cycles.</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: 9 }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: 4, fontWeight: 700 }}>A. Man power</td><td style={{ border: '1px solid #000', padding: 4 }}>0:20</td>
                <td style={{ border: '1px solid #000', padding: 4, fontWeight: 700 }}>B. Identification</td><td style={{ border: '1px solid #000', padding: 4 }}>0:35</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: 4, fontWeight: 700 }}>C. Spare parts</td><td style={{ border: '1px solid #000', padding: 4 }}>2:15</td>
                <td style={{ border: '1px solid #000', padding: 4, fontWeight: 700 }}>D. Restoration</td><td style={{ border: '1px solid #000', padding: 4 }}>1:10</td>
              </tr>
              <tr>
                <td colSpan="3" style={{ border: '1px solid #000', padding: 4, fontWeight: 700, textAlign: 'right' }}>Total idle time</td>
                <td style={{ border: '1px solid #000', padding: 4, fontWeight: 700 }}>4:20</td>
              </tr>
            </tbody>
          </table>
          <div style={{ display: 'flex', marginTop: 12, gap: 10 }}>
            <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: 4 }}>
              <Signature color="#000"/>
              <div style={{ fontSize: 9, fontWeight: 700 }}>Technician · N. Perera</div>
            </div>
            <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: 4 }}>
              <div style={{ height: 60, fontSize: 8, color: '#888', textAlign: 'center', paddingTop: 20 }}>(awaiting)</div>
              <div style={{ fontSize: 9, fontWeight: 700 }}>Team Leader</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 20px 8px', background: '#1a1a1a', display: 'flex', gap: 10, flexShrink: 0 }}>
        <Btn kind="ghost" size="md" icon="download" style={{ flex: 1, background: '#ffffff11', color: '#fff', borderColor: '#ffffff22' }}>Save</Btn>
        <Btn kind="primary" size="md" icon="share" style={{ flex: 2 }}>Share PDF</Btn>
      </div>
      <GestureBar dark/>
    </>
  );
}

// ─── 17. Sync / Offline queue ────────────────────────────────────────────
function SyncQueue({ onBack }) {
  const items = [
    { id: 127, machine: 'Injection Molder #3', state: 'uploading', prog: 62 },
    { id: 126, machine: 'CNC Lathe B-7', state: 'pending' },
    { id: 125, machine: 'Conveyor Line 2', state: 'error' },
  ];
  return (
    <>
      <StatusBar/>
      <AppBar title="Sync queue" subtitle="3 jobs not yet on the server"
        left={<button onClick={onBack} style={{ border: 'none', background: 'none', padding: 6, cursor: 'pointer' }}><Icon name="arrow_left" size={22}/></button>}
        right={<SyncDot state="pending"/>}/>
      <Screen>
        <div style={{
          background: T.amberSoft, color: '#8C4A00', borderRadius: 12, padding: '12px 14px',
          fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
        }}>
          <Icon name="cloud_off" size={18}/>
          <div style={{ flex: 1, lineHeight: 1.45 }}>
            <strong>On cellular data.</strong> Uploads paused — will resume on Wi-Fi.
          </div>
        </div>

        <SectionLabel right={<span style={{ fontSize: 11, color: T.navy, fontWeight: 700 }}>Retry all</span>}>Queue</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(it => (
            <Card key={it.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: it.state === 'error' ? T.redSoft : it.state === 'uploading' ? '#E8EFF7' : T.lineSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: it.state === 'error' ? T.red : it.state === 'uploading' ? T.navy : T.muteDeep,
                }}>
                  <Icon name={it.state === 'error' ? 'warning' : it.state === 'uploading' ? 'cloud' : 'clock'} size={20}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>#{it.id} · {it.machine}</div>
                  <div style={{ fontSize: 11.5, color: it.state === 'error' ? T.red : T.mute, marginTop: 2, fontWeight: it.state === 'error' ? 600 : 500 }}>
                    {it.state === 'uploading' && `Uploading · ${it.prog}%`}
                    {it.state === 'pending' && 'Waiting for Wi-Fi'}
                    {it.state === 'error' && 'Failed — tap retry'}
                  </div>
                  {it.state === 'uploading' && (
                    <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: T.line, overflow: 'hidden' }}>
                      <div style={{ width: `${it.prog}%`, height: '100%', background: T.navy }}/>
                    </div>
                  )}
                </div>
                <button style={{
                  padding: '8px 12px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700,
                  background: it.state === 'error' ? T.red : T.lineSoft,
                  color: it.state === 'error' ? '#fff' : T.text, cursor: 'pointer',
                }}>
                  {it.state === 'error' ? 'Retry' : it.state === 'uploading' ? 'Pause' : 'Retry'}
                </button>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ height: 20 }}/>
      </Screen>
      <GestureBar/>
    </>
  );
}

Object.assign(window, { SearchScreen, SearchResultDetail, ProfileScreen, SettingsScreen, PDFExport, SyncQueue });
