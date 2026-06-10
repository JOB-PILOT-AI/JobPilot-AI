import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle, AlertCircle, Building, MapPin, DollarSign, RefreshCcw, ArrowLeft, X, Bookmark } from 'lucide-react'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'

const Pill = ({ children, tone = 'neutral' }) => {
  const styles = {
    neutral: 'border-border bg-tertiary text-muted',
    primary: 'border-primary/30 bg-primary/10 text-primary',
    accent: 'border-accent/30 bg-accent/10 text-accent',
  }

  return <span className={`rounded-full border px-3 py-1 text-xs ${styles[tone]}`}>{children}</span>
}

export default function JobMatch() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [applyStatus, setApplyStatus] = useState('idle') // 'idle', 'submitting', 'success', 'error'
  const [coverLetter, setCoverLetter] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [hasResume, setHasResume] = useState(null)
  const [userResumeId, setUserResumeId] = useState(null)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    loadJobMatch()
    if (token) {
      checkUserResume()
    }
  }, [jobId, token])

  const checkUserResume = async () => {
    try {
      const response = await axios.get('/api/resume', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const resumes = unwrapApiResponse(response.data, ['resumes']) || response.data
      if (resumes && resumes.length > 0) {
        setHasResume(true)
        setUserResumeId(resumes[0]._id || resumes[0].id)
      } else {
        setHasResume(false)
      }
    } catch {
      setHasResume(false)
    }
  }

  const loadJobMatch = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.get(`/api/jobs/${jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      setJob(unwrapApiResponse(response.data, ['job', 'matchData']))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load job match details.'))
      setJob(null)
    } finally {
      setIsLoading(false)
    }
  }

  const jobRecord = job?.job || null
  const matchData = job?.matchData || null

  const handleApply = () => {
    setApplyError('')
    if (!user) {
      navigate('/login', { state: { from: `/job-match/${jobId}` } })
    } else if (hasResume === null) {
      setApplyError('Checking your profile status. Please click again in a moment.')
    } else if (hasResume === false) {
      setApplyError('You must have a resume to apply. Please create one in the Resume Builder.')
    } else if (jobRecord?.applyUrl) {
      // If the job has an external link (like a Google Form), open it directly
      window.open(jobRecord.applyUrl, '_blank')
    } else {
      // Otherwise, open our internal application form
      setIsApplyModalOpen(true)
    }
  }

  const submitApplication = async (e) => {
    e.preventDefault()
    setApplyStatus('submitting')
    setApplyError('')
    try {
      await axios.post(`/api/jobs/${jobId}/apply`, { coverLetter, resumeId: userResumeId }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      setApplyStatus('success')
    } catch (err) {
      setApplyStatus('error')
      setApplyError(err.response?.data?.message || 'Failed to submit application. Please try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to jobs
        </Button>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsSaved(!isSaved)}
            className={isSaved ? 'text-primary border-primary/50 bg-primary/5' : ''}
          >
            <Bookmark size={16} className={`mr-2 ${isSaved ? 'fill-primary text-primary' : ''}`} />
            {isSaved ? 'Saved' : 'Save Job'}
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply Now
          </Button>
        </div>
      </div>

      {applyError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-300">
          {applyError}{' '}
          <Link to="/resume-builder" className="font-semibold underline hover:text-red-200">
            Go to Resume Builder
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <div className="space-y-4">
            <div className="h-10 w-96 rounded bg-tertiary animate-pulse" />
            <div className="h-4 w-72 rounded bg-tertiary animate-pulse" />
            <div className="h-72 rounded-2xl border border-border bg-secondary animate-pulse" />
          </div>
          <div className="h-72 rounded-2xl border border-border bg-secondary animate-pulse" />
        </div>
      ) : error ? (
        <Card className="border border-red-500/20 bg-red-500/10">
          <CardTitle className="mb-2">Match details unavailable</CardTitle>
          <CardContent>{error}</CardContent>
          <Button variant="outline" className="mt-4" onClick={loadJobMatch}>
            <RefreshCcw size={16} className="mr-2" />
            Retry
          </Button>
        </Card>
      ) : jobRecord ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] items-start">
          <div className="space-y-8">
            <Card className="bg-transparent border-0 p-0 shadow-none">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="primary">{jobRecord.category}</Pill>
                    <Pill>{jobRecord.remoteType}</Pill>
                    <Pill>{jobRecord.employmentType}</Pill>
                    <Pill>{jobRecord.experienceLevel?.min || jobRecord.experience?.min || 0}+ years</Pill>
                  </div>

                  <div>
                    <h1 className="max-w-3xl text-6xl font-bold tracking-tight text-foreground mb-5">{jobRecord.title}</h1>
                    <div className="flex flex-wrap gap-6 text-muted">
                      <div className="flex items-center gap-2">
                        <Building size={18} />
                        {jobRecord.company}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={18} />
                        {jobRecord.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={18} />
                        ${Number(jobRecord.salaryRange?.min || jobRecord.salary?.min || 0).toLocaleString()} - ${Number(jobRecord.salaryRange?.max || jobRecord.salary?.max || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-w-44 rounded-lg border border-primary/30 bg-primary/10 p-5 text-center">
                  <div className="text-5xl font-bold text-primary-soft">{matchData?.matchPercentage ?? 0}%</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">Match</div>
                  <div className="mt-3 text-sm text-muted">Confidence {matchData?.confidence ?? 0}%</div>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Card className="text-center">
                <div className="text-3xl font-bold text-foreground">{matchData?.technicalAlignment ?? 0}%</div>
                <CardTitle className="mt-2 text-sm">Technical fit</CardTitle>
                <CardContent>Normalized skill alignment</CardContent>
              </Card>

              <Card className="text-center">
                <div className="text-3xl font-bold text-foreground">{matchData?.requiredSkillMatch ?? 0}%</div>
                <CardTitle className="mt-2 text-sm">Required skills</CardTitle>
                <CardContent>Core role requirements</CardContent>
              </Card>

              <Card className="text-center">
                <div className="text-3xl font-bold text-foreground">{matchData?.preferredSkillMatch ?? 0}%</div>
                <CardTitle className="mt-2 text-sm">Preferred skills</CardTitle>
                <CardContent>Secondary skill coverage</CardContent>
              </Card>

              <Card className="text-center">
                <div className="text-3xl font-bold text-foreground">{matchData?.resumeCompleteness ?? 0}%</div>
                <CardTitle className="mt-2 text-sm">Resume health</CardTitle>
                <CardContent>ATS profile contribution</CardContent>
              </Card>
            </div>

            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <CardTitle className="text-xl">Match explanation</CardTitle>
                  <CardContent>Structured and deterministic alignment summary</CardContent>
                </div>
              </div>

              <div className="space-y-3">
                {(matchData?.explanation || []).length > 0 ? (
                  matchData.explanation.map((line) => (
                    <div key={line} className="rounded-xl border border-border bg-tertiary/50 px-4 py-3 text-sm text-muted">
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-border bg-tertiary/50 px-4 py-3 text-sm text-muted">
                    Match analytics are ready.
                  </div>
                )}
              </div>
            </Card>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="bg-[#181818]">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={20} className="text-accent" />
                  <CardTitle className="text-lg">Matched skills</CardTitle>
                </div>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(matchData?.matchedSkills || []).length > 0 ? (
                      matchData.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No matched skills yet.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#181818]">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle size={20} className="text-yellow-400" />
                  <CardTitle className="text-lg">Missing skills</CardTitle>
                </div>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(matchData?.missingSkills || []).length > 0 ? (
                      matchData.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">No missing skills identified.</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card>
                <CardTitle className="mb-4">Strength areas</CardTitle>
                <CardContent>
                  <div className="space-y-2">
                    {(matchData?.strengths || []).length > 0 ? (
                      matchData.strengths.map((item) => <div key={item} className="text-sm text-muted">{item}</div>)
                    ) : (
                      <div className="text-sm text-muted">No strength areas identified.</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardTitle className="mb-4">Weakness areas</CardTitle>
                <CardContent>
                  <div className="space-y-2">
                    {(matchData?.weaknesses || []).length > 0 ? (
                      matchData.weaknesses.map((item) => <div key={item} className="text-sm text-muted">{item}</div>)
                    ) : (
                      <div className="text-sm text-muted">No weakness areas identified.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/25 bg-[#252020]">
              <CardTitle className="mb-4">Role overview</CardTitle>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted">{jobRecord.description}</p>
                {(jobRecord.responsibilities || []).length > 0 && (
                  <div>
                    <div className="mb-3 text-sm font-semibold text-foreground">Responsibilities</div>
                    <ul className="space-y-2 text-sm text-muted">
                      {jobRecord.responsibilities.map((item) => (
                        <li key={item} className="rounded-lg border border-border bg-tertiary/40 px-4 py-3">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardTitle className="mb-4">Match snapshot</CardTitle>
              <CardContent className="space-y-3 text-sm text-muted">
                <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                  <span>ATS score contribution</span>
                  <span className="text-foreground">{matchData?.atsContribution ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                  <span>Confidence</span>
                  <span className="text-foreground">{matchData?.confidence ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                  <span>Resume health</span>
                  <span className="text-foreground">{matchData?.resumeCompleteness ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                  <span>Technical fit</span>
                  <span className="text-foreground">{matchData?.technicalAlignment ?? 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardTitle className="mb-4">Company</CardTitle>
              <CardContent className="space-y-3 text-sm text-muted">
                <div className="text-foreground font-semibold">{jobRecord.company}</div>
                <p>{jobRecord.companyDescription || 'Company details are available with the live job record.'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {/* Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-[#181818]">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <CardTitle className="text-xl">Apply for {jobRecord?.title}</CardTitle>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-muted hover:text-foreground transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {applyStatus === 'success' ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Application Submitted!</h3>
                <p className="text-muted">Your profile and resume have been securely sent to {jobRecord?.company}.</p>
                <Button variant="outline" onClick={() => setIsApplyModalOpen(false)} className="mt-4">
                  Close Window
                </Button>
              </div>
            ) : (
              <form onSubmit={submitApplication} className="space-y-5">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Full Name</label>
                      <input type="text" value={user?.name || ''} disabled className="w-full rounded-lg border border-border bg-tertiary/50 px-3 py-2 text-sm text-muted opacity-70" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
                      <input type="email" value={user?.email || ''} disabled className="w-full rounded-lg border border-border bg-tertiary/50 px-3 py-2 text-sm text-muted opacity-70" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Resume</label>
                    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary-soft">
                      ✓ Your JobPilot profile and latest ATS resume will be automatically attached.
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">Cover Letter / Note (Optional)</label>
                    <textarea
                      rows={4}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Why are you a great fit for this role?"
                      className="w-full rounded-lg border border-border bg-tertiary px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {applyStatus === 'error' && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    {applyError}
                    {applyError.toLowerCase().includes('resume') && (
                      <div className="mt-2">
                        <Link to="/resume-builder" className="font-semibold underline hover:text-red-300">
                          Go to Resume Builder
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={applyStatus === 'submitting'}>
                    {applyStatus === 'submitting' ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
