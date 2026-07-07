import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import {
  ArrowLeft, ArrowRight, Bot, BriefcaseBusiness, Camera, CameraOff, CheckCircle2,
  ChevronRight, Clock3, Headphones, Lightbulb, Loader2, MessageSquareText,
  Mic, MicOff, PhoneOff, Play, RefreshCcw, RotateCcw, ShieldCheck, Sparkles,
  Star, Target, UserRound, Volume2, VolumeX, Wifi,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { normalizeResumeData } from '../lib/resumeStructure'
import ErrorBoundary from '../components/ErrorBoundary'

const tracks = {
  technical: {
    label: 'Technical interview',
    short: 'Technical',
    description: 'Projects, problem solving, architecture and role-specific fundamentals.',
    interviewer: 'Maya AI',
    interviewerRole: 'Technical Interview Coach',
  },
  nonTechnical: {
    label: 'Behavioral interview',
    short: 'Behavioral',
    description: 'Communication, leadership, decision making and culture-fit scenarios.',
    interviewer: 'Aarav AI',
    interviewerRole: 'Behavioral Interview Coach',
  },
}

const fallbackQuestions = {
  technical: [
    'Walk me through a recent project you are proud of. What problem did it solve and what did you personally own?',
    'Tell me about a difficult technical problem you faced. How did you investigate it and what tradeoffs did you make?',
    'How would you improve the reliability and performance of a product as its usage grows?',
    'Describe a time you received critical feedback on your work. What changed afterward?',
    'Why are you interested in this role, and what would you hope to accomplish in your first 90 days?',
  ],
  nonTechnical: [
    'Tell me about yourself and the experiences that best prepared you for this role.',
    'Describe a time you had to align people with different priorities. How did you move the work forward?',
    'Tell me about a decision you made with incomplete information. What was your approach?',
    'Share an example of a setback or failure. What did you learn and apply afterward?',
    'Why do you want this role, and what kind of team environment helps you do your best work?',
  ],
}

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const wordCount = (value = '') => value.trim().split(/\s+/).filter(Boolean).length

export default function MockInterview() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { token, user } = useAuthStore()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const audioRecorderRef = useRef(null)
  const audioStreamRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingQuestionRef = useRef(0)
  const initialTrack = searchParams.get('track') === 'nonTechnical' ? 'nonTechnical' : 'technical'

  const [stage, setStage] = useState('setup')
  const [activeTrack, setActiveTrack] = useState(initialTrack)
  const [resumeData, setResumeData] = useState(null)
  const [targetRole, setTargetRole] = useState('')
  const [prep, setPrep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('off')
  const [cameraMessage, setCameraMessage] = useState('')
  const [micOn, setMicOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [listening, setListening] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [elapsed, setElapsed] = useState(0)
  const [evaluation, setEvaluation] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordings, setRecordings] = useState({})
  const [interviewerSpeaking, setInterviewerSpeaking] = useState(false)

  const track = tracks[activeTrack]
  const questions = useMemo(() => {
    const generated = prep?.questions?.filter(Boolean) || []
    return generated.length ? generated.slice(0, 8) : fallbackQuestions[activeTrack]
  }, [prep, activeTrack])

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((item) => item.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
    setCameraStatus('off')
    setCameraMessage('')
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await axios.get('/api/resume', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        const latest = response.data?.[0]
        if (!latest) {
          setResumeData(null)
          setPrep(null)
          return
        }
        const normalized = normalizeResumeData(latest)
        const role = normalized.experience?.[0]?.position || ''
        setResumeData(normalized)
        setTargetRole(role)
        const prepResponse = await axios.post(
          '/api/resume/interview-prep',
          { resumeData: normalized, targetRole: role, track: activeTrack },
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
        )
        setPrep(prepResponse.data?.prep || null)
      } catch {
        setPrep(null)
        setError('Personalization is unavailable, so a complete standard interview is ready instead.')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      streamRef.current?.getTracks().forEach((item) => item.stop())
      audioRecorderRef.current?.stop?.()
      audioStreamRef.current?.getTracks().forEach((item) => item.stop())
      window.speechSynthesis?.cancel()
      recognitionRef.current?.stop?.()
    }
  }, [token, activeTrack])

  useEffect(() => {
    if (stage !== 'live') return undefined
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (!recording) return undefined
    const timer = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    const attachStream = async () => {
      if (!videoRef.current || !streamRef.current) return
      videoRef.current.srcObject = streamRef.current
      try {
        await videoRef.current.play()
        setCameraStatus('ready')
      } catch {
        setCameraMessage('Camera connected. Tap the preview once if your browser paused video playback.')
      }
    }
    attachStream()
  }, [cameraOn, stage])

  const regenerate = async () => {
    if (!resumeData) return
    setLoading(true)
    setError('')
    try {
      const response = await axios.post(
        '/api/resume/interview-prep',
        { resumeData, targetRole, track: activeTrack },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      setPrep(response.data?.prep || null)
    } catch {
      setError('Could not refresh tailored questions. Your current interview is still ready.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCamera = async () => {
    if (cameraOn) {
      stopCamera()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported')
      setCameraMessage(window.isSecureContext
        ? 'This browser does not support camera access.'
        : 'Camera access requires HTTPS or localhost. Open JobPilot on a secure address.')
      return
    }
    setCameraStatus('requesting')
    setCameraMessage('Waiting for camera permission…')
    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (constraintError) {
        if (constraintError?.name !== 'OverconstrainedError' && constraintError?.name !== 'NotFoundError') throw constraintError
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) throw new Error('No camera track was returned')
      videoTrack.onended = () => {
        streamRef.current = null
        setCameraOn(false)
        setCameraStatus('off')
        setCameraMessage('The camera was stopped by your browser or another application.')
      }
      streamRef.current = stream
      setCameraOn(true)
      setCameraStatus('ready')
      setCameraMessage('')
      setError('')
      window.setTimeout(async () => {
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch {
          setCameraMessage('Camera is connected, but preview autoplay was paused. Tap the video to start it.')
        }
      }, 0)
    } catch (cameraError) {
      setCameraOn(false)
      setCameraStatus('blocked')
      if (cameraError?.name === 'NotAllowedError' || cameraError?.name === 'SecurityError') {
        setCameraMessage('Camera permission is blocked. Allow Camera in your browser’s site settings, then try again.')
      } else if (cameraError?.name === 'NotReadableError') {
        setCameraMessage('Your camera is busy in another app. Close that app and try again.')
      } else if (cameraError?.name === 'NotFoundError') {
        setCameraMessage('No camera was found on this device.')
      } else {
        setCameraMessage('The camera could not start. Check browser permission and try again.')
      }
    }
  }

  const readQuestion = (index = questionIndex) => {
    if (!speakerOn || !window.speechSynthesis) {
      setInterviewerSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(questions[index])
    utterance.rate = 0.96
    utterance.pitch = 1.02
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find((voice) => /^en/i.test(voice.lang) && /female|samantha|zira|aria|google uk english female/i.test(voice.name))
      || voices.find((voice) => /^en/i.test(voice.lang))
    if (preferredVoice) utterance.voice = preferredVoice
    utterance.onstart = () => setInterviewerSpeaking(true)
    utterance.onend = () => setInterviewerSpeaking(false)
    utterance.onerror = () => setInterviewerSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const toggleDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Live transcription is not supported by this browser. You can type your answer instead.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    let committed = answers[questionIndex] || ''
    recognition.onresult = (event) => {
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript
        if (event.results[index].isFinal) committed = `${committed} ${text}`.trim()
        else interim += text
      }
      setAnswers((previous) => ({ ...previous, [questionIndex]: `${committed} ${interim}`.trim() }))
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setError(recording
        ? 'Live transcription stopped, but your audio is still recording safely.'
        : 'Live transcription stopped. You can restart it or type your response.')
    }
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
    setError('')
  }

  const stopRecording = () => {
    if (audioRecorderRef.current?.state === 'recording') {
      setRecording(false)
      audioRecorderRef.current.stop()
    } else {
      audioStreamRef.current?.getTracks().forEach((item) => item.stop())
      audioStreamRef.current = null
      setRecording(false)
    }
  }

  const toggleRecording = async () => {
    if (recording) {
      stopRecording()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Audio recording is not supported by this browser. Live transcription and typed answers are still available.')
      return
    }
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(audioStream)
      const capturedQuestion = questionIndex
      const startedAt = Date.now()
      audioStreamRef.current = audioStream
      audioRecorderRef.current = recorder
      audioChunksRef.current = []
      recordingQuestionRef.current = capturedQuestion
      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordings((previous) => {
          if (previous[capturedQuestion]?.url) URL.revokeObjectURL(previous[capturedQuestion].url)
          return {
            ...previous,
            [capturedQuestion]: {
              url,
              duration: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
              question: questions[capturedQuestion],
            },
          }
        })
        audioStream.getTracks().forEach((item) => item.stop())
        audioStreamRef.current = null
        audioRecorderRef.current = null
        audioChunksRef.current = []
        setRecording(false)
      }
      recorder.start(500)
      setMicOn(true)
      setRecordingSeconds(0)
      setRecording(true)
      setError('')
    } catch {
      setError('Microphone access was not granted. Allow microphone permission to record your answer.')
      setRecording(false)
    }
  }

  const begin = () => {
    setStage('live')
    setElapsed(0)
    setQuestionIndex(0)
    window.setTimeout(() => readQuestion(0), 350)
  }

  const move = (direction) => {
    if (recording) stopRecording()
    recognitionRef.current?.stop?.()
    setListening(false)
    const next = Math.max(0, Math.min(questions.length - 1, questionIndex + direction))
    setQuestionIndex(next)
    window.setTimeout(() => readQuestion(next), 200)
  }

  const finish = async () => {
    if (recording) stopRecording()
    recognitionRef.current?.stop?.()
    window.speechSynthesis?.cancel()
    stopCamera()
    setStage('report')
    setEvaluating(true)
    setError('')
    try {
      const orderedAnswers = questions.map((_, index) => answers[index] || '')
      const response = await axios.post(
        '/api/resume/interview-evaluate',
        {
          resumeData: resumeData || {},
          targetRole,
          track: activeTrack,
          questions,
          answers: orderedAnswers,
          durationSeconds: elapsed,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )
      setEvaluation(response.data?.evaluation || null)
    } catch {
      setError('Detailed evaluation could not be generated. Your responses are still available below.')
    } finally {
      setEvaluating(false)
    }
  }

  const restart = () => {
    setAnswers({})
    setQuestionIndex(0)
    setElapsed(0)
    setEvaluation(null)
    setError('')
    Object.values(recordings).forEach((item) => item?.url && URL.revokeObjectURL(item.url))
    setRecordings({})
    setRecording(false)
    setRecordingSeconds(0)
    setStage('setup')
  }

  return (
    <ErrorBoundary>
      <div className="mx-auto w-full max-w-[1500px]">
        {stage === 'setup' && (
          <Setup
            activeTrack={activeTrack} cameraMessage={cameraMessage} cameraOn={cameraOn}
            cameraStatus={cameraStatus} error={error} loading={loading}
            micOn={micOn} prep={prep} questions={questions} resumeData={resumeData} speakerOn={speakerOn}
            targetRole={targetRole} videoRef={videoRef}
            onBack={() => navigate('/interview-prep')} onBegin={begin} onCamera={toggleCamera}
            onMic={() => setMicOn((value) => !value)} onRegenerate={regenerate}
            onRole={setTargetRole} onSpeaker={() => setSpeakerOn((value) => !value)}
            onTrack={(value) => {
              setActiveTrack(value)
              navigate(`/mock-interview?track=${value}`, { replace: true })
            }}
          />
        )}
        {stage === 'live' && (
          <Live
            answer={answers[questionIndex] || ''} answers={answers} cameraMessage={cameraMessage}
            cameraOn={cameraOn} cameraStatus={cameraStatus}
            candidateName={user?.name?.split(' ')[0] || 'Candidate'} elapsed={elapsed}
            error={error} listening={listening} micOn={micOn} questionIndex={questionIndex}
            questions={questions} recording={recording} recordingSeconds={recordingSeconds}
            savedRecording={recordings[questionIndex]} speakerOn={speakerOn} targetRole={targetRole} track={track}
            interviewerSpeaking={interviewerSpeaking}
            videoRef={videoRef}
            onAnswer={(value) => setAnswers((previous) => ({ ...previous, [questionIndex]: value }))}
            onCamera={toggleCamera} onDictation={toggleDictation} onFinish={finish}
            onMic={() => {
              if (recording) stopRecording()
              setMicOn((value) => !value)
            }} onMove={move} onRead={() => readQuestion()}
            onRecording={toggleRecording}
            onSpeaker={() => {
              if (speakerOn) window.speechSynthesis?.cancel()
              setInterviewerSpeaking(false)
              setSpeakerOn((value) => !value)
            }}
          />
        )}
        {stage === 'report' && (
          <Report answers={answers} elapsed={elapsed} error={error} evaluation={evaluation}
            evaluating={evaluating} prep={prep} questions={questions}
            targetRole={targetRole} track={track} onBack={() => navigate('/interview-prep')} onRestart={restart} />
        )}
      </div>
    </ErrorBoundary>
  )
}

function Setup({ activeTrack, cameraMessage, cameraOn, cameraStatus, error, loading, micOn, prep, questions, resumeData, speakerOn, targetRole, videoRef, onBack, onBegin, onCamera, onMic, onRegenerate, onRole, onSpeaker, onTrack }) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-white">
        <ArrowLeft size={16} /> Interview preparation
      </button>
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1118] shadow-[0_30px_90px_rgba(0,0,0,.32)]">
        <header className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-primary">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Interview lobby
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Let’s get you interview-ready.</h1>
              <p className="mt-2 text-sm text-secondary">Check your setup, choose a round, and enter when you’re comfortable.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs text-secondary">
              <ShieldCheck size={15} className="text-emerald-400" /> Private practice session
            </div>
          </div>
        </header>
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_420px]">
          <div className="p-5 sm:p-8">
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-[#151a21]">
              {cameraOn ? <video ref={videoRef} autoPlay muted playsInline onClick={(event) => event.currentTarget.play()} className="h-full w-full scale-x-[-1] object-cover" /> : (
                <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,rgba(182,79,82,.15),transparent_55%)]">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full border bg-white/[.05] ${cameraStatus === 'blocked' || cameraStatus === 'unsupported' ? 'border-red-400/30 text-red-300' : 'border-white/10 text-secondary'}`}>
                    {cameraStatus === 'requesting' ? <Loader2 size={32} className="animate-spin" /> : <UserRound size={34} />}
                  </div>
                  <div className="mt-4 text-sm font-medium text-white">
                    {cameraStatus === 'requesting' ? 'Starting your camera…' : cameraStatus === 'blocked' ? 'Camera needs attention' : 'Camera is off'}
                  </div>
                  <div className="mt-1 max-w-md px-5 text-center text-xs leading-5 text-secondary">
                    {cameraMessage || 'Enable it to check your framing before joining'}
                  </div>
                  <button
                    type="button"
                    onClick={onCamera}
                    disabled={cameraStatus === 'requesting'}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0a0e13] shadow-lg transition hover:bg-slate-200"
                  >
                    {cameraStatus === 'requesting' ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    {cameraStatus === 'blocked' ? 'Try camera again' : 'Enable camera'}
                  </button>
                </div>
              )}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">You</div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Control active={micOn} icon={micOn ? Mic : MicOff} label="Microphone" onClick={onMic} />
                <Control active={cameraOn} icon={cameraOn ? Camera : CameraOff} label="Camera" onClick={onCamera} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Device icon={micOn ? Mic : MicOff} label="Microphone" value={micOn ? 'Ready' : 'Muted'} ready={micOn} />
              <Device icon={cameraOn ? Camera : CameraOff} label="Camera" value={cameraStatus === 'requesting' ? 'Connecting' : cameraOn ? 'Ready' : cameraStatus === 'blocked' ? 'Permission blocked' : 'Optional'} ready={cameraOn} />
              <Device icon={Wifi} label="Connection" value="Stable" ready />
            </div>
          </div>
          <aside className="border-t border-white/10 bg-[#101722] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Session details</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Configure your mock round</h2>
            <label className="mb-2 mt-5 block text-xs font-medium text-secondary">Target role</label>
            <Input value={targetRole} onChange={(event) => onRole(event.target.value)} placeholder="e.g. Frontend Developer" className="w-full" />
            <div className="mt-5">
              <div className="mb-2 text-xs font-medium text-secondary">Interview type</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(tracks).map(([key, item]) => (
                  <button key={key} onClick={() => onTrack(key)} className={`rounded-xl border px-3 py-3 text-left transition ${activeTrack === key ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-black/10 text-secondary'}`}>
                    <div className="text-sm font-semibold">{item.short}</div>
                    <div className="mt-1 text-[11px] opacity-70">{key === 'technical' ? 'Skills & projects' : 'Stories & fit'}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-xs">
              <Detail icon={Clock3} label="Estimated time" value="20–30 min" />
              <Detail icon={MessageSquareText} label="Questions" value={`${questions.length} questions`} />
              <Detail
                icon={BriefcaseBusiness}
                label="Question source"
                value={resumeData ? prep?.questionSource === 'ai-resume' ? 'AI + ATS resume' : 'ATS resume' : 'Standard'}
              />
            </div>
            {resumeData && (
              <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/[.06] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-accent">
                  <Sparkles size={14} />
                  Latest ATS resume connected
                </div>
                <p className="mt-2 text-xs leading-5 text-secondary">
                  Your projects, skills, experience and target role are being used to prepare this question set.
                </p>
              </div>
            )}
            <button onClick={onSpeaker} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-secondary">
              <span className="flex items-center gap-2">{speakerOn ? <Volume2 size={16} /> : <VolumeX size={16} />} Read questions aloud</span>
              <span className={`relative h-5 w-9 rounded-full ${speakerOn ? 'bg-primary' : 'bg-white/15'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${speakerOn ? 'left-[18px]' : 'left-0.5'}`} /></span>
            </button>
            <Button size="lg" className="mt-5 w-full" onClick={onBegin} disabled={loading}>
              {loading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Play size={18} className="mr-2 fill-current" />}
              {loading ? 'Preparing interview' : 'Join interview'}
            </Button>
            <button onClick={onRegenerate} disabled={loading || !resumeData} className="mt-3 flex w-full items-center justify-center gap-2 text-xs text-secondary disabled:opacity-40">
              <RefreshCcw size={13} /> Refresh tailored questions
            </button>
          </aside>
        </div>
      </section>
      {error && <Notice message={error} />}
      <div className="grid gap-4 md:grid-cols-3">
        <Info icon={Headphones} title="Find a quiet space" text="Use headphones and silence notifications so you can stay focused." />
        <Info icon={Target} title="Answer with structure" text="Use Situation, Task, Action and Result when sharing an example." />
        <Info icon={Sparkles} title="Treat it like the real thing" text="Speak naturally, be specific, and pause before answering." />
      </div>
    </div>
  )
}

