import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { CheckCircle2, ShieldCheck, Sparkles, Target } from 'lucide-react'
import ResumeForm from '../components/resume/ResumeForm'
import ResumePreview from '../components/resume/ResumePreview'
import { useAuthStore } from '../store/authStore'
import { clearPersistedResumeData, useResumeBuilderStore } from '../store/resumeBuilderStore'
import { normalizeResumeData, toLegacyResumePayload } from '../lib/resumeStructure'
import ErrorBoundary from '../components/ErrorBoundary'

export default function ResumeBuilder() {
  const { token, user } = useAuthStore()
  const {
    resumeId,
    fileName,
    resumeData,
    atsAnalytics,
    hydrateResume,
    resetResumeData,
    updatePersonalInfoField,
    addSkill,
    removeSkill,
    updateSkill,
    addSectionItem,
    updateSectionItem,
    removeSectionItem,
    isDirty,
  } = useResumeBuilderStore()
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [formResetKey, setFormResetKey] = useState(0)
  const hydrationVersionRef = useRef(0)

  useEffect(() => {
    const loadLatestResume = async () => {
      if (!token) return

      const requestVersion = hydrationVersionRef.current

      try {
        const response = await axios.get('/api/resume', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (requestVersion !== hydrationVersionRef.current) {
          return
        }

        const latestResume = response.data?.[0]
        if (latestResume) {
          hydrateResume(latestResume)
        } else {
          resetResumeData()
        }
      } catch {
        resetResumeData()
      }
    }

    loadLatestResume()
  }, [token, hydrateResume, resetResumeData])

  const handleClearResume = async () => {
    hydrationVersionRef.current += 1
    setIsSaving(false)
    setIsUploading(false)
    setUploadError('')
    setUploadSuccess('')
    setSaveMessage('')

    try {
      await axios.delete('/api/resume', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Failed to clear resume data.')
    } finally {
      clearPersistedResumeData()
      resetResumeData()
      setFormResetKey((currentKey) => currentKey + 1)
    }
  }

  const handleUploadFile = async (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    const fileNameValue = file.name.toLowerCase()
    const isAllowedFile =
      allowedTypes.includes(file.type) || fileNameValue.endsWith('.pdf') || fileNameValue.endsWith('.docx')

    if (!isAllowedFile) {
      setUploadError('Please upload a PDF or DOCX resume.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Resume must be 10MB or smaller.')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')
    setSaveMessage('')

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await axios.post('/api/resume/upload', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const nextResume = response.data?.resume || response.data?.resumeData || response.data?.parsedResume
      if (nextResume) {
        hydrateResume(nextResume)
        // refresh auth user so synced skills/projects appear in profile UI
        try {
          const { refreshUser } = useAuthStore.getState()
          if (typeof refreshUser === 'function') await refreshUser()
        } catch (e) {
          // ignore refresh errors
        }
      }

      setUploadSuccess('Resume uploaded and structured successfully.')
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Resume upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!resumeId) {
      setSaveMessage('Upload a resume first to save changes.')
      return
    }

    setIsSaving(true)
    setSaveMessage('')
    setUploadError('')

    try {
      const normalizedResume = normalizeResumeData(resumeData)
      const payload = {
        resumeData: normalizedResume,
        ...toLegacyResumePayload(normalizedResume),
      }

      const response = await axios.put(`/api/resume/${resumeId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      hydrateResume(response.data)
      setSaveMessage('Resume saved successfully.')
    } catch (error) {
      setSaveMessage(error.response?.data?.message || 'Failed to save resume.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateResume = async () => {
    setIsSaving(true)
    setSaveMessage('')
    setUploadError('')

    try {
      const normalizedResume = normalizeResumeData(resumeData)
      const payload = { resumeData: normalizedResume }

      const response = await axios.post('/api/resume', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const created = response.data?.resume || response.data?.resumeData
      if (created) {
        hydrateResume(created)
        try {
          const { refreshUser } = useAuthStore.getState()
          if (typeof refreshUser === 'function') await refreshUser()
        } catch (e) {}
      }

      setSaveMessage('Resume created successfully.')
    } catch (error) {
      setSaveMessage(error.response?.data?.message || 'Failed to create resume.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true)
    setSaveMessage('')
    setUploadError('')

    try {
      const normalizedResume = normalizeResumeData(resumeData)
      const response = await axios.post(
        '/api/resume/summary',
        { resumeData: normalizedResume },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      )

      if (response.data?.summary) {
        updatePersonalInfoField('summary', response.data.summary)
        setSaveMessage('AI assistant wrote a resume summary from your profile details.')
      }
    } catch (error) {
      setSaveMessage(error.response?.data?.message || 'Failed to generate summary.')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleDownloadPdf = () => {
    const preview = document.getElementById('resume-print-preview')
    if (!preview) {
      setSaveMessage('Resume preview is not ready yet.')
      return
    }

    window.print()
  }

  const filledProfileFields = [
    resumeData.personalInfo.fullName,
    resumeData.personalInfo.email,
    resumeData.personalInfo.phone,
    resumeData.personalInfo.location,
    resumeData.personalInfo.summary,
  ].filter(Boolean).length
  const completedSections = [
    resumeData.skills.length > 0,
    resumeData.education.length > 0,
    resumeData.experience.length > 0,
    resumeData.projects.length > 0,
    resumeData.certifications.length > 0,
  ].filter(Boolean).length
  const resumeCompletion = Math.min(100, Math.round(((filledProfileFields + completedSections) / 10) * 100))
  const isSaveDisabled = !resumeId || isSaving || !isDirty

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="grid gap-6 rounded-2xl border border-white/10 bg-[#0b1118]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] lg:grid-cols-[minmax(0,1fr)_360px] lg:p-6">
          <div className="min-w-0 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles size={16} /> Resume designer
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Resume Builder</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-secondary">
                Build an ATS-friendly resume with structured sections, quick upload parsing, and a live printable preview.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Completion</p>
                <p className="mt-3 text-3xl font-semibold text-white">{resumeCompletion}%</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${resumeCompletion}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Sections</p>
                <p className="mt-3 text-3xl font-semibold text-white">{completedSections}/5</p>
                <p className="mt-2 text-sm text-secondary">Skills, education, work, projects, certificates.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#111417] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Profile</p>
                <p className="mt-3 text-3xl font-semibold text-white">{filledProfileFields}/5</p>
                <p className="mt-2 text-sm text-secondary">Contact details and professional summary.</p>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#111417] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Resume snapshot</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">{resumeCompletion > 85 ? 'Ready to polish' : 'Keep building'}</h2>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Add measurable accomplishments, role context, and targeted keywords to improve recruiter readability.
            </p>
            {!resumeId && (
              <button
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
                onClick={handleCreateResume}
                disabled={isSaving}
              >
                {isSaving ? 'Creating...' : 'Create Resume From Scratch'}
              </button>
            )}
          </aside>
        </div>

        {saveMessage && (
          <div className="rounded-2xl border border-white/10 bg-[#0f131c] px-5 py-4 text-sm text-slate-300 shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
            {saveMessage}
          </div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0f131c] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Editor</div>
              <p className="mt-1 text-sm text-secondary">Fill each section in order. Your preview updates instantly.</p>
            </div>
            <div className="p-5 lg:p-6">
              <ResumeForm
                key={formResetKey}
                resumeData={normalizeResumeData(resumeData)}
                fileName={fileName}
                isUploading={isUploading}
                isSaving={isSaving}
                uploadError={uploadError}
                uploadSuccess={uploadSuccess}
                onUploadFile={handleUploadFile}
                onSave={handleSave}
                onPersonalInfoChange={updatePersonalInfoField}
                onSkillAdd={addSkill}
                onSkillRemove={removeSkill}
                onSkillChange={updateSkill}
                onSectionAdd={addSectionItem}
                onSectionRemove={removeSectionItem}
                onSectionChange={updateSectionItem}
                onClearResume={handleClearResume}
                onGenerateSummary={handleGenerateSummary}
                onDownloadPdf={handleDownloadPdf}
                canSave={!isSaveDisabled}
                isGeneratingSummary={isGeneratingSummary}
              />
            </div>
          </div>

          <div className="min-w-0 xl:sticky xl:top-24">
            <div className="rounded-2xl border border-white/10 bg-[#0f131c] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] lg:p-6">
              <ResumePreview resumeData={normalizeResumeData(resumeData)} atsAnalytics={atsAnalytics} />
              {user?.isPro && atsAnalytics && (
                <div className="mt-6 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><ShieldCheck size={19} /></div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pro ATS intelligence</div>
                      <h3 className="mt-1 text-lg font-semibold text-white">Rule-level diagnostics</h3>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {Object.entries(atsAnalytics.categoryScores || {}).map(([category, value]) => (
                      <div key={category} className="rounded-xl border border-white/10 bg-black/10 p-3">
                        <div className="flex items-center justify-between text-xs"><span className="text-secondary">{category}</span><span className="font-semibold text-white">{value.score}%</span></div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${value.score}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {(atsAnalytics.failedRules || []).slice(0, 5).map((rule) => (
                      <div key={rule.id} className="flex gap-3 rounded-xl border border-white/10 bg-[#11161d] p-3 text-xs leading-5 text-secondary">
                        <Target size={15} className="mt-0.5 shrink-0 text-amber-300" />
                        <div><span className="font-semibold text-white">{rule.title}:</span> {rule.recommendation}</div>
                      </div>
                    ))}
                    {(atsAnalytics.failedRules || []).length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />All tracked ATS rules passed.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
