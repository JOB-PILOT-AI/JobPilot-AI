import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import ReactECharts from 'echarts-for-react'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  Radar,
  RefreshCcw,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'

const ELECTRIC_CYAN = '#22D3EE'
const SOFT_BLUE = '#64748B'
const TARGET_COLOR = '#FBBF24'

const DIMENSION_LIBRARY = [
  {
    key: 'frontend',
    label: 'Frontend',
    skills: ['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Tailwind CSS', 'Redux', 'Redux Toolkit', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Vite', 'Framer Motion'],
    signals: ['frontend', 'front end', 'ui', 'ux', 'react', 'next.js', 'typescript', 'javascript', 'component', 'accessibility'],
  },
  {
    key: 'backend',
    label: 'Backend',
    skills: ['Node.js', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET', 'PHP', 'Laravel', 'Ruby on Rails', 'GraphQL', 'REST API', 'Prisma', 'Mongoose'],
    signals: ['backend', 'api', 'service', 'server', 'rest', 'graphql', 'node', 'express', 'nestjs', 'fastapi', 'django', 'flask', 'microservice'],
  },
  {
    key: 'system-design',
    label: 'System Design',
    skills: ['System Design', 'Data Structures', 'Algorithms', 'Microservices', 'Kafka', 'RabbitMQ', 'gRPC'],
    signals: ['system design', 'architecture', 'distributed', 'scalability', 'microservice', 'event driven', 'kafka', 'grpc', 'reliability'],
  },
  {
    key: 'cloud',
    label: 'Cloud',
    skills: ['AWS', 'Azure', 'Google Cloud Platform', 'CloudFront', 'Lambda', 'EC2', 'ECS', 'EKS', 'S3', 'Cloudflare', 'Serverless'],
    signals: ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'lambda', 's3', 'ec2', 'ecs', 'eks', 'cloudfront', 'cloudflare'],
  },
  {
    key: 'devops',
    label: 'DevOps',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Terraform', 'Ansible', 'Jenkins', 'Nginx', 'Linux', 'Git'],
    signals: ['devops', 'docker', 'kubernetes', 'ci/cd', 'cicd', 'github actions', 'terraform', 'ansible', 'jenkins', 'nginx', 'linux'],
  },
  {
    key: 'database',
    label: 'Database',
    skills: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'DynamoDB', 'Aurora', 'Elasticsearch', 'SQL'],
    signals: ['database', 'sql', 'postgres', 'mongodb', 'mysql', 'redis', 'schema', 'migrations', 'dynamodb', 'elasticsearch'],
  },
  {
    key: 'leadership',
    label: 'Leadership',
    skills: ['Leadership', 'Agile', 'Scrum', 'Jira', 'Confluence', 'Notion', 'Figma'],
    signals: ['lead', 'leader', 'leadership', 'manager', 'principal', 'staff', 'mentor', 'mentoring', 'coaching', 'stakeholder', 'communication', 'collaboration', 'planning', 'ownership'],
  },
  {
    key: 'ai-ml',
    label: 'AI / ML',
    skills: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'LangChain', 'Hugging Face', 'MLflow', 'Pandas', 'NumPy', 'Keras', 'NLTK', 'OpenCV', 'Apache Spark', 'Hadoop', 'XGBoost'],
    signals: ['machine learning', 'artificial intelligence', 'ai', 'llm', 'nlp', 'langchain', 'hugging face', 'tensorflow', 'pytorch', 'scikit learn', 'mlflow'],
  },
]

const MAX_SNAPSHOT_COUNT = 3
const RING_LEVELS = [0.25, 0.5, 0.75, 1]

const normalizeText = (value) =>
  typeof value === 'string'
    ? value
        .toLowerCase()
        .replace(/[^a-z0-9#+]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : ''

const unique = (items = []) => Array.from(new Set(items.filter(Boolean)))

const toStringArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((entry) => String(entry))
  if (typeof value === 'string') return [value]
  return []
}

const buildTextBlock = (parts = []) => unique(parts.flatMap((entry) => toStringArray(entry))).join(' ').toLowerCase()

const createSkillSet = (items = []) => new Set(unique(items).map((item) => normalizeText(item)).filter(Boolean))

const matchesSignal = (text, signal) => {
  const normalizedText = ` ${normalizeText(text)} `
  const normalizedSignal = normalizeText(signal)

  if (!normalizedText.trim() || !normalizedSignal) return false

  return normalizedText.includes(` ${normalizedSignal} `)
}

const scoreDimension = (profile, dimension) => {
  const skillMatches = dimension.skills.reduce(
    (count, skill) => count + (profile.skillSet.has(normalizeText(skill)) ? 1 : 0),
    0
  )
  const skillScore = dimension.skills.length > 0 ? (skillMatches / dimension.skills.length) * 78 : 0

  const signalMatches = dimension.signals.reduce(
    (count, signal) => count + (matchesSignal(profile.text, signal) ? 1 : 0),
    0
  )
  const signalScore = dimension.signals.length > 0 ? (signalMatches / dimension.signals.length) * 22 : 0

  return Math.max(0, Math.min(100, Math.round(skillScore + signalScore)))
}

const buildResumeProfile = (resume) => {
  if (!resume) {
    return { text: '', skillSet: new Set(), atsAnalytics: null }
  }

  const atsAnalytics = resume.atsAnalytics || null
  const experience = Array.isArray(resume.experience?.length ? resume.experience : resume.workExperience)
    ? resume.experience?.length
      ? resume.experience
      : resume.workExperience
    : []

  const text = buildTextBlock([
    resume.personalInfo?.fullName,
    resume.personalInfo?.summary,
    resume.summary,
    resume.personalInfo?.title,
    resume.personalInfo?.location,
    ...experience.flatMap((item) => [item.company, item.position, item.description]),
    ...(resume.education || []).flatMap((item) => [item.school, item.degree, item.field, item.graduationYear]),
    ...(resume.projects || []).flatMap((item) => [item.name, item.description, ...(item.technologies || []), item.link]),
    ...(resume.certifications || []).flatMap((item) => [item.name, item.issuer, item.date]),
    ...(atsAnalytics?.topSkills || []),
    ...(atsAnalytics?.technicalCoverage || []),
    ...(atsAnalytics?.strengths || []),
    ...(atsAnalytics?.weaknesses || []),
    ...(atsAnalytics?.recommendations || []),
    ...(atsAnalytics?.normalizedSkills || resume.skills || []),
  ])

  return {
    text,
    skillSet: createSkillSet(atsAnalytics?.normalizedSkills || resume.skills || []),
    atsAnalytics,
  }
}

const buildJobProfile = (job) => {
  if (!job) {
    return { text: '', skillSet: new Set(), matchScore: null }
  }

  const text = buildTextBlock([
    job.title,
    job.company,
    job.location,
    job.remoteType,
    job.employmentType,
    job.category,
    job.description,
    ...(job.responsibilities || []),
    ...(job.requiredSkills || []),
    ...(job.preferredSkills || []),
    ...(job.extractedSkills || []),
  ])

  return {
    text,
    skillSet: createSkillSet([...(job.requiredSkills || []), ...(job.preferredSkills || []), ...(job.extractedSkills || [])]),
    matchScore: job.matchScore || null,
  }
}

const getDimensionRows = (dimensions, resumeProfile, jobProfile) =>
  dimensions.map((dimension) => {
    const candidateScore = scoreDimension(resumeProfile, dimension)
    const jobScore = scoreDimension(jobProfile, dimension)
    const difference = candidateScore - jobScore
    const overlap = Math.min(candidateScore, jobScore)
    const similarity = Math.max(0, 100 - Math.abs(difference))

    let status = 'Aligned'
    if (difference >= 15) {
      status = 'Ahead'
    } else if (difference <= -15) {
      status = 'Gap'
    }

    return {
      ...dimension,
      candidateScore,
      jobScore,
      difference,
      overlap,
      similarity,
      status,
    }
  })

const buildRadarPoints = (rows, size = 420) => {
  const center = size / 2
  const radius = size * 0.34

  return rows.map((row, index) => {
    const angle = (Math.PI * 2 * index) / rows.length - Math.PI / 2
    const distance = (row / 100) * radius

    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance,
      angle,
      index,
    }
  })
}

