import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Button from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import { ArrowRight, Zap, Brain, Gauge } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold text-balance">
              Precision tools for{' '}
              <span className="text-primary">career growth</span>
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Intelligent job matching and engineering-focused workflows designed for the
              modern professional.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
              className="flex items-center gap-2"
            >
              Get Started Free <ArrowRight size={20} />
            </Button>
            <Button variant="outline" size="lg">
              View Demo
            </Button>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-border">
            <div>
              <div className="text-2xl font-bold text-primary">94%</div>
              <div className="text-sm text-muted">Match Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">25K+</div>
              <div className="text-sm text-muted">Engineers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted">ATS Optimized</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Match Engine Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-2 border-primary bg-gradient-to-br from-secondary to-tertiary">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                  <Brain size={20} className="text-white" />
                </div>
                <span className="font-semibold text-primary">AI Matching Engine</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Find your perfect job match
              </h3>
              <p className="text-muted mb-6">
                Our intelligent engine analyzes your skills, experience, and preferences
                to surface opportunities that align with your career goals.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Skill-based matching algorithm</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Real-time job alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm">Personalized recommendations</span>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-tertiary rounded-lg p-8 text-center">
              <div className="text-6xl font-bold text-primary mb-2">94%</div>
              <div className="text-sm text-muted mb-4">Match Strength</div>
              <Button variant="primary" className="w-full">
                View Matching Jobs
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">
          Intelligence built for excellence
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Zap size={24} className="text-white" />
              </div>
              <CardTitle className="text-lg">Intelligent Matching</CardTitle>
            </div>
            <CardContent>
              Our neural network analyzes high-dimensional skill data to find roles that
              don&apos;t just match your title, but your actual engineering capacity.
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Gauge size={24} className="text-white" />
              </div>
              <CardTitle className="text-lg">ATS Optimization</CardTitle>
            </div>
            <CardContent>
              We provide a surgical view into how specific ATS algorithms rank your profile
              against competitors.
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Brain size={24} className="text-white" />
              </div>
              <CardTitle className="text-lg">Engineering Workflows</CardTitle>
            </div>
            <CardContent>
              Built by engineers, for engineers. Export required support, compare roles with
              Git-like versioning, and automate mundane research.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-center space-y-6">
          <h3 className="text-3xl font-bold">Ready to navigate your next pivot?</h3>
          <p className="text-muted">
            Join 25,000+ engineers using JobPilot.AI to manage their professional evolution
            with clinical precision.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            Create Free Profile
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold mb-4">JobPilot.AI</div>
              <div className="text-sm text-muted">Career Intelligence Platform</div>
            </div>
            <div>
              <div className="font-semibold mb-4">Platform</div>
              <ul className="text-sm text-muted space-y-2">
                <li><a href="#" className="hover:text-foreground transition">ATS Scan</a></li>
                <li><a href="#" className="hover:text-foreground transition">Job Matches</a></li>
                <li><a href="#" className="hover:text-foreground transition">Resume Builder</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-4">Resources</div>
              <ul className="text-sm text-muted space-y-2">
                <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition">Templates</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-4">Legal</div>
              <ul className="text-sm text-muted space-y-2">
                <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted">
            © 2024 JobPilot.AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
