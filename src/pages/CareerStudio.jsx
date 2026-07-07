import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  BellRing, BriefcaseBusiness, ClipboardCopy, FilePenLine, Mail,
  MessageSquareText, Mic2, Sparkles, Trash2,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import ErrorBoundary from '../components/ErrorBoundary'

const tools = [
  { id: 'tailored-resume', label: 'Resume Tailor', icon: FilePenLine },
  { id: 'cover-letter', label: 'Cover Letter', icon: Mail },
  { id: 'screening-answers', label: 'Autofill', icon: ClipboardCopy },
  { id: 'interview-feedback', label: 'Interview Coach', icon: Mic2 },
  { id: 'job-alerts', label: 'Job Alerts', icon: BellRing },
  { id: 'networking-message', label: 'Networking', icon: MessageSquareText },
]

const descriptions = {
  'tailored-resume': 'Tailor wording and keyword priority while preserving every fact in your resume.',
  'cover-letter': 'Create a specific cover letter from your resume and the target role.',
  'screening-answers': 'Prepare reusable profile data and truthful answers to screening questions.',
  'interview-feedback': 'Score an interview answer and turn it into a tighter, evidence-led response.',
  'job-alerts': 'Review your strongest live matches with transparent fit and gap explanations.',
  'networking-message': 'Create connection notes, recruiter outreach, and polite follow-ups.',
}

const copyText = async (value) => {
  await navigator.clipboard.writeText(value)
}

