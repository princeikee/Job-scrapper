import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  Bell,
  Briefcase,
  Check,
  Clock,
  Database,
  Globe,
  LayoutDashboard,
  Mail,
  X,
  Menu,
  Play,
  Search,
  Send,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://job-scrapper-tgle.onrender.com'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'Scraper Jobs', icon: Search },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'email', label: 'Email Reports', icon: Mail },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString()
}

const formatAgo = (value) => {
  if (!value) return 'N/A'
  const diffMs = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `GET ${path} failed (${res.status})`)
  }
  return res.json()
}

async function apiPost(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    throw new Error(errorBody?.message ?? `POST ${path} failed (${res.status})`)
  }
  return res.json()
}

function StatCard({ icon, label, value, hint }) {
  const IconComponent = icon
  return (
    <div className="glass rounded-2xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
          {IconComponent ? <IconComponent className="w-6 h-6 text-white" /> : null}
        </div>
      </div>
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-xs text-gray-500 mono mt-2">{hint}</p>
    </div>
  )
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  )
}

const JobScraperDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [chartRange, setChartRange] = useState(30)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  const [runningScraper, setRunningScraper] = useState(false)
  const [resettingJobs, setResettingJobs] = useState(false)
  const [toast, setToast] = useState({ open: false, title: '', message: '' })

  const [jobs, setJobs] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [topSkills, setTopSkills] = useState([])
  const [salaryDistribution, setSalaryDistribution] = useState([])
  const [topLocations, setTopLocations] = useState([])
  const [remoteStats, setRemoteStats] = useState({ remote_jobs: 0, onsite_jobs: 0, total_jobs: 0 })
  const [overview, setOverview] = useState({ total_jobs: 0, source_count: 0, remote_jobs: 0, onsite_jobs: 0 })
  const [systemStatus, setSystemStatus] = useState(null)

  const showToast = (title, message) => {
    setToast({ open: true, title, message })
    setTimeout(() => setToast({ open: false, title: '', message: '' }), 3500)
  }

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      const [jobsRes, recentRes, skillsRes, salaryRes, locationsRes, remoteRes, overviewRes, statusRes] = await Promise.all([
        apiGet('/jobs?limit=100'),
        apiGet('/jobs/recent?limit=10'),
        apiGet('/analytics/top-skills'),
        apiGet('/analytics/salary-distribution'),
        apiGet('/analytics/top-locations'),
        apiGet('/analytics/remote-vs-onsite'),
        apiGet('/analytics/overview'),
        apiGet('/system/status'),
      ])

      setJobs(jobsRes.data ?? [])
      setRecentJobs(recentRes.data ?? [])
      setTopSkills(skillsRes.data ?? [])
      setSalaryDistribution(salaryRes.data ?? [])
      setTopLocations(locationsRes.data ?? [])
      setRemoteStats(remoteRes.data ?? { remote_jobs: 0, onsite_jobs: 0, total_jobs: 0 })
      setOverview(overviewRes.data ?? { total_jobs: 0, source_count: 0, remote_jobs: 0, onsite_jobs: 0 })
      setSystemStatus(statusRes.data ?? null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeSection])

  useEffect(() => {
    if (!mobileNavOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [mobileNavOpen])

  const filteredJobs = useMemo(() => {
    const base = query.trim() ? jobs.filter((job) => {
      const haystack = `${job.title} ${job.company} ${job.location} ${job.source}`.toLowerCase()
      return haystack.includes(query.toLowerCase())
    }) : jobs

    return base
  }, [jobs, query])

  const jobsOverTime = useMemo(() => {
    const labels = []
    const buckets = new Map()
    const end = new Date()

    for (let i = chartRange - 1; i >= 0; i -= 1) {
      const date = new Date(end)
      date.setDate(end.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      labels.push(key)
      buckets.set(key, 0)
    }

    for (const job of jobs) {
      if (!job.scraped_at) continue
      const key = new Date(job.scraped_at).toISOString().slice(0, 10)
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + 1)
      }
    }

    const raw = labels.map((key) => ({
      key,
      label: new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: buckets.get(key) || 0,
    }))

    const max = Math.max(...raw.map((item) => item.count), 1)
    const step = chartRange <= 7 ? 1 : chartRange <= 30 ? 3 : 7

    return raw.map((item, idx) => ({
      ...item,
      height: Math.max(6, Math.round((item.count / max) * 100)),
      showLabel: idx % step === 0 || idx === raw.length - 1,
    }))
  }, [jobs, chartRange])

  const runScraper = async () => {
    setRunningScraper(true)
    try {
      const res = await apiPost('/scraper/run')
      showToast('Scraper completed', `${res.data?.jobsFound ?? 0} jobs found`) 
      await loadData()
    } catch (err) {
      showToast('Scraper failed', err.message)
    } finally {
      setRunningScraper(false)
    }
  }

  const resetJobs = async () => {
    setResettingJobs(true)
    try {
      const res = await apiPost('/jobs/reset')
      showToast('Jobs reset complete', `${res.data?.deletedJobs ?? 0} records removed`)
      await loadData()
    } catch (err) {
      showToast('Reset failed', err.message)
    } finally {
      setResettingJobs(false)
    }
  }

  const totalJobs = overview.total_jobs ?? 0
  const activeListings = overview.total_jobs ?? 0
  const sourceCount = overview.source_count ?? 0

  const handleSectionSelect = (sectionId) => {
    setActiveSection(sectionId)
    setMobileNavOpen(false)
  }

  return (
    <div className="bg-black text-white min-h-screen font-sans">
      <aside className="fixed left-0 top-0 h-full w-64 glass-dark z-50 hidden lg:block">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">JobScraper</h1>
              <p className="text-xs text-gray-500 mono">Live backend mode</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-2 h-2 rounded-full status-dot ${systemStatus?.database?.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">{systemStatus?.database?.healthy ? 'System Online' : 'System Degraded'}</span>
            </div>
            <div className="text-xs text-gray-500 mono">
              Last scrape: <span>{formatAgo(systemStatus?.lastScrape?.started_at)}</span>
            </div>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-[70]">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] glass-dark border-r border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                <span className="font-semibold">Navigation</span>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-white/10"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon
                const active = activeSection === section.id
                return (
                  <button
                    key={`mobile-${section.id}`}
                    onClick={() => handleSectionSelect(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      <main className="lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-40 glass-dark border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 hover:bg-white/5 rounded-lg"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold gradient-text">{SECTIONS.find((s) => s.id === activeSection)?.label}</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:justify-end">
              <button
                onClick={resetJobs}
                disabled={resettingJobs}
                className="flex items-center justify-center gap-2 min-w-[140px] px-4 py-2.5 bg-red-500/20 text-red-200 border border-red-500/40 rounded-lg font-medium hover:bg-red-500/30 transition-colors disabled:opacity-70 text-sm"
              >
                <Database className="w-4 h-4" />
                <span>{resettingJobs ? 'Resetting...' : 'Reset'}</span>
              </button>

              <button
                onClick={runScraper}
                disabled={runningScraper}
                className="flex items-center justify-center gap-2 min-w-[140px] px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-70 text-sm"
              >
                <Play className="w-4 h-4" />
                <span>{runningScraper ? 'Running...' : 'Run Scraper'}</span>
              </button>

              <button onClick={loadData} className="p-2.5 hover:bg-white/5 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {error && (
            <div className="glass rounded-xl p-4 border border-red-500/30 text-red-300 text-sm">
              Backend error: {error}
            </div>
          )}

          {loading ? (
            <div className="glass rounded-xl p-8 text-gray-400">Loading backend data...</div>
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <>
                  <div className="glass rounded-xl p-4 border border-yellow-500/30 text-yellow-200 text-sm leading-relaxed">
                    ⚠️ Note: This dashboard shows global data. Please use the “Reset” button after testing to clear the jobs for other users.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={Briefcase} label="Total Jobs Scraped" value={totalJobs.toLocaleString()} hint="Live from /jobs" />
                    <StatCard icon={Clock} label="Active Listings" value={activeListings.toLocaleString()} hint="Current indexed records" />
                    <StatCard icon={Globe} label="Sources Connected" value={sourceCount.toString()} hint="Distinct source names" />
                    <StatCard
                      icon={Zap}
                      label="Remote Jobs"
                      value={(overview.remote_jobs ?? 0).toLocaleString()}
                      hint={`${overview.total_jobs ?? 0} total`}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 glass rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold">Jobs Scraped Over Time</h3>
                          <p className="text-sm text-gray-400">Daily job collection from all sources</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {[7, 30, 90].map((range) => (
                            <button
                              key={range}
                              onClick={() => setChartRange(range)}
                              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                chartRange === range
                                  ? 'bg-white text-black font-medium'
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                            >
                              {range}D
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-64 flex items-end gap-1.5" id="jobsChart">
                        {jobsOverTime.map((bar) => (
                          <div key={bar.key} className="flex-1 flex flex-col justify-end items-center group">
                            <div
                              className="chart-bar bg-gradient-to-t from-violet-500 via-fuchsia-500 to-cyan-400 w-full rounded-t-md"
                              style={{ height: `${bar.height}%` }}
                              title={`${bar.label}: ${bar.count} jobs`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between mt-4 text-xs text-gray-500 mono">
                        {jobsOverTime.map((bar) => (
                          <span key={`label-${bar.key}`} className="flex-1 text-center">
                            {bar.showLabel ? bar.label : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                      <SectionTitle title="Top Skills in Demand" subtitle="From /analytics/top-skills" />
                      <div className="space-y-4">
                        {topSkills.length === 0 && <p className="text-sm text-gray-500">No skill data yet.</p>}
                        {topSkills.map((s, i) => {
                          const max = topSkills[0]?.demand || 1
                          const percent = Math.round((s.demand / max) * 100)
                          return (
                            <div key={`${s.skill}-${i}`} className="flex items-center gap-4">
                              <div className="w-28 text-sm font-medium">{s.skill}</div>
                              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              <div className="w-12 text-right text-sm mono text-emerald-400">{s.demand}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass rounded-2xl p-6">
                      <SectionTitle title="Salary Distribution" subtitle="Job postings by salary range" />
                      <div className="space-y-4">
                        {salaryDistribution.length === 0 && <p className="text-sm text-gray-500">No salary data yet.</p>}
                        {salaryDistribution.map((item, i) => {
                          const max = salaryDistribution[0]?.count || 1
                          const percent = Math.round((item.count / max) * 100)
                          return (
                            <div key={`${item.range_bucket}-${i}`}>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span>{item.range_bucket}</span>
                                <span className="mono">{item.count}</span>
                              </div>
                              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                      <SectionTitle title="Top Locations" subtitle="Jobs by city" />
                      <div className="space-y-4">
                        {topLocations.length === 0 && <p className="text-sm text-gray-500">No location data yet.</p>}
                        {topLocations.map((loc, i) => {
                          const max = topLocations[0]?.jobs || 1
                          const percent = Math.round((loc.jobs / max) * 100)
                          return (
                            <div key={`${loc.location}-${i}`} className="flex items-center justify-between">
                              <span className="text-sm">{loc.location}</span>
                              <div className="flex items-center gap-3 flex-1 ml-6">
                                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                                <span className="mono text-sm w-14 text-right">{loc.jobs}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeSection === 'jobs' && (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <SectionTitle title="Scraper Jobs" subtitle="Live list from backend /jobs" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text"
                        placeholder="Search title, company, source"
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-white/30 w-64"
                      />
                      <button
                        onClick={() => setQuery(searchTerm)}
                        className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Title</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Company</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Location</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Salary</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Skills</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium">
                              <a
                                className="text-blue-400 underline decoration-blue-400/60 hover:text-blue-300"
                                href={job.job_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {job.title}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{job.company || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{job.location || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-emerald-400 mono">{job.salary || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{Array.isArray(job.skills) ? job.skills.join(', ') : 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-gray-400">{job.source || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'database' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-6">
                    <SectionTitle title="Database Health" subtitle="From /system/status" />
                    <p className="text-sm text-gray-400 mb-4">
                      Connection status and latest scrape log prove whether writes are succeeding.
                    </p>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span>Healthy</span><span className="mono text-green-400">{systemStatus?.database?.healthy ? 'YES' : 'NO'}</span></div>
                      <div className="flex justify-between"><span>Last Source</span><span className="mono">{systemStatus?.lastScrape?.source || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>Last Status</span><span className="mono">{systemStatus?.lastScrape?.status || 'N/A'}</span></div>
                      <div className="flex justify-between"><span>Jobs Inserted</span><span className="mono">{systemStatus?.lastScrape?.jobs_inserted ?? 0}</span></div>
                      <div className="flex justify-between"><span>Jobs Updated</span><span className="mono">{systemStatus?.lastScrape?.jobs_updated ?? 0}</span></div>
                      <div className="flex justify-between"><span>Started At</span><span className="mono">{formatDateTime(systemStatus?.lastScrape?.started_at)}</span></div>
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6">
                    <SectionTitle title="Stored Dataset Snapshot" subtitle="Derived from /jobs" />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span>Total rows in jobs view</span><span className="mono">{jobs.length}</span></div>
                      <div className="flex justify-between"><span>Remote rows</span><span className="mono">{remoteStats.remote_jobs ?? 0}</span></div>
                      <div className="flex justify-between"><span>Onsite rows</span><span className="mono">{remoteStats.onsite_jobs ?? 0}</span></div>
                      <div className="flex justify-between"><span>Distinct sources</span><span className="mono">{sourceCount}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-6">
                    <SectionTitle title="Salary Distribution" subtitle="From /analytics/salary-distribution" />
                    <div className="space-y-4">
                      {salaryDistribution.map((item, i) => {
                        const max = salaryDistribution[0]?.count || 1
                        const percent = Math.round((item.count / max) * 100)
                        return (
                          <div key={`${item.range_bucket}-${i}`}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span>{item.range_bucket}</span>
                              <span className="mono">{item.count}</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="glass rounded-2xl p-6">
                    <SectionTitle title="Remote vs Onsite" subtitle="From /analytics/remote-vs-onsite" />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span>Remote jobs</span><span className="mono text-green-400">{remoteStats.remote_jobs ?? 0}</span></div>
                      <div className="flex justify-between"><span>Onsite jobs</span><span className="mono text-blue-400">{remoteStats.onsite_jobs ?? 0}</span></div>
                      <div className="flex justify-between"><span>Total</span><span className="mono">{remoteStats.total_jobs ?? 0}</span></div>
                    </div>
                    <div className="mt-6 text-xs text-gray-500">
                      This section verifies your analytics engine is producing meaningful distribution output.
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'email' && (
                <div className="glass rounded-2xl p-6">
                  <SectionTitle title="Email Reports" subtitle="Operational details for report automation" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center"><Send className="w-5 h-5 text-green-400" /></div>
                        <div><p className="font-medium">Daily Summary</p><p className="text-xs text-gray-400">Enabled</p></div>
                      </div>
                      <p className="text-sm text-gray-400">Delivery window: 09:00 UTC. Includes new jobs and top skills.</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-blue-400" /></div>
                        <div><p className="font-medium">Weekly Analytics</p><p className="text-xs text-gray-400">Enabled</p></div>
                      </div>
                      <p className="text-sm text-gray-400">Monday digest of salary, locations, and remote ratios.</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center"><AlertCircle className="w-5 h-5 text-purple-400" /></div>
                        <div><p className="font-medium">Alert Rules</p><p className="text-xs text-gray-400">Configured</p></div>
                      </div>
                      <p className="text-sm text-gray-400">Trigger if total new jobs in last run is lower than expected.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'settings' && (
                <div className="glass rounded-2xl p-6">
                  <SectionTitle title="Settings" subtitle="Backend integration settings" />
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Backend Base URL</span><span className="mono">{API_BASE}</span></div>
                    <div className="flex justify-between"><span>Scheduler</span><span className="mono">{systemStatus?.scheduler?.active ? 'ACTIVE' : 'INACTIVE'}</span></div>
                    <div className="flex justify-between"><span>Cron</span><span className="mono">{systemStatus?.scheduler?.cron || 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Scraper Running</span><span className="mono">{systemStatus?.scraper?.scrapeRunning ? 'YES' : 'NO'}</span></div>
                    <div className="flex justify-between"><span>Last Runtime Start</span><span className="mono">{formatDateTime(systemStatus?.scraper?.lastRunAt)}</span></div>
                  </div>
                </div>
              )}

              <div className="glass rounded-2xl p-6">
                <SectionTitle title="Recently Scraped Jobs" subtitle="From /jobs/recent" />
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="bg-white/5 rounded-lg p-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-xs text-gray-400">{job.company || 'N/A'} • {job.location || 'N/A'} • {job.source || 'N/A'}</p>
                      </div>
                      <p className="mono text-xs text-gray-500">{formatAgo(job.scraped_at)}</p>
                    </div>
                  ))}
                  {recentJobs.length === 0 && <p className="text-sm text-gray-500">No recent jobs found yet.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {toast.open && (
        <div className="fixed bottom-6 right-6 z-50 slide-in">
          <div className="glass-dark rounded-xl p-4 flex items-center gap-3 shadow-2xl">
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="font-medium">{toast.title}</p>
              <p className="text-sm text-gray-400">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobScraperDashboard

