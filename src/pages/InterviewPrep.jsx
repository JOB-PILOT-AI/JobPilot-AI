import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  GraduationCap,
  MessageSquare,
  PenLine,
  Sparkles,
  Users,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import ErrorBoundary from '../components/ErrorBoundary'

const tracks = [
  {
    key: 'technical',
    label: 'Technical',
    eyebrow: 'Developer and engineering rounds',
    icon: Code2,
    description: 'A professional technical path for coding screens, project deep dives, debugging, and system thinking.',
    examMix: ['Technical MCQs', 'Coding aptitude', 'Resume skill questions', 'Project explanation'],
    bestFor: ['Software roles', 'Developer internships', 'Technical interviews'],
    stats: [
      { label: 'Practice mix', value: 'Tech + Aptitude' },
      { label: 'Mock focus', value: 'Projects' },
      { label: 'Level', value: 'Job ready' },
    ],
  },
  {
    key: 'nonTechnical',
    label: 'Non-technical',
    eyebrow: 'HR, aptitude, and communication rounds',
    icon: Users,
    description: 'A placement-style non-tech path with aptitude, English, HR, behavioral, and communication practice.',
    examMix: ['Aptitude MCQs', 'English grammar', 'Communication', 'HR questions'],
    bestFor: ['HR round', 'Manager round', 'Non-tech jobs', 'Campus placement'],
    stats: [
      { label: 'Practice mix', value: 'Aptitude + English' },
      { label: 'Mock focus', value: 'HR stories' },
      { label: 'Level', value: 'Professional' },
    ],
  },
]

const actions = [
  {
    title: 'Mock Interview',
    description: 'Practice role-specific spoken questions, talking points, and improvement areas based on your resume.',
    path: '/mock-interview',
    icon: MessageSquare,
    cta: 'Start Mock',
  },
  {
    title: 'Practice Set',
    description: 'Take a timed MCQ exam. Non-tech includes aptitude and English; technical includes aptitude and skill questions.',
    path: '/practice-test',
    icon: ClipboardCheck,
    cta: 'Open Exam',
  },
  {
    title: 'Tracker Analytics',
    description: 'Review your application pipeline, response rate, interview stages, and next actions in one Pro dashboard.',
    path: '/applications',
    icon: BarChart3,
    cta: 'Open Tracker',
    preserveTrack: false,
  },
]

const preparationFlow = [
  { title: 'Select Track', description: 'Choose technical or non-technical based on your target role.' },
  { title: 'Practice Exam', description: 'Attempt timed MCQs with a professional exam layout and scoring.' },
  { title: 'Mock Round', description: 'Prepare answers that connect your resume to real interview questions.' },
]

