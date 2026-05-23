import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { CheckCircle, AlertCircle, Building, MapPin, DollarSign } from 'lucide-react'

export default function JobMatch() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Dummy data
  const job = {
    title: 'Senior Staff Engineer, Cloud Platform',
    company: 'QuantumScale Systems',
    location: 'Palo Alto, CA',
    locationType: 'Hybrid',
    salary: { min: 220000, max: 310000 },
    description: 'Lead the architecture and development of next-generation cloud infrastructure systems.',
    matchScore: {
      overall: 94,
      skillMatch: 95,
      experienceMatch: 92,
      educationMatch: 98,
      details: {
        matchedSkills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud Architecture'],
        missingSkills: ['Rust (Internal Tooling)', 'Service Mesh'],
        feedback: 'Exceptional alignment. Your experience directly matches 95% of required skills.',
      },
    },
  }

  const handleApply = () => {
    if (!user) {
      navigate('/login', { state: { from: `/job-match/${jobId}` } })
    } else {
      // Handle job application for authenticated users
      console.log('Applying for job:', jobId)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="inline-block px-3 py-1 bg-accent text-black text-xs font-semibold rounded-full mb-4">
          Engineering
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">{job.title}</h1>
        <div className="flex flex-wrap gap-6 text-muted">
          <div className="flex items-center gap-2">
            <Building size={18} />
            {job.company}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={18} />
            {job.location}
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={18} />
            ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
          </div>
        </div>
      </div>

      <Card className="border-2 border-primary mb-8">
        <div className="flex items-center justify-between mb-6">
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {job.matchScore.overall}%
            </div>
            Match Intelligence
          </CardTitle>
          <Button variant="primary" onClick={handleApply}>
            Apply Now
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-accent mb-2">{job.matchScore.skillMatch}%</div>
            <div className="text-sm text-muted">Skill Match</div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-accent mb-2">{job.matchScore.experienceMatch}%</div>
            <div className="text-sm text-muted">Experience Match</div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-accent mb-2">{job.matchScore.educationMatch}%</div>
            <div className="text-sm text-muted">Education Match</div>
          </div>
        </div>

        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
          <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-green-400 mb-1">High Confidence Alignment</div>
            <p className="text-sm text-green-400/70">{job.matchScore.details.feedback}</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={20} className="text-accent" />
            <CardTitle className="text-lg">Critical Skill Overlap</CardTitle>
          </div>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.matchScore.details.matchedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-accent/10 border border-accent/30 text-accent rounded-full text-sm"
                >
                  ✓ {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={20} className="text-yellow-400" />
            <CardTitle className="text-lg">Identified Gaps</CardTitle>
          </div>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {job.matchScore.details.missingSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-full text-sm"
                >
                  ○ {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardTitle className="mb-4">About This Role</CardTitle>
        <CardContent className="space-y-4">
          <p>{job.description}</p>
          <h4 className="font-semibold text-foreground mt-6">Key Responsibilities:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted">
            <li>Design and implement cloud infrastructure solutions</li>
            <li>Lead technical architecture discussions and design reviews</li>
            <li>Mentor junior engineers and conduct code reviews</li>
            <li>Collaborate with product teams to define technical roadmaps</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardTitle className="mb-4">About QuantumScale Systems</CardTitle>
        <CardContent>
          <p className="text-muted mb-4">
            A Series D unicorn focused on providing high-throughput edge computing for the next generation of AI-driven applications.
          </p>
          <Button variant="outline">View Company Profile →</Button>
        </CardContent>
      </Card>
    </div>
  )
}

