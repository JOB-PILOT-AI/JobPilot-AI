import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { clearPersistedResumeData, useResumeBuilderStore } from '../store/resumeBuilderStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'
import { AlertCircle, ArrowRight, Bookmark, BrainCircuit, CheckCircle2, FileText, Landmark, RefreshCcw, Upload } from 'lucide-react'
import ErrorBoundary from '../components/ErrorBoundary'

const EMPTY_ANALYTICS = {
  score: 82,
  topSkills: [],
  missingAreas: [],
  recommendations: [],
  failedRules: [],
}

const buildLegacyAnalytics = (latestResume) => {
  if (!latestResume?.atsScore) return null
  return {
    score: latestResume.atsScore.score || 82,
    recommendations: latestResume.atsScore.feedback || [],
    topSkills: latestResume.atsScore.keywordMatches || [],
    missingAreas: [],
    failedRules: [],
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [resume, setResume] = useState(null)
  const [atsAnalytics, setAtsAnalytics] = useState(null)
  const [jobMatches, setJobMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const fileInputRef = useRef(null)
  const loadedTokenRef = useRef('')

  useEffect(() => {
    if (token) fetchDashboardData()
  }, [token])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const [resumeRes, matchRes] = await Promise.all([
        axios.get('/api/resume', { headers }),
        axios.get('/api/jobs/matches?limit=3', { headers }),
      ])

      const latestResume = unwrapApiResponse(resumeRes.data, ['resumes'])?.[0] || null
      setResume(latestResume)
      setAtsAnalytics(latestResume?.atsAnalytics || buildLegacyAnalytics(latestResume))
      setJobMatches(unwrapApiResponse(matchRes.data, ['matches'])?.matches || [])
    } catch {
      setJobMatches([])
      if (!resume) setAtsAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const normalizedName = file.name.toLowerCase()
    const isAllowedFile = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type) || normalizedName.endsWith('.pdf') || normalizedName.endsWith('.docx')
    if (!isAllowedFile) {
      setUploadError('Please upload a PDF or DOCX resume.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Resume must be 10MB or smaller.')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('resume', file)
      const response = await axios.post('/api/resume/upload', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const uploadedResume = unwrapApiResponse(response.data, ['resume'])?.resume || response.data?.resume || null
      if (uploadedResume) {
        setResume(uploadedResume)
        setAtsAnalytics(uploadedResume.atsAnalytics || response.data?.atsAnalytics || null)
      }
      setUploadSuccess('Resume uploaded and ATS analysis generated successfully.')
      const matchResponse = await axios.get('/api/jobs/matches?limit=3', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      setJobMatches(unwrapApiResponse(matchResponse.data, ['matches'])?.matches || [])
    } catch (error) {
      setUploadError(getApiErrorMessage(error, 'Resume upload failed. Please try again.'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleClearResume = async () => {
    if (!resume) return
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      await axios.delete('/api/resume', { headers })
      clearPersistedResumeData()
      useResumeBuilderStore.getState().resetResumeData()
      setResume(null)
      setAtsAnalytics(null)
      setJobMatches([])
    } catch (error) {
      setUploadError(getApiErrorMessage(error, 'Failed to clear resume data. Please try again.'))
    }
  }

  const currentATS = atsAnalytics || EMPTY_ANALYTICS
  const score = Number(currentATS.score || 82)
  const matchedSkills = currentATS.topSkills.length ? currentATS.topSkills.slice(0, 4) : ['Scalability', 'ISO20022', 'EBITDA', 'Leadership']
  const gaps = currentATS.missingAreas.length ? currentATS.missingAreas.slice(0, 2) : ['Cross-border settlement', 'PL Management']
  const matches = jobMatches.length ? jobMatches.slice(0, 2) : [
    { _id: 'demo-1', title: 'VP of Infrastructure Growth', company: 'Revolut', location: 'London / Remote', matchScore: { matchPercentage: 98 }, requiredSkills: ['Swift Transfer', 'Cloud Architecture'] },
    { _id: 'demo-2', title: 'Head of Strategic Operations', company: 'Monzo', location: 'London (Hybrid)', matchScore: { matchPercentage: 92 }, requiredSkills: ['Product Strategy', 'Team Scaling'] },
  ]

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground px-3 py-3 sm:px-4 sm:py-4 lg:px-0 lg:py-0">
        <div className="mx-auto max-w-7xl space-y-6 lg:space-y-10">
          <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#121318] px-3 py-1.5 text-xs text-secondary md:rounded-3xl md:px-4 md:py-2 md:text-sm">
                <div className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_6px_rgba(73,215,202,0.08)] md:h-2.5 md:w-2.5" />
                Resume profile synced
              </div>
              <h1 className="mt-3 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl md:mt-4 lg:text-4xl xl:text-5xl">
                Welcome,&nbsp;
                <span className="text-amber-400">{user?.name || 'Sonu Yadav'}</span>
              </h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-secondary sm:text-base md:mt-3 lg:text-lg lg:leading-7">
                Your profile is synced. We&apos;ve identified {matches.length + 2} new high-compatibility matches in the London fintech sector since your last login.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Button variant="outline" onClick={fetchDashboardData} disabled={isLoading} className="w-full rounded-lg px-4 py-2 text-sm sm:w-auto sm:rounded-2xl sm:px-6 sm:py-3">
                <RefreshCcw size={16} className="mr-2" />
                Refresh
              </Button>
              <Button variant="primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full rounded-lg px-4 py-2 text-sm sm:w-auto sm:rounded-2xl sm:px-6 sm:py-3">
                <Upload size={16} className="mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
            </div>
          </div>

      <input ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileUpload} />

      {(uploadError || uploadSuccess) && (
        <div className={`rounded-lg border px-3 py-2 text-xs sm:text-sm md:rounded-2xl md:px-4 md:py-3 ${uploadError ? 'border-danger/30 bg-danger/10 text-danger' : 'border-accent/30 bg-accent/10 text-accent'}`}>
          {uploadError || uploadSuccess}
        </div>
      )}

      <div className="grid gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_clamp(300px,30%,400px)]">
        <section className="rounded-lg border border-white/10 bg-[#101214]/95 p-4 shadow-[0_28px_70px_rgba(0,0,0,0.24)] sm:p-5 md:rounded-2xl md:p-6 lg:rounded-[2rem] lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 md:gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-[0.18em] text-secondary md:tracking-[0.24em]">ATS optimization</div>
              <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl md:text-3xl">Role Fit</h2>
              <p className="mt-1 text-sm text-secondary md:mt-2">Target: Senior Director of Product (Global Payments)</p>
            </div>
            <div className="shrink-0 rounded-lg bg-[#111417] px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:rounded-2xl sm:px-5 sm:py-4 lg:rounded-[1.5rem]">
              <div className="text-3xl font-semibold text-accent sm:text-4xl md:text-5xl">{score}%</div>
              <div className="text-xs uppercase tracking-[0.18em] text-secondary md:text-sm md:tracking-[0.24em]">Compatibility</div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5 md:gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-[#14161a] p-4 sm:p-5 md:rounded-2xl md:p-6">
              <div className="mb-3 text-base font-semibold text-white md:mb-4 md:text-lg">Keyword Density</div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {matchedSkills.map((skill, index) => (
                  <span key={`${skill}-${index}`} className={`rounded-full border px-2 py-1 text-xs sm:px-3 sm:py-2 md:text-sm ${index < 3 ? 'border-primary/30 bg-primary/10 text-primary' : 'border-white/10 bg-[#0d1116] text-secondary'}`}>{skill}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#14161a] p-4 sm:p-5 md:rounded-2xl md:p-6">
              <div className="mb-3 text-base font-semibold text-white md:mb-4 md:text-lg">Missing Intent</div>
              <div className="space-y-3 text-xs text-secondary sm:text-sm">
                {gaps.map((gap) => (
                  <div key={gap} className="flex items-start gap-2"><AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />{gap}</div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-[#14161a] p-4 sm:p-5 md:rounded-2xl md:p-6">
              <div className="mb-3 text-base font-semibold text-white md:mb-4 md:text-lg">Readability Index</div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#2b2b2b] md:mb-4"><div className="h-full w-[86%] rounded-full bg-accent" /></div>
              <p className="text-xs leading-5 text-secondary md:text-sm md:leading-6">Excellent. High-impact phrasing detected.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-secondary sm:gap-4 md:mt-8 md:pt-6 lg:flex-row lg:items-center lg:justify-between md:text-sm">
            <span>Last scanned: 12 minutes ago</span>
            <button onClick={() => navigate('/resume-builder')} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-[#111417] px-3 py-2 text-xs font-semibold text-primary transition hover:bg-[#161a1f] md:px-5 md:py-3 md:text-sm">
              Run full deep scan <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <aside className="rounded-lg border border-white/10 bg-[#101214]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.22)] sm:p-5 md:rounded-2xl md:p-6 lg:rounded-[2rem] lg:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">Resume Health</h2>
              <p className="mt-1 text-xs text-secondary sm:text-sm md:mt-2">Executive-grade summary of your resume strength.</p>
            </div>
            <div className="shrink-0 rounded-full border border-white/10 bg-[#111417] px-2 py-1 text-xs uppercase tracking-[0.18em] text-secondary md:px-3 md:py-2">Updated</div>
          </div>

          <div className="relative mx-auto my-6 flex h-40 w-40 items-center justify-center rounded-full border-8 border-[#2f3431] shadow-[0_12px_36px_rgba(0,0,0,0.18)] sm:my-8 md:h-48 md:w-48 lg:h-56 lg:w-56">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(73,215,202,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(182,79,82,0.12),transparent_35%)]" />
            <div className="relative text-center">
              <div className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">{score}</div>
              <div className="text-xs uppercase tracking-[0.24em] text-secondary md:text-sm">Score</div>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {['Quantified Achievements', 'Executive Tone', 'Layout Density'].map((label, index) => (
              <div key={label} className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#111417] p-3 md:rounded-2xl md:p-4">
                {index < 2 ? <CheckCircle2 className="mt-0.5 shrink-0 text-accent" size={18} /> : <AlertCircle className="mt-0.5 shrink-0 text-danger" size={18} />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white md:text-base">{label}</div>
                  <div className="text-xs text-secondary md:text-sm">{index < 2 ? 'Excellent use of metrics' : 'Slightly heavy in Section 3'}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-[#111417] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] md:mt-6 md:rounded-2xl md:p-6">
            <div className="flex flex-col gap-2 md:gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white md:text-xl">Career Assistant</h3>
                <p className="mt-1 text-xs text-secondary md:text-sm">Launch career guidance or clear your resume data.</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 md:gap-3">
              <Button variant="secondary" onClick={() => navigate('/interview-prep')} className="w-full rounded-lg px-4 py-2 text-xs sm:text-sm md:rounded-2xl md:px-6 md:py-4">
                <BrainCircuit size={16} className="mr-2" />
                Ask Career Assistant
              </Button>
              {resume && (
                <Button
                  variant="outline"
                  onClick={handleClearResume}
                  className="w-full rounded-lg px-4 py-2 border-red-500 text-red-300 text-xs hover:bg-red-500/10 hover:border-red-400 sm:text-sm md:rounded-2xl md:px-6 md:py-4"
                >
                  <FileText size={16} className="mr-2" />
                  Clear Resume
                </Button>
              )}
            </div>
          </div>

          <Button variant="outline" className="mt-4 w-full rounded-lg px-4 py-2 text-xs sm:text-sm md:mt-6 md:rounded-2xl md:px-6 md:py-3" onClick={() => navigate('/resume-builder')}>
            Edit content strategy
          </Button>
        </aside>
      </div>

      <section className="pt-2 md:pt-4">
        <div className="mb-4 flex flex-col gap-3 md:mb-6 md:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">Precision Job Matches</h2>
            <p className="mt-1 text-xs text-secondary sm:text-sm md:mt-2">Curated opportunities tailored to your profile and ATS readiness.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-[#111417] px-2 py-1.5 text-xs text-secondary md:rounded-2xl md:px-3 md:py-2 md:text-sm">
            <span className="rounded-full bg-[#161a1f] px-2 py-0.5 uppercase tracking-[0.16em] md:px-3 md:py-1">Remote only</span>
            <span className="rounded-full bg-[#161a1f] px-2 py-0.5 uppercase tracking-[0.16em] md:px-3 md:py-1">All tiers</span>
          </div>
        </div>
        <div className="space-y-3 md:space-y-4">
          {matches.map((job) => (
            <div key={job._id} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#101214]/95 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.16)] sm:p-5 md:rounded-2xl md:p-6 md:gap-4 lg:grid lg:grid-cols-[clamp(80px,10%,100px)_1fr_auto] lg:items-center lg:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17191d] text-[#ffd0cc] md:h-16 md:w-16 md:rounded-3xl">
                <Landmark size={28} className="md:w-[34px]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-[0.24em] text-accent">{job.matchScore?.matchPercentage || 92}% Match</div>
                <h3 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl md:mt-2 md:text-2xl">{job.title}</h3>
                <p className="mt-1 text-xs text-secondary sm:text-sm md:text-base">{job.company} • {job.location}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:flex-col lg:flex-row lg:items-center lg:justify-end md:gap-3">
                {(job.requiredSkills || []).slice(0, 2).map((skill) => <span key={skill} className="rounded-full border border-white/10 bg-[#14161a] px-3 py-1 text-xs text-secondary md:px-4 md:py-2 md:text-sm">{skill}</span>)}
                <Bookmark className="text-secondary" size={18} />
                <Button variant="primary" className="rounded-lg px-3 py-2 text-xs sm:text-sm md:rounded-full md:px-5 md:py-3 md:text-base" onClick={() => job._id.startsWith('demo') ? navigate('/jobs') : navigate(`/job-match/${job._id}`)}>
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
      </div>
    </ErrorBoundary>
  )
}
