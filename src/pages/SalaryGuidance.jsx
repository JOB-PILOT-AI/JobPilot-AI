import { useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const benchmarkData = {
  'Software Engineer': { Delhi: '₹10-18L', Bengaluru: '₹12-24L', Mumbai: '₹11-20L' },
  'Product Manager': { Delhi: '₹14-26L', Bengaluru: '₹16-30L', Mumbai: '₹15-28L' },
  'Data Scientist': { Delhi: '₹11-20L', Bengaluru: '₹13-24L', Mumbai: '₹12-22L' },
}

export default function SalaryGuidance() {
  const [role, setRole] = useState('Software Engineer')
  const [location, setLocation] = useState('Bengaluru')
  const [range, setRange] = useState(benchmarkData[role]?.[location] || 'Select role and location')

  const updateSalaryRange = () => {
    setRange(benchmarkData[role]?.[location] || 'Data unavailable for this role/location')
  }

  return (
    <div className="min-h-screen page-shell text-foreground px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[#0b1118]/95 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Pro salary guidance</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Benchmark your compensation</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Compare your target role against market salary ranges and get negotiation guidance for your next offer.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">Role</label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer"
                  className="h-12 border-white/10 bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Location</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bengaluru"
                  className="h-12 border-white/10 bg-slate-950"
                />
              </div>
              <Button variant="primary" className="mt-4 w-full" onClick={updateSalaryRange}>
                Show salary range
              </Button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-slate-200">
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">Expected range</p>
                <p className="mt-4 text-4xl font-semibold text-white">{range}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Use this as a negotiation benchmark when you discuss compensation with hiring teams.
                </p>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-[#0f1620] p-5 text-sm text-slate-300">
                <p className="font-semibold text-white">Negotiation tip</p>
                <p className="mt-3 text-slate-400">
                  Highlight your recent impact, align with the role’s top priorities, and ask for a range based on market benchmarks.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
            <h2 className="text-xl font-semibold text-white">Why this helps</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>• Know the market range for your role and location.</li>
              <li>• Position your next offer with confidence during negotiation.</li>
              <li>• Avoid lowball salary expectations by benchmarking against real data.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
