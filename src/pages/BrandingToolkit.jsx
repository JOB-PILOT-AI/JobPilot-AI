import { useState } from 'react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function BrandingToolkit() {
  const [role, setRole] = useState('Software Engineer')
  const [industry, setIndustry] = useState('Fintech')
  const [summary, setSummary] = useState('')
  const [headline, setHeadline] = useState('')

  const generateBranding = () => {
    setHeadline(`${role} with proven leadership in ${industry}`)
    setSummary(
      `Experienced ${role} who builds high-impact products for ${industry} teams. Skilled in translating business goals into scalable solutions, improving processes, and driving delivery through cross-functional collaboration.`
    )
  }

  return (
    <div className="min-h-screen page-shell text-foreground px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="rounded-[2rem] border border-white/10 bg-[#0d1118]/95 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.28)]">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.24em] text-secondary">Pro branding toolkit</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Polish your professional brand</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Create a standout resume headline, LinkedIn summary, and personal brand narrative that recruiters remember.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-5 rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Target role</label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Product Manager"
                  className="h-12 border-white/10 bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Industry focus</label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Healthcare"
                  className="h-12 border-white/10 bg-slate-950"
                />
              </div>
              <Button variant="primary" onClick={generateBranding} className="mt-4 w-full">
                Generate brand copy
              </Button>
            </div>

            <div className="space-y-5 rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">Suggested headline</p>
                <div className="mt-3 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-white">
                  {headline || 'Your professional headline will appear here.'}
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-secondary">Suggested summary</p>
                <div className="mt-3 rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-slate-200">
                  {summary || 'Your professional summary will appear here once generated.'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#11151f]/95 p-6">
            <h2 className="text-xl font-semibold text-white">How this helps</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li>• Align your resume and LinkedIn with recruiter search intent.</li>
              <li>• Use strong, role-focused language that explains your impact.</li>
              <li>• Save time with one-click professional copy generation.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
