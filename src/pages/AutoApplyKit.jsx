import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCopy,
  FileText,
  Loader2,
  Mail,
  MessageSquareText,
  Send,
  Sparkles,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import ErrorBoundary from '../components/ErrorBoundary'

const getResumeText = (resume) => {
  if (!resume) return ''
  const experience = resume.experience || resume.workExperience || []
  const projects = resume.projects || []

  return [
    resume.personalInfo?.summary || resume.summary,
    `Skills: ${(resume.skills || []).join(', ')}`,
    experience.map((item) => `${item.position || 'Role'} at ${item.company || 'Company'}: ${item.description || ''}`).join('\n'),
    projects.map((item) => `${item.name}: ${item.description || ''}`).join('\n'),
  ].filter(Boolean).join('\n')
}

const splitKeywords = (text) => {
  const ignored = new Set(['and', 'the', 'with', 'for', 'you', 'our', 'are', 'that', 'this', 'from', 'will', 'have', 'your', 'into', 'work', 'team'])
  const counts = new Map()

  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !ignored.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1))

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 16)
}

const copyText = async (text) => {
  await navigator.clipboard.writeText(text)
}

export default function AutoApplyKit() {
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState(null)
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState('')
  const [form, setForm] = useState({
    role: '',
    company: '',
    recruiter: '',
    jobDescription: '',
  })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [workspaceResponse, matchResponse] = await Promise.all([
          axios.get('/api/career/workspace'),
          axios.get('/api/jobs/matches?limit=6'),
        ])
        setWorkspace(workspaceResponse.data)
        const data = matchResponse.data?.data || matchResponse.data
        setMatches(data?.matches || [])
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const resume = workspace?.resume
  const person = resume?.personalInfo || {}
  const resumeText = getResumeText(resume)
  const resumeKeywords = splitKeywords(resumeText)
  const jdKeywords = splitKeywords(form.jobDescription)
  const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.includes(keyword)).slice(0, 8)
  const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.includes(keyword)).slice(0, 8)

  const kit = useMemo(() => {
    const name = person.fullName || workspace?.user?.name || 'Your Name'
    const title = person.title || form.role || workspace?.user?.currentRole || 'candidate'
    const role = form.role || 'this role'
    const company = form.company || 'your company'
    const recruiter = form.recruiter || 'there'
    const topSkills = (resume?.skills || []).slice(0, 6).join(', ') || 'relevant technical and business skills'
    const project = resume?.projects?.[0]
    const experience = (resume?.experience || resume?.workExperience || [])[0]
    const proof = experience?.description || project?.description || person.summary || resume?.summary || 'I bring practical experience, fast learning ability, and a strong ownership mindset.'

    return {
      resumeSummary: `${title} with hands-on experience aligned to ${role}. Strong in ${topSkills}. Known for turning requirements into reliable outcomes, communicating clearly, and improving delivery quality. Interested in contributing to ${company} with practical execution and continuous learning.`,
      coverLetter: `Hi ${recruiter},\n\nI am excited to apply for the ${role} position at ${company}. My background connects closely with the role through ${topSkills}, and I am especially interested in the opportunity to solve meaningful product and engineering problems.\n\n${proof}\n\nI would welcome the chance to discuss how my experience can support ${company}'s goals. Thank you for your time and consideration.\n\nBest regards,\n${name}`,
      recruiterMessage: `Hi ${recruiter}, I am interested in the ${role} role at ${company}. My profile matches the role through ${topSkills}. I would appreciate the chance to connect and share how I can contribute.`,
      screeningAnswers: [
        `Why are you interested? I am interested in ${company} because the ${role} role matches my skills in ${topSkills} and gives me a chance to contribute to real outcomes.`,
        `Why are you a good fit? My resume shows relevant experience, a strong learning mindset, and practical delivery ability. ${proof}`,
        'When can you start? I can discuss availability based on the interview process and notice period requirements.',
      ].join('\n\n'),
      followUp: `Hi ${recruiter}, I wanted to follow up on my application for the ${role} position at ${company}. I remain very interested and would be happy to share any additional details that help with the review. Thank you again for your time.`,
    }
  }, [form.company, form.recruiter, form.role, person, resume, workspace])

  const applyMatch = (job) => {
    setForm((current) => ({
      ...current,
      role: job.title || current.role,
      company: job.company || current.company,
      jobDescription: job.description || job.summary || current.jobDescription,
    }))
  }

  const copySection = async (key, value) => {
    await copyText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1600)
  }

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground">
        <div className="mx-auto max-w-7xl space-y-8">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Send size={16} /> Auto Apply Kit
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Generate a full application packet in one click.</h1>
              <p className="mt-4 max-w-3xl text-secondary">Create a tailored resume summary, cover letter, recruiter message, screening answers, and follow-up from your resume and target job.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/career-studio')}>Open Career Studio <ArrowRight size={16} className="ml-2" /></Button>
          </header>

          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="rounded-[1.5rem]">
              <CardTitle className="mb-2">Target job</CardTitle>
              <CardContent className="mb-6">Paste a job description or pick one of your best matches.</CardContent>
              <div className="space-y-4">
                <Input name="role" value={form.role} onChange={updateForm} placeholder="Target role" />
                <Input name="company" value={form.company} onChange={updateForm} placeholder="Company" />
                <Input name="recruiter" value={form.recruiter} onChange={updateForm} placeholder="Recruiter name optional" />
                <textarea
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={updateForm}
                  rows={8}
                  placeholder="Paste job description..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1221] p-4 text-sm text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1116] p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-white"><Sparkles size={17} className="text-primary" /> Keyword match</div>
                <div className="flex flex-wrap gap-2">
                  {matchedKeywords.map((keyword) => <span key={keyword} className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">{keyword}</span>)}
                  {!matchedKeywords.length && <span className="text-sm text-secondary">Paste a job description to compare keywords.</span>}
                </div>
                {!!missingKeywords.length && <div className="mt-4 text-xs uppercase tracking-[0.2em] text-secondary">Missing keywords</div>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {missingKeywords.map((keyword) => <span key={keyword} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{keyword}</span>)}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              {!resume && !isLoading && (
                <Card className="rounded-[1.5rem]">
                  <CardTitle>No resume found</CardTitle>
                  <CardContent className="mt-2">Build or upload a resume first so the kit can personalize every section.</CardContent>
                  <Button className="mt-5" onClick={() => navigate('/resume-builder')}>Build resume</Button>
                </Card>
              )}

              {isLoading && (
                <Card className="rounded-[1.5rem]">
                  <div className="flex items-center text-secondary"><Loader2 size={18} className="mr-2 animate-spin" /> Loading your application workspace...</div>
                </Card>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <KitCard icon={FileText} title="Tailored resume summary" value={kit.resumeSummary} copied={copied === 'summary'} onCopy={() => copySection('summary', kit.resumeSummary)} />
                <KitCard icon={Mail} title="Cover letter" value={kit.coverLetter} copied={copied === 'cover'} onCopy={() => copySection('cover', kit.coverLetter)} />
                <KitCard icon={MessageSquareText} title="Recruiter message" value={kit.recruiterMessage} copied={copied === 'message'} onCopy={() => copySection('message', kit.recruiterMessage)} />
                <KitCard icon={BriefcaseBusiness} title="Screening answers" value={kit.screeningAnswers} copied={copied === 'answers'} onCopy={() => copySection('answers', kit.screeningAnswers)} />
              </div>
              <KitCard icon={CheckCircle2} title="Follow-up message" value={kit.followUp} copied={copied === 'follow'} onCopy={() => copySection('follow', kit.followUp)} />
            </div>
          </section>

          {!!matches.length && (
            <Card className="rounded-[1.5rem]">
              <CardTitle className="mb-2">Use a top job match</CardTitle>
              <CardContent className="mb-5">Click a match to fill the kit inputs.</CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {matches.map((job) => (
                  <button key={job._id || job.id} onClick={() => applyMatch(job)} className="rounded-2xl border border-white/10 bg-[#0d1116] p-4 text-left transition hover:border-primary/35 hover:bg-white/[0.04]">
                    <div className="text-xs uppercase tracking-[0.2em] text-accent">{job.matchScore?.matchPercentage || 0}% match</div>
                    <div className="mt-2 font-semibold text-white">{job.title}</div>
                    <div className="mt-1 text-sm text-secondary">{job.company}</div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

function KitCard({ icon: Icon, title, value, copied, onCopy }) {
  return (
    <Card className="rounded-[1.5rem]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon size={18} /></span>
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <button onClick={onCopy} className="rounded-xl border border-white/10 p-2 text-secondary transition hover:text-white" aria-label={`Copy ${title}`}>
          <ClipboardCopy size={17} />
        </button>
      </div>
      <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#0d1116] p-4 text-sm leading-7 text-secondary">{value}</div>
      {copied && <div className="mt-3 text-sm font-semibold text-accent">Copied</div>}
    </Card>
  )
}