const pointsToString = (points) => points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')

const buildSimilarityScore = (rows) => {
  const overlapTotal = rows.reduce((sum, row) => sum + Math.min(row.candidateScore, row.jobScore), 0)
  const exposureTotal = rows.reduce((sum, row) => sum + Math.max(row.candidateScore, row.jobScore), 0)

  return exposureTotal > 0 ? Math.round((overlapTotal / exposureTotal) * 100) : 0
}

const buildRadarOption = (dimensions, rows, candidateName, targetName) => {
  const indicators = dimensions.map((dimension) => ({ name: dimension.label, max: 100 }))
  const candidateValues = rows.map((row) => row.candidateScore)
  const targetValues = rows.map((row) => row.jobScore)

  return {
    animation: true,
    animationDuration: 900,
    animationDurationUpdate: 180,
    animationEasing: 'cubicOut',
    color: [ELECTRIC_CYAN, TARGET_COLOR],
    legend: {
      top: 8,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#98a2b3',
        fontSize: 12,
      },
      data: [candidateName, targetName],
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(14, 18, 24, 0.96)',
      borderColor: 'rgba(255,255,255,0.08)',
      textStyle: {
        color: '#e5e7eb',
      },
      formatter: (params) => {
        const data = params?.data || {}
        const valueList = Array.isArray(data.value) ? data.value : []

        return [
          `<div style="font-weight:600;margin-bottom:4px;">${data.name || params?.seriesName || 'Skill DNA'}</div>`,
          ...indicators.map((indicator, index) => {
            const value = valueList[index] ?? 0
            return `<div style="display:flex;justify-content:space-between;gap:18px;min-width:180px;"><span>${indicator.name}</span><strong>${value}%</strong></div>`
          }),
        ].join('')
      },
    },
    radar: {
      center: ['50%', '52%'],
      radius: '78%',
      shape: 'circle',
      indicator: indicators,
      splitNumber: 5,
      name: {
        color: '#9ca3af',
        fontSize: 12,
      },
      axisName: {
        color: '#cbd5e1',
        fontSize: 12,
        padding: [2, 4],
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.12)',
          width: 1,
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.1)',
          width: 1,
        },
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(255,255,255,0.012)', 'rgba(255,255,255,0.03)'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        name: candidateName,
        zlevel: 1,
        z: 2,
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: candidateValues,
            name: candidateName,
            lineStyle: {
              color: ELECTRIC_CYAN,
              width: 3,
              type: 'solid',
              shadowColor: 'rgba(34,211,238,.35)',
              shadowBlur: 14,
            },
            itemStyle: {
              color: ELECTRIC_CYAN,
            },
            areaStyle: {
              color: 'rgba(34,211,238,.25)',
            },
            emphasis: {
              lineStyle: {
                width: 3,
              },
            },
          },
        ],
      },
      {
        type: 'radar',
        name: targetName,
        zlevel: 0,
        z: 1,
        symbol: 'circle',
        symbolSize: 6,
        data: [
          {
            value: targetValues,
            name: targetName,
            lineStyle: {
              color: TARGET_COLOR,
              width: 2,
              type: 'dashed',
              shadowColor: 'rgba(251,191,36,.22)',
              shadowBlur: 16,
            },
            itemStyle: {
              color: TARGET_COLOR,
            },
            areaStyle: {
              color: 'rgba(251,191,36,.16)',
            },
            emphasis: {
              lineStyle: {
                width: 3,
              },
            },
          },
        ],
      },
    ],
  }
}

const getSignalMatchCount = (profile, dimension) =>
  dimension.signals.reduce((count, signal) => count + (matchesSignal(profile.text, signal) ? 1 : 0), 0)

