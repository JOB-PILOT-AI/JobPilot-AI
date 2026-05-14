import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { Card, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { FileUp } from 'lucide-react'
import { useState } from 'react'

export default function ResumeBuilder() {
  const [resume, setResume] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, just store file info
    setResume({
      name: file.name,
      type: file.type,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">Resume Builder</h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Section */}
              <Card>
                <CardTitle className="mb-6">Upload Resume</CardTitle>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition">
                  <FileUp size={48} className="mx-auto mb-4 text-muted" />
                  <p className="text-sm text-muted mb-2">Drop your resume here or click to select</p>
                  <p className="text-xs text-muted mb-4">PDF, DOCX, or TXT (Max 10MB)</p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button variant="primary" size="sm" as="span">
                      Select File
                    </Button>
                  </label>
                </div>
                {resume && (
                  <div className="mt-4 p-3 bg-secondary rounded-lg">
                    <div className="text-sm font-semibold text-foreground">{resume.name}</div>
                    <div className="text-xs text-muted mt-1">Ready to parse</div>
                  </div>
                )}
              </Card>

              {/* Preview Section */}
              <Card>
                <CardTitle className="mb-6">Preview</CardTitle>
                <div className="aspect-[8.5/11] bg-tertiary rounded-lg p-4 text-center text-muted">
                  <p>Resume preview will appear here</p>
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
        </div>
      </div>
    </div>
  )
}