export default function CareerStudio() {
  const [activeTool, setActiveTool] = useState('tailored-resume')
  const [workspace, setWorkspace] = useState(null)
  const [matches, setMatches] = useState([])
  const [form, setForm] = useState({
    role: '', company: '', jobDescription: '', tone: 'professional',
    questions: '', answer: '',
  })
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadWorkspace = async () => {
    setIsLoading(true)
    try {
      const [workspaceResponse, matchResponse] = await Promise.all([
        axios.get('/api/career/workspace'),
        axios.get('/api/jobs/matches?limit=8'),
      ])
      setWorkspace(workspaceResponse.data)
      setMatches(matchResponse.data?.matches || matchResponse.data?.data?.matches || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load Career Studio.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkspace()
  }, [])

  useEffect(() => {
    setResult('')
    setError('')
  }, [activeTool])

  const autofillProfile = useMemo(() => {
    const resume = workspace?.resume
    const person = resume?.personalInfo || {}
    return {
      fullName: person.fullName || workspace?.user?.name || '',
      email: person.email || workspace?.user?.email || '',
      phone: person.phone || '',
      location: person.location || workspace?.user?.location || '',
      currentTitle: person.title || workspace?.user?.currentRole || '',
      linkedin: person.linkedin || '',
      github: person.github || '',
      skills: (resume?.skills || []).join(', '),
    }
  }, [workspace])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const generate = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await axios.post('/api/career/generate', { type: activeTool, ...form })
      setResult(response.data.asset.content)
      await loadWorkspace()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Generation failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const removeAsset = async (id) => {
    await axios.delete(`/api/career/assets/${id}`)
    setWorkspace((current) => ({
      ...current,
      assets: current.assets.filter((asset) => asset._id !== id),
    }))
  }

  const currentAssets = (workspace?.assets || []).filter((asset) => asset.type === activeTool)

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell px-6 py-10 text-foreground lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles size={16} /> Application intelligence
            </div>
            <h1 className="text-4xl font-bold text-white">Career Studio</h1>
            <p className="mt-3 max-w-3xl text-secondary">One workspace for every document, answer, alert, and conversation around your job search.</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {tools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTool(id)}
                className={`rounded-2xl border p-4 text-left transition ${activeTool === id ? 'border-primary bg-primary/15 text-white' : 'border-white/10 bg-[#111418] text-secondary hover:text-white'}`}
              >
                <Icon size={20} className="mb-3" />
                <span className="text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>

          {error && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-danger">{error}</div>}

          {activeTool === 'job-alerts' ? (
            <div className="grid gap-5 md:grid-cols-2">
              {matches.map((job) => {
                const match = job.matchScore || {}
                return (
                  <Card key={job._id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardContent>{job.company} · {job.location}</CardContent>
                      </div>
                      <div className="rounded-full bg-accent/15 px-3 py-2 text-sm font-bold text-accent">{match.matchPercentage || 0}%</div>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(match.matchedSkills || []).slice(0, 4).map((skill) => <span key={skill} className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">✓ {skill}</span>)}
                      {(match.missingSkills || []).slice(0, 3).map((skill) => <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Gap: {skill}</span>)}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-secondary">{(match.explanation || []).join(' ') || 'Match explanation will appear after resume analysis.'}</p>
                    <Button className="mt-5" variant="outline" onClick={() => window.location.assign(`/job-match/${job._id}`)}>Review match</Button>
                  </Card>
                )
              })}
              {!matches.length && !isLoading && <Card><CardTitle>No alerts yet</CardTitle><CardContent>Upload a resume to receive explained job matches.</CardContent></Card>}
            </div>
          ) : activeTool === 'screening-answers' ? (
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardTitle className="mb-2">Reusable application profile</CardTitle>
                <CardContent className="mb-5">Copy verified fields directly from your latest resume.</CardContent>
                <div className="space-y-3">
                  {Object.entries(autofillProfile).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-white/10 bg-[#0d1116] p-4">
                      <div className="mb-1 text-xs uppercase tracking-wide text-secondary">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-sm text-white">{value || 'Not provided'}</span>
                        {value && <button onClick={() => copyText(value)} className="text-primary"><ClipboardCopy size={16} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <GeneratorPanel activeTool={activeTool} form={form} updateForm={updateForm} generate={generate} result={result} isLoading={isLoading} />
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <GeneratorPanel activeTool={activeTool} form={form} updateForm={updateForm} generate={generate} result={result} isLoading={isLoading} />
              <Card>
                <CardTitle className="mb-2">Saved outputs</CardTitle>
                <CardContent className="mb-5">Your latest generated assets stay available here.</CardContent>
                <div className="space-y-3">
                  {currentAssets.map((asset) => (
                    <div key={asset._id} className="rounded-xl border border-white/10 bg-[#0d1116] p-4">
                      <div className="text-sm font-semibold capitalize text-white">{asset.title}</div>
                      <div className="mt-1 text-xs text-secondary">{new Date(asset.createdAt).toLocaleString()}</div>
                      <div className="mt-3 flex gap-3">
                        <button onClick={() => { setResult(asset.content); copyText(asset.content) }} className="text-xs text-primary">Copy</button>
                        <button onClick={() => removeAsset(asset._id)} className="text-danger"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                  {!currentAssets.length && <div className="text-sm text-secondary">No saved output for this tool yet.</div>}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

function GeneratorPanel({ activeTool, form, updateForm, generate, result, isLoading }) {
  const isInterview = activeTool === 'interview-feedback'
  const needsJob = !['interview-feedback'].includes(activeTool)
  return (
    <Card>
      <CardTitle className="mb-2">{tools.find((tool) => tool.id === activeTool)?.label}</CardTitle>
      <CardContent className="mb-6">{descriptions[activeTool]}</CardContent>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="role" value={form.role} onChange={updateForm} placeholder="Target role" />
          <Input name="company" value={form.company} onChange={updateForm} placeholder="Company" />
        </div>
        {needsJob && <textarea name="jobDescription" value={form.jobDescription} onChange={updateForm} rows={7} placeholder="Paste the job description..." className="w-full rounded-xl border border-white/10 bg-[#0d1116] p-4 text-sm text-white outline-none focus:border-primary/50" />}
        {(activeTool === 'screening-answers' || isInterview) && <textarea name="questions" value={form.questions} onChange={updateForm} rows={3} placeholder={isInterview ? 'Interview question' : 'Screening questions, one per line'} className="w-full rounded-xl border border-white/10 bg-[#0d1116] p-4 text-sm text-white outline-none focus:border-primary/50" />}
        {isInterview && <textarea name="answer" value={form.answer} onChange={updateForm} rows={7} placeholder="Type your interview answer..." className="w-full rounded-xl border border-white/10 bg-[#0d1116] p-4 text-sm text-white outline-none focus:border-primary/50" />}
        <Button variant="primary" onClick={generate} disabled={isLoading || (isInterview && !form.answer.trim())}>
          <Sparkles size={16} className="mr-2" /> {isLoading ? 'Working...' : 'Generate'}
        </Button>
        {result && (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <div className="mb-3 flex justify-between"><span className="font-semibold text-accent">Generated output</span><button onClick={() => copyText(result)} className="text-secondary"><ClipboardCopy size={17} /></button></div>
            <div className="whitespace-pre-wrap text-sm leading-7 text-white">{result}</div>
          </div>
        )}
      </div>
    </Card>
  )
}
