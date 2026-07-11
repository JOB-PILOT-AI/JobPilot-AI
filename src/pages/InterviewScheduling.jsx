import { useState } from 'react'
import Button from '../components/ui/Button'
import { CalendarDays } from 'lucide-react'

const availableSlots = [
  'Mon, Jul 15 — 10:00 AM',
  'Mon, Jul 15 — 2:00 PM',
  'Tue, Jul 16 — 11:00 AM',
  'Tue, Jul 16 — 4:00 PM',
]

export default function InterviewScheduling() {
  const [selectedSlot, setSelectedSlot] = useState(availableSlots[0])
  const [scheduled, setScheduled] = useState('')

  const scheduleInterview = () => {
    setScheduled(`Interview scheduled successfully for ${selectedSlot}.`)
  }

  return (
    <div className="min-h-screen page-shell text-foreground px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[#0b1118]/95 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
          <div className="mb-6 flex items-center gap-3 text-sm uppercase tracking-[0.24em] text-secondary">
            <CalendarDays size={18} />
            Smart interview scheduling
          </div>
          <h1 className="text-4xl font-semibold text-white">Book the best interview time</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
            Choose a recommended slot, sync with your calendar, and keep your interview preparation on track.
          </p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <p className="mb-4 text-sm uppercase tracking-[0.24em] text-secondary">Available slots</p>
              <div className="space-y-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedSlot === slot
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-white/10 bg-slate-950 text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <p className="mb-4 text-sm uppercase tracking-[0.24em] text-secondary">Your selected slot</p>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-slate-200">
                <p className="text-lg font-semibold text-white">{selectedSlot}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The system will confirm your interview time and send reminders to keep you ready.
                </p>
              </div>
              <Button variant="primary" className="mt-6 w-full" onClick={scheduleInterview}>
                Schedule interview
              </Button>
              {scheduled && (
                <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {scheduled}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
            <h2 className="text-xl font-semibold text-white">Why this helps</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>• Get recommended interview windows so you can choose a strong availability time.</li>
              <li>• Build a consistent preparation timeline with reminders and calendar syncing.</li>
              <li>• Keep your application process moving without manual scheduling overhead.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
