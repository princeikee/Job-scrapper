import { Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Database,
  Layers3,
  Monitor,
  PlayCircle,
  Server,
  ShieldCheck,
  Workflow,
} from 'lucide-react'

const features = [
  {
    title: 'Automated Scraping',
    desc: 'Runs every 6 hours with manual trigger support for immediate collection.',
    icon: PlayCircle,
  },
  {
    title: 'Reliable Data Pipeline',
    desc: 'Deduplication, normalization, and PostgreSQL persistence for production-grade consistency.',
    icon: Database,
  },
  {
    title: 'Analytics API',
    desc: 'Top skills, salary distribution, location demand, and remote vs onsite metrics.',
    icon: BarChart3,
  },
  {
    title: 'Operational Visibility',
    desc: 'Scrape logs, health endpoints, and runtime status for fast debugging and monitoring.',
    icon: Activity,
  },
]

const techStack = ['Node.js', 'Express', 'PostgreSQL', 'Playwright', 'node-cron', 'REST API']

function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.15),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.1),transparent_40%)]" />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black grid place-items-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold tracking-tight">JobScraper Platform</p>
              <p className="text-xs text-gray-400">Backend-connected intelligence dashboard</p>
            </div>
          </div>
          <Link
            to="/job"
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors w-full sm:w-auto text-center"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-12 md:pt-16 pb-10 md:pb-12">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-4">Production Job Intelligence</p>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
              Scrape, Store, Analyze
              <span className="block text-gray-400">Tech Jobs in One System</span>
            </h1>
            <p className="mt-6 text-gray-300 text-base md:text-lg">
              A full-stack job data platform that ingests public postings, normalizes records, and exposes analytics-ready
              APIs for real-time decision making.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/job"
                className="px-5 py-3 rounded-xl bg-white text-black font-medium hover:bg-gray-200 transition-colors text-center"
              >
                Launch App
              </Link>
              <a
                href="http://localhost:4000/healthz"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-center"
              >
                Verify Backend Health
              </a>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {features.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="glass rounded-2xl p-5 md:p-6 border border-white/10">
                <div className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center mb-4">
                  <Icon className="w-5 h-5 text-cyan-300" />
                </div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-gray-400 mt-2">{item.desc}</p>
              </div>
            )
          })}
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="glass rounded-2xl p-5 md:p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Workflow className="w-4 h-4 text-emerald-300" />
              <h3 className="font-semibold">Architecture</h3>
            </div>
            <p className="text-sm text-gray-400">
              Modular backend with controllers, services, scrapers, scheduler, analytics, and DB migration layers.
            </p>
          </div>
          <div className="glass rounded-2xl p-5 md:p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <h3 className="font-semibold">Data Integrity</h3>
            </div>
            <p className="text-sm text-gray-400">
              URL hash dedupe, transactional writes, and schema constraints prevent duplicate and inconsistent records.
            </p>
          </div>
          <div className="glass rounded-2xl p-5 md:p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-purple-300" />
              <h3 className="font-semibold">Stack</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {techStack.map((item) => (
                <span key={item} className="text-xs px-2 py-1 rounded-md bg-white/10 text-gray-300">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <div className="glass rounded-2xl p-5 md:p-6 border border-white/10">
            <h3 className="font-semibold text-xl mb-4">Structural Architecture</h3>
            <p className="text-sm text-gray-400 mb-6">
              The platform follows a layered architecture so each layer has one responsibility and can scale independently.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-400/20 grid place-items-center mb-3">
                  <Monitor className="w-5 h-5 text-cyan-300" />
                </div>
                <p className="font-medium mb-2">Frontend</p>
                <p className="text-gray-400">React dashboard and landing pages consume REST endpoints.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-blue-400/20 grid place-items-center mb-3">
                  <Server className="w-5 h-5 text-blue-300" />
                </div>
                <p className="font-medium mb-2">API Layer</p>
                <p className="text-gray-400">Express routes/controllers validate input and return response contracts.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-400/20 grid place-items-center mb-3">
                  <Layers3 className="w-5 h-5 text-emerald-300" />
                </div>
                <p className="font-medium mb-2">Services</p>
                <p className="text-gray-400">Business logic for scraping orchestration, normalization, and analytics.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-400/20 grid place-items-center mb-3">
                  <Bot className="w-5 h-5 text-fuchsia-300" />
                </div>
                <p className="font-medium mb-2">Scraper + Scheduler</p>
                <p className="text-gray-400">Playwright collectors run manually or every 6 hours via node-cron.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="w-10 h-10 rounded-lg bg-amber-400/20 grid place-items-center mb-3">
                  <Database className="w-5 h-5 text-amber-300" />
                </div>
                <p className="font-medium mb-2">Data Layer</p>
                <p className="text-gray-400">PostgreSQL tables enforce dedupe, relationships, and query performance.</p>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500 mono break-words">
              React UI {'->'} REST API {'->'} Services {'->'} Scrapers/Scheduler {'->'} PostgreSQL {'->'} Analytics Endpoints {'->'} React UI
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 text-sm text-gray-400 text-center">
          @2026 made by Ikechukwu princewill
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
