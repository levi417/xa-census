import { useMemo, useState } from 'react'
import censusRaw from '../census_data.json'
import CensusAI from './CensusAI.tsx'

type Row = Record<string, unknown>
const campuses = censusRaw as Row[]
type View = 'dashboard' | 'detail' | 'ai'
type Tab = 'identity' | 'attendance' | 'international' | 'demographics' | 'smallgroups' | 'staff'

const num = (v: unknown): number => {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return v
  const n = Number(String(v).replace(/[^0-9.-]/g, ''))
  return isFinite(n) ? n : 0
}
const fv = (row: Row, key: string): string => {
  const v = row[key]
  if (v === null || v === undefined || v === '') return '—'
  return String(v)
}
const leader = (r: Row) => `${r['Primary Leader Name (First)'] ?? ''} ${r['Primary Leader Name (Last)'] ?? ''}`.trim() || '—'
const weekly = (r: Row) => num(r['Overall average of students attending your weekly meeting'])
const sgStart = (r: Row) => num(r['How many students were small group leaders at the start of the school year?'])
const retention = (r: Row) => { let v = num(r['Small Group Leader Retention']); if (v > 0 && v <= 1) v *= 100; return v }
const trips = (r: Row) => num(r['What is the total number of world mission trips?']) + num(r['What is the total number of U.S. missions trips?'])
const sgTotal = (r: Row) => num(r['What is the total number of students attending small groups'])

function retClass(v: number) {
  if (v === 0) return ''
  if (v >= 75) return 'retention-high'
  if (v >= 50) return 'retention-mid'
  return 'retention-low'
}

function Card({ label, value }: { label: string; value: string }) {
  return <div className="card"><div className="card-label">{label}</div><div className="card-value">{value}</div></div>
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" className={`tab${active ? ' active' : ''}`} onClick={onClick}>{label}</button>
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [selected, setSelected] = useState<Row | null>(null)
  const [region, setRegion] = useState('All')
  const [district, setDistrict] = useState('All')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('identity')

  const regions = useMemo(() => ['All', ...Array.from(new Set(campuses.map(c => String(c['Region'] ?? '')))).filter(Boolean).sort()], [])
  const districts = useMemo(() => {
    const src = region === 'All' ? campuses : campuses.filter(c => c['Region'] === region)
    return ['All', ...Array.from(new Set(src.map(c => String(c['District'] ?? '')))).filter(Boolean).sort()]
  }, [region])

  const filtered = useMemo(() => campuses.filter(c => {
    const rm = region === 'All' || c['Region'] === region
    const dm = district === 'All' || c['District'] === district
    const sm = !search.trim() || String(c['Campus Name']).toLowerCase().includes(search.toLowerCase())
    return rm && dm && sm
  }), [region, district, search])

  const summary = useMemo(() => ({
    count: campuses.length,
    sgStudents: campuses.reduce((s, c) => s + sgTotal(c), 0),
    avgRetention: (() => { const vals = campuses.map(retention).filter(v => v > 0); return vals.reduce((a, b) => a + b, 0) / (vals.length || 1) })(),
    totalTrips: campuses.reduce((s, c) => s + trips(c), 0),
  }), [])

  const openDetail = (c: Row) => { setSelected(c); setTab('identity'); setView('detail') }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">XA</div>
          <div>
            <div className="brand-title">Chi Alpha Census</div>
            <div className="brand-subtitle">2024–2025 Campus Snapshot</div>
          </div>
        </div>
        <nav className="nav">
          <button className={`nav-btn${view === 'dashboard' ? ' active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={`nav-btn${view === 'detail' ? ' active' : ''}`} onClick={() => selected && setView('detail')} disabled={!selected}>Campus Detail</button>
          <button className={`nav-btn${view === 'ai' ? ' active' : ''}`} onClick={() => setView('ai')}>✨ Census AI</button>
        </nav>
      </header>

      <main className="main">
        {view === 'dashboard' && (
          <section>
            <div className="summary">
              <Card label="Total Campuses" value={summary.count.toString()} />
              <Card label="Students in Small Groups" value={summary.sgStudents.toLocaleString()} />
              <Card label="Avg SG Leader Retention" value={`${summary.avgRetention.toFixed(1)}%`} />
              <Card label="Total Missions Trips" value={summary.totalTrips.toLocaleString()} />
            </div>

            <div className="filters">
              <div>
                <label>Region</label>
                <select value={region} onChange={e => { setRegion(e.target.value); setDistrict('All') }}>
                  {regions.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label>District</label>
                <select value={district} onChange={e => setDistrict(e.target.value)}>
                  {districts.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="search">
                <label>Search</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Campus name..." />
              </div>
              <div className="results-count" style={{ paddingBottom: '6px', color: 'var(--muted)', fontSize: '12px', alignSelf: 'flex-end' }}>
                {filtered.length} campus{filtered.length !== 1 ? 'es' : ''}
              </div>
            </div>

            <div className="table">
              <div className="table-header">
                <span>Campus Name</span>
                <span>Region</span>
                <span>District</span>
                <span>Leader</span>
                <span>Weekly Avg</span>
                <span>SG Leaders</span>
                <span>SG Retention</span>
                <span>Missions</span>
              </div>
              {filtered.map(c => {
                const ret = retention(c)
                return (
                  <button key={String(c['Campus Name'])} className="table-row" onClick={() => openDetail(c)}>
                    <span className="campus-name">{String(c['Campus Name'])}</span>
                    <span>{String(c['Region'] ?? '—')}</span>
                    <span>{String(c['District'] ?? '—')}</span>
                    <span>{leader(c)}</span>
                    <span>{weekly(c) || '—'}</span>
                    <span>{sgStart(c) || '—'}</span>
                    <span className={retClass(ret)}>{ret > 0 ? `${ret.toFixed(0)}%` : '—'}</span>
                    <span>{trips(c) || '—'}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {view === 'detail' && selected && (
          <section>
            <div className="detail-header">
              <div>
                <div className="detail-title">{String(selected['Campus Name'])}</div>
                <div className="detail-subtitle">{String(selected['Region'] ?? '')} · {String(selected['District'] ?? '')} · {leader(selected)}</div>
              </div>
              <button className="ghost" onClick={() => setView('dashboard')}>← Back to Dashboard</button>
            </div>

            <div className="tabs">
              {(['identity','attendance','international','demographics','smallgroups','staff'] as Tab[]).map(t => (
                <TabBtn key={t} label={t === 'identity' ? 'Campus Identity' : t === 'attendance' ? 'Attendance & Engagement' : t === 'international' ? 'International' : t === 'demographics' ? 'Demographics' : t === 'smallgroups' ? 'Small Groups' : 'Staff, CMIT & Missions'} active={tab === t} onClick={() => setTab(t)} />
              ))}
            </div>

            {tab === 'identity' && (
              <div className="detail-grid">
                {[
                  ['Campus Name', fv(selected, 'Campus Name')],
                  ['Primary Leader', leader(selected)],
                  ['Region', fv(selected, 'Region')],
                  ['District', fv(selected, 'District')],
                  ['Calendar System', fv(selected, 'What calendar system is your campus?')],
                  ['Campus Classification', fv(selected, 'What is your campus classification?')],
                  ['Total Enrollment', fv(selected, 'What is the total student enrollment of your campus?')],
                ].map(([label, value]) => (
                  <div key={label} className="detail-card">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'attendance' && (
              <div className="detail-grid">
                {[
                  ['Weekly Avg Attendance', fv(selected, 'Overall average of students attending your weekly meeting')],
                  ['Fall Large Group Avg', fv(selected, 'What was the average large group attendance in the fall?')],
                  ['Spring Large Group Avg', fv(selected, 'What was the average large group attendance in spring?')],
                  ['Fall Retreat', fv(selected, 'How many students attended fall retreat?')],
                  ['SALT / Winter Retreat', fv(selected, 'How many students attended SALT/winter retreat?')],
                  ['Conversions / Recommitments', fv(selected, 'How many students were converted or recommitted their lives to Jesus?')],
                  ['Water Baptisms', fv(selected, 'How many students were baptized in water?')],
                  ['Holy Spirit Baptisms', fv(selected, 'How many students were baptized in the Holy Spirit?')],
                  ['Physical Healings', fv(selected, 'How many students were physically healed?')],
                ].map(([label, value]) => (
                  <div key={label} className="detail-card">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'international' && (
              <div className="detail-grid">
                {[
                  ['Intl Students in Weekly Total', fv(selected, 'How many international students included in the total above?')],
                  ['Intl Students in Small Groups', fv(selected, 'How many international students are included in the total above?')],
                  ['Intl in Both SG + LG', fv(selected, 'How many international students are involved in both small group and large groups')],
                  ['Total Intl Involved (SG or LG)', fv(selected, 'Total number of international students involved in either small group, large group or both')],
                ].map(([label, value]) => (
                  <div key={label} className="detail-card">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'demographics' && (
              <div className="detail-grid">
                {[
                  ['AG Background', 'What percentage of your students come from an Assemblies of God background?'],
                  ['Church (Non-AG)', 'What percentage of your students have a church background but not Assemblies of God?'],
                  ['Black / African American', 'What percentage of your regularly involved students are Black/African American?'],
                  ['Asian', 'What percentage of your regularly involved students are Asian?'],
                  ['Hispanic / Latino', 'What percentage of your regularly involved students are Hispanic/Latino?'],
                  ['White / Caucasian', 'What percentage of your regularly involved students are White/Caucasian?'],
                  ['Other', 'What percentage of your regularly involved students are Other?'],
                ].map(([label, key]) => {
                  const pct = num(selected[key])
                  return (
                    <div key={label} className="detail-card">
                      <div className="detail-label">{label}</div>
                      <div className="progress"><div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                      <div className="detail-value">{pct > 0 ? `${pct}%` : '—'}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'smallgroups' && (
              <div className="detail-grid">
                {[
                  ['Students in Small Groups', fv(selected, 'What is the total number of students attending small groups')],
                  ['Discipleship Groups (Weekly)', fv(selected, 'How many separate discipleship groups meet weekly?')],
                  ['SG Leaders (Start of Year)', fv(selected, 'How many students were small group leaders at the start of the school year?')],
                  ['SG Leaders (End of Year)', fv(selected, 'Of those student small group leaders, how many were small group leaders at the end of the school year year?')],
                  ['SG Leader Retention', (() => { const v = retention(selected); return v > 0 ? `${v.toFixed(1)}%` : '—' })()],
                  ['Intl SG Leaders', fv(selected, 'Of those student small group leaders, how many were international students?')],
                  ['Leaders Not Continuing', fv(selected, 'Of the student small group leaders who finished the year, how many are graduating, moving away, or otherwise not continuing next year as a leader?')],
                  ['Newly Trained Students', fv(selected, 'How many students were put through training this school year to become small group leaders?')],
                  ['Newly Approved Leaders', fv(selected, 'Of these newly trained students in the previous question, how many were approved to become new small group leaders?')],
                  ['SG Leader Replication Rate', fv(selected, 'Small Group Leader Replication')],
                  ['Projected Leaders Next Year', fv(selected, 'How many student small group leaders will you start with next school year?*')],
                  ['SG Members per Leader', fv(selected, 'Small group Memebers per small group leader')],
                ].map(([label, value]) => (
                  <div key={label} className="detail-card">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'staff' && (
              <div className="detail-grid">
                {[
                  ['Affiliated Staff Total', fv(selected, 'How many affiliated staff members, do you have on your staff team?')],
                  ['Full-Time Staff', fv(selected, 'How many of these staff team members serve full-time in ministry?')],
                  ['Part-Time Staff', fv(selected, 'How many of these staff team members serve part-time in ministry?')],
                  ['Volunteer Staff', fv(selected, 'How many of these staff team members serve as volunteers?')],
                  ['Staff Who Led SGs', fv(selected, 'How many of these affiliated staff team members led student small groups this year?')],
                  ['Staff Who Led Leader RGs', fv(selected, 'How many of these affiliated staff team members led student leader resource groups this year?')],
                  ['Years Director Has Led', fv(selected, 'How many years has the director been leading this Chi Alpha group?')],
                  ['CMIT Program', fv(selected, 'Did you have an official CMIT program this last school year?')],
                  ['CMIT Interns', fv(selected, 'How many CMIT interns are part of the program?')],
                  ['CMIT Interns Led SGs', fv(selected, 'How many of these CMIT interns led student small groups this year?')],
                  ['Preparing for AGWM', fv(selected, 'How many of your CMIT interns and/or affiliated staff are preparing for an AGWM assignment?')],
                  ['US Missions Trips', fv(selected, 'What is the total number of U.S. missions trips?')],
                  ['Students on US Trips', fv(selected, 'How many students went on U.S. mission trips?')],
                  ['World Missions Trips', fv(selected, 'What is the total number of world mission trips?')],
                  ['Students on World Trips', fv(selected, 'How many students went on world mission trip?')],
                  ['World Trip Destinations', fv(selected, 'What were the destination(s) of world mission trips?')],
                  ['Missionaries at LG', fv(selected, 'How many times did a world missionary preach at your large group meeting last year or engage with students in other ways (small groups, Q&A, zoom calls, etc)?')],
                  ['Annual Missions Week', fv(selected, 'Does your ministry conduct an annual missions week or month?')],
                ].map(([label, value]) => (
                  <div key={label} className="detail-card">
                    <div className="detail-label">{label}</div>
                    <div className="detail-value">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'ai' && <CensusAI />}
      </main>
    </div>
  )
}
