import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { clearPersistedResumeData, useResumeBuilderStore } from '../store/resumeBuilderStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react'

const EMPTY_ANALYTICS = {
  score: 0,
  healthLabel: 'No analysis yet',
  topSkills: [],
  missingAreas: [],
  recommendations: [],
  strengths: [],
  weaknesses: [],
  passedRules: [],
  failedRules: [],
  categoryScores: {},
  analyzedAt: null,
}

const buildLegacyAnalytics = (latestResume) => {
  if (!latestResume?.atsScore) {
    return null
  }

  return {
    score: latestResume.atsScore.score || 0,
    recommendations: latestResume.atsScore.feedback || [],
    topSkills: latestResume.atsScore.keywordMatches || [],
    missingAreas: [],
    strengths: [],
    weaknesses: [],
    passedRules: [],
    failedRules: [],
    categoryScores: {},
    healthLabel: latestResume.atsScore.score >= 75 ? 'Strong' : 'Needs improvement',
    analyzedAt: latestResume.atsScore.lastCalculated || null,
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
    if (!token || loadedTokenRef.current === token) {
      return
    }

    loadedTokenRef.current = token
    fetchDashboardData()
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
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setJobMatches([])
      if (!resume) {
        setAtsAnalytics(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const normalizedName = file.name.toLowerCase()
    const isAllowedFile =
      allowedTypes.includes(file.type) || normalizedName.endsWith('.pdf') || normalizedName.endsWith('.docx')

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

  const currentATS = atsAnalytics || EMPTY_ANALYTICS
  const bestMatch = jobMatches[0] || null

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleClearResume = async () => {
    if (!resume) {
      return
    }

    setIsUploading(false)
    setUploadError('')
    setUploadSuccess('')

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      await axios.delete('/api/resume', { headers })
      clearPersistedResumeData()
      useResumeBuilderStore.getState().resetResumeData()
      setResume(null)
      setAtsAnalytics(null)
      setJobMatches([])

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setUploadError(getApiErrorMessage(error, 'Failed to clear resume data. Please try again.'))
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {user?.name}</h1>
          <p className="text-muted">Run ATS analysis, inspect resume health, and keep job matching synchronized.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDashboardData} disabled={isLoading}>
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate('/resume-builder')}>
            Open Resume Builder
          </Button>
        </div>
      </div>

      <Card className="border border-primary/30 bg-gradient-to-br from-secondary via-secondary to-tertiary/50">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <CardTitle className="text-2xl">Resume Analysis</CardTitle>
            <CardContent className="max-w-2xl">
              Upload a resume to generate ATS analysis, resume health, and job match preview.
            </CardContent>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="primary" onClick={openFilePicker} disabled={isUploading}>
              <Upload size={16} className="mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
            {resume && (
              <Button
                variant="outline"
                onClick={handleClearResume}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                Clear Resume
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/resume-builder')}>
              Edit Existing Resume
            </Button>
          </div>
        </div>

        {(uploadError || uploadSuccess) && (
          <div className="mt-6 space-y-3">
            {uploadError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {resume ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Target size={22} />
              </div>
              <div className="text-4xl font-bold text-foreground">{currentATS.score}</div>
              <CardTitle className="mt-2 text-base">ATS Score</CardTitle>
              <CardContent>Deterministic score derived from ATS rules</CardContent>
            </Card>

            <Card className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <ShieldCheck size={22} />
              </div>
              <div className="text-2xl font-bold text-foreground">{currentATS.healthLabel}</div>
              <CardTitle className="mt-2 text-base">Resume Health</CardTitle>
              <CardContent>{currentATS.failedRules.length} gap areas identified</CardContent>
            </Card>

            <Card className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles size={22} />
              </div>
              <div className="text-2xl font-bold text-foreground">{currentATS.topSkills.length}</div>
              <CardTitle className="mt-2 text-base">Top Skills</CardTitle>
              <CardContent>Normalized skills surfaced from the resume parser</CardContent>
            </Card>

            <Card className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
                <Briefcase size={22} />
              </div>
              <div className="text-2xl font-bold text-foreground">{jobMatches.length}</div>
              <CardTitle className="mt-2 text-base">Job Matches</CardTitle>
              <CardContent>{bestMatch ? 'Latest match preview synced from ATS analytics' : 'Waiting for resume analysis'}</CardContent>
            </Card>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] items-start">
            <div className="space-y-8">
              <Card>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <CardTitle>Resume Overview</CardTitle>
                    <CardContent>
                      {resume ? `Analyzed resume: ${resume.fileName || 'Uploaded resume'}` : 'Upload a resume to generate an overview.'}
                    </CardContent>
                  </div>
                  {currentATS.analyzedAt && (
                    <div className="text-right text-xs text-muted">
                      <div>Last analyzed</div>
                      <div className="text-foreground">{new Date(currentATS.analyzedAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-tertiary/60 p-4">
                    <div className="mb-2 text-sm font-semibold text-foreground">Strengths</div>
                    <div className="flex flex-wrap gap-2">
                      {(currentATS.strengths.length > 0 ? currentATS.strengths : ['Profile and content analysis completed']).map((item) => (
                        <span key={item} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-tertiary/60 p-4">
                    <div className="mb-2 text-sm font-semibold text-foreground">Areas to improve</div>
                    <div className="flex flex-wrap gap-2">
                      {(currentATS.missingAreas.length > 0 ? currentATS.missingAreas : ['No gaps identified']).map((item) => (
                        <span key={item} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Sparkles size={18} />
                    </div>
                    <CardTitle className="text-xl">Quick Recommendations</CardTitle>
                  </div>

                  <div className="space-y-3">
                    {currentATS.recommendations.length > 0 ? (
                      currentATS.recommendations.slice(0, 5).map((recommendation) => (
                        <div key={recommendation} className="flex items-start gap-3 rounded-xl border border-border bg-tertiary/50 px-4 py-3 text-sm text-muted">
                          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-accent" />
                          <span>{recommendation}</span>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-border bg-tertiary/50 px-4 py-3 text-sm text-muted">
                        Recommendations appear after ATS analysis.
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      <Sparkles size={18} />
                    </div>
                    <CardTitle className="text-xl">Top Extracted Skills</CardTitle>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentATS.topSkills.length > 0 ? (
                      currentATS.topSkills.map((skill) => (
                        <span key={skill} className="rounded-full border border-border bg-tertiary/60 px-3 py-1 text-xs text-foreground">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted">Upload a resume to extract normalized skills.</span>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <div className="space-y-8">
              <Card>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <CardTitle className="text-xl">Top Match Preview</CardTitle>
                    <CardContent>Synced from the server-side job match engine</CardContent>
                  </div>
                  {bestMatch && (
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                      {bestMatch.matchScore?.matchPercentage ?? 0}%
                    </span>
                  )}
                </div>

                {bestMatch ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg font-semibold text-foreground">{bestMatch.title}</div>
                      <div className="text-sm text-muted">{bestMatch.company}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                        <span>{bestMatch.location}</span>
                        <span>•</span>
                        <span>{bestMatch.remoteType || bestMatch.locationType}</span>
                        <span>•</span>
                        <span>{bestMatch.employmentType}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border bg-tertiary/50 p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{bestMatch.matchScore?.confidence ?? 0}%</div>
                        <div className="text-xs text-muted">Confidence</div>
                      </div>
                      <div className="rounded-xl border border-border bg-tertiary/50 p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{bestMatch.matchScore?.technicalAlignment ?? 0}%</div>
                        <div className="text-xs text-muted">Technical fit</div>
                      </div>
                      <div className="rounded-xl border border-border bg-tertiary/50 p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{bestMatch.matchScore?.resumeCompleteness ?? 0}%</div>
                        <div className="text-xs text-muted">Resume health</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-tertiary/40 px-4 py-3 text-sm text-muted">
                      {bestMatch.matchScore?.summary?.[0] || bestMatch.matchScore?.explanation?.[0] || 'Match analytics ready.'}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-border bg-tertiary/40 p-4">
                        <div className="mb-2 text-sm font-semibold text-foreground">Matched skills</div>
                        <div className="flex flex-wrap gap-2">
                          {(bestMatch.matchScore?.matchedSkills || []).slice(0, 4).map((skill) => (
                            <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-tertiary/40 p-4">
                        <div className="mb-2 text-sm font-semibold text-foreground">Missing skills</div>
                        <div className="flex flex-wrap gap-2">
                          {(bestMatch.matchScore?.missingSkills || []).slice(0, 4).map((skill) => (
                            <span key={skill} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button variant="primary" className="w-full" onClick={() => navigate(`/job-match/${bestMatch._id}`)}>
                      View Full Match Details
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-tertiary/40 px-6 py-12 text-center">
                    <Briefcase size={40} className="mb-3 text-muted opacity-50" />
                    <p className="text-sm text-muted">Best match preview appears after resume analysis.</p>
                  </div>
                )}
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Upload size={18} />
                  </div>
                  <CardTitle className="text-xl">Current Upload State</CardTitle>
                </div>

                <div className="space-y-3 text-sm text-muted">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                    <span>Latest resume</span>
                    <span className="text-foreground">{resume?.fileName || 'None uploaded'}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                    <span>Profile completeness</span>
                    <span className="text-foreground">{currentATS.profileCompletion || 0}/5</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-tertiary/40 px-4 py-3">
                    <span>Recommendations</span>
                    <span className="text-foreground">{currentATS.recommendations.length}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/60 px-6 py-12 text-center text-muted">
          Upload a resume to view ATS score, recommendations, and match preview.
        </div>
      )}
    </div>
  )
}
