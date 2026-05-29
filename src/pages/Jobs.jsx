import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Briefcase, ChevronDown, Search, SlidersHorizontal, MapPin, DollarSign, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'

const EMPTY_FILTERS = {
  search: '',
  location: '',
  remoteType: '',
  category: '',
  employmentType: '',
  salaryRange: '',
  experience: '',
  skills: '',
  skillMatchThreshold: '',
}

const REMOTE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Remote', value: 'Remote' },
  { label: 'Hybrid', value: 'Hybrid' },
  { label: 'On-site', value: 'On-site' },
]

const buildQueryString = (filters) => {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      params.set(key, value.trim())
    }
  })

  return params.toString()
}

const formatSalary = (job) => {
  const min = Number(job.salaryRange?.min || job.salary?.min || 0)
  const max = Number(job.salaryRange?.max || job.salary?.max || 0)

  return `$${min.toLocaleString()} - $${max.toLocaleString()}`
}

const getMatchPercentage = (job) => Number(job.matchScore?.matchPercentage || job.matchScore?.overall || 0)

export default function Jobs() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const loadJobs = async (nextFilters = filters) => {
    setIsLoading(true)
    setError('')

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined
      const queryString = buildQueryString(nextFilters)
      const jobsUrl = queryString ? `/api/jobs?${queryString}` : '/api/jobs'
      const matchesUrl = token ? `/api/jobs/matches?limit=12${queryString ? `&${queryString}` : ''}` : null

      const [jobsRes, matchesRes] = await Promise.all([
        axios.get(jobsUrl, { headers }),
        matchesUrl ? axios.get(matchesUrl, { headers }) : Promise.resolve({ data: { matches: [] } }),
      ])

      const jobsPayload = unwrapApiResponse(jobsRes.data, ['jobs'])
      const matchesPayload = unwrapApiResponse(matchesRes.data, ['matches'])
      const matchMap = new Map(((matchesPayload?.matches || [])).map((job) => [String(job._id), job.matchScore]))

      setJobs(
        (jobsPayload || []).map((job) => ({
          ...job,
          matchScore: matchMap.get(String(job._id)) || job.matchScore || null,
        }))
      )
    } catch (requestError) {
      setJobs([])
      setError(getApiErrorMessage(requestError, 'Failed to load jobs.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs(EMPTY_FILTERS)
  }, [token])

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const applyFilters = async (event) => {
    event.preventDefault()
    await loadJobs(filters)
    setIsFiltersOpen(false)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    loadJobs(EMPTY_FILTERS)
  }

  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === 'skillMatchThreshold') {
      return Number(value) > 0 ? count + 1 : count
    }

    return typeof value === 'string' && value.trim() ? count + 1 : count
  }, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-3">Job Matches</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Search by title, company, skills, or keywords, then refine by location, remote type, salary, and fit threshold.
          </p>
        </div>

        <Button variant="outline" onClick={() => loadJobs(filters)} disabled={isLoading}>
          <RefreshCcw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <CardTitle className="text-xl">Search and filters</CardTitle>
            <CardContent>Deterministic filters keep the list stable and match-aware.</CardContent>
          </div>
        </div>

        <form onSubmit={applyFilters}>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-tertiary/40 p-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <Input
                type="text"
                placeholder="Title, company, skills, or keyword"
                value={filters.search}
                onChange={(event) => handleFilterChange('search', event.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFiltersOpen((current) => !current)}
                className="min-w-[132px] justify-center"
              >
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                <ChevronDown
                  size={16}
                  className={`ml-2 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}
                />
              </Button>

              <Button type="submit" variant="primary">
                Apply Filters
              </Button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${isFiltersOpen ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="rounded-2xl border border-border bg-secondary p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Location</label>
                  <Input
                    type="text"
                    placeholder="San Francisco, Remote"
                    value={filters.location}
                    onChange={(event) => handleFilterChange('location', event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Remote type</label>
                  <select
                    value={filters.remoteType}
                    onChange={(event) => handleFilterChange('remoteType', event.target.value)}
                    className="w-full rounded-lg border border-border bg-tertiary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    {REMOTE_OPTIONS.map((option) => (
                      <option key={option.value || option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Category</label>
                  <Input
                    type="text"
                    placeholder="Engineering, Product"
                    value={filters.category}
                    onChange={(event) => handleFilterChange('category', event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Employment type</label>
                  <select
                    value={filters.employmentType}
                    onChange={(event) => handleFilterChange('employmentType', event.target.value)}
                    className="w-full rounded-lg border border-border bg-tertiary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Salary range</label>
                  <Input
                    type="text"
                    placeholder="150000-250000"
                    value={filters.salaryRange}
                    onChange={(event) => handleFilterChange('salaryRange', event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Experience</label>
                  <Input
                    type="text"
                    placeholder="3-7"
                    value={filters.experience}
                    onChange={(event) => handleFilterChange('experience', event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Skills</label>
                  <Input
                    type="text"
                    placeholder="React, Node.js, AWS"
                    value={filters.skills}
                    onChange={(event) => handleFilterChange('skills', event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Match threshold</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={filters.skillMatchThreshold}
                    onChange={(event) => handleFilterChange('skillMatchThreshold', event.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:col-span-4 pt-2">
                  <Button type="submit" variant="primary">
                    Apply Filters
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      clearFilters()
                      setIsFiltersOpen(false)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center rounded-2xl border border-border bg-secondary px-6 py-16 text-muted">
            Loading live opportunities...
          </div>
        ) : jobs.length > 0 ? (
          jobs.map((job) => {
            const matchScore = getMatchPercentage(job)
            const matchedSkills = job.matchScore?.matchedSkills || []
            const missingSkills = job.matchScore?.missingSkills || []

            return (
              <Card
                key={job._id}
                className="group cursor-pointer border border-border bg-secondary transition duration-200 hover:-translate-y-1 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/10"
                onClick={() => navigate(`/job-match/${job._id}`)}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-border px-2 py-1">{job.category}</span>
                      <span className="rounded-full border border-border px-2 py-1">{job.remoteType}</span>
                      <span className="rounded-full border border-border px-2 py-1">{job.employmentType}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground transition group-hover:text-primary">{job.title}</h3>
                      <p className="text-sm text-muted">{job.company}</p>
                    </div>
                  </div>

                  {matchScore > 0 && (
                    <div className="flex h-14 min-w-14 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-primary">{matchScore}%</div>
                        <div className="text-[10px] uppercase tracking-wide text-muted">Match</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm text-muted">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} />
                      {formatSalary(job)}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-sm leading-6 text-muted">{job.description}</p>

                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">Required skills</div>
                    <div className="flex flex-wrap gap-2">
                      {(job.requiredSkills || []).slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full border border-border bg-tertiary px-3 py-1 text-xs text-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {matchScore > 0 && (
                    <div className="grid gap-3 rounded-xl border border-border bg-tertiary/60 p-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Matched</div>
                        <div className="flex flex-wrap gap-2">
                          {matchedSkills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Gaps</div>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <div className="text-xs text-muted">
                    {job.matchScore?.confidence ? `Confidence ${job.matchScore.confidence}%` : 'Live job data'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/job-match/${job._id}`)
                    }}
                  >
                    View details
                  </Button>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-secondary px-6 py-16 text-center text-muted">
            <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
            <p className="mb-4">No jobs found matching your filters.</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}