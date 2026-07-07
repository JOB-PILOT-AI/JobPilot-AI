import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart3, CalendarClock, ChevronRight, GripVertical, Target } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import ErrorBoundary from '../components/ErrorBoundary'

const stages = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
]

const normalizeStage = (status) => {
  if (['reviewing', 'screening'].includes(status)) return 'applied'
  if (status === 'shortlisted') return 'interview'
  if (status === 'accepted') return 'offer'
  if (status === 'withdrawn') return 'rejected'
  return status
}

export default function Applications() {
  const [workspace, setWorkspace] = useState({ applications: [], analytics: {} })
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [nextActionAt, setNextActionAt] = useState('')
  const [message, setMessage] = useState('')
  const [draggedCard, setDraggedCard] = useState(null)

  const load = async () => {
    const response = await axios.get('/api/career/workspace')
    setWorkspace(response.data)
  }

  useEffect(() => {
    load().catch(() => setMessage('Could not load applications.'))
  }, [])

  const updateApplication = async (application, updates) => {
    try {
      if (application.kind === 'saved') {
        await axios.patch(`/api/jobs/${application.jobId._id}/save`, updates)
      } else {
        await axios.patch(`/api/jobs/applications/${application._id}`, updates)
      }
      setMessage('Application updated.')
      await load()
      setSelected(null)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Update failed.')
    }
  }

  const moveCard = async (card, targetStage) => {
    if (!card || normalizeStage(card.status) === targetStage) return
    setMessage('Moving application...')
    try {
      if (card.kind === 'saved') {
        if (targetStage === 'saved') return
        if (!workspace.resume?._id) {
          setMessage('Upload or build a resume before moving a saved job to Applied.')
          return
        }
        const response = await axios.post(`/api/jobs/${card.jobId._id}/apply`, {
          resumeId: workspace.resume._id,
        })
        const created = response.data?.application || response.data?.data || response.data
        if (targetStage !== 'applied' && created?._id) {
          await axios.patch(`/api/jobs/applications/${created._id}`, { status: targetStage })
        }
        await axios.delete(`/api/jobs/${card.jobId._id}/save`)
      } else if (targetStage !== 'saved') {
        await axios.patch(`/api/jobs/applications/${card._id}`, { status: targetStage })
      } else {
        setMessage('Applied jobs cannot move back to Saved. Move them to another application stage.')
        return
      }
      await load()
      setSelected(null)
      setMessage(`Moved to ${stages.find((stage) => stage.id === targetStage)?.label}.`)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not move this application.')
    }
  }

  const openDetails = (application) => {
    setSelected(application)
    setNotes(application.notes || '')
    setNextAction(application.nextAction || '')
    setNextActionAt(application.nextActionAt ? new Date(application.nextActionAt).toISOString().slice(0, 10) : '')
  }

  const analytics = workspace.analytics || {}
  const boardCards = [...(workspace.savedJobs || []), ...(workspace.applications || [])]
  return (
    <ErrorBoundary>
      <div className="min-h-screen page-shell px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <header>
            <h1 className="text-4xl font-bold text-white">Application Pipeline</h1>
            <p className="mt-3 text-secondary">Keep every opportunity moving and know where your search is converting.</p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Total', analytics.total || 0, BarChart3],
              ['Saved', analytics.saved || 0, Target],
              ['Interviews', analytics.interviews || 0, CalendarClock],
              ['Offers', analytics.offers || 0, ChevronRight],
              ['Response rate', `${analytics.responseRate || 0}%`, BarChart3],
            ].map(([label, value, Icon]) => (
              <Card key={label}><Icon size={18} className="mb-4 text-primary" /><div className="text-3xl font-bold text-white">{value}</div><CardContent>{label}</CardContent></Card>
            ))}
          </div>

          {message && <div className="rounded-xl border border-white/10 bg-[#111418] px-4 py-3 text-sm text-secondary">{message}</div>}

          <div className="grid gap-4 xl:grid-cols-5">
            {stages.map((stage) => {
              const applications = boardCards.filter((item) => normalizeStage(item.status) === stage.id)
              return (
                <section
                  key={stage.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    moveCard(draggedCard, stage.id)
                    setDraggedCard(null)
                  }}
                  className="min-h-72 rounded-2xl border border-white/10 bg-[#0d1116] p-3 transition hover:border-primary/30"
                >
                  <div className="mb-4 flex items-center justify-between px-2 py-1">
                    <h2 className="font-semibold text-white">{stage.label}</h2>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-secondary">{applications.length}</span>
                  </div>
                  <div className="space-y-3">
                    {applications.map((application) => (
                      <button
                        key={`${application.kind || 'application'}-${application._id}`}
                        draggable
                        onDragStart={() => setDraggedCard(application)}
                        onDragEnd={() => setDraggedCard(null)}
                        onClick={() => openDetails(application)}
                        className="w-full cursor-grab rounded-xl border border-white/10 bg-[#151922] p-4 text-left transition hover:border-primary/40 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold text-white">{application.jobId?.title || 'Role'}</div>
                          <GripVertical size={15} className="shrink-0 text-secondary" />
                        </div>
                        <div className="mt-1 text-xs text-secondary">{application.jobId?.company || 'Company'}</div>
                        {application.nextAction && (
                          <div className="mt-3 rounded-lg bg-primary/10 px-2 py-2 text-xs text-primary">
                            {application.nextAction}
                            {application.nextActionAt ? ` · ${new Date(application.nextActionAt).toLocaleDateString()}` : ''}
                          </div>
                        )}
                        <div className="mt-4 flex items-center justify-between text-xs"><span className="text-accent">{application.matchScore?.overall || 0}% match</span><ChevronRight size={14} /></div>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>

          {selected && (
            <Card>
              <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
                <div>
                  <CardTitle>{selected.jobId?.title} at {selected.jobId?.company}</CardTitle>
                  <CardContent className="mb-5">Update notes, your next action, or move this application through the pipeline.</CardContent>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Interview notes, contacts, follow-up details..." className="w-full rounded-xl border border-white/10 bg-[#0d1116] p-4 text-white outline-none" />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Next action" />
                    <Input type="date" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
                  </div>
                  <Button className="mt-4" onClick={() => updateApplication(selected, { notes, nextAction, nextActionAt })}>Save notes & reminder</Button>
                </div>
                <div className="space-y-2">
                  {stages.map((stage) => (
                    <Button
                      key={stage.id}
                      variant={normalizeStage(selected.status) === stage.id ? 'primary' : 'outline'}
                      className="w-full"
                      disabled={selected.kind !== 'saved' && stage.id === 'saved'}
                      onClick={() => moveCard(selected, stage.id)}
                    >
                      {stage.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
