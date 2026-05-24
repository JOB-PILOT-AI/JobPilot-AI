import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import ResumeForm from '../components/resume/ResumeForm'
import ResumePreview from '../components/resume/ResumePreview'
import { useAuthStore } from '../store/authStore'
import { clearPersistedResumeData, useResumeBuilderStore } from '../store/resumeBuilderStore'
import { normalizeResumeData, toLegacyResumePayload } from '../lib/resumeStructure'

export default function ResumeBuilder() {
  const { token } = useAuthStore()
  const {
    resumeId,
    fileName,
    resumeData,
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

  const isSaveDisabled = !resumeId || isSaving || !isDirty

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-foreground">Resume Builder</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Build a structured ATS-ready resume, auto-fill it from uploads, and keep the live preview in sync while editing.
        </p>
      </div>

      {saveMessage && (
        <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted">
          {saveMessage}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] items-start">
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
          canSave={!isSaveDisabled}
        />

        <ResumePreview resumeData={normalizeResumeData(resumeData)} />
      </div>
    </div>
  )
}
