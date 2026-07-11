import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import BrandLogo from '../components/BrandLogo'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import {
  ArrowRight,
  Brain,
  Briefcase,
  ClipboardCheck,
  Code2,
  FileText,
  Gauge,
  Github,
  Globe2,
  Linkedin,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  Users,
  TrendingUp,
  UserCheck,
} from 'lucide-react'

const featureCards = [
  {
    icon: Brain,
    title: 'Intelligent Matching',
    copy: "Find roles that don't just match your title, but your real skills, career direction, and engineering capacity.",
    path: '/jobs',
  },
  {
    icon: Gauge,
    title: 'ATS Optimization',
    copy: 'Reverse-engineer recruitment systems with a clear scorecard for keywords, structure, impact, and missing areas.',
    path: '/resume-builder',
  },
  {
    icon: Code2,
    title: 'Engineering Workflows',
    copy: 'Build clean resume data, track applications, and keep your job search organized like a focused workspace.',
    path: '/dashboard',
  },
  {
    icon: MessageSquare,
    title: 'Interview Prep',
    copy: 'Choose technical or non-technical rounds, then practice with mock interviews and placement-style exams.',
    path: '/interview-prep',
  },
  {
    icon: ClipboardCheck,
    title: 'Practice Tests',
    copy: 'Attempt timed MCQs for technical, aptitude, English, HR, and behavioral preparation with instant scoring.',
    path: '/practice-test?track=nonTechnical',
  },
  {
    icon: FileText,
    title: 'Resume Builder',
    copy: 'Create, upload, improve, and preview an ATS-ready resume that connects directly to your job applications.',
    path: '/resume-builder',
  },
  {
    icon: UserCheck,
    title: 'Branding Toolkit',
    copy: 'Generate a polished resume headline, LinkedIn summary, and professional pitch quickly.',
    path: '/branding-toolkit',
  },
  {
    icon: CalendarDays,
    title: 'Interview Scheduling',
    copy: 'Schedule interviews around your availability and stay on top of upcoming preparation tasks.',
    path: '/interview-scheduling',
  },
  {
    icon: Users,
    title: 'Recruiter Access',
    copy: 'Request referrals and get matched with recruiters who can help accelerate your hiring process.',
    path: '/recruiter-access',
  },
  {
    icon: TrendingUp,
    title: 'Salary Guidance',
    copy: 'See market compensation ranges for your role and get negotiation talking points.',
    path: '/salary-guidance',
  },
  {
    icon: Briefcase,
    title: 'Job Applications',
    copy: 'Explore matched jobs, compare fit scores, save roles, and move from discovery to application faster.',
    path: '/jobs',
  },
  {
    icon: ShieldCheck,
    title: 'Career Scorecard',
    copy: 'Review resume health, missing skills, and improvement signals before applying to competitive roles.',
    path: '/dashboard',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [liveATS, setLiveATS] = useState(null)

  const openFeature = (path) => {
    if (token) {
      navigate(path)
      return
    }

    navigate(`/login?next=${encodeURIComponent(path)}`)
  }

  useEffect(() => {
    let mounted = true
    const loadLatest = async () => {
      try {
        if (!token) return
        const res = await axios.get('/api/resume', { headers: { Authorization: `Bearer ${token}` } })
        const latest = res.data?.[0]
        if (mounted && latest) setLiveATS(latest.atsAnalytics || latest.atsScore || null)
      } catch (e) {
        // ignore
      }
    }
    loadLatest()
    return () => (mounted = false)
  }, [token])

  return (
    <div className="min-h-screen page-shell text-foreground">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(182,79,82,0.18),transparent_24rem),radial-gradient(circle_at_88%_10%,rgba(73,215,202,0.08),transparent_20rem)] pointer-events-none" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-32">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Now in beta
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl font-black leading-[0.95] text-white sm:text-6xl">
                Precision tools for <span className="text-primary">career growth</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-secondary">
                A clinical approach to the job search. Leveraging career intelligence to match your engineering DNA with elite opportunities.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="primary"
                onClick={() => navigate(token ? '/dashboard' : '/login')}
                className="gap-2 rounded-[1.5rem] py-3 px-7 text-base"
              >
                Get Started Free <ArrowRight size={17} />
              </Button>
              <Button variant="outline" className="rounded-[1.5rem] py-3 px-7 text-base" onClick={() => navigate('/resume-builder')}>
                View Demo
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#101214]/95 p-8 shadow-[0_32px_100px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3 rounded-[1.5rem] bg-[#141618] p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">AI Matching Engine</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-secondary">Real-time job DNA analysis</div>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-[#111417] px-6 py-4 text-right">
                  <div className="text-4xl font-semibold text-primary">{liveATS?.score ? `${liveATS.score}%` : '98%'}</div>
                  <div className="text-xs uppercase tracking-[0.24em] text-secondary">{liveATS?.healthLabel || 'Perfect fit'}</div>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-[#161619] p-5 shadow-inner shadow-black/20">
                <div className="mb-3 flex items-center justify-between text-sm text-secondary">
                  <span className="font-semibold text-foreground">Lead Systems Engineer</span>
                  <span className="rounded-full border border-white/10 bg-[#0f1114] px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-primary">Perfect fit</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#302929]">
                  <div className="h-full w-[94%] rounded-full bg-[#ffaaa7]" />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-[#14161a] p-4 text-sm text-secondary">
                  <div className="text-xs uppercase tracking-[0.18em]">ATS compatibility</div>
                  <div className="mt-2 text-base font-semibold text-foreground">{liveATS?.score ? `High (${liveATS.score})` : 'High (94)'}</div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-[#14161a] p-4 text-sm text-secondary">
                  <div className="text-xs uppercase tracking-[0.18em]">Skill gaps</div>
                  <div className="mt-2 text-base font-semibold text-foreground">{(liveATS?.missingAreas?.length) ? `${liveATS.missingAreas.length} Missing` : '0 Missing'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Intelligence built for excellence</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
              Click any module to continue. Logged-in users go directly there; guests are taken through login first.
            </p>
          </div>
          <Button variant="outline" onClick={() => openFeature('/interview-prep')} className="w-full sm:w-auto">
            Open Interview Prep <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {featureCards.map(({ icon: Icon, title, copy, path }) => (
            <button
              key={title}
              type="button"
              onClick={() => openFeature(path)}
              className="group min-h-60 rounded-[2rem] border border-white/10 bg-[#201c1b] p-6 text-left shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 hover:border-primary/50 hover:bg-[#251f1e] focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <div className="mb-7 flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#342928] text-[#ffb5b1] transition group-hover:bg-primary group-hover:text-white">
                  <Icon size={18} />
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary transition group-hover:border-primary/40 group-hover:text-[#ffb5b1]">
                  Open
                </span>
              </div>
              <CardTitle className="mb-3 text-xl">{title}</CardTitle>
              <CardContent>{copy}</CardContent>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[1fr_0.92fr] lg:px-8">
        <Card className="bg-[#191817]">
          <CardTitle className="mb-4">Detailed Insights</CardTitle>
          <CardContent>Visualize your market value with real-time industry data and salary benchmarks.</CardContent>
          <div className="mt-10 rounded-sm bg-[#1f1f1f] p-6">
            <div className="flex h-36 items-end gap-4">
              {[38, 55, 72, 108, 60, 48].map((height, index) => (
                <div key={`${height}-${index}`} className={`flex-1 ${index === 3 ? 'bg-[#ffaaa7]' : 'bg-[#6b4b48]'}`} style={{ height }} />
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs uppercase tracking-wide text-muted">
              <span>Market Percentile<br /><strong className="text-foreground">Top 2%</strong></span>
              <span>Growth Vector<br /><strong className="text-accent">+14.2%</strong></span>
            </div>
          </div>
        </Card>
        <div className="space-y-8">
          <Card className="border-primary/30 bg-[#211514]">
            <CardTitle className="mb-4 text-xl">Resume Scorecard</CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted">
              <ShieldCheck size={20} className="text-accent" />
              Optimized for 14 major ATS platforms.
            </div>
          </Card>
          <Card className="overflow-hidden bg-[#191817]">
            <div className="grid gap-6 sm:grid-cols-[1fr_0.75fr]">
              <div>
                <CardTitle className="mb-2 text-xl">Global Reach</CardTitle>
                <CardContent>Connecting elite talent with Fortune 500 tech teams across 4 continents.</CardContent>
                <button onClick={() => navigate('/jobs')} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#ffb5b1]">
                  Explore Network <ArrowRight size={15} />
                </button>
              </div>
              <div className="min-h-40 rounded-sm bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%),linear-gradient(135deg,#232323,#101010)] opacity-80" />
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Card className="bg-[#333332] px-8 py-20 text-center">
          <h3 className="mx-auto max-w-xl text-4xl font-bold leading-tight">
            Ready to navigate your <span className="text-[#ffb5b1]">next pivot?</span>
          </h3>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-6 text-[#dac9c5]">
            Join 25,000+ engineers using JobPilot.AI to manage their professional evolution with clinical precision.
          </p>
          <Button variant="primary" className="mt-8" onClick={() => navigate('/login')}>
            Create Free Profile
          </Button>
        </Card>
      </section>

      <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-[#070809]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(182,79,82,0.18),transparent_24rem),radial-gradient(circle_at_88%_10%,rgba(73,215,202,0.10),transparent_22rem)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="mb-14 grid gap-6 rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffb5b1]">
                Career intelligence
              </div>
              <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">Build a sharper job search system.</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b9aea4]">
                Match roles, improve your resume score, and keep every application moving with one focused workspace.
              </p>
            </div>
            <Button variant="primary" className="w-full rounded-lg px-6 py-3 lg:w-auto" onClick={() => navigate(token ? '/dashboard' : '/login')}>
              Launch JobPilot <ArrowRight size={16} />
            </Button>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.35fr_2fr]">
            <div>
              <BrandLogo size="lg" subtitle="Career command center" />
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#b9aea4]">
                AI-powered resume scoring, job matching, and application tracking for engineers who want a cleaner path to better roles.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="mailto:hello@jobpilot.ai" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#dac9c5] transition hover:border-primary/50 hover:bg-primary/10 hover:text-white" aria-label="Email JobPilot.AI">
                  <Mail size={17} />
                </a>
                <Link to="/" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#dac9c5] transition hover:border-primary/50 hover:bg-primary/10 hover:text-white" aria-label="JobPilot.AI on LinkedIn">
                  <Linkedin size={17} />
                </Link>
                <Link to="/" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#dac9c5] transition hover:border-primary/50 hover:bg-primary/10 hover:text-white" aria-label="JobPilot.AI on GitHub">
                  <Github size={17} />
                </Link>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#ffb5b1]">Platform</div>
                <div className="space-y-3 text-sm text-[#b9aea4]">
                  <Link to="#features" className="block transition hover:text-white">Features</Link>
                  <Link to="/resume-builder" className="block transition hover:text-white">ATS Scan</Link>
                  <Link to="/jobs" className="block transition hover:text-white">Job Matches</Link>
                  <Link to="/upgrade" className="block transition hover:text-white">Pricing</Link>
                </div>
              </div>
              <div>
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#ffb5b1]">Resources</div>
                <div className="space-y-3 text-sm text-[#b9aea4]">
                  <Link to="/" className="block transition hover:text-white">Career Blog</Link>
                  <Link to="/" className="block transition hover:text-white">Documentation</Link>
                  <Link to="/resume-builder" className="block transition hover:text-white">Resume Templates</Link>
                  <Link to="/interview-prep" className="block transition hover:text-white">Interview Prep</Link>
                </div>
              </div>
              <div>
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#ffb5b1]">Company</div>
                <div className="space-y-3 text-sm text-[#b9aea4]">
                  <Link to="/" className="block transition hover:text-white">Privacy</Link>
                  <Link to="/" className="block transition hover:text-white">Terms</Link>
                  <Link to="/" className="block transition hover:text-white">Security</Link>
                  <Link to="/" className="block transition hover:text-white">Contact</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-[#958a86] sm:flex-row sm:items-center sm:justify-between">
            <span>© 2024 JobPilot.AI Inc. All rights reserved.</span>
            <span className="inline-flex items-center gap-2">
              <Globe2 size={15} />
              Built for global engineering teams
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
