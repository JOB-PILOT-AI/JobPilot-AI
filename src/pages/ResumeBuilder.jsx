import { Card, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export default function ResumeBuilder() {
  const [resume, setResume] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  })
  const fileInputRef = useRef(null)
  const { token } = useAuthStore()

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  const maxFileSize = 10 * 1024 * 1024

  const isAllowedFile = (file) => {
    const fileName = file.name.toLowerCase()
    return (
      allowedTypes.includes(file.type) ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.docx')
    )
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) return

    if (!isAllowedFile(file)) {
      setUploadError('Please upload a PDF or DOCX resume.')
      return
    }

    if (file.size > maxFileSize) {
      setUploadError('Resume must be 10MB or smaller.')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const res = await axios.post('/api/resume/upload', formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      const parsedResume = res.data?.parsedResume || res.data?.resume

      setResume({
        fileName: file.name,
        fileType: file.type,
        ...parsedResume,
      })
      setFormData({
        fullName: parsedResume?.personalInfo?.fullName || '',
        email: parsedResume?.personalInfo?.email || '',
        phone: parsedResume?.personalInfo?.phone || '',
      })
      setUploadSuccess('Resume uploaded and parsed successfully.')
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Resume upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-foreground mb-8">Resume Builder</h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card>
                <CardTitle className="mb-6">Upload Resume</CardTitle>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition">
                  <FileUp size={48} className="mx-auto mb-4 text-muted" />
                  <p className="text-sm text-muted mb-2">Drop your resume here or click to select</p>
                  <p className="text-xs text-muted mb-4">PDF or DOCX only (Max 10MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    id="resume-upload"
                  />
                  <Button variant="primary" size="sm" onClick={openFilePicker} disabled={isUploading}>
                    {isUploading ? 'Parsing...' : 'Select File'}
                  </Button>
                </div>
                {uploadError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {uploadError}
                  </div>
                )}
                {uploadSuccess && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
                    {uploadSuccess}
                  </div>
                )}
                {resume && (
                  <div className="mt-4 p-3 bg-secondary rounded-lg">
                    <div className="text-sm font-semibold text-foreground">{resume.fileName}</div>
                    <div className="text-xs text-muted mt-1">
                      {resume.personalInfo?.fullName || 'Parsed resume data loaded'}
                    </div>
                  </div>
                )}
              </Card>

              {/* Preview Section */}
              <Card>
                <CardTitle className="mb-6">Preview</CardTitle>
                <div className="aspect-[8.5/11] bg-tertiary rounded-lg p-4 text-left text-muted space-y-3 overflow-auto">
                  {resume ? (
                    <>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted mb-1">Name</div>
                        <div className="text-foreground font-semibold">
                          {resume.personalInfo?.fullName || 'Not extracted'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted mb-1">Email</div>
                        <div className="text-foreground">{resume.personalInfo?.email || 'Not extracted'}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted mb-1">Skills</div>
                        <div className="text-foreground">
                          {resume.skills?.length ? resume.skills.join(', ') : 'Not extracted'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted mb-1">Summary</div>
                        <div className="text-foreground text-sm leading-6">
                          {resume.summary || 'Not extracted'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>Resume preview will appear here</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Editor Section */}
            <Card className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <CardTitle>Resume Details</CardTitle>
                <Button
                  variant={isEditing ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    name="fullName"
                    className="w-full px-3 py-2 bg-tertiary border border-border rounded disabled:opacity-50"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      disabled={!isEditing}
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      name="email"
                      className="w-full px-3 py-2 bg-tertiary border border-border rounded disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground block mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      disabled={!isEditing}
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleInputChange}
                      name="phone"
                      className="w-full px-3 py-2 bg-tertiary border border-border rounded disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

        <div className="mt-6 flex gap-4">
          <Button variant="primary">Export as PDF</Button>
          <Button variant="outline">Save Draft</Button>
        </div>
      </Card>
    </div>
  )
}
