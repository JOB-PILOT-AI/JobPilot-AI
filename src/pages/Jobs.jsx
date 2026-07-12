import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Bookmark, Briefcase, ChevronDown, Search, SlidersHorizontal, MapPin, RefreshCcw, Landmark } from 'lucide-react'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { getApiErrorMessage, unwrapApiResponse } from '../lib/apiResponse'
import ErrorBoundary from '../components/ErrorBoundary'

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
  const [savedJobs, setSavedJobs] = useState(() => {
    try {
      const raw = localStorage.getItem('savedJobs')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })
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

  useEffect(() => {
    const loadSaved = async () => {
      if (!token) return
      try {
        const res = await axios.get('/api/jobs/saved/list')
        const saved = res.data?.saved || []
        setSavedJobs(saved)
      } catch (err) {
        // ignore
      }
    }

    loadSaved()
  }, [token])

  useEffect(() => {
    try {
      localStorage.setItem('savedJobs', JSON.stringify(savedJobs))
    } catch (e) {
      // ignore
    }
  }, [savedJobs])

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
    <ErrorBoundary>
      <div className="min-h-screen page-shell text-foreground px-0 py-0 sm:px-2 sm:py-2 lg:px-0">
        <div className="mx-auto max-w-7xl space-y-8">
          <Card className="rounded-2xl border border-white/10 bg-[#101317]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6 lg:rounded-[2rem] lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 flex flex-wrap gap-3">
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-sm font-semibold text-accent">Engineering</span>
                  <span className="rounded-full border border-white/10 bg-[#111418] px-4 py-1 text-sm font-semibold text-secondary">Remote / Hybrid</span>
                </div>
                <h1 className="max-w-4xl break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">Precision Job Matches</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-secondary">
                  Search by title, company, skills, or keywords, then refine by location, remote type, salary, and fit threshold.
                </p>
              </div>

              <Button variant="outline" onClick={() => loadJobs(filters)} disabled={isLoading} className="w-full rounded-[1.5rem] px-6 py-3 sm:w-auto">
                <RefreshCcw size={16} className="mr-2" />
                Refresh
              </Button>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-border bg-[#111418] p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm shadow-black/20">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <CardTitle className="text-lg text-white sm:text-xl">Search and filters</CardTitle>
                  <CardContent>Deterministic filters keep the list stable and match-aware.</CardContent>
                </div>
              </div>

              <form onSubmit={applyFilters}>
                <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0d1218] p-4 sm:flex-row sm:items-center sm:gap-3">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
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
                    className="w-full justify-center rounded-[1.5rem] sm:w-auto sm:min-w-[148px]"
                    >
                      Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                      <ChevronDown
                        size={16}
                        className={`ml-2 transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}
                      />
                    </Button>

                    <Button type="submit" variant="primary" className="w-full rounded-[1.5rem] sm:w-auto">
                      Apply Filters
                    </Button>
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${isFiltersOpen ? 'mt-4 max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="rounded-[1.5rem] border border-white/10 bg-[#101418] p-5">
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
                          className="w-full rounded-md border border-border bg-tertiary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
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
                          className="w-full rounded-md border border-border bg-tertiary px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
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
            </div>
          </Card>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101417] shadow-[0_24px_70px_rgba(0,0,0,0.20)]">
        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-20 text-secondary">
            Loading live opportunities...
          </div>
        ) : jobs.length > 0 ? (
          jobs.map((job) => {
            const matchScore = getMatchPercentage(job)
            const matchedSkills = job.matchScore?.matchedSkills || []

            return (
              <div
                key={job._id}
                className="group grid cursor-pointer gap-5 border-b border-white/10 p-4 transition duration-200 last:border-b-0 hover:bg-[#14161b] sm:p-6 lg:grid-cols-[92px_1fr_auto] lg:items-center lg:p-8"
                onClick={() => navigate(`/job-match/${job._id}`)}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#17171c] text-[#ffd0cc]">
                  <Landmark size={34} />
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap gap-3 text-sm font-semibold uppercase tracking-[0.12em] text-secondary">
                    {matchScore > 0 && <span className="text-accent">{matchScore}% Match</span>}
                    <span>Posted recently</span>
                  </div>
                  <h3 className="max-w-xl break-words text-xl font-semibold text-white transition group-hover:text-primary sm:text-2xl">{job.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-base text-secondary">
                    <span>{job.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-2"><MapPin size={17} />{job.location}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {(matchedSkills.length ? matchedSkills : job.requiredSkills || []).slice(0, 2).map((skill) => (
                    <span key={skill} className="rounded-full border border-white/10 bg-[#11141a] px-4 py-2 text-sm text-secondary">{skill}</span>
                  ))}
                  <span className="rounded-full border border-white/10 bg-[#11141a] px-4 py-2 text-sm text-secondary">+{Math.max((job.requiredSkills || []).length - 2, 2)} skills</span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      const isSaved = savedJobs.includes(job._id)
                      if (token) {
                        try {
                          if (isSaved) {
                            await axios.delete(`/api/jobs/${job._id}/save`)
                            setSavedJobs((s) => s.filter((id) => id !== job._id))
                          } else {
                            await axios.post(`/api/jobs/${job._id}/save`, { matchScore: job.matchScore })
                            setSavedJobs((s) => Array.from(new Set([...s, job._id])))
                          }
                        } catch (err) {
                          // fallback to local save if API fails
                          if (isSaved) setSavedJobs((s) => s.filter((id) => id !== job._id))
                          else setSavedJobs((s) => Array.from(new Set([...s, job._id])))
                        }
                      } else {
                        // unauthenticated - use localStorage fallback
                        if (isSaved) setSavedJobs((s) => s.filter((id) => id !== job._id))
                        else setSavedJobs((s) => Array.from(new Set([...s, job._id])))
                      }
                    }}
                    aria-label="Save job"
                  >
                    <Bookmark className={`text-secondary ${savedJobs.includes(job._id) ? 'text-accent' : ''}`} />
                  </button>
                  <div onClick={(event) => event.stopPropagation()}>
                    <Button variant="primary" className="rounded-full px-5 py-3" onClick={() => navigate(`/job-match/${job._id}`)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-6 py-20 text-center text-secondary">
            <Briefcase size={48} className="mx-auto mb-4 opacity-60" />
            <p className="mb-4 text-lg">No jobs found matching your filters.</p>
            <Button variant="outline" className="rounded-[1.5rem] px-6 py-3" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  </div>
</ErrorBoundary>
  )
}
