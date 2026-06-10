import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import ResumeForm from '../components/resume/ResumeForm'
import ResumePreview from '../components/resume/ResumePreview'
import { useAuthStore } from '../store/authStore'
import { clearPersistedResumeData, useResumeBuilderStore } from '../store/resumeBuilderStore'
import { normalizeResumeData, toLegacyResumePayload } from '../lib/resumeStructure'
import Button from '../components/ui/Button'
import { ArrowRight, Download, Code } from 'lucide-react'

export default function ResumeBuilder() {
  const { token } = useAuthStore()
  const navigate = useNavigate()
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
  const [isGenerating, setIsGenerating] = useState(false)
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

  // Auto-save debounce effect
  useEffect(() => {
    if (!isDirty || isUploading || isGenerating || isSaving) return

    const timeoutId = setTimeout(() => {
      handleSave()
    }, 2000) // 2-second debounce

    return () => clearTimeout(timeoutId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, isDirty])

  const handleSave = async () => {
    setIsSaving(true)
    setUploadError('')

    try {
      const normalizedResume = normalizeResumeData(resumeData)
      const payload = {
        resumeData: normalizedResume,
        ...toLegacyResumePayload(normalizedResume),
      }

      let response;
      if (resumeId) {
        response = await axios.put(`/api/resume/${resumeId}`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
      } else {
        response = await axios.post(`/api/resume`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
      }

      hydrateResume(response.data)
      setSaveMessage('Saved')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      setSaveMessage('Failed to auto-save.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(normalizeResumeData(resumeData), null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", (fileName || "resume") + ".json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    setSaveMessage('')
    
    try {
      const response = await axios.post('/api/resume/generate-summary', normalizeResumeData(resumeData), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      updatePersonalInfoField('summary', response.data.summary)
    } catch (error) {
      setSaveMessage('Failed to generate summary. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const isSaveDisabled = isSaving || !isDirty

  return (
    <div className="max-w-7xl mx-auto space-y-8 print:m-0 print:w-full print:max-w-none print:space-y-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between print:hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-foreground">Resume Builder</h1>
            <div className="flex items-center text-sm font-medium">
              {isSaving ? (
                <span className="text-muted animate-pulse">Saving...</span>
              ) : saveMessage ? (
                <span className={saveMessage.includes('Failed') ? "text-red-400" : "text-green-500"}>{saveMessage}</span>
              ) : null}
            </div>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted">
            Build a structured ATS-ready resume, auto-fill it from uploads, and keep the live preview in sync while editing. All changes are auto-saved.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            View ATS Matches
            <ArrowRight size={16} className="ml-2" />
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Code size={16} className="mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] items-start print:block print:w-full print:gap-0">
        <div className="print:hidden">
          <ResumeForm
          key={formResetKey}
          resumeData={normalizeResumeData(resumeData)}
          fileName={fileName}
          isUploading={isUploading}
          isSaving={isSaving}
          uploadError={uploadError}
          uploadSuccess={uploadSuccess}
          onUploadFile={handleUploadFile}
          isGenerating={isGenerating}
          onGenerateSummary={handleGenerateSummary}
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
        </div>

        <div className="print:w-full print:block">
          <ResumePreview resumeData={normalizeResumeData(resumeData)} />
        </div>
      </div>
    </div>
  )
}
