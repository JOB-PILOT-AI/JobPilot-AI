import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, FileText, Briefcase, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [resume, setResume] = useState(null)
  const [jobMatches, setJobMatches] = useState([])
  const [atsScore, setAtsScore] = useState(0)
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    offers: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch resume
      const resumeRes = await axios.get('/api/resume', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resumeRes.data.length > 0) {
        setResume(resumeRes.data[0])
        setAtsScore(resumeRes.data[0].atsScore?.score || 0)
      }

      // Fetch job matches (dummy data for now)
      setJobMatches([
        {
          _id: '1',
          title: 'Senior Staff Engineer',
          company: 'QuantumScale Systems',
          location: 'Palo Alto, CA',
          matchScore: { overall: 94 },
        },
        {
          _id: '2',
          title: 'Principal Engineer',
          company: 'TechCore Solutions',
          location: 'San Francisco, CA',
          matchScore: { overall: 88 },
        },
        {
          _id: '3',
          title: 'Staff Software Engineer',
          company: 'CloudInnovate Inc',
          location: 'Seattle, WA',
          matchScore: { overall: 82 },
        },
      ])

      setStats({
        applications: 12,
        interviews: 3,
        offers: 1,
      })
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    }
  }

  // Chart data
  const atsChartData = [
    { name: 'Personal Info', value: 10 },
    { name: 'Experience', value: 25 },
    { name: 'Education', value: 15 },
    { name: 'Skills', value: 35 },
    { name: 'Extra', value: 15 },
  ]

  const matchData = [
    { month: 'Week 1', matches: 4 },
    { month: 'Week 2', matches: 7 },
    { month: 'Week 3', matches: 5 },
    { month: 'Week 4', matches: 9 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome back, {user?.name}
              </h1>
              <p className="text-muted">Track your career intelligence metrics and job opportunities</p>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{atsScore}</div>
                <CardTitle className="text-base mb-2">ATS Score</CardTitle>
                <CardContent className="text-xs">
                  Your resume ATS optimization score
                </CardContent>
              </Card>

              <Card className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">{jobMatches.length}</div>
                <CardTitle className="text-base mb-2">Top Matches</CardTitle>
                <CardContent className="text-xs">
                  Job opportunities matching your profile
                </CardContent>
              </Card>

              <Card className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stats.applications}</div>
                <CardTitle className="text-base mb-2">Applications</CardTitle>
                <CardContent className="text-xs">
                  Total applications submitted
                </CardContent>
              </Card>

              <Card className="text-center">
                <div className="text-4xl font-bold text-accent mb-2">{stats.interviews}</div>
                <CardTitle className="text-base mb-2">Interviews</CardTitle>
                <CardContent className="text-xs">
                  Scheduled interviews
                </CardContent>
              </Card>
            </div>

            {/* ATS Intelligence Card */}
            <Card className="border-2 border-primary">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Zap size={20} className="text-white" />
                </div>
                <CardTitle>ATS Intelligence</CardTitle>
                <span className="ml-auto text-primary font-bold">{atsScore}/100</span>
              </div>

              {resume ? (
                <div className="space-y-6">
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={atsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #404040',
                          }}
                        />
                        <Bar dataKey="value" fill="#e07856" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {atsScore >= 80 ? (
                    <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-400">Well optimized for ATS</div>
                        <p className="text-sm text-green-400/70">Your resume is highly optimized. Focus on applying!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-yellow-400">Optimize your resume</div>
                        <p className="text-sm text-yellow-400/70">Implement suggestions to improve ATS compatibility.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="text-muted mx-auto mb-4 opacity-50" />
                  <p className="text-muted mb-4">No resume uploaded yet</p>
                  <Button variant="primary" onClick={() => navigate('/resume-builder')}>
                    Upload Resume
                  </Button>
                </div>
              )}
            </Card>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Precision Job Matches */}
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Briefcase size={20} className="text-white" />
                  </div>
                  <CardTitle>Precision Job Matches</CardTitle>
                </div>

                <div className="space-y-4">
                  {jobMatches.map((job) => (
                    <div
                      key={job._id}
                      className="p-4 border border-border rounded-lg hover:bg-tertiary transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-foreground">{job.title}</div>
                          <div className="text-sm text-muted">{job.company}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {job.matchScore.overall}%
                          </div>
                          <div className="text-xs text-muted">Match</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted mb-3">{job.location}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate(`/job/${job._id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate('/dashboard')}
                >
                  View All Matches
                </Button>
              </Card>

              {/* Match Trend */}
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <CardTitle>Match Trend</CardTitle>
                </div>

                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={matchData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #404040',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="matches"
                      stroke="#e07856"
                      strokeWidth={2}
                      dot={{ fill: '#e07856' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