const getTopKeywords = (dimension, profile) => {
  const matchedSkills = dimension.skills.filter((skill) => profile.skillSet.has(normalizeText(skill)))
  const matchedSignals = dimension.signals.filter((signal) => matchesSignal(profile.text, signal))

  return unique([...matchedSkills, ...matchedSignals]).slice(0, 4)
}

const buildSuggestions = (rows, selectedJobProfile, resumeProfile) => {
  return rows
    .filter((row) => row.jobScore > row.candidateScore)
    .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))
    .slice(0, 3)
    .map((row) => {
      const missingSkills = row.skills.filter((skill) => !resumeProfile.skillSet.has(normalizeText(skill)))
      const jobSignals = getTopKeywords(row, selectedJobProfile)

      if (missingSkills.length > 0) {
        return `${row.label}: surface existing evidence for ${missingSkills.slice(0, 3).join(', ')} to narrow the gap against ${jobSignals.slice(0, 2).join(', ') || 'the selected role'}.`
      }

      return `${row.label}: add a concrete example from your current resume that better demonstrates ${jobSignals.slice(0, 2).join(', ') || 'this capability'} in context.`
    })
}

const buildTimelineSeries = (snapshots, dimensions) =>
  dimensions.map((dimension) => ({
    ...dimension,
    values: snapshots.map((snapshot) => scoreDimension(snapshot.profile, dimension)),
  }))

function MiniRadar({ rows, values, highlightedIndex = null, className = '', stroke = ELECTRIC_CYAN, fill = ELECTRIC_CYAN }) {
  const size = 112
  const center = size / 2
  const radius = 38
  const rings = RING_LEVELS.map((level) => {
    const points = rows.map((_, index) => {
      const angle = (Math.PI * 2 * index) / rows.length - Math.PI / 2
      const distance = radius * level

      return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance,
      }
    })

    return pointsToString(points)
  })

  const axisPoints = rows.map((_, index) => {
    const angle = (Math.PI * 2 * index) / rows.length - Math.PI / 2
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    }
  })

  const radarPoints = buildRadarPoints(values, size)

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden="true">
      {rings.map((ringPoints) => (
        <polygon
          key={ringPoints}
          points={ringPoints}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {axisPoints.map((point, index) => (
        <line
          key={`${index}-axis`}
          x1={center}
          y1={center}
          x2={point.x}
          y2={point.y}
          stroke={highlightedIndex === index ? stroke : 'rgba(255,255,255,0.14)'}
          strokeWidth={highlightedIndex === index ? '1.8' : '1'}
        />
      ))}
      <polygon
        points={pointsToString(radarPoints)}
        fill={fill}
        fillOpacity="0.12"
        stroke={stroke}
        strokeWidth="1.8"
      />
      {radarPoints.map((point, index) => (
        <circle
          key={`${index}-dot`}
          cx={point.x}
          cy={point.y}
          r={highlightedIndex === index ? 2.8 : 2.2}
          fill={stroke}
        />
      ))}
    </svg>
  )
}

function Sparkline({ values, stroke = ELECTRIC_CYAN, className = '' }) {
  const width = 140
  const height = 42
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = Math.max(max - min, 1)
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 6) - 3
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((value, index) => {
        const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
        const y = height - ((value - min) / range) * (height - 6) - 3

        return <circle key={`${index}-${value}`} cx={x} cy={y} r="1.9" fill={stroke} />
      })}
    </svg>
  )
}