function Live({ answer, answers, cameraMessage, cameraOn, cameraStatus, candidateName, elapsed, error, interviewerSpeaking, listening, micOn, questionIndex, questions, recording, recordingSeconds, savedRecording, speakerOn, targetRole, track, videoRef, onAnswer, onCamera, onDictation, onFinish, onMic, onMove, onRead, onRecording, onSpeaker }) {
  const answered = Object.values(answers).filter((value) => wordCount(value) > 4).length
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d12] shadow-[0_30px_100px_rgba(0,0,0,.4)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#0d1218] px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">JP</div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-white">{track.label}</div>
              <span className="rounded-full border border-accent/20 bg-accent/[.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.1em] text-accent">Resume-powered AI</span>
            </div>
            <div className="text-xs text-secondary">{targetRole || 'General professional'} · Practice room</div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-secondary"><span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />LIVE</div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 font-mono text-xs text-white"><Clock3 size={14} />{formatTime(elapsed)}</div>
        </div>
      </header>
      <div className="interview-live-layout min-h-[700px]">
        <main className="flex min-w-0 flex-col p-4 sm:p-6">
          <div className="grid flex-1 gap-4 md:grid-cols-2">
            <div className="relative min-h-[270px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_28%,rgba(73,215,202,.16),transparent_36%),linear-gradient(145deg,#16202b,#0d1218)]">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                  {interviewerSpeaking && <span className="absolute -inset-5 animate-ping rounded-full border border-accent/30" />}
                  <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 bg-[#182630] text-white shadow-[0_20px_70px_rgba(73,215,202,.12)] transition ${interviewerSpeaking ? 'border-accent' : 'border-[#2a3b49]'}`}>
                    <Bot size={46} className={interviewerSpeaking ? 'text-accent' : 'text-white'} />
                    <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-[#182630] bg-emerald-400" />
                  </div>
                </div>
                <div className="mt-5 text-base font-semibold text-white">{track.interviewer}</div>
                <div className="mt-1 text-xs text-secondary">{track.interviewerRole}</div>
                <div className={`mt-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${interviewerSpeaking ? 'border-accent/30 bg-accent/10 text-accent' : recording || listening ? 'border-emerald-400/20 bg-emerald-400/[.06] text-emerald-300' : 'border-white/10 bg-black/20 text-secondary'}`}>
                  {interviewerSpeaking ? (
                    <>
                      <span className="flex h-3 items-end gap-0.5">
                        <span className="h-1 w-0.5 animate-pulse bg-accent" />
                        <span className="h-3 w-0.5 animate-pulse bg-accent [animation-delay:120ms]" />
                        <span className="h-2 w-0.5 animate-pulse bg-accent [animation-delay:240ms]" />
                      </span>
                      Asking Question {questionIndex + 1}
                    </>
                  ) : recording || listening ? <><Mic size={13} />Listening to your answer</> : <>Ready for your response</>}
                </div>
              </div>
              {speakerOn && <button onClick={onRead} className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"><Volume2 size={16} /></button>}
            </div>
            <div className="relative min-h-[270px] overflow-hidden rounded-3xl border border-white/10 bg-[#151a21]">
              {cameraOn ? <video ref={videoRef} autoPlay muted playsInline onClick={(event) => event.currentTarget.play()} className="h-full w-full scale-x-[-1] object-cover" /> : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  {cameraStatus === 'requesting'
                    ? <Loader2 size={32} className="animate-spin text-primary" />
                    : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-2xl font-semibold text-primary">{candidateName[0]?.toUpperCase()}</div>}
                  <div className="mt-4 text-xs text-secondary">{cameraMessage || 'Your camera is off'}</div>
                  <button
                    type="button"
                    onClick={onCamera}
                    disabled={cameraStatus === 'requesting'}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0a0e13] hover:bg-slate-200"
                  >
                    <Camera size={14} />
                    {cameraStatus === 'blocked' ? 'Try again' : 'Turn camera on'}
                  </button>
                </div>
              )}
              <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">You</div>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-[#111720] p-5 sm:p-6">
            <div className="mb-3 flex justify-between gap-3"><span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[.14em] text-primary">Question {questionIndex + 1} of {questions.length}</span><span className="text-xs text-secondary">{questionIndex === 0 ? 'Opening' : questionIndex === questions.length - 1 ? 'Closing' : 'Core interview'}</span></div>
            <h1 className="text-xl font-semibold leading-8 text-white sm:text-2xl">{questions[questionIndex]}</h1>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Control large active={micOn} icon={micOn ? Mic : MicOff} label="Microphone" onClick={onMic} />
              <Control large active={cameraOn} icon={cameraOn ? Camera : CameraOff} label="Camera" onClick={onCamera} />
              <Control large active={speakerOn} icon={speakerOn ? Volume2 : VolumeX} label="Speaker" onClick={onSpeaker} />
            </div>
            <button onClick={onFinish} className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white"><PhoneOff size={17} />End interview</button>
          </div>
        </main>
        <aside className="interview-response-panel border-t border-white/10 bg-[#0f141b]">
          <div className="border-b border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><div className="text-sm font-semibold text-white">Your response</div><div className="mt-1 text-xs text-secondary">Speak naturally or type private notes</div></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={onDictation} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${listening ? 'bg-accent/15 text-accent' : 'border border-white/10 bg-[#111820] text-white'}`}>
                  {listening ? <><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />Transcribing</> : <><MessageSquareText size={14} />Transcribe</>}
                </button>
                <button onClick={onRecording} className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white transition ${recording ? 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,.12)]' : 'border border-red-400/30 bg-red-500/10 hover:bg-red-500/20'}`}>
                  {recording ? <><span className="h-2 w-2 animate-pulse rounded-full bg-white" />Stop · {formatTime(recordingSeconds)}</> : <><Mic size={14} />Record answer</>}
                </button>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-start gap-3 rounded-2xl border border-accent/15 bg-accent/[.04] p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><Bot size={16} /></div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-accent">{track.interviewer} asked</div>
                <p className="mt-1 text-xs leading-5 text-white">{questions[questionIndex]}</p>
              </div>
            </div>
            {recording && (
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">Recording answer for Question {questionIndex + 1}</div>
                    <div className="mt-0.5 text-xs text-red-100/70">Your microphone audio is being captured locally</div>
                  </div>
                </div>
                <span className="font-mono text-sm font-semibold text-white">{formatTime(recordingSeconds)}</span>
              </div>
            )}
            {!recording && savedRecording && (
              <div className="mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-semibold text-emerald-300"><CheckCircle2 size={15} />Voice answer saved for Question {questionIndex + 1}</span>
                  <span className="text-secondary">{formatTime(savedRecording.duration)}</span>
                </div>
                <audio controls preload="metadata" src={savedRecording.url} className="h-9 w-full" />
              </div>
            )}
            {error && <Notice compact message={error} />}
            <textarea
              value={answer}
              onChange={(event) => onAnswer(event.target.value)}
              placeholder="Your transcript will appear here, or type your response..."
              className="interview-response-textarea mt-3 min-h-[190px] w-full resize-none rounded-2xl border border-white/10 p-4 text-sm leading-6 outline-none focus:border-primary/60"
              style={{ backgroundColor: '#0a0e13', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
            />
            <div className="mt-2 flex justify-between text-[11px] text-secondary"><span>{wordCount(answer)} words</span><span>Saved automatically</span></div>
            <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-amber-200"><Lightbulb size={15} />Answer coach</div>
              <p className="mt-2 text-xs leading-5 text-secondary">Give context, explain what you personally did, and close with a measurable result or clear learning.</p>
            </div>
            <div className="mt-5">
              <div className="mb-3 flex justify-between text-xs text-secondary"><span>Interview progress</span><span>{answered}/{questions.length} answered</span></div>
              <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
            </div>
          </div>
          <div className="border-t border-white/10 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => onMove(-1)} disabled={questionIndex === 0}>Previous</Button>
              {questionIndex < questions.length - 1 ? <Button onClick={() => onMove(1)}>Next<ChevronRight size={16} className="ml-1" /></Button> : <Button onClick={onFinish}>Finish</Button>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Report({ answers, elapsed, error, evaluation, evaluating, prep, questions, targetRole, track, onBack, onRestart }) {
  const completed = Object.values(answers).filter((item) => wordCount(item) > 4).length
  const totalWords = Object.values(answers).reduce((total, item) => total + wordCount(item), 0)
  const completion = Math.round((completed / questions.length) * 100)
  const depth = Math.min(100, Math.round((totalWords / Math.max(questions.length * 55, 1)) * 100))
  const overall = evaluation?.overallScore ?? Math.round(completion * .6 + depth * .4)
  const responseFeedback = evaluation?.responseFeedback || []
  return (
    <div className="space-y-6">
      {evaluating && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[.07] px-5 py-4 text-sm text-white">
          <Loader2 size={18} className="animate-spin text-primary" />
          Your interview coach is reviewing every response…
        </div>
      )}
      {error && <Notice message={error} />}
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1118]">
        <div className="bg-[radial-gradient(circle_at_top,rgba(73,215,202,.14),transparent_45%)] px-6 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"><CheckCircle2 size={30} /></div>
          <div className="mt-5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Interview complete</div>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Nice work showing up and practicing.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-secondary">
            {evaluation?.summary || 'This private readiness snapshot measures response completion and depth. Use it as coaching guidance, not a hiring prediction.'}
          </p>
        </div>
        <div className="grid border-t border-white/10 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
            <div className="flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#49d7ca ${overall * 3.6}deg, rgba(255,255,255,.08) 0deg)` }}>
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-[#0c1118]"><div className="text-4xl font-semibold text-white">{overall}</div><div className="mt-1 text-xs uppercase tracking-[.14em] text-secondary">Readiness</div></div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white"><Star size={16} className="fill-amber-300 text-amber-300" />{overall >= 75 ? 'Strong practice round' : overall >= 45 ? 'Good foundation' : 'Keep building'}</div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Session summary</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">{track.label} · {targetRole || 'General professional'}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Duration" value={formatTime(elapsed)} icon={Clock3} />
              <Metric label="Completed" value={`${completed}/${questions.length}`} icon={CheckCircle2} />
              <Metric label="Total words" value={totalWords} icon={MessageSquareText} />
              <Metric
                label={evaluation?.speechMetrics?.estimatedWordsPerMinute ? 'Speaking pace' : 'Avg. response'}
                value={evaluation?.speechMetrics?.estimatedWordsPerMinute ? `${evaluation.speechMetrics.estimatedWordsPerMinute} wpm` : `${completed ? Math.round(totalWords / completed) : 0} words`}
                icon={Target}
              />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Score label="Response completion" value={completion} />
              <Score label={evaluation ? 'AI answer quality' : 'Answer depth'} value={evaluation ? overall : depth} />
            </div>
            {evaluation?.speechMetrics && (
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-secondary">
                <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5">
                  {evaluation.speechMetrics.fillerWords} filler words
                </span>
                <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5">
                  {evaluation.speechMetrics.fillerRate}% filler rate
                </span>
                <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5">
                  {evaluation.source === 'ai' ? 'AI-reviewed' : 'Locally reviewed'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[2rem] border border-white/10 bg-[#0f141b] p-6">
          <div className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Response review</div>
          <h2 className="mb-5 mt-2 text-xl font-semibold text-white">Your interview answers</h2>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <details key={question} className="group rounded-2xl border border-white/10 bg-black/10 p-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-medium leading-6 text-white">
                  <span><span className="mr-2 text-primary">Q{index + 1}</span>{question}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {responseFeedback[index] && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{responseFeedback[index].score}/100</span>}
                    <ChevronRight size={17} className="mt-1 transition group-open:rotate-90" />
                  </span>
                </summary>
                <div className="mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-secondary">
                  <div>{answers[index]?.trim() || 'No response captured for this question.'}</div>
                  {responseFeedback[index] && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <FeedbackBox title="What worked" items={responseFeedback[index].strengths} tone="good" />
                      <FeedbackBox title="Improve next time" items={responseFeedback[index].improvements} />
                      {responseFeedback[index].improvedApproach && (
                        <div className="rounded-xl border border-accent/20 bg-accent/[.05] p-3 sm:col-span-2">
                          <div className="text-xs font-semibold uppercase tracking-[.12em] text-accent">Stronger approach</div>
                          <p className="mt-2 text-xs leading-5 text-secondary">{responseFeedback[index].improvedApproach}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-white/10 bg-[#0f141b] p-6">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Sparkles size={18} /></div><h2 className="text-lg font-semibold text-white">Next-round coaching</h2></div>
            <div className="mt-5 space-y-3">
              {(evaluation?.priorities || prep?.talkingPoints?.slice(0, 3) || ['Open with a direct answer before adding context.', 'Use specific numbers to make your impact memorable.', 'End each example with the result and what you learned.']).map((item) => <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-xs leading-5 text-secondary"><CheckCircle2 size={16} className="shrink-0 text-emerald-400" />{item}</div>)}
            </div>
            {evaluation?.followUpQuestion && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[.06] p-4">
                <div className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Practice this follow-up</div>
                <p className="mt-2 text-xs leading-5 text-white">{evaluation.followUpQuestion}</p>
              </div>
            )}
          </section>
          <section className="rounded-[2rem] border border-white/10 bg-[#0f141b] p-6">
            <h2 className="text-lg font-semibold text-white">What would you like to do?</h2>
            <Button className="mt-5 w-full" onClick={onRestart}><RotateCcw size={16} className="mr-2" />Practice again</Button>
            <Button variant="outline" className="mt-3 w-full" onClick={onBack}>Back to interview prep<ArrowRight size={16} className="ml-2" /></Button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Control({ active, icon: Icon, label, onClick, large }) {
  return <button onClick={onClick} aria-label={label} title={label} className={`flex items-center justify-center rounded-full border ${large ? 'h-11 w-11' : 'h-9 w-9'} ${active ? 'border-white/10 bg-black/55 text-white' : 'border-red-400/30 bg-red-500 text-white'}`}><Icon size={large ? 18 : 16} /></button>
}
function Device({ icon: Icon, label, value, ready }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${ready ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-secondary'}`}><Icon size={16} /></div><div><div className="text-xs font-medium text-white">{label}</div><div className="mt-0.5 text-[11px] text-secondary">{value}</div></div></div>
}
function Detail({ icon: Icon, label, value }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-secondary"><Icon size={14} />{label}</span><span className="font-medium text-white">{value}</span></div>
}
function Info({ icon: Icon, title, text }) {
  return <div className="rounded-2xl border border-white/10 bg-[#0f141b] p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></div><div className="mt-4 text-sm font-semibold text-white">{title}</div><p className="mt-2 text-xs leading-5 text-secondary">{text}</p></div>
}
function Notice({ message, compact }) {
  return <div className={`rounded-xl border border-amber-300/20 bg-amber-300/[.06] text-amber-100 ${compact ? 'p-3 text-xs leading-5' : 'px-4 py-3 text-sm'}`}>{message}</div>
}
function Metric({ label, value, icon: Icon }) {
  return <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><Icon size={16} className="text-primary" /><div className="mt-3 text-xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-secondary">{label}</div></div>
}
function Score({ label, value }) {
  return <div><div className="mb-2 flex justify-between text-xs"><span className="text-secondary">{label}</span><span className="font-semibold text-white">{value}%</span></div><div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${value}%` }} /></div></div>
}
function FeedbackBox({ title, items = [], tone = 'improve' }) {
  if (!items?.length) return null
  return (
    <div className={`rounded-xl border p-3 ${tone === 'good' ? 'border-emerald-400/20 bg-emerald-400/[.05]' : 'border-amber-300/20 bg-amber-300/[.05]'}`}>
      <div className={`text-xs font-semibold uppercase tracking-[.12em] ${tone === 'good' ? 'text-emerald-300' : 'text-amber-200'}`}>{title}</div>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => <p key={item} className="text-xs leading-5 text-secondary">• {item}</p>)}
      </div>
    </div>
  )
}
