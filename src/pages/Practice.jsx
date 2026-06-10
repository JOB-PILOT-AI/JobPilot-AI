import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { Card, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Brain, Code2, LineChart, Target, Briefcase, Loader2 } from 'lucide-react'

const PRACTICE_CATEGORIES = [
  { id: 'aptitude', title: 'Quantitative Aptitude', icon: LineChart, description: 'Practice math, logic, and data interpretation.' },
  { id: 'logical', title: 'Logical Reasoning', icon: Brain, description: 'Test your analytical and problem-solving skills.' },
  { id: 'technical', title: 'Technical Foundations', icon: Code2, description: 'Core CS concepts, data structures, and algorithms.' },
  { id: 'verbal', title: 'Verbal Ability', icon: Target, description: 'Grammar, comprehension, and vocabulary exercises.' },
]

const TRACKS = [
  {
    id: 'technical',
    title: 'Technical Role',
    icon: Code2,
    description: 'Practice programming, logic, reasoning, english, and problem solving.',
    allowedCategories: ['technical', 'aptitude', 'logical', 'verbal']
  },
  {
    id: 'non-technical',
    title: 'Non-Technical Role',
    icon: Briefcase,
    description: 'Focus on verbal ability (english), reasoning, and quantitative aptitude.',
    allowedCategories: ['verbal', 'aptitude', 'logical']
  }
]

