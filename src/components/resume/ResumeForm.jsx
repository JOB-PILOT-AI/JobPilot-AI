import { useRef, useState } from 'react'
import { Plus, X, Upload, Save } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Textarea } from '../ui/textarea'
import { Card, CardTitle } from '../ui/Card'

const ResumeForm = ({
  resumeData,
  fileName,
  isUploading,
  isSaving,
  uploadError,
  uploadSuccess,
  onUploadFile,
  onSave,
  onPersonalInfoChange,
  onSkillAdd,
  onSkillRemove,
  onSkillChange,
  onSectionAdd,
  onSectionRemove,
  onSectionChange,
  onClearResume,
  canSave,
}) => {
  const fileInputRef = useRef(null)
  const [newSkill, setNewSkill] = useState('')

  const triggerFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await onUploadFile(file)
  }

  const handleAddSkill = () => {
    const skill = newSkill.trim()
    if (!skill) return
    onSkillAdd(skill)
    setNewSkill('')
  }

  const renderSectionHeader = (title, description, onAdd, buttonLabel = 'Add') => (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onAdd} className="flex items-center gap-2">
        <Plus size={14} />
        {buttonLabel}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="mb-2">Upload Resume</CardTitle>
            <p className="text-sm text-muted">PDF or DOCX up to 10MB</p>
          </div>
          <Button variant="primary" size="sm" onClick={triggerFilePicker} disabled={isUploading}>
            <Upload size={14} className="mr-2" />
            {isUploading ? 'Parsing...' : 'Upload'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />

        {uploadError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {uploadSuccess}
          </div>
        )}

        {fileName && (
          <div className="rounded-lg border border-border bg-tertiary px-4 py-3">
            <div className="text-sm font-medium text-foreground">{fileName}</div>
            <div className="text-xs text-muted">Parsed data loaded into the builder</div>
          </div>
        )}
      </Card>

      <Card className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="mb-2">Personal Information</CardTitle>
            <p className="text-sm text-muted">Keep contact details and summary aligned with ATS systems.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearResume}
              disabled={isUploading || isSaving}
              className="border-[#e07855] text-[#e07855] hover:bg-[#e07855]/10 hover:text-[#e07855] focus:ring-[#e07855]"
            >
              Clear Resume
            </Button>
            <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving || !canSave}>
              <Save size={14} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Full Name"
            value={resumeData.personalInfo.fullName}
            onChange={(event) => onPersonalInfoChange('fullName', event.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={resumeData.personalInfo.email}
            onChange={(event) => onPersonalInfoChange('email', event.target.value)}
          />
          <Input
            placeholder="Phone"
            value={resumeData.personalInfo.phone}
            onChange={(event) => onPersonalInfoChange('phone', event.target.value)}
          />
          <Input
            placeholder="Location"
            value={resumeData.personalInfo.location}
            onChange={(event) => onPersonalInfoChange('location', event.target.value)}
          />
          <Input
            placeholder="LinkedIn URL"
            value={resumeData.personalInfo.linkedin}
            onChange={(event) => onPersonalInfoChange('linkedin', event.target.value)}
          />
          <Input
            placeholder="GitHub URL"
            value={resumeData.personalInfo.github}
            onChange={(event) => onPersonalInfoChange('github', event.target.value)}
          />
        </div>

        <Textarea
          placeholder="Professional summary"
          className="min-h-28"
          value={resumeData.personalInfo.summary}
          onChange={(event) => onPersonalInfoChange('summary', event.target.value)}
        />
      </Card>

      <Card className="space-y-5">
        {renderSectionHeader('Skills', 'Normalize and rank skills for ATS consumption.', handleAddSkill)}
        <div className="flex gap-3">
          <Input
            placeholder="Add a skill"
            value={newSkill}
            onChange={(event) => setNewSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAddSkill()
              }
            }}
          />
          <Button variant="primary" size="sm" onClick={handleAddSkill}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {resumeData.skills.length > 0 ? (
            resumeData.skills.map((skill, index) => (
              <div
                key={`${skill}-${index}`}
                className="flex items-center gap-2 rounded-full border border-border bg-tertiary px-3 py-1.5"
              >
                <input
                  value={skill}
                  onChange={(event) => onSkillChange(index, event.target.value)}
                  className="w-32 bg-transparent text-sm text-foreground outline-none"
                />
                <button
                  type="button"
                  className="text-muted transition hover:text-foreground"
                  onClick={() => onSkillRemove(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
              No skills added yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-5">
        {renderSectionHeader('Education', 'Add degrees, institutions, and graduation details.', () => onSectionAdd('education'))}
        <div className="space-y-4">
          {resumeData.education.length > 0 ? (
            resumeData.education.map((item, index) => (
              <div key={`education-${index}`} className="rounded-xl border border-border bg-tertiary p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="School"
                      value={item.school}
                      onChange={(event) => onSectionChange('education', index, 'school', event.target.value)}
                    />
                    <Input
                      placeholder="Degree"
                      value={item.degree}
                      onChange={(event) => onSectionChange('education', index, 'degree', event.target.value)}
                    />
                    <Input
                      placeholder="Field of study"
                      value={item.field}
                      onChange={(event) => onSectionChange('education', index, 'field', event.target.value)}
                    />
                    <Input
                      placeholder="Graduation year"
                      value={item.graduationYear}
                      onChange={(event) => onSectionChange('education', index, 'graduationYear', event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-muted transition hover:text-foreground"
                    onClick={() => onSectionRemove('education', index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
              No education entries added yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-5">
        {renderSectionHeader('Experience', 'Capture measurable work history and impact.', () => onSectionAdd('experience'))}
        <div className="space-y-4">
          {resumeData.experience.length > 0 ? (
            resumeData.experience.map((item, index) => (
              <div key={`experience-${index}`} className="rounded-xl border border-border bg-tertiary p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Company"
                      value={item.company}
                      onChange={(event) => onSectionChange('experience', index, 'company', event.target.value)}
                    />
                    <Input
                      placeholder="Position"
                      value={item.position}
                      onChange={(event) => onSectionChange('experience', index, 'position', event.target.value)}
                    />
                    <Input
                      placeholder="Start date"
                      value={item.startDate}
                      onChange={(event) => onSectionChange('experience', index, 'startDate', event.target.value)}
                    />
                    <Input
                      placeholder="End date"
                      value={item.endDate}
                      onChange={(event) => onSectionChange('experience', index, 'endDate', event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-muted transition hover:text-foreground"
                    onClick={() => onSectionRemove('experience', index)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <Textarea
                  placeholder="Describe your impact"
                  value={item.description}
                  onChange={(event) => onSectionChange('experience', index, 'description', event.target.value)}
                />
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(item.isCurrent)}
                    onChange={(event) => onSectionChange('experience', index, 'isCurrent', event.target.checked)}
                  />
                  Current role
                </label>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
              No experience entries added yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-5">
        {renderSectionHeader('Projects', 'Highlight relevant product and engineering work.', () => onSectionAdd('projects'))}
        <div className="space-y-4">
          {resumeData.projects.length > 0 ? (
            resumeData.projects.map((item, index) => (
              <div key={`project-${index}`} className="rounded-xl border border-border bg-tertiary p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Project name"
                      value={item.name}
                      onChange={(event) => onSectionChange('projects', index, 'name', event.target.value)}
                    />
                    <Input
                      placeholder="Project link"
                      value={item.link}
                      onChange={(event) => onSectionChange('projects', index, 'link', event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-muted transition hover:text-foreground"
                    onClick={() => onSectionRemove('projects', index)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <Textarea
                  placeholder="Project description"
                  value={item.description}
                  onChange={(event) => onSectionChange('projects', index, 'description', event.target.value)}
                />
                <Input
                  placeholder="Technologies, separated by commas"
                  value={item.technologies.join(', ')}
                  onChange={(event) => onSectionChange('projects', index, 'technologies', event.target.value)}
                />
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
              No projects added yet.
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-5">
        {renderSectionHeader('Certifications', 'Track relevant certifications and credentials.', () => onSectionAdd('certifications'))}
        <div className="space-y-4">
          {resumeData.certifications.length > 0 ? (
            resumeData.certifications.map((item, index) => (
              <div key={`certification-${index}`} className="rounded-xl border border-border bg-tertiary p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid flex-1 gap-4 md:grid-cols-2">
                    <Input
                      placeholder="Certification name"
                      value={item.name}
                      onChange={(event) => onSectionChange('certifications', index, 'name', event.target.value)}
                    />
                    <Input
                      placeholder="Issuer"
                      value={item.issuer}
                      onChange={(event) => onSectionChange('certifications', index, 'issuer', event.target.value)}
                    />
                    <Input
                      placeholder="Date"
                      value={item.date}
                      onChange={(event) => onSectionChange('certifications', index, 'date', event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-muted transition hover:text-foreground"
                    onClick={() => onSectionRemove('certifications', index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted">
              No certifications added yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ResumeForm
