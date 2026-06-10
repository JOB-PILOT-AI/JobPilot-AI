import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import { ArrowRight, BarChart3, Brain, Code2, Gauge, Globe2, Sparkles, Zap, FileText, Video, BookOpen } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-soft">
            Now in beta
          </div>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-balance sm:text-6xl">
              Precision tools for <span className="text-primary-soft">career growth</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted">
              A clinical approach to the job search. Leveraging career intelligence to match your engineering DNA with elite opportunities.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="lg" onClick={() => navigate('/login')}>
              Get Started Free <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Demo
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-[#171212]/90 p-5 shadow-[0_30px_100px_rgba(182,77,80,0.12)]">
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">AI Matching Engine</div>
                <div className="text-[11px] text-muted">Real-time Job DNA Analysis</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-soft">98% Match</div>
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span>Lead Systems Engineer</span>
                <span className="text-primary-soft">Perfect Fit</span>
              </div>
              <div className="h-3 rounded-sm bg-tertiary">
                <div className="h-full w-[92%] rounded-sm bg-primary-soft" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-[#151515] p-4">
                <div className="text-[11px] uppercase text-muted">ATS compatibility</div>
                <div className="mt-1 font-semibold">High (94)</div>
              </div>
              <div className="rounded-md bg-[#151515] p-4">
                <div className="text-[11px] uppercase text-muted">Skill gaps</div>
                <div className="mt-1 font-semibold">0 Missing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight">Intelligence built for excellence</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            [Zap, 'Intelligent Matching', "Our neural network parses high-dimensional skill data to find roles that don't just match your title, but your actual engineering capacity.", '/jobs'],
            [Gauge, 'ATS Optimization', 'Reverse-engineer recruitment systems with a surgical view into how ATS algorithms rank your profile against competitors.', '/dashboard'],
            [FileText, 'Resume Builder', 'Create an ATS-friendly resume from scratch or import your existing one. Live preview and real-time scoring included.', '/resume-builder'],
            [Video, 'Mock Interviews', 'Practice your technical and behavioral skills with an AI-powered mock interview simulator.', '/mock-interview'],
            [BookOpen, 'Aptitude Practice', 'Brush up on your technical and non-technical aptitude with a library of practice questions.', '/practice'],
            [Code2, 'Engineering Workflows', 'Export resumes as clean JSON, track applications with Git-like versioning, and automate the mundane.', ''],
          ].map(([Icon, title, copy, link]) => (
            <Card key={title} className={`overflow-hidden bg-[#211d1d]/90 ${link ? 'transition-colors hover:border-primary/50' : ''}`}>
              <div className={`h-full w-full ${link ? 'cursor-pointer' : ''}`} onClick={() => link && navigate(link)}>
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-tertiary text-primary-soft">
                  <Icon size={18} />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardContent className="mt-3">{copy}</CardContent>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-24 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <Card className="min-h-80 bg-[#181818]">
          <CardTitle>Detailed Insights</CardTitle>
          <CardContent className="mt-2">Visualize your market value with real-time industry data and salary benchmarks.</CardContent>
          <div className="mt-10 flex h-32 items-end gap-4 border-t border-border pt-8">
            {[38, 55, 70, 100, 60, 48].map((height, index) => (
              <div
                key={height}
                className={`w-full rounded-sm ${index === 3 ? 'bg-primary-soft' : 'bg-[#5b4444]'}`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between text-xs text-muted">
            <span>Market percentile <strong className="block text-foreground">Top 2%</strong></span>
            <span className="text-right">Growth vector <strong className="block text-accent">+14.2%</strong></span>
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="border-primary/25 bg-primary/10">
            <CardTitle className="text-xl">Resume Scorecard</CardTitle>
            <CardContent className="mt-3 flex items-center gap-3">
              <Brain size={18} className="text-primary-soft" /> Optimized for 14 major ATS platforms.
            </CardContent>
          </Card>
          <Card className="bg-[#181818]">
            <div className="flex items-start justify-between gap-6">
              <div>
                <CardTitle className="text-xl">Global Reach</CardTitle>
                <CardContent className="mt-3">Connecting elite talent with Fortune 500 tech teams across 4 continents.</CardContent>
                <button className="mt-5 text-sm font-semibold text-primary-soft">Explore Network <ArrowRight size={14} className="inline" /></button>
              </div>
              <Globe2 className="mt-2 text-border" size={86} />
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="rounded-2xl border border-border bg-[#33302e] px-8 py-20 text-center">
          <h3 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight">
            Ready to navigate your <span className="text-primary-soft">next pivot?</span>
          </h3>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-muted">
            Join 25,000+ engineers using JobPilot.AI to manage their professional evolution with clinical precision.
          </p>
          <Button variant="primary" size="lg" className="mt-8" onClick={() => navigate('/login')}>
            Create Free Profile
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-[#090909]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4 lg:px-8">
          <div>
            <div className="text-xl font-bold">JobPilot.AI</div>
            <p className="mt-3 text-sm text-muted">Career Intelligence for the modern engineer.</p>
          </div>
          {[
            ['Platform', 'Features', 'ATS Scan', 'Pricing'],
            ['Resources', 'Career Blog', 'Documentation', 'Templates'],
            ['Legal', 'Privacy', 'Terms', 'Security'],
          ].map(([title, ...links]) => (
            <div key={title}>
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em]">{title}</div>
              <div className="space-y-3 text-sm text-muted">
                {links.map((link) => <a key={link} href="#" className="block hover:text-foreground">{link}</a>)}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  )
}
