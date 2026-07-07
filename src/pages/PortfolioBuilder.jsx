import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Globe2,
  Linkedin,
  Loader2,
  Palette,
  Mail,
  MapPin,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import ErrorBoundary from '../components/ErrorBoundary'

const themes = {
  aurora: {
    label: 'Aurora',
    accent: '#49d7ca',
    secondary: '#b64f52',
    background: '#061018',
    surface: '#101820',
    border: 'rgba(73,215,202,.18)',
    muted: '#a9bac5',
  },
  crimson: {
    label: 'Crimson',
    accent: '#ff7474',
    secondary: '#5f83f6',
    background: '#10070a',
    surface: '#1a1115',
    border: 'rgba(255,116,116,.2)',
    muted: '#d0b6bb',
  },
  graphite: {
    label: 'Graphite',
    accent: '#f8fafc',
    secondary: '#94a3b8',
    background: '#09090b',
    surface: '#15171c',
    border: 'rgba(248,250,252,.16)',
    muted: '#b4bdca',
  },
}

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const buildPortfolioHtml = ({ resume, profile, theme }) => {
  const personal = resume?.personalInfo || {}
  const experience = resume?.experience || resume?.workExperience || []
  const projects = resume?.projects || []
  const activeTheme = themes[theme] || themes.aurora

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(profile.name)} Portfolio</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; background: ${activeTheme.background}; color: #f8fafc; }
    body:before { content: ""; position: fixed; inset: 0; pointer-events: none; background: radial-gradient(circle at top left, ${activeTheme.accent}24, transparent 34%), radial-gradient(circle at bottom right, ${activeTheme.secondary}20, transparent 36%); }
    main { position: relative; max-width: 1080px; margin: 0 auto; padding: 64px 24px; }
    .hero { padding: 52px; border: 1px solid ${activeTheme.border}; border-radius: 30px; background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.028)); box-shadow: 0 28px 90px rgba(0,0,0,.28); }
    .eyebrow { margin: 0 0 16px; font-size: 13px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 0; max-width: 820px; font-size: clamp(42px, 7vw, 76px); line-height: .96; letter-spacing: -.04em; }
    h2 { margin: 54px 0 18px; font-size: 26px; letter-spacing: -.02em; }
    h3 { margin: 0 0 8px; }
    p, li { color: ${activeTheme.muted}; line-height: 1.75; }
    .contact { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 26px; color: ${activeTheme.muted}; }
    .accent { color: ${activeTheme.accent}; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip { border: 1px solid ${activeTheme.border}; border-radius: 999px; padding: 8px 12px; color: ${activeTheme.accent}; background: rgba(255,255,255,.05); font-size: 13px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
    .card { border: 1px solid rgba(255,255,255,.11); border-radius: 22px; padding: 24px; background: ${activeTheme.surface}; }
    a { color: ${activeTheme.accent}; }
    @media (max-width: 680px) { .hero { padding: 30px; } main { padding-top: 32px; } }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <p class="eyebrow accent">${escapeHtml(profile.title)}</p>
      <h1>${escapeHtml(profile.name)}</h1>
      <p>${escapeHtml(profile.summary || personal.summary || resume?.summary)}</p>
      <div class="contact"><span>${escapeHtml(personal.email)}</span>${personal.location ? `<span>${escapeHtml(personal.location)}</span>` : ''}</div>
    </section>
    <h2>Skills</h2>
    <div class="chips">${(resume?.skills || []).map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`).join('')}</div>
    <h2>Projects</h2>
    <section class="grid">${projects.map((project) => `<article class="card"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description)}</p><p>${(project.technologies || []).map(escapeHtml).join(', ')}</p></article>`).join('')}</section>
    <h2>Experience</h2>
    <section class="grid">${experience.map((item) => `<article class="card"><h3>${escapeHtml(item.position)}</h3><p class="accent">${escapeHtml(item.company)}</p><p>${escapeHtml(item.description)}</p></article>`).join('')}</section>
  </main>
</body>
</html>`
}

