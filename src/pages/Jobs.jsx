import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Building, MapPin, DollarSign, Briefcase, Search } from 'lucide-react'

export default function Jobs() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  // Dummy job data
  const allJobs = [
    {
      _id: '1',
      title: 'Senior Staff Engineer',
      company: 'QuantumScale Systems',
      location: 'Palo Alto, CA',
      locationType: 'Hybrid',
      salary: { min: 220000, max: 310000 },
      matchScore: { overall: 94 },
      description: 'Lead the architecture and development of next-generation cloud infrastructure systems.',
    },
    {
      _id: '2',
      title: 'Principal Engineer',
      company: 'TechCore Solutions',
      location: 'San Francisco, CA',
      locationType: 'Remote',
      salary: { min: 250000, max: 350000 },
      matchScore: { overall: 88 },
      description: 'Design and implement core platform systems at scale.',
    },
    {
      _id: '3',
      title: 'Staff Software Engineer',
      company: 'CloudInnovate Inc',
      location: 'Seattle, WA',
      locationType: 'Hybrid',
      salary: { min: 210000, max: 290000 },
      matchScore: { overall: 82 },
      description: 'Build scalable backend systems and microservices.',
    },
    {
      _id: '4',
      title: 'Engineering Manager',
      company: 'NextGen Tech',
      location: 'New York, NY',
      locationType: 'On-site',
      salary: { min: 200000, max: 280000 },
      matchScore: { overall: 76 },
      description: 'Lead and mentor a team of talented engineers.',
    },
    {
      _id: '5',
      title: 'Senior Backend Engineer',
      company: 'DataFlow Systems',
      location: 'Austin, TX',
      locationType: 'Remote',
      salary: { min: 180000, max: 250000 },
      matchScore: { overall: 85 },
      description: 'Develop high-performance data processing systems.',
    },
    {
      _id: '6',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Berkeley, CA',
      locationType: 'Hybrid',
      salary: { min: 150000, max: 220000 },
      matchScore: { overall: 79 },
      description: 'Build features across our entire product stack.',
    },
  ]

  const filteredJobs = allJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Job Matches</h1>
        <p className="text-lg text-muted mb-8">
          Explore opportunities that match your skills and experience
        </p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
            <Input
              type="text"
              placeholder="Search by title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3"
            />
          </div>
      </div>

        {/* Jobs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <Card
                key={job._id}
                className="hover:border-primary transition cursor-pointer hover:shadow-lg"
                onClick={() => navigate(`/job-match/${job._id}`)}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground hover:text-primary transition">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted">{job.company}</p>
                      </div>
                      {job.matchScore && (
                        <div className="ml-4 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {job.matchScore.overall}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <MapPin size={16} />
                      <span>{job.location}</span>
                      <span className="text-xs bg-tertiary px-2 py-1 rounded">
                        {job.locationType}
                      </span>
                    </div>

                    {job.salary && (
                      <div className="flex items-center gap-2 text-muted">
                        <DollarSign size={16} />
                        <span>
                          ${(job.salary.min / 1000).toFixed(0)}K - ${(job.salary.max / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted line-clamp-2">{job.description}</p>

                  {/* CTA */}
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/job-match/${job._id}`)
                    }}
                  >
                    View Match Details
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Briefcase size={48} className="mx-auto text-muted mb-4 opacity-50" />
              <p className="text-muted mb-4">No jobs found matching your search</p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
            </div>
          )}
      </div>
    </div>
  )
}