export default function Practice() {
  const { token } = useAuthStore()
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [seenQuestionIds, setSeenQuestionIds] = useState([])
  const [currentQuestions, setCurrentQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [recommendedTrack, setRecommendedTrack] = useState(null)

  useEffect(() => {
    if (!token) return
    const fetchResume = async () => {
      try {
        const res = await axios.get('/api/resume', { headers: { Authorization: `Bearer ${token}` } })
        const resumes = res.data?.resumes || res.data
        const latestResume = resumes?.[0]
        if (latestResume) {
          const skills = latestResume.skills || latestResume.atsAnalytics?.topSkills || []
          const skillLower = skills.join(' ').toLowerCase()
          if (skillLower.includes('react') || skillLower.includes('node') || skillLower.includes('sql') || skillLower.includes('java') || skillLower.includes('python') || skillLower.includes('c++') || skillLower.includes('developer') || skillLower.includes('engineer')) {
            setRecommendedTrack('technical')
          } else {
            setRecommendedTrack('non-technical')
          }
        }
      } catch (e) {
        console.error('Failed to fetch resume for practice recommendations:', e)
      }
    }
    fetchResume()
  }, [token])

  const handleStartTrack = async (trackId) => {
    setSelectedTrack(trackId)
    setIsLoading(true)
    setError(null)
    
    try {
      const allowed = TRACKS.find(t => t.id === trackId)?.allowedCategories || []
      const response = await axios.get(`/api/practice/questions?categories=${allowed.join(',')}&limit=10&exclude=${seenQuestionIds.join(',')}`)
      
      let questions = response.data.questions || []
      
      if (questions.length === 0) {
        setError("No practice questions found. The database might still be seeding or is empty.")
        return
      }

      if (response.data.isReset) {
        setSeenQuestionIds(questions.map(q => q._id))
      } else {
        setSeenQuestionIds(prev => [...prev, ...questions.map(q => q._id)])
      }

      setCurrentQuestions(questions.sort(() => Math.random() - 0.5))
      setCurrentQuestionIndex(0)
      setSelectedAnswer(null)
      setIsAnswerChecked(false)
      setScore(0)
      setIsFinished(false)
    } catch (error) {
      console.error("Failed to fetch questions:", error)
      setError(error.response?.data?.message || "Failed to fetch practice questions. Make sure your backend is running and the new practice routes are registered.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (index) => {
    if (!isAnswerChecked) {
      setSelectedAnswer(index)
    }
  }

  const handleCheckAnswer = () => {
    setIsAnswerChecked(true)
    const correct = currentQuestions[currentQuestionIndex].answer === selectedAnswer
    if (correct) {
      setScore(s => s + 1)
    }
  }

  const handleNext = async () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(c => c + 1)
      setSelectedAnswer(null)
      setIsAnswerChecked(false)
    } else {
      setIsFinished(true)
      
      if (token) {
        try {
          await axios.post('/api/practice/score', {
            track: selectedTrack,
            score: score + (currentQuestions[currentQuestionIndex].answer === selectedAnswer && isAnswerChecked ? 1 : 0),
            total: currentQuestions.length
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        } catch (error) {
          console.error("Failed to save score:", error)
        }
      }
    }
  }

  const resetPractice = () => {
    setSelectedTrack(null)
    setCurrentQuestions([])
    setError(null)
    setSeenQuestionIds([])
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 text-center mt-24 flex flex-col items-center">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Generating Practice Set...</h2>
        <p className="text-muted">Fetching customized questions for your track from the server.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 text-center mt-24 flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-500 mb-4">
          <XCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Oops! Something went wrong</h2>
        <p className="text-muted">{error}</p>
        <div className="mt-8">
          <Button variant="outline" onClick={resetPractice}>Back to Tracks</Button>
        </div>
      </div>
    )
  }

  if (!selectedTrack) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Choose Your Track</h1>
          <p className="text-xl text-muted max-w-3xl mx-auto">Select your background to get customized practice sets tailored to your role.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {TRACKS.map((track) => {
            const Icon = track.icon
            return (
              <Card key={track.id} className="overflow-hidden bg-[#181818] border-border hover:border-primary/40 transition-colors">
                <div 
                  className="flex h-full w-full cursor-pointer flex-col items-center gap-5 p-6 text-center" 
                  onClick={() => handleStartTrack(track.id)}
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon size={40} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-3">{track.title}</CardTitle>
                    {recommendedTrack === track.id && (
                      <div className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary-soft bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 inline-block">
                        ⭐ Resume Match
                      </div>
                    )}
                    <p className="text-sm text-muted">{track.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 text-center mt-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary">
          <CheckCircle size={40} />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Practice Completed!</h1>
        <p className="text-xl text-muted">You scored {score} out of {currentQuestions.length}.</p>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button variant="outline" onClick={resetPractice}>Choose Another Track</Button>
          <Button variant="primary" onClick={() => handleStartTrack(selectedTrack)}>Try Again</Button>
        </div>
      </div>
    )
  }

  if (selectedTrack && currentQuestions.length > 0) {
    const currentQuestion = currentQuestions[currentQuestionIndex]
    const trackInfo = TRACKS.find(t => t.id === selectedTrack)

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" size="sm" onClick={resetPractice}>
            <ArrowLeft size={16} className="mr-2" /> Change Track
          </Button>
          <span className="text-sm font-semibold text-muted tracking-widest uppercase">
            {trackInfo?.title} • Q {currentQuestionIndex + 1}/{currentQuestions.length}
          </span>
        </div>

        <Card className="bg-[#171212]">
          <div className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-soft">
            {PRACTICE_CATEGORIES.find(c => c.id === currentQuestion.category)?.title || 'Practice'}
          </div>
          <CardTitle className="text-2xl leading-relaxed mb-8">{currentQuestion.question}</CardTitle>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              let optionStyle = "border-border bg-tertiary/40 hover:bg-tertiary/80 text-foreground"
              
              if (isAnswerChecked) {
                if (index === currentQuestion.answer) {
                  optionStyle = "border-green-500/50 bg-green-500/10 text-green-400"
                } else if (index === selectedAnswer) {
                  optionStyle = "border-red-500/50 bg-red-500/10 text-red-400"
                } else {
                  optionStyle = "border-border bg-tertiary/10 text-muted opacity-50"
                }
              } else if (selectedAnswer === index) {
                optionStyle = "border-primary bg-primary/10 text-primary-soft"
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  disabled={isAnswerChecked}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${optionStyle}`}
                >
                  <span className="font-medium">{option}</span>
                  {isAnswerChecked && index === currentQuestion.answer && <CheckCircle size={20} className="text-green-500" />}
                  {isAnswerChecked && index === selectedAnswer && index !== currentQuestion.answer && <XCircle size={20} className="text-red-500" />}
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex justify-end">
            {!isAnswerChecked ? (
              <Button variant="primary" onClick={handleCheckAnswer} disabled={selectedAnswer === null}>
                Check Answer
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext}>
                {currentQuestionIndex === currentQuestions.length - 1 ? 'Finish Practice' : 'Next Question'} <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return null
}