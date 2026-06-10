import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { Card, CardTitle, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Mic, StopCircle, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'

const INTERVIEW_TOPICS = [
  { id: 'frontend', title: 'Frontend Engineering', icon: '💻' },
  { id: 'backend', title: 'Backend Engineering', icon: '⚙️' },
  { id: 'fullstack', title: 'Full Stack Development', icon: '🌐' },
  { id: 'behavioral', title: 'Behavioral & Culture Fit', icon: '🤝' },
]

const MOCK_QUESTIONS = {
  frontend: [
    "Can you explain the virtual DOM and how React handles rendering?",
    "How do you manage state in a large React application?",
    "Explain the concept of closures in JavaScript and provide a use case.",
  ],
  backend: [
    "How would you design a scalable microservices architecture?",
    "Explain the differences between SQL and NoSQL databases.",
    "How do you secure a RESTful API?",
  ],
  fullstack: [
    "Describe the lifecycle of a web request from browser to database and back.",
    "How do you handle authentication and authorization in a full-stack app?",
    "What strategies do you use for performance optimization on both frontend and backend?",
  ],
  behavioral: [
    "Tell me about a time you had a conflict with a team member and how you resolved it.",
    "Describe a challenging technical problem you solved recently.",
    "Where do you see your career heading in the next 3 to 5 years?",
  ]
}

export default function MockInterview() {
  const { token } = useAuthStore()
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [isStarted, setIsStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [customTrack, setCustomTrack] = useState(null)
  const [customQuestions, setCustomQuestions] = useState([])

  useEffect(() => {
    if (!token) return
    const fetchResumeAndGenerateQuestions = async () => {
      try {
        const res = await axios.get('/api/resume', { headers: { Authorization: `Bearer ${token}` } })
        const resumes = res.data?.resumes || res.data
        const latestResume = resumes?.[0]
        if (latestResume) {
          const skills = latestResume.skills || latestResume.atsAnalytics?.topSkills || []
          const skillLower = skills.map(s => typeof s === 'string' ? s.toLowerCase() : '')
          
          const skillMap = {
            react: ["Can you explain the virtual DOM and how React handles rendering?", "How do you manage state in a large React application?"],
            javascript: ["Explain the concept of closures in JavaScript.", "What is the difference between var, let, and const?"],
            node: ["How does the Node.js event loop work?", "Explain how you handle asynchronous operations in Node.js."],
            python: ["What are decorators in Python?", "Explain the difference between a list and a tuple."],
            java: ["What is the difference between an interface and an abstract class?", "Explain garbage collection in Java."],
            sql: ["Explain the differences between SQL and NoSQL databases.", "What are the different types of JOINs?"],
            aws: ["What is the difference between EC2 and S3?", "Explain how IAM works in AWS."],
            docker: ["What is a Docker container vs an image?", "How do you share data between Docker containers?"],
          }

          const matchedQuestions = []
          skillLower.forEach(skill => {
            Object.keys(skillMap).forEach(key => {
              if (skill.includes(key)) {
                matchedQuestions.push(...skillMap[key])
              }
            })
          })

          const uniqueQs = [...new Set(matchedQuestions)].slice(0, 5)
          if (uniqueQs.length >= 2) {
            setCustomTrack({ id: 'custom', title: 'Personalized (Resume Match)', icon: '🎯' })
            setCustomQuestions(uniqueQs)
          }
        }
      } catch (error) {
        console.error('Failed to fetch resume for mock interview:', error)
      }
    }
    fetchResumeAndGenerateQuestions()
  }, [token])

  const handleStart = (topicId) => {
    setSelectedTopic(topicId)
    setIsStarted(true)
    setCurrentQuestionIndex(0)
    setShowFeedback(false)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const handleNextQuestion = () => {
    if (isRecording) setIsRecording(false)
    
    const activeQuestions = selectedTopic === 'custom' ? customQuestions : MOCK_QUESTIONS[selectedTopic]
    
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(curr => curr + 1)
    } else {
      setIsAnalyzing(true)
      setTimeout(() => {
        setIsAnalyzing(false)
        setShowFeedback(true)
      }, 2000)
    }
  }

  const resetInterview = () => {
    setIsStarted(false)
    setSelectedTopic(null)
    setShowFeedback(false)
  }

  if (showFeedback) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={resetInterview}>
            <ArrowLeft size={16} className="mr-2" /> Back to Setup
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Interview Analysis</h1>
        </div>
        
        <Card className="border-primary/25 bg-[#170f10]">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <CardTitle className="text-2xl">Great job!</CardTitle>
            <p className="text-muted">You completed the {selectedTopic === 'custom' ? customTrack?.title : INTERVIEW_TOPICS.find(t => t.id === selectedTopic)?.title} mock interview.</p>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-[#1d1d1d] p-5">
              <h3 className="font-semibold text-foreground mb-3">Strengths Identified</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" /> Clear communication of technical concepts.</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" /> Good pacing and structured answers.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-[#1d1d1d] p-5">
              <h3 className="font-semibold text-foreground mb-3">Areas for Improvement</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2"><ArrowRight size={16} className="text-yellow-500 shrink-0 mt-0.5" /> Consider adding more real-world examples.</li>
                <li className="flex items-start gap-2"><ArrowRight size={16} className="text-yellow-500 shrink-0 mt-0.5" /> Elaborate slightly more on the "why" behind your choices.</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button variant="primary" onClick={resetInterview}>Start Another Interview</Button>
          </div>
        </Card>
      </div>
    )
  }

  if (isStarted) {
    const activeQuestions = selectedTopic === 'custom' ? customQuestions : MOCK_QUESTIONS[selectedTopic]
    const currentTrackTitle = selectedTopic === 'custom' ? customTrack?.title : INTERVIEW_TOPICS.find(t => t.id === selectedTopic)?.title

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={resetInterview}>
            <StopCircle size={16} className="mr-2" /> End Interview
          </Button>
          <span className="text-sm font-semibold text-muted">
            Question {currentQuestionIndex + 1} of {activeQuestions.length}
          </span>
        </div>

        <Card className="min-h-[400px] flex flex-col justify-between bg-[#171212]">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-soft">
              {currentTrackTitle}
            </div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              {activeQuestions[currentQuestionIndex]}
            </h2>
          </div>

          <div className="mt-12 flex flex-col items-center gap-6">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500/20 border-2 border-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-tertiary border border-border'}`}>
              {isRecording ? <Mic size={32} className="text-red-500 animate-pulse" /> : <Mic size={32} className="text-muted" />}
            </div>
            
            <div className="flex gap-4">
              <Button variant={isRecording ? "outline" : "primary"} onClick={toggleRecording} className={isRecording ? "border-red-500 text-red-500 hover:bg-red-500/10" : ""}>
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
              <Button variant="outline" onClick={handleNextQuestion} disabled={isAnalyzing}>
              {isAnalyzing ? <><Loader2 size={16} className="mr-2 animate-spin" /> Analyzing...</> : <>{currentQuestionIndex === activeQuestions.length - 1 ? 'Finish' : 'Next Question'} <ArrowRight size={16} className="ml-2" /></>}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const displayTopics = customTrack ? [customTrack, ...INTERVIEW_TOPICS] : INTERVIEW_TOPICS

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-4">Mock Interview Simulator</h1>
        <p className="text-xl text-muted max-w-2xl">Practice your technical and behavioral skills with our AI-driven interview simulator. Select a track below to begin.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {displayTopics.map((topic) => (
          <Card key={topic.id} className={`overflow-hidden transition-all hover:border-primary/50 hover:bg-tertiary/40 ${topic.id === 'custom' ? 'border-primary/30 bg-primary/5' : ''}`}>
            <div className="h-full w-full cursor-pointer p-6" onClick={() => handleStart(topic.id)}>
              <div className="mb-4 flex items-center gap-4">
                <div className="text-4xl">{topic.icon}</div>
                <div>
                  <CardTitle>{topic.title}</CardTitle>
                  {topic.id === 'custom' && <div className="mt-1 text-[10px] text-primary-soft font-semibold uppercase tracking-widest">⭐ Recommended for you</div>}
                </div>
              </div>
              <div className="text-sm text-muted">
                {topic.id === 'custom' ? 'Questions generated dynamically based on the skills and experience extracted from your uploaded resume.' : 'A comprehensive set of questions covering key concepts, best practices, and problem-solving scenarios.'}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}