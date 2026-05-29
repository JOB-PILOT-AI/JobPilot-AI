import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CheckCircle, AlertCircle, Building, MapPin, DollarSign, RefreshCcw, ArrowLeft } from 'lucide-react'
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

  useEffect(() => {
    loadJobMatch()
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
    } else {
      console.log('Applying for job:', jobId)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/jobs')}>
          <ArrowLeft size={16} className="mr-2" />
          Back to jobs
        </Button>

        <Button variant="primary" onClick={handleApply}>
          Apply Now
        </Button>
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] items-start">
          <div className="space-y-8">
            <Card>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="primary">{jobRecord.category}</Pill>
                    <Pill>{jobRecord.remoteType}</Pill>
                    <Pill>{jobRecord.employmentType}</Pill>
                    <Pill>{jobRecord.experienceLevel?.min || jobRecord.experience?.min || 0}+ years</Pill>
                  </div>

                  <div>
                    <h1 className="text-4xl font-bold text-foreground mb-3">{jobRecord.title}</h1>
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

                <div className="min-w-44 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-center">
                  <div className="text-4xl font-bold text-primary">{matchData?.matchPercentage ?? 0}%</div>
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
              <Card>
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

              <Card>
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

            <Card>
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
    </div>
  )
}