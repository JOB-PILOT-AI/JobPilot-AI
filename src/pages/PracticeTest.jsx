import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { ArrowLeft, Brain, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Code2, RotateCcw, Timer, Users } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import { useAuthStore } from '../store/authStore'
import { normalizeResumeData } from '../lib/resumeStructure'
import ErrorBoundary from '../components/ErrorBoundary'

const trackIcons = {
  technical: Code2,
  nonTechnical: Users,
  combined: Brain,
}

const trackLabels = {
  technical: 'Technical',
  nonTechnical: 'Non-technical',
  combined: 'Combined',
}

const trackSummaries = {
  technical: 'Technical MCQs, coding aptitude, resume skill questions, and project-based reasoning.',
  nonTechnical: 'Aptitude, English grammar, communication, HR, and behavioral questions.',
  combined: 'A mixed set with technical, behavioral, and aptitude questions.',
}

const normalizeTrack = (track) => {
  if (track === 'nonTechnical') return 'nonTechnical'
  if (track === 'combined') return 'combined'
  return 'technical'
}

export default function PracticeTest() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token } = useAuthStore()
  const [activeTrack, setActiveTrack] = useState(normalizeTrack(searchParams.get('track')))
  const [resumeData, setResumeData] = useState(null)
  const [testData, setTestData] = useState(null)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isTestStarted, setIsTestStarted] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timer, setTimer] = useState(45 * 60)
  const SelectedIcon = trackIcons[activeTrack]

  useEffect(() => {
    const loadResumeAndTest = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await axios.get('/api/resume', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        const latestResume = response.data?.[0]

        if (!latestResume) {
          setResumeData(null)
          setTestData(null)
          return
        }

        const normalizedResume = normalizeResumeData(latestResume)
        setResumeData(normalizedResume)
        await generatePracticeTest(normalizedResume, activeTrack)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load practice test.')
      } finally {
        setIsLoading(false)
      }
    }

    loadResumeAndTest()
  }, [token, activeTrack])

  const generatePracticeTest = async (sourceResume = resumeData, track = activeTrack) => {
    if (!sourceResume) {
      setError('Upload or build a resume first to generate practice tests.')
      return
    }

    setIsLoading(true)
    setError('')
    setIsFinished(false)
    setIsTestStarted(false)
    setTimer(45 * 60)
    setCurrentQuestionIndex(0)

    try {
      const response = await axios.post(
        '/api/resume/practice-test',
        { resumeData: sourceResume, track },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      setTestData(response.data?.test)
      setSelectedAnswers({})
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to generate practice test.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrackChange = (track) => {
    const normalizedTrack = normalizeTrack(track)
    setActiveTrack(normalizedTrack)
    navigate(`/practice-test?track=${normalizedTrack}`, { replace: true })
  }

  const handleStartTest = () => {
    if (!testData?.questions?.length) return
    setIsTestStarted(true)
    setIsFinished(false)
    setCurrentQuestionIndex(0)
  }

  const handleFinishTest = () => {
    setIsFinished(true)
    setIsTestStarted(false)
  }

  const handleRetake = () => {
    setSelectedAnswers({})
    setCurrentQuestionIndex(0)
    setIsFinished(false)
    setIsTestStarted(false)
    setTimer(45 * 60)
  }

  const handleOptionSelect = (questionIndex, optionValue) => {
    if (!isTestStarted || isFinished) return
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionValue,
    }))
  }

  useEffect(() => {
    if (!isTestStarted || isFinished) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsFinished(true)
          setIsTestStarted(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTestStarted, isFinished])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    return `${minutes}:${remaining.toString().padStart(2, '0')}`
  }

  const questions = testData?.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = Object.keys(selectedAnswers).length
  const correctCount = questions.reduce((count, question, index) => {
    return selectedAnswers[index] === question.answer ? count + 1 : count
  }, 0)
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  const categoryCounts = useMemo(() => {
    return questions.reduce((acc, question) => {
      const category = question.category || 'General'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
  }, [questions])

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#0b1118]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Button variant="outline" size="sm" className="mb-5" onClick={() => navigate('/interview-prep')}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Exam Prep
              </Button>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <SelectedIcon size={21} />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Practice Set</h1>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-secondary">
                {trackSummaries[activeTrack]} Choose an answer, move question by question, then finish for scoring.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: 'technical', label: 'Technical', icon: Code2 },
                { key: 'nonTechnical', label: 'Non-tech', icon: Users },
                { key: 'combined', label: 'Combined', icon: Brain },
              ].map((track) => {
                const Icon = track.icon
                const isActive = activeTrack === track.key

                return (
                  <Button
                    key={track.key}
                    variant={isActive ? 'primary' : 'outline'}
                    onClick={() => handleTrackChange(track.key)}
                    className="justify-center"
                    disabled={isLoading || !resumeData || isTestStarted}
                  >
                    <Icon size={16} className="mr-2" />
                    {track.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!resumeData && !isLoading ? (
          <Card className="text-center">
            <CardTitle className="mb-2">Resume needed first</CardTitle>
            <CardContent>Upload or create a resume in Resume Builder to generate aptitude and resume-based practice sets.</CardContent>
            <Button variant="primary" className="mt-5" onClick={() => navigate('/resume-builder')}>
              Open Resume Builder
            </Button>
          </Card>
        ) : null}

        {resumeData && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <Card className="border-white/10 bg-[#0f131c]">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-primary">Questions</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{questions.length}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-primary">Answered</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{answeredCount}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-primary">Progress</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{progress}%</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
                      <Timer size={14} />
                      Time
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">{formatTime(timer)}</div>
                  </div>
                </div>
              </Card>

              {!isTestStarted && !isFinished && (
                <Card className="border-primary/20 bg-[#111417]">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <ClipboardCheck size={22} />
                    </div>
                    <div>
                      <CardTitle>{testData?.label || trackLabels[activeTrack]} Practice Set</CardTitle>
                      <CardContent className="mt-2 leading-6 text-secondary">
                        {isLoading ? 'Generating from your uploaded resume...' : testData?.summary || 'Practice set ready.'}
                      </CardContent>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={handleStartTest} disabled={isLoading || !questions.length}>
                      Start Exam
                    </Button>
                    <Button variant="outline" onClick={() => generatePracticeTest(resumeData, activeTrack)} disabled={isLoading}>
                      <RotateCcw size={16} className="mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </Card>
              )}

              {isFinished && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <div className="mb-5 flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    <div>
                      <CardTitle>Exam complete</CardTitle>
                      <CardContent className="mt-1">Review your score and jump back into any question from the palette.</CardContent>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-primary">Correct</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{correctCount}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-primary">Score</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{score}%</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-primary">Attempted</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{answeredCount}/{questions.length}</div>
                    </div>
                  </div>
                  <Button variant="primary" className="mt-5" onClick={handleRetake}>
                    Retake Same Set
                  </Button>
                </Card>
              )}

              {currentQuestion && (
                <Card className="border-white/10 bg-[#0f131c]">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-secondary">
                          {currentQuestion.category || 'General'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-secondary">
                          {currentQuestion.difficulty || 'Foundational'}
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold leading-8 text-white">{currentQuestion.question}</h2>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {(currentQuestion.options || []).map((option, optionIndex) => {
                      const selected = selectedAnswers[currentQuestionIndex]
                      const selectedOption = selected === option
                      const isAnswer = currentQuestion.answer === option
                      const showResult = isFinished || Boolean(selected)

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleOptionSelect(currentQuestionIndex, option)}
                          className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                            selectedOption
                              ? isAnswer
                                ? 'border-emerald-400 bg-emerald-500/10 text-white'
                                : 'border-rose-400 bg-rose-500/10 text-white'
                              : showResult && isAnswer
                                ? 'border-emerald-400/70 bg-emerald-500/10 text-white'
                                : 'border-white/10 bg-[#111417] text-secondary hover:border-primary/70 hover:bg-[#151922]'
                          }`}
                        >
                          <div className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs font-semibold">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span className="leading-6">{option}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {(isFinished || selectedAnswers[currentQuestionIndex]) && (
                    <div className="mt-5 rounded-2xl border border-primary/20 bg-[#111722] p-4 text-sm leading-6 text-secondary">
                      <div>
                        Correct answer: <span className="font-semibold text-white">{currentQuestion.answer}</span>
                      </div>
                      {currentQuestion.explanation && <div className="mt-2">{currentQuestion.explanation}</div>}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft size={16} className="mr-2" />
                      Previous
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestionIndex((index) => Math.min(questions.length - 1, index + 1))}
                        disabled={currentQuestionIndex === questions.length - 1}
                      >
                        Next
                        <ChevronRight size={16} className="ml-2" />
                      </Button>
                      <Button variant="primary" onClick={handleFinishTest} disabled={!isTestStarted}>
                        Finish Exam
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {isLoading && <div className="text-sm text-secondary">Generating practice set...</div>}
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24">
              <Card className="border-white/10 bg-[#0f131c]">
                <CardTitle className="mb-4 text-xl">Question Palette</CardTitle>
                <div className="max-h-[380px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((question, index) => {
                      const selected = selectedAnswers[index]
                      const isCurrent = index === currentQuestionIndex
                      const isCorrect = selected && selected === question.answer

                      return (
                        <button
                          key={question.id || index}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`h-10 rounded-xl border text-sm font-semibold transition ${
                            isCurrent
                              ? 'border-primary bg-primary text-white'
                              : selected
                                ? isCorrect
                                  ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                                  : 'border-rose-400/60 bg-rose-500/10 text-rose-200'
                                : 'border-white/10 bg-[#111417] text-secondary hover:border-primary/60'
                          }`}
                        >
                          {index + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Card>

              <Card className="border-white/10 bg-[#0f131c]">
                <CardTitle className="mb-4 text-xl">Exam Mix</CardTitle>
                <div className="space-y-3">
                  {Object.entries(categoryCounts).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111417] px-4 py-3 text-sm">
                      <span className="text-secondary">{category}</span>
                      <span className="font-semibold text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-white/10 bg-[#0f131c]">
                <CardTitle className="mb-4 text-xl">Before you start</CardTitle>
                <div className="space-y-3">
                  {(testData?.readinessTips || []).map((tip) => (
                    <div key={tip} className="rounded-xl border border-white/10 bg-[#111417] px-4 py-3 text-sm leading-6 text-secondary">
                      {tip}
                    </div>
                  ))}
                </div>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
