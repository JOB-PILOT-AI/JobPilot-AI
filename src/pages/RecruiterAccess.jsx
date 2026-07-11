import { useState } from 'react'
import Button from '../components/ui/Button'

const recruiters = [
  { name: 'Priya Mehta', company: 'Fintech Hire', speciality: 'Engineering leadership' },
  { name: 'Aman Verma', company: 'TalentBridge', speciality: 'Product & design' },
  { name: 'Neha Sharma', company: 'Growth Careers', speciality: 'Startup hiring' },
]

export default function RecruiterAccess() {
  const [message, setMessage] = useState('')
  const [selectedRecruiter, setSelectedRecruiter] = useState(recruiters[0].name)
  const [requested, setRequested] = useState(false)

  const handleRequestIntro = () => {
    setRequested(true)
    setMessage(`Referral request sent to ${selectedRecruiter}. We'll notify you when the recruiter replies.`)
  }

  return (
    <div className="min-h-screen page-shell text-foreground px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[#0b1118]/95 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Pro recruiter access</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Connect with recruiters and referrals</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Request introductions, explore referral opportunities, and build a direct line to hiring teams.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <div className="mb-5 text-sm uppercase tracking-[0.24em] text-secondary">Available recruiters</div>
              <div className="space-y-4">
                {recruiters.map((recruiter) => (
                  <button
                    key={recruiter.name}
                    type="button"
                    onClick={() => setSelectedRecruiter(recruiter.name)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedRecruiter === recruiter.name
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-white/10 bg-slate-950 text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <p className="font-semibold">{recruiter.name}</p>
                    <p className="text-sm text-slate-400">{recruiter.company}</p>
                    <p className="text-sm text-slate-400">{recruiter.speciality}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <div className="mb-5 text-sm uppercase tracking-[0.24em] text-secondary">Referral request</div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                <p className="text-sm text-slate-300">Selected recruiter</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedRecruiter}</p>
              </div>
              <Button variant="primary" className="mt-6 w-full" onClick={handleRequestIntro}>
                Request an introduction
              </Button>
              {requested && (
                <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {message}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
            <h2 className="text-xl font-semibold text-white">Why this helps</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>• Access recruiters who specialize in your target role and industry.</li>
              <li>• Use referral introductions to accelerate interview opportunities.</li>
              <li>• Keep your outreach professional with prebuilt request workflows.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