export default function InterviewPrep() {
  const navigate = useNavigate()
  const location = useLocation()
  const growthSupportRef = useRef(null)
  const [selectedTrack, setSelectedTrack] = useState('technical')
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const isCareerGrowthEntry = searchParams.get('source') === 'career-growth'
  const selectedTrackData = useMemo(
    () => tracks.find((track) => track.key === selectedTrack) || tracks[0],
    [selectedTrack]
  )
  const SelectedIcon = selectedTrackData.icon

  useEffect(() => {
    if (!isCareerGrowthEntry) return
    growthSupportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isCareerGrowthEntry])

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <section
          ref={growthSupportRef}
          id="career-growth-support"
          className={`overflow-hidden rounded-2xl border bg-[#0b1118] shadow-[0_24px_70px_rgba(0,0,0,0.24)] ${
            isCareerGrowthEntry ? 'border-primary/40 ring-1 ring-primary/30' : 'border-white/10'
          }`}
        >
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_380px]">
            <div className="p-6 sm:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles size={14} />
                {isCareerGrowthEntry ? 'Career Growth Support' : 'Interview preparation'}
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {isCareerGrowthEntry
                  ? 'Your Pro career growth tools are ready.'
                  : 'Prepare for every interview round with a real exam structure.'}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-secondary">
                {isCareerGrowthEntry
                  ? 'Use Pro practice tests and resume-aware mock interviews to prepare for technical, non-technical, HR, and aptitude rounds.'
                  : 'Choose your track first, then move into a mock interview or timed practice set. The non-technical path now gives aptitude and English practice, like common campus and hiring portals.'}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {preparationFlow.map((step, index) => (
                  <div key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="text-sm font-semibold text-white">{step.title}</div>
                    <div className="mt-1 text-xs leading-5 text-secondary">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#101722] p-6 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <BriefcaseBusiness size={21} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-primary">Professional mode</div>
                  <div className="text-lg font-semibold text-white">Round planner</div>
                </div>
              </div>
              <div className="space-y-3">
                {selectedTrackData.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0d121a] px-4 py-3">
                    <span className="text-sm text-secondary">{stat.label}</span>
                    <span className="text-sm font-semibold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          {tracks.map((track) => {
            const Icon = track.icon
            const isActive = selectedTrack === track.key

            return (
              <button
                key={track.key}
                type="button"
                onClick={() => setSelectedTrack(track.key)}
                className={`group rounded-2xl border p-5 text-left transition ${
                  isActive
                    ? 'border-primary bg-primary/10 shadow-[0_20px_70px_rgba(182,79,82,0.2)]'
                    : 'border-white/10 bg-[#101318] hover:border-primary/50 hover:bg-[#151920]'
                }`}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? 'bg-primary text-white' : 'bg-white/5 text-primary'}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{track.eyebrow}</div>
                      <h2 className="mt-1 text-2xl font-semibold text-white">{track.label}</h2>
                    </div>
                  </div>
                  {isActive && <CheckCircle2 size={22} className="shrink-0 text-primary" />}
                </div>
                <p className="text-sm leading-6 text-secondary">{track.description}</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {track.examMix.map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-secondary">
                      <CheckCircle2 size={15} className="text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-white/10 bg-[#0f131c]">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <SelectedIcon size={22} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Selected track</div>
                  <CardTitle className="mt-2">{selectedTrackData.label} preparation</CardTitle>
                  <CardContent className="mt-2 max-w-2xl text-secondary">{selectedTrackData.description}</CardContent>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {actions.map((action) => {
                const Icon = action.icon
                const target = action.preserveTrack === false ? action.path : `${action.path}?track=${selectedTrack}`

                return (
                  <div
                    key={action.path}
                    className={`rounded-2xl border bg-[#111417] p-5 transition hover:border-primary/60 hover:bg-[#151922] ${
                      isCareerGrowthEntry ? 'border-primary/35 shadow-[0_18px_60px_rgba(182,79,82,0.14)]' : 'border-white/10'
                    }`}
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <Icon size={22} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{action.title}</h3>
                    <p className="mt-3 min-h-16 text-sm leading-6 text-secondary">{action.description}</p>
                    <Button variant="primary" className="mt-5 w-full" onClick={() => navigate(target)}>
                      {action.cta}
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </Card>

          <aside className="space-y-6">
            <Card className="border-white/10 bg-[#0f131c]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <GraduationCap size={19} />
                </div>
                <CardTitle className="text-xl">Exam Contents</CardTitle>
              </div>
              <div className="space-y-3">
                {selectedTrackData.examMix.map((item) => {
                  const Icon = item.includes('Aptitude') ? Calculator : item.includes('English') ? BookOpenCheck : item.includes('Communication') || item.includes('HR') ? PenLine : ClipboardCheck

                  return (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111417] px-4 py-3 text-sm text-secondary">
                      <Icon size={16} className="text-primary" />
                      {item}
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="border-white/10 bg-[#0f131c]">
              <CardTitle className="mb-4 text-xl">Best For</CardTitle>
              <div className="space-y-3">
                {selectedTrackData.bestFor.map((item) => (
                  <div key={item} className="rounded-xl border border-white/10 bg-[#111417] px-4 py-3 text-sm text-secondary">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </ErrorBoundary>
  )
}