export default function SkillDNA() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [resumeHistory, setResumeHistory] = useState([])
  const [jobMatches, setJobMatches] = useState([])
  const [selectedJobId, setSelectedJobId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSkillDNA()
  }, [token])

  useEffect(() => {
    if (!selectedJobId && jobMatches.length > 0) {
      setSelectedJobId(String(jobMatches[0]._id || jobMatches[0].id || ''))
    }
  }, [jobMatches, selectedJobId])

  const loadSkillDNA = async () => {
    setIsLoading(true)
    setError('')

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const [resumesRes, matchesRes] = await Promise.all([
        axios.get('/api/resume', { headers }),
        axios.get('/api/jobs/matches?limit=10', { headers }),
      ])

      const resumes = unwrapApiResponse(resumesRes.data, ['resumes']) || []
      const matchesPayload = unwrapApiResponse(matchesRes.data, ['matches']) || {}
      const matches = Array.isArray(matchesPayload) ? matchesPayload : matchesPayload.matches || []

      setResumeHistory(resumes)
      setJobMatches(matches)

      const nextSelectedId = selectedJobId || String(matches[0]?._id || matches[0]?.id || '')
      setSelectedJobId(nextSelectedId)
    } catch (requestError) {
      setResumeHistory([])
      setJobMatches([])
      setError(getApiErrorMessage(requestError, 'Failed to load Skill DNA analytics.'))
    } finally {
      setIsLoading(false)
    }
  }

  const currentResume = resumeHistory[0] || null
  const timelineSnapshots = [...resumeHistory].reverse().slice(0, MAX_SNAPSHOT_COUNT).map((resume) => ({
    resume,
    profile: buildResumeProfile(resume),
    dateLabel: resume?.createdAt ? format(new Date(resume.createdAt), 'MMM yyyy') : 'Latest',
  }))

  const candidateProfile = useMemo(() => buildResumeProfile(currentResume), [currentResume])
  const selectedJob = useMemo(
    () => jobMatches.find((job) => String(job._id || job.id || '') === String(selectedJobId)) || jobMatches[0] || null,
    [jobMatches, selectedJobId]
  )
  const selectedJobProfile = useMemo(() => buildJobProfile(selectedJob), [selectedJob])
  const activeProfiles = [candidateProfile, selectedJobProfile, ...timelineSnapshots.map((snapshot) => snapshot.profile)]

  const activeDimensions = useMemo(() => {
    const dimensionsWithSignal = DIMENSION_LIBRARY.filter((dimension) =>
      activeProfiles.some((profile) => profile.text && (getSignalMatchCount(profile, dimension) > 0 || dimension.skills.some((skill) => profile.skillSet.has(normalizeText(skill)))))
    )

    if (dimensionsWithSignal.length >= 6) {
      return dimensionsWithSignal
    }

    const fallback = DIMENSION_LIBRARY.filter((dimension) => !dimensionsWithSignal.includes(dimension))
    return [...dimensionsWithSignal, ...fallback.slice(0, 6 - dimensionsWithSignal.length)]
  }, [candidateProfile, selectedJobProfile, timelineSnapshots])

  const comparisonRows = useMemo(
    () => getDimensionRows(activeDimensions, candidateProfile, selectedJobProfile),
    [activeDimensions, candidateProfile, selectedJobProfile]
  )

  const radarSimilarity = buildSimilarityScore(comparisonRows)
  const selectedJobMatch = selectedJob?.matchScore || null

  const strongestDimensions = [...comparisonRows]
    .filter((row) => row.overlap > 0 || row.candidateScore > 0 || row.jobScore > 0)
    .sort((left, right) => right.overlap - left.overlap || right.similarity - left.similarity)
    .slice(0, 3)

  const weakestDimensions = [...comparisonRows]
    .filter((row) => row.overlap > 0 || row.candidateScore > 0 || row.jobScore > 0)
    .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))
    .slice(0, 3)

  const improvementSuggestions = buildSuggestions(comparisonRows, selectedJobProfile, candidateProfile)

  const rankByDNA = [...jobMatches]
    .map((job) => {
      const profile = buildJobProfile(job)
      const rows = getDimensionRows(activeDimensions, candidateProfile, profile)
      const overlap = buildSimilarityScore(rows)

      return {
        ...job,
        dnaOverlap: overlap,
      }
    })
    .sort((left, right) => right.dnaOverlap - left.dnaOverlap || (right.matchScore?.matchPercentage || 0) - (left.matchScore?.matchPercentage || 0))

  const radarOption = useMemo(
    () => buildRadarOption(activeDimensions, comparisonRows, 'Candidate', 'Target Job'),
    [activeDimensions, comparisonRows]
  )

  return (
    <div className="max-w-7xl mx-auto space-y-5 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-3">Skill DNA</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted">
              Visualizes professional strengths using existing resume parsing and job matching data.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={loadSkillDNA} disabled={isLoading}>
            <RefreshCcw size={16} className="mr-2" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate('/jobs')}>
            Review Job Matches
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <Card className="relative overflow-hidden border border-border bg-secondary/90 p-4 md:p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-primary/30" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-2xl">Career DNA Match Overlay</CardTitle>
            <CardContent className="max-w-2xl">
              Candidate profile is shown in Electric Cyan. Selected target job is shown in Amber Gold.
            </CardContent>
          </div>

          <div className="min-w-[260px] lg:w-[300px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">Compare Job</label>
            <select
              value={selectedJobId}
              onChange={(event) => setSelectedJobId(event.target.value)}
              disabled={jobMatches.length === 0}
              className="w-full rounded-lg border border-border bg-tertiary px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {jobMatches.length === 0 ? (
                <option value="">No matched jobs available</option>
              ) : (
                jobMatches.map((job) => (
                  <option key={String(job._id || job.id)} value={String(job._id || job.id)}>
                    {job.title} · {job.company}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.35fr)]">
            <div className="h-[620px] rounded-2xl border border-border bg-tertiary/40 animate-pulse" />
            <div className="space-y-3">
              <div className="h-24 rounded-2xl border border-border bg-tertiary/40 animate-pulse" />
              <div className="h-24 rounded-2xl border border-border bg-tertiary/40 animate-pulse" />
              <div className="h-24 rounded-2xl border border-border bg-tertiary/40 animate-pulse" />
            </div>
          </div>
        ) : comparisonRows.length > 0 ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.35fr)] items-start">
            <div className="rounded-2xl border border-border bg-tertiary/30 p-3 md:p-4">
              <div className="mb-3 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-muted">
                <span>Candidate</span>
                <span>Radar overlap {radarSimilarity}%</span>
                <span>Target Job</span>
              </div>
              <div className="h-[620px] w-full">
                <ReactECharts
                  option={radarOption}
                  style={{ width: '100%', height: '100%' }}
                  notMerge
                  lazyUpdate
                  showLoading={isLoading}
                  loadingOption={{
                    text: 'Loading Skill DNA',
                    color: ELECTRIC_CYAN,
                    textColor: '#cbd5e1',
                    maskColor: 'rgba(15, 18, 24, 0.55)',
                    zlevel: 0,
                  }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>
            </div>

            <div className="grid gap-3 self-stretch md:grid-cols-2 xl:grid-cols-1">
              <Card className="p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Match %</div>
                <div className="mt-2 text-3xl font-bold text-foreground">{selectedJobMatch?.matchPercentage ?? 0}%</div>
              </Card>

              <Card className="p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">Radar Overlap</div>
                <div className="mt-2 text-3xl font-bold text-foreground">{radarSimilarity}%</div>
              </Card>

              <Card className="p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted">ATS Score</div>
                <div className="mt-2 text-3xl font-bold text-foreground">{currentResume?.atsAnalytics?.score ?? 0}%</div>
              </Card>

              <Card className="p-4 md:col-span-2 xl:col-span-1">
                <CardTitle className="text-sm uppercase tracking-[0.18em] text-muted mb-3">Strongest Dimensions</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {strongestDimensions.length > 0 ? (
                    strongestDimensions.map((row) => (
                      <span key={row.key} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                        {row.label} {Math.min(row.candidateScore, row.jobScore)}%
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted">No aligned dimensions yet.</span>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:col-span-2 xl:col-span-1">
                <CardTitle className="text-sm uppercase tracking-[0.18em] text-muted mb-3">Weakest Dimensions</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {weakestDimensions.length > 0 ? (
                    weakestDimensions.map((row) => (
                      <span key={row.key} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted">
                        {row.label} {Math.abs(row.difference)}%
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted">No major gaps found.</span>
                  )}
                </div>
              </Card>

              <Card className="p-4 md:col-span-2 xl:col-span-1">
                <CardTitle className="text-sm uppercase tracking-[0.18em] text-muted mb-3">Actionable Suggestions</CardTitle>
                <div className="space-y-2 text-sm text-muted">
                  {improvementSuggestions.length > 0 ? (
                    improvementSuggestions.map((suggestion) => (
                      <div key={suggestion} className="rounded-xl border border-border bg-secondary/80 px-3 py-2 leading-6">
                        {suggestion}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-border bg-secondary/80 px-3 py-2 leading-6">No actionable gaps detected.</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border bg-tertiary/30 p-6 text-sm text-muted">
            No matched job data is available yet. Upload or analyze a resume to populate Skill DNA.
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-3">
          <div>
            <CardTitle className="text-xl">Comparison Table</CardTitle>
            <CardContent>Every dimension is scored from the same resume and job evidence.</CardContent>
          </div>
          <div className="text-sm text-muted">Selected job: {selectedJob?.title || 'Unavailable'}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-[0.18em] text-muted">
                <th className="py-3 pr-4 text-left font-semibold">Dimension</th>
                <th className="py-3 px-4 text-left font-semibold">Candidate Score</th>
                <th className="py-3 px-4 text-left font-semibold">Job Score</th>
                <th className="py-3 px-4 text-left font-semibold">Difference</th>
                <th className="py-3 pl-4 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.key} className="border-b border-border/60 transition hover:bg-tertiary/30">
                  <td className="py-4 pr-4 font-medium text-foreground">{row.label}</td>
                  <td className="py-4 px-4 text-muted">{row.candidateScore}%</td>
                  <td className="py-4 px-4 text-muted">{row.jobScore}%</td>
                  <td className={`py-4 px-4 font-medium ${row.difference >= 0 ? 'text-primary' : 'text-amber-300'}`}>
                    {row.difference >= 0 ? '+' : ''}{row.difference}%
                  </td>
                  <td className="py-4 pl-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${
                        row.status === 'Ahead'
                          ? 'border-primary/20 bg-primary/10 text-primary'
                          : row.status === 'Gap'
                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                            : 'border-border bg-secondary text-muted'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Clock3 size={18} />
            </div>
            <div>
              <CardTitle className="text-xl">DNA Evolution</CardTitle>
              <CardContent>Previous resume analyses become a compact history of your skill profile.</CardContent>
            </div>
          </div>

          {timelineSnapshots.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {timelineSnapshots.map((snapshot, index) => {
                const snapshotScores = activeDimensions.map((dimension) => scoreDimension(snapshot.profile, dimension))
                const snapshotATS = snapshot.resume?.atsAnalytics?.score ?? 0
                const snapshotTopDimension = activeDimensions
                  .map((dimension, dimensionIndex) => ({ label: dimension.label, value: snapshotScores[dimensionIndex] }))
                  .sort((left, right) => right.value - left.value)[0]

                return (
                  <div
                    key={snapshot.resume?._id || snapshot.dateLabel}
                    className={`rounded-2xl border bg-secondary/80 p-4 ${index === timelineSnapshots.length - 1 ? 'border-primary/20' : 'border-border'}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted">Snapshot</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">{snapshot.dateLabel}</div>
                      </div>
                      <div className="rounded-full border border-border bg-tertiary px-2.5 py-1 text-xs text-muted">
                        ATS {snapshotATS}%
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-tertiary/30 p-3">
                      <MiniRadar rows={activeDimensions} values={snapshotScores} highlightedIndex={snapshotTopDimension ? activeDimensions.findIndex((dimension) => dimension.label === snapshotTopDimension.label) : null} />
                    </div>
                    <div className="mt-3 text-sm text-muted">
                      Top dimension: <span className="text-foreground">{snapshotTopDimension?.label || 'Unassigned'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-tertiary/30 p-6 text-sm text-muted">
              Resume history is empty. After each new resume analysis, prior snapshots will appear here.
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <TrendingUp size={18} />
            </div>
            <div>
              <CardTitle className="text-xl">Growth Timeline</CardTitle>
              <CardContent>Each row shows how a dimension has changed across the latest analyses.</CardContent>
            </div>
          </div>

          {timelineSnapshots.length > 0 ? (
            <div className="space-y-4">
              {buildTimelineSeries(timelineSnapshots, activeDimensions).map((dimension) => {
                const latest = dimension.values[dimension.values.length - 1] ?? 0
                const previous = dimension.values.length > 1 ? dimension.values[dimension.values.length - 2] : latest
                const delta = latest - previous

                return (
                  <div key={dimension.key} className="rounded-2xl border border-border bg-tertiary/30 px-4 py-3">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{dimension.label}</div>
                        <div className="text-xs text-muted">Latest {latest}% · {delta >= 0 ? '+' : ''}{delta}% vs previous</div>
                      </div>
                      <div className="text-sm font-semibold text-foreground">{latest}%</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Sparkline values={dimension.values} />
                      <div className="flex-1 space-y-2">
                        {dimension.values.map((value, index) => (
                          <div key={`${dimension.key}-${index}`} className="h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${value}%`,
                                background: index === dimension.values.length - 1 ? ELECTRIC_CYAN : SOFT_BLUE,
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-tertiary/30 p-6 text-sm text-muted">
              Timeline data will appear once multiple resume analyses exist.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <AlertCircle size={18} />
            </div>
            <div>
              <CardTitle className="text-xl">Opportunity Gaps</CardTitle>
              <CardContent>Largest differences with direct next-step guidance.</CardContent>
            </div>
          </div>

          <div className="space-y-3">
            {comparisonRows
              .filter((row) => row.jobScore > row.candidateScore)
              .sort((left, right) => Math.abs(right.difference) - Math.abs(left.difference))
              .slice(0, 3)
              .map((row) => {
                const missingSkills = row.skills.filter((skill) => !candidateProfile.skillSet.has(normalizeText(skill))).slice(0, 3)

                return (
                  <div key={row.key} className="rounded-2xl border border-border bg-secondary/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="font-semibold text-foreground">{row.label}</div>
                      <div className="text-sm font-medium text-amber-300">{Math.abs(row.difference)}% gap</div>
                    </div>
                    <div className="text-sm leading-6 text-muted">
                      {missingSkills.length > 0
                        ? `Add or surface existing evidence for ${missingSkills.join(', ')}. Keep it grounded in work you have already done.`
                        : 'Add a concrete example from your existing resume that demonstrates this dimension more explicitly.'}
                    </div>
                  </div>
                )
              })}

            {comparisonRows.filter((row) => row.jobScore > row.candidateScore).length === 0 && (
              <div className="rounded-2xl border border-border bg-tertiary/30 px-4 py-4 text-sm text-muted">
                No notable opportunity gaps detected for the selected job.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Briefcase size={18} />
            </div>
            <div>
              <CardTitle className="text-xl">Top Matching Jobs by DNA</CardTitle>
              <CardContent>Ranked by radar overlap instead of ATS score alone.</CardContent>
            </div>
          </div>

          {rankByDNA.length > 0 ? (
            <div className="space-y-3">
              {rankByDNA.map((job) => (
                <button
                  key={String(job._id || job.id)}
                  onClick={() => navigate(`/job-match/${String(job._id || job.id)}`)}
                  className="w-full rounded-2xl border border-border bg-secondary/80 px-4 py-4 text-left transition hover:border-primary/40 hover:bg-tertiary/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-foreground transition group-hover:text-primary">{job.title}</div>
                      <div className="text-sm text-muted">{job.company}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{job.dnaOverlap}%</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted">DNA overlap</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <span className="rounded-full border border-border px-2 py-1">ATS {job.matchScore?.matchPercentage ?? 0}%</span>
                    <span className="rounded-full border border-border px-2 py-1">{job.remoteType}</span>
                    <span className="rounded-full border border-border px-2 py-1">{job.employmentType}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-tertiary/30 px-4 py-4 text-sm text-muted">
              No job matches are available yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}