export default function PortfolioBuilder() {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState('aurora')
  const [profile, setProfile] = useState({ name: '', title: '', summary: '' })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get('/api/career/workspace')
        setWorkspace(response.data)
        const resume = response.data?.resume
        const personal = resume?.personalInfo || {}
        setProfile({
          name: personal.fullName || response.data?.user?.name || 'Your Name',
          title: personal.title || response.data?.user?.currentRole || 'Career Professional',
          summary: personal.summary || resume?.summary || '',
        })
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const resume = workspace?.resume
  const personal = resume?.personalInfo || {}
  const experience = resume?.experience || resume?.workExperience || []
  const projects = resume?.projects || []
  const activeTheme = themes[theme]
  const visibleSkills = (resume?.skills || []).slice(0, 14)
  const contactLinks = [
    personal.email && { label: personal.email, icon: Mail, href: `mailto:${personal.email}` },
    personal.location && { label: personal.location, icon: MapPin },
    personal.github && { label: 'GitHub', icon: Github, href: personal.github },
    personal.linkedin && { label: 'LinkedIn', icon: Linkedin, href: personal.linkedin },
  ].filter(Boolean)

  const html = useMemo(() => buildPortfolioHtml({ resume, profile, theme }), [profile, resume, theme])

  const updateProfile = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  const downloadHtml = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'portfolio'}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Globe2 size={16} /> Portfolio Builder
              </div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-5xl">Design a polished portfolio website from your resume.</h1>
              <p className="mt-4 max-w-3xl text-secondary">Refine your professional headline, preview a recruiter-ready portfolio, and export a standalone HTML page.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/resume-builder')}><FileText size={16} className="mr-2" /> Edit resume</Button>
              <Button onClick={downloadHtml} disabled={!resume}><Download size={16} className="mr-2" /> Download HTML</Button>
            </div>
          </header>

          {isLoading && (
            <Card className="rounded-[1.5rem]">
              <div className="flex items-center text-secondary"><Loader2 size={18} className="mr-2 animate-spin" /> Building portfolio preview...</div>
            </Card>
          )}

          {!resume && !isLoading && (
            <Card className="rounded-[1.5rem]">
              <CardTitle>No resume found</CardTitle>
              <CardContent className="mt-2">Create or upload a resume first so Portfolio Builder can generate your site.</CardContent>
              <Button className="mt-5" onClick={() => navigate('/resume-builder')}>Build resume <ArrowRight size={16} className="ml-2" /></Button>
            </Card>
          )}

          <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
            <Card className="rounded-[1.25rem] border-white/[0.08] bg-[#0f1116]">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="mb-2 text-2xl">Customize</CardTitle>
                  <CardContent>Control the portfolio hero, theme, and export style.</CardContent>
                </div>
                <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">Live</span>
              </div>

              <div className="space-y-5">
                <FieldLabel label="Display name">
                  <Input name="name" value={profile.name} onChange={updateProfile} placeholder="Name" />
                </FieldLabel>
                <FieldLabel label="Professional headline">
                  <Input name="title" value={profile.title} onChange={updateProfile} placeholder="Senior Software Engineer" />
                </FieldLabel>
                <FieldLabel label="Portfolio summary">
                  <textarea
                    name="summary"
                    value={profile.summary}
                    onChange={updateProfile}
                    rows={8}
                    placeholder="Write a concise summary focused on your impact, strengths, and target role."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-[#0b1221] p-4 text-sm leading-7 text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </FieldLabel>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Stat value={visibleSkills.length} label="Skills" />
                <Stat value={projects.length} label="Projects" />
                <Stat value={experience.length} label="Roles" />
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Palette size={17} className="text-primary" /> Theme</div>
                <div className="grid gap-3">
                  {Object.entries(themes).map(([key, item]) => (
                    <button key={key} onClick={() => setTheme(key)} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${theme === key ? 'border-primary bg-primary/10 shadow-[0_18px_45px_rgba(182,79,82,0.12)]' : 'border-white/10 bg-[#0d1116] hover:border-white/20'}`}>
                      <span>
                        <span className="block font-semibold text-white">{item.label}</span>
                        <span className="mt-1 block text-xs text-secondary">Professional dark portfolio</span>
                      </span>
                      <span className="flex gap-1.5">
                        <span className="h-5 w-5 rounded-full ring-2 ring-white/10" style={{ background: item.accent }} />
                        <span className="h-5 w-5 rounded-full ring-2 ring-white/10" style={{ background: item.secondary }} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-[1.25rem] border-white/[0.08] bg-[#0d0f13] p-0">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white"><Eye size={17} className="text-primary" /> Recruiter preview</div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs uppercase tracking-[0.2em] text-secondary sm:inline">Desktop</span>
                  <div className="text-xs uppercase tracking-[0.2em] text-secondary">{activeTheme.label}</div>
                </div>
              </div>
              <div className="bg-[#080a0d] p-5 md:p-7">
                <div className="overflow-hidden rounded-[1.5rem] border shadow-[0_30px_100px_rgba(0,0,0,0.35)]" style={{ background: activeTheme.background, borderColor: activeTheme.border }}>
                  <div className="border-b border-white/10 px-5 py-3">
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff7474]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffc857]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#49d7ca]" />
                    </div>
                  </div>
                  <div className="p-6 md:p-10">
                    <div className="rounded-[1.25rem] border p-7 md:p-9" style={{ borderColor: activeTheme.border, background: activeTheme.surface }}>
                      <div className="mb-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: activeTheme.accent, borderColor: activeTheme.border }}>
                        {profile.title}
                      </div>
                      <h2 className="max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">{profile.name}</h2>
                      <p className="mt-5 max-w-3xl text-sm leading-7 md:text-base" style={{ color: activeTheme.muted }}>{profile.summary || personal.summary || resume?.summary || 'Add a focused portfolio summary that explains your strengths, impact, and target role.'}</p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {contactLinks.map(({ label, icon: Icon, href }) => {
                          const content = (
                            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold text-slate-200" style={{ borderColor: activeTheme.border }}>
                              <Icon size={14} /> {label}
                            </span>
                          )
                          return href ? <a key={label} href={href}>{content}</a> : <span key={label}>{content}</span>
                        })}
                      </div>
                    </div>

                    <PreviewSection title="Skills">
                      <div className="flex flex-wrap gap-2">
                        {visibleSkills.map((skill) => <span key={skill} className="rounded-full border bg-white/[0.06] px-3 py-1.5 text-xs font-semibold" style={{ color: activeTheme.accent, borderColor: activeTheme.border }}>{skill}</span>)}
                        {!visibleSkills.length && <span className="text-sm" style={{ color: activeTheme.muted }}>Add resume skills to populate this section.</span>}
                      </div>
                    </PreviewSection>

                    <PreviewSection title="Projects">
                      <div className="grid gap-3 md:grid-cols-2">
                        {projects.slice(0, 4).map((project) => (
                          <div key={project.name} className="rounded-2xl border bg-white/[0.04] p-5" style={{ borderColor: activeTheme.border }}>
                            <div className="font-semibold text-white">{project.name}</div>
                            <p className="mt-2 text-sm leading-6" style={{ color: activeTheme.muted }}>{project.description}</p>
                            {project.link && <a href={project.link} className="mt-3 inline-flex items-center text-sm" style={{ color: activeTheme.accent }}>Open <ExternalLink size={14} className="ml-1" /></a>}
                          </div>
                        ))}
                        {!projects.length && <EmptyPreview label="Projects from your resume will appear here." />}
                      </div>
                    </PreviewSection>

                    <PreviewSection title="Experience">
                      <div className="space-y-3">
                        {experience.slice(0, 4).map((item) => (
                          <div key={`${item.company}-${item.position}`} className="grid gap-4 rounded-2xl border bg-white/[0.04] p-5 md:grid-cols-[150px_1fr]" style={{ borderColor: activeTheme.border }}>
                            <div>
                              <div className="text-xs uppercase tracking-[0.16em]" style={{ color: activeTheme.accent }}>{item.company}</div>
                              <div className="mt-1 text-xs" style={{ color: activeTheme.muted }}>{[item.startDate, item.endDate || (item.isCurrent ? 'Present' : '')].filter(Boolean).join(' - ')}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-white">{item.position}</div>
                              <p className="mt-2 text-sm leading-6" style={{ color: activeTheme.muted }}>{item.description}</p>
                            </div>
                          </div>
                        ))}
                        {!experience.length && <EmptyPreview label="Experience from your resume will appear here." />}
                      </div>
                    </PreviewSection>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function PreviewSection({ title, children }) {
  return (
    <section className="mt-8">
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
        <span className="h-2 w-2 rounded-full bg-current opacity-50" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-secondary">{label}</span>
      {children}
    </label>
  )
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1116] p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">{label}</div>
    </div>
  )
}

function EmptyPreview({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-5 text-sm text-slate-400">
      {label}
    </div>
  )
}
