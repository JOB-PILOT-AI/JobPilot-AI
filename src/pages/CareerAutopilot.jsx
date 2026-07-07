import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileText,
  Gauge,
  Lightbulb,
  ListChecks,
  Loader2,
  Rocket,
  Sparkles,
  Target,
  WandSparkles,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import ErrorBoundary from '../components/ErrorBoundary'

const defaultGoal = {
  role: 'Frontend Developer',
  timeline: '45',
  workMode: 'Remote',
  level: 'Mid level',
}

const prioritySkills = [
  'React',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'REST API',
  'Tailwind CSS',
  'Testing',
  'MongoDB',
  'System Design',
  'Git',
]

const planTemplates = [
  {
    range: 'Days 1-7',
    title: 'Positioning sprint',
    tasks: [
      'Rewrite resume summary around the target role.',
      'Move strongest matching skills into the first skill row.',
      'Add measurable outcomes to the top two experience bullets.',
    ],
  },
  {
    range: 'Days 8-18',
    title: 'Proof sprint',
    tasks: [
      'Upgrade one project description with problem, stack, and business result.',
      'Create a short portfolio note for your strongest project.',
      'Patch the top missing skill with a focused mini project or certification.',
    ],
  },
  {
    range: 'Days 19-32',
    title: 'Application sprint',
    tasks: [
      'Apply to the highest match jobs first.',
      'Tailor resume keywords for each job description before applying.',
      'Send one recruiter or referral message for every serious application.',
    ],
  },
  {
    range: 'Days 33-45',
    title: 'Interview sprint',
    tasks: [
      'Practice role-specific questions from recent job descriptions.',
      'Prepare STAR stories for ownership, conflict, technical tradeoffs, and impact.',
      'Follow up on active applications and update the tracker daily.',
    ],
  },
]

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

const readAutopilotGoal = () => {
  if (typeof window === 'undefined') return defaultGoal

  try {
    return {
      ...defaultGoal,
      ...(JSON.parse(window.localStorage.getItem('jobpilot-career-autopilot-goal')) || {}),
    }
  } catch {
    return defaultGoal
  }
}

const saveAutopilotGoal = (goal) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('jobpilot-career-autopilot-goal', JSON.stringify(goal))
}

const getResumeSkills = (resume) => {
  const directSkills = Array.isArray(resume?.skills) ? resume.skills : []
  const projectSkills = Array.isArray(resume?.projects)
    ? resume.projects.flatMap((project) => Array.isArray(project.technologies) ? project.technologies : [])
    : []

  return [...directSkills, ...projectSkills].map((skill) => String(skill || '').trim()).filter(Boolean)
}

const normalizeResponse = (payload, key) => {
  if (payload?.data?.[key] !== undefined) return payload.data[key]
  if (payload?.[key] !== undefined) return payload[key]
  return payload?.data || payload
}

