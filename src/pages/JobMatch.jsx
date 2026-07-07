import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle, AlertCircle, Building, MapPin, DollarSign, RefreshCcw, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'
import ErrorBoundary from '../components/ErrorBoundary'

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
  const [isApplying, setIsApplying] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    loadJobMatch()
  }, [jobId, token])

  useEffect(() => {
    if (!token) return
    axios.get('/api/jobs/saved/list')
      .then((response) => setIsSaved((response.data?.saved || []).includes(jobId)))
      .catch(() => setIsSaved(false))
  }, [jobId, token])

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
    if (!user) {
      navigate('/login', { state: { from: `/job-match/${jobId}` } })
      return
    }

    ;(async () => {
      setIsApplying(true)
      setApplyMessage('')
      try {
        // Get the user's latest resume
        const resumeRes = await axios.get('/api/resume')
        const resumes = unwrapApiResponse(resumeRes.data, ['resumes']) || []
        const latest = resumes[0]
        if (!latest || !latest._id) {
          setApplyMessage('Please upload a resume before applying.')
          setIsApplying(false)
          return
        }

        const response = await axios.post(`/api/jobs/${jobId}/apply`, { resumeId: latest._id })
        if (response.data?.alreadyApplied) {
          setApplyMessage('You already applied to this job. Check it in Applications.')
        } else {
          setApplyMessage(response.data?.message || 'Application submitted successfully.')
        }
      } catch (err) {
        setApplyMessage(getApiErrorMessage(err, 'Failed to apply for job.'))
      } finally {
        setIsApplying(false)
      }
    })()
  }

  const toggleSaved = async () => {
    try {
      if (isSaved) {
        await axios.delete(`/api/jobs/${jobId}/save`)
      } else {
        await axios.post(`/api/jobs/${jobId}/save`, { matchScore: matchData?.matchPercentage || null })
      }
      setIsSaved((current) => !current)
    } catch (requestError) {
      setApplyMessage(getApiErrorMessage(requestError, 'Could not update saved jobs.'))
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => navigate('/jobs')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to jobs
          </Button>

          <div>
            {applyMessage && (
              <div className={`mb-2 rounded-md px-4 py-2 text-sm ${applyMessage.includes('failed') || applyMessage.includes('Please') ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                {applyMessage}
              </div>
            )}
            <Button variant="primary" onClick={handleApply} disabled={isApplying}>
              {isApplying ? 'Applying...' : 'Apply Now'}
            </Button>
          </div>
        </div>

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
        <div className="space-y-10">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div className="space-y-7">
              <div className="flex flex-wrap gap-3">
                <Pill tone="primary">{jobRecord.category}</Pill>
                <Pill>{jobRecord.remoteType}</Pill>
              </div>

              <div>
                <h1 className="max-w-4xl text-6xl font-bold leading-[1.03]">{jobRecord.title}</h1>
                <div className="mt-6 flex flex-wrap gap-6 text-xl text-[#dac9c5]">
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
              <div className="flex justify-start gap-4 lg:justify-end">
              <Button variant="outline" onClick={toggleSaved}>{isSaved ? 'Saved' : 'Save'}</Button>
              <Button variant="primary" onClick={handleApply} disabled={isApplying}>{isApplying ? 'Applying...' : 'Apply Now'}</Button>
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
            <div className="space-y-8">
              <Card className="bg-[#1e1e1e] p-10">
                <div className="mb-10 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="text-[#ffb5b1]" />
                    <CardTitle>Match Intelligence</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-[#ffb5b1]">{matchData?.matchPercentage ?? 94}%</div>
                    <div className="font-semibold uppercase tracking-wide text-[#dac9c5]">Match Strength</div>
                  </div>
                </div>

                <div className="mb-10">
                  <div className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-[#dac9c5]">Critical Skill Overlap</div>
                  <div className="flex flex-wrap gap-4">
                    {(matchData?.matchedSkills || jobRecord.requiredSkills || []).slice(0, 5).map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-md border border-accent/35 bg-accent/10 px-5 py-3 text-lg text-[#d8fffb]">
                        <CheckCircle size={16} className="text-accent" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-8">
                  <div className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-[#dac9c5]">Identified Gaps</div>
                  <div className="flex flex-wrap gap-4">
                    {(matchData?.missingSkills || []).length > 0 ? matchData.missingSkills.slice(0, 3).map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-5 py-3 text-lg text-[#ffd0cc]">
                        <AlertCircle size={16} />
                        {skill}
                      </span>
                    )) : (
                      <span className="inline-flex items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-5 py-3 text-lg text-[#ffd0cc]">
                        <AlertCircle size={16} />
                        No material gaps found
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="bg-[#2a2a2a] p-10">
                <div className="mb-8 flex items-start justify-between">
                  <CardTitle className="text-[#ffb5b1]">Intelligence Engine Reasoning</CardTitle>
                  <Sparkles className="text-white/10" size={52} />
                </div>
                <div className="space-y-4 text-xl leading-9 text-[#dac9c5]">
                  {(matchData?.explanation || []).length > 0 ? (
                    matchData.explanation.slice(0, 2).map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>
                      Your profile indicates high-confidence alignment for this role due to your technical overlap, seniority signal, and resume health.
                    </p>
                  )}
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  <div className="rounded-md bg-[#1c1c1c] p-6">
                    <div className="mb-3 text-xl font-bold text-[#ffb5b1]">Career Trajectory</div>
                    <p className="text-[#dac9c5]">Your move matches the growth expectations for this position.</p>
                  </div>
                  <div className="rounded-md bg-[#1c1c1c] p-6">
                    <div className="mb-3 text-xl font-bold text-[#ffb5b1]">Impact Potential</div>
                    <p className="text-[#dac9c5]">Experience scaling complex systems is a critical requirement you meet.</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#171111]">
                <CardTitle className="mb-4">Role overview</CardTitle>
                <CardContent className="space-y-4">
                  <p className="text-base leading-7 text-[#dac9c5]">{jobRecord.description}</p>
                  {(jobRecord.responsibilities || []).length > 0 && (
                    <div className="space-y-3">
                      {jobRecord.responsibilities.map((item) => (
                        <div key={item} className="rounded-md border border-border bg-tertiary/50 px-4 py-3 text-sm text-muted">
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-8">
              <Card className="bg-[#1e1e1e]">
                <div className="mb-8 h-52 rounded-md bg-[linear-gradient(rgba(0,0,0,0.1),rgba(0,0,0,0.35)),radial-gradient(circle_at_70%_30%,rgba(73,215,202,0.16),transparent_18rem),linear-gradient(135deg,#22313a,#101010)]" />
                <CardTitle className="mb-4">About {jobRecord.company}</CardTitle>
                <CardContent className="text-base">
                  {jobRecord.companyDescription || 'A high-growth technology company focused on building resilient products for the next generation of intelligent applications.'}
                </CardContent>
                <button className="mt-8 inline-flex items-center gap-2 font-semibold text-[#ffb5b1]">
                  View Company Profile <ExternalLink size={16} />
                </button>
              </Card>
              <Card className="bg-[#1e1e1e]">
                <div className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#dac9c5]">Estimated Salary</div>
                <div className="mb-8 text-3xl font-bold">
                  ${Number(jobRecord.salaryRange?.min || jobRecord.salary?.min || 220000).toLocaleString()} - ${Number(jobRecord.salaryRange?.max || jobRecord.salary?.max || 310000).toLocaleString()}
                </div>
                <div className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-[#dac9c5]">Interview Difficulty</div>
                <div className="mb-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((item) => <div key={item} className={`h-3 flex-1 rounded-full ${item < 5 ? 'bg-[#ffaaa7]' : 'bg-[#604544]'}`} />)}
                </div>
                <div className="text-center text-sm text-[#dac9c5]">High (Based on AI analysis)</div>
              </Card>
              <Card className="border-primary/40 bg-[#321c1b]">
                <CardTitle className="mb-5 text-[#ffb5b1]">Ready to Apply?</CardTitle>
                <CardContent>Your CV has been pre-tailored by our Intelligence Engine to highlight matching skills.</CardContent>
                <Button variant="primary" className="mt-7 w-full" onClick={handleApply}>Send Tailored Application</Button>
              </Card>
            </aside>
          </div>
        </div>
      ) : null}
      </div>
    </div>
    </ErrorBoundary>
  )
}