export default function CareerAutopilot() {
  const navigate = useNavigate()
  const [goal, setGoal] = useState(readAutopilotGoal)
  const [workspace, setWorkspace] = useState(null)
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAutopilot = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [workspaceResponse, matchResponse] = await Promise.all([
        axios.get('/api/career/workspace'),
        axios.get('/api/jobs/matches?limit=12'),
      ])

      setWorkspace(workspaceResponse.data)
      const matchPayload = normalizeResponse(matchResponse.data, 'matches')
      setMatches(Array.isArray(matchPayload?.matches) ? matchPayload.matches : Array.isArray(matchPayload) ? matchPayload : [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Career Autopilot could not load right now.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAutopilot()
  }, [])

  useEffect(() => {
    saveAutopilotGoal(goal)
  }, [goal])

  const intelligence = useMemo(() => {
    const resume = workspace?.resume
    const resumeSkills = getResumeSkills(resume)
    const normalizedResumeSkills = resumeSkills.map((skill) => skill.toLowerCase())
    const targetWords = goal.role
      .split(/[^a-z0-9+#.]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length > 2)

    const relevantSkills = prioritySkills.filter((skill) => {
      const lowerSkill = skill.toLowerCase()
      return normalizedResumeSkills.some((resumeSkill) => resumeSkill.includes(lowerSkill) || lowerSkill.includes(resumeSkill))
    })

    const targetHits = targetWords.filter((word) => {
      const lowerWord = word.toLowerCase()
      return normalizedResumeSkills.some((skill) => skill.includes(lowerWord))
    })

    const missingSkills = prioritySkills
      .filter((skill) => !relevantSkills.includes(skill))
      .slice(0, 5)

    const atsScore = Number(resume?.atsAnalytics?.score || resume?.atsScore?.score || 0)
    const matchScores = matches.map((job) => Number(job.matchScore?.matchPercentage || job.matchScore?.overall || 0))
    const averageMatch = matchScores.length
      ? Math.round(matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length)
      : 0

    const applications = Array.isArray(workspace?.applications) ? workspace.applications : []
    const activeApplications = applications.filter((item) => !['rejected', 'withdrawn'].includes(item.status)).length
    const experience = resume?.experience || resume?.workExperience || []

    const resumeCompleteness = resume
      ? clamp(
          25 +
          Math.min(resumeSkills.length, 12) * 3 +
          (resume.personalInfo?.summary || resume.summary ? 14 : 0) +
          (Array.isArray(experience) && experience.length ? 16 : 0) +
          (Array.isArray(resume.projects) && resume.projects.length ? 9 : 0)
        )
      : 0

    const readiness = clamp(Math.round(
      resumeCompleteness * 0.32 +
      (atsScore || resumeCompleteness) * 0.28 +
      averageMatch * 0.24 +
      Math.min(activeApplications * 5, 16) +
      Math.min(targetHits.length * 4, 12)
    ))

    const strongestJobs = [...matches]
      .sort((left, right) => Number(right.matchScore?.matchPercentage || 0) - Number(left.matchScore?.matchPercentage || 0))
      .slice(0, 4)

    return {
      resume,
      resumeSkills,
      relevantSkills,
      missingSkills,
      readiness,
      averageMatch,
      activeApplications,
      strongestJobs,
      atsScore,
      resumeCompleteness,
    }
  }, [goal.role, matches, workspace])

  const updateGoal = (event) => {
    const { name, value } = event.target
    setGoal((current) => ({ ...current, [name]: value }))
  }

  const targetDays = clamp(Number(goal.timeline) || 45, 7, 120)
  const dailyApplications = targetDays <= 30 ? 6 : targetDays <= 60 ? 4 : 3
  const weeklyInterviewPractice = targetDays <= 30 ? 4 : 3

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Rocket size={16} /> Career Autopilot
              </div>
              <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white md:text-5xl">
                Turn one career goal into a daily execution plan.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-secondary">
                Autopilot reads your resume, active applications, and best job matches, then converts them into a focused roadmap for getting hired faster.
              </p>
            </div>

            <Card className="rounded-[1.5rem]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardContent className="mb-1 uppercase tracking-[0.22em]">Readiness</CardContent>
                  <CardTitle>{intelligence.readiness}% ready</CardTitle>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-2xl font-bold text-accent">
                  {intelligence.readiness}
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${intelligence.readiness}%` }} />
              </div>
            </Card>
          </header>

          {error && <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="rounded-[1.5rem]">
              <CardTitle className="mb-2">Mission control</CardTitle>
              <CardContent className="mb-6">Set the role you want. The plan updates instantly.</CardContent>

              <div className="space-y-4">
                <Input name="role" value={goal.role} onChange={updateGoal} placeholder="Target role" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input name="timeline" value={goal.timeline} onChange={updateGoal} type="number" min="7" max="120" placeholder="Days" />
                  <select name="workMode" value={goal.workMode} onChange={updateGoal} className="w-full rounded-2xl border border-white/10 bg-[#0b1221] px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>On-site</option>
                    <option>Any</option>
                  </select>
                </div>
                <select name="level" value={goal.level} onChange={updateGoal} className="w-full rounded-2xl border border-white/10 bg-[#0b1221] px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  <option>Entry level</option>
                  <option>Mid level</option>
                  <option>Senior level</option>
                  <option>Leadership</option>
                </select>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <Metric label="ATS" value={intelligence.atsScore || '--'} />
                <Metric label="Avg match" value={intelligence.averageMatch || '--'} />
                <Metric label="Active" value={intelligence.activeApplications} />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" onClick={() => navigate('/resume-builder')}>
                  <FileText size={16} className="mr-2" /> Improve resume
                </Button>
                <Button variant="outline" className="flex-1" onClick={loadAutopilot} disabled={isLoading}>
                  {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                  Refresh
                </Button>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InsightCard icon={Target} title="Target" value={goal.role || 'Target role'} detail={`${goal.level} | ${goal.workMode} | ${targetDays} days`} />
              <InsightCard icon={Gauge} title="Resume strength" value={`${intelligence.resumeCompleteness}%`} detail={intelligence.resume ? 'Based on current resume sections' : 'Create or upload a resume first'} />
              <InsightCard icon={BriefcaseBusiness} title="Daily apply pace" value={`${dailyApplications}/day`} detail="Recommended sustainable outreach volume" />
              <InsightCard icon={CalendarCheck2} title="Interview prep" value={`${weeklyInterviewPractice}x/week`} detail="Practice cadence for this timeline" />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
            <Card className="rounded-[1.5rem]">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>45-day execution roadmap</CardTitle>
                  <CardContent>Concrete actions ordered by impact, not noise.</CardContent>
                </div>
                <div className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                  {goal.timeline || 45} day mission
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {planTemplates.map((phase, index) => (
                  <div key={phase.range} className="rounded-2xl border border-white/10 bg-[#0d1116] p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{index + 1}</div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-secondary">{phase.range}</div>
                        <div className="font-semibold text-white">{phase.title}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {phase.tasks.map((task) => (
                        <div key={task} className="flex items-start gap-3 text-sm leading-6 text-secondary">
                          <CheckCircle2 size={17} className="mt-1 shrink-0 text-accent" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[1.5rem]">
              <CardTitle className="mb-2">Autopilot priorities</CardTitle>
              <CardContent className="mb-5">Do these first for the biggest readiness jump.</CardContent>
              <div className="space-y-4">
                <Priority icon={WandSparkles} title="Tailor your top resume section" detail={`Make your summary explicitly point at ${goal.role || 'your target role'}.`} to="/career-studio" />
                <Priority icon={ListChecks} title="Patch skill gaps" detail={intelligence.missingSkills.length ? intelligence.missingSkills.slice(0, 3).join(', ') : 'Your core skill coverage looks strong.'} to="/resume-builder" />
                <Priority icon={ClipboardList} title="Track every application" detail="Saved notes and next actions keep the search from becoming messy." to="/applications" />
              </div>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
            <Card className="rounded-[1.5rem]">
              <CardTitle className="mb-2">Skill radar</CardTitle>
              <CardContent className="mb-5">Your current profile compared with common target-role signals.</CardContent>

              <div className="mb-5">
                <div className="mb-3 text-sm font-semibold text-white">Matched strengths</div>
                <div className="flex flex-wrap gap-2">
                  {(intelligence.relevantSkills.length ? intelligence.relevantSkills : intelligence.resumeSkills.slice(0, 6)).map((skill) => (
                    <span key={skill} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">{skill}</span>
                  ))}
                  {!intelligence.resumeSkills.length && <span className="text-sm text-secondary">No resume skills detected yet.</span>}
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-semibold text-white">Missing signals</div>
                <div className="flex flex-wrap gap-2">
                  {intelligence.missingSkills.map((skill) => (
                    <span key={skill} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{skill}</span>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="rounded-[1.5rem]">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Best jobs to attack first</CardTitle>
                  <CardContent>Highest compatibility roles from your current matches.</CardContent>
                </div>
                <Button variant="outline" onClick={() => navigate('/jobs')}>View all jobs <ArrowRight size={16} className="ml-2" /></Button>
              </div>

              <div className="space-y-3">
                {intelligence.strongestJobs.map((job) => (
                  <div key={job._id || job.id} className="grid gap-4 rounded-2xl border border-white/10 bg-[#0d1116] p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.22em] text-accent">
                        {job.matchScore?.matchPercentage || job.matchScore?.overall || 0}% match
                      </div>
                      <div className="text-lg font-semibold text-white">{job.title}</div>
                      <div className="mt-1 text-sm text-secondary">{job.company} | {job.location || job.remoteType || 'Location not listed'}</div>
                    </div>
                    <Button size="sm" onClick={() => navigate(`/job-match/${job._id || job.id}`)}>Attack role</Button>
                  </div>
                ))}
                {!intelligence.strongestJobs.length && !isLoading && (
                  <div className="rounded-2xl border border-white/10 bg-[#0d1116] p-8 text-center">
                    <Compass className="mx-auto mb-3 text-primary" />
                    <div className="font-semibold text-white">No matches yet</div>
                    <p className="mt-2 text-sm text-secondary">Upload or build a resume, then Autopilot will rank your best roles.</p>
                  </div>
                )}
                {isLoading && (
                  <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#0d1116] p-8 text-secondary">
                    <Loader2 className="mr-2 animate-spin" size={18} /> Loading Autopilot intelligence...
                  </div>
                )}
              </div>
            </Card>
          </section>

          <Card className="rounded-[1.5rem]">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex gap-4">
                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary sm:flex">
                  <Lightbulb size={26} />
                </div>
                <div>
                  <CardTitle>Next best action</CardTitle>
                  <CardContent className="mt-2">
                    {intelligence.resume
                      ? `Create one tailored resume and cover letter for your highest match ${goal.role || 'target role'} today.`
                      : 'Upload or build a resume so Autopilot can score your readiness and generate role-specific actions.'}
                  </CardContent>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate(intelligence.resume ? '/career-studio' : '/resume-builder')}>
                  {intelligence.resume ? 'Generate tailored assets' : 'Build resume'} <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/interview-prep')}>
                  Practice interview
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1116] p-4 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-secondary">{label}</div>
    </div>
  )
}

function InsightCard({ icon: Icon, title, value, detail }) {
  return (
    <Card className="rounded-[1.5rem]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon size={22} />
      </div>
      <CardContent className="mb-1 uppercase tracking-[0.22em]">{title}</CardContent>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="mt-3 text-sm leading-6 text-secondary">{detail}</p>
    </Card>
  )
}

function Priority({ icon: Icon, title, detail, to }) {
  return (
    <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0d1116] p-4 transition hover:border-primary/30 hover:bg-white/[0.04]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-semibold text-white">
          {title}
          <BadgeCheck size={16} className="text-accent opacity-0 transition group-hover:opacity-100" />
        </span>
        <span className="mt-1 block text-sm leading-6 text-secondary">{detail}</span>
      </span>
    </Link>
  )
}
