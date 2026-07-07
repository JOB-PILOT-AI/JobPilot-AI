import { useEffect, useMemo, useRef, useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const ResumePreviewSection = ({ title, children }) => (
  <section className="space-y-3">
    <div className="border-b border-slate-200 pb-2">
      <h3 className="text-[12px] font-bold uppercase tracking-[0.22em] text-slate-600">{title}</h3>
    </div>
    {children}
  </section>
)

const ResumePreview = ({ resumeData, atsAnalytics = {} }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const themePanelRef = useRef(null)
  const [selectedTemplate, setSelectedTemplate] = useState('modern')
  const { personalInfo, skills, education, experience, projects, certifications } = resumeData
  const templates = [
    { id: 'modern', label: 'Modern Minimal', pro: false },
    { id: 'executive', label: 'Executive Pro', pro: true },
    { id: 'classic', label: 'ATS Classic Pro', pro: true },
  ]
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const activePanel = searchParams.get('panel')
  const requestedTemplate = searchParams.get('template')
  const isThemeDeepLink = activePanel === 'themes'

  useEffect(() => {
    if (!isThemeDeepLink) return

    themePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const template = templates.find((item) => item.id === requestedTemplate)
    if (!template) return

    if (template.pro && !user?.isPro) {
      navigate('/upgrade', {
        replace: true,
        state: {
          from: '/resume-builder?panel=themes&template=executive',
          requiredFeature: `${template.label} resume theme`,
        },
      })
      return
    }

    setSelectedTemplate(template.id)
  }, [isThemeDeepLink, navigate, requestedTemplate, user?.isPro])

  const hasText = (value) => typeof value === 'string' && value.trim().length > 0
  const hasList = (value) => Array.isArray(value) && value.some(hasText)
  const hasFilledSection = (item, fields) => fields.some((field) => hasText(item[field]) || hasList(item[field]))

  const experienceItems = experience.filter((item) => hasFilledSection(item, ['company', 'position', 'description', 'startDate', 'endDate']))
  const educationItems = education.filter((item) => hasFilledSection(item, ['school', 'degree', 'field', 'graduationYear']))
  const projectItems = projects.filter((item) => hasFilledSection(item, ['name', 'title', 'description', 'link', 'technologies']))
  const certificationItems = certifications.filter((item) => hasFilledSection(item, ['name', 'issuer', 'date']))

  const hasContent =
    hasText(personalInfo.fullName) ||
    hasText(personalInfo.email) ||
    hasText(personalInfo.phone) ||
    hasText(personalInfo.linkedin) ||
    hasText(personalInfo.github) ||
    hasText(personalInfo.location) ||
    hasText(personalInfo.summary) ||
    skills.length > 0 ||
    educationItems.length > 0 ||
    experienceItems.length > 0 ||
    projectItems.length > 0 ||
    certificationItems.length > 0

  const contactItems = [
    personalInfo.location,
    personalInfo.email,
    personalInfo.phone,
    personalInfo.linkedin,
    personalInfo.github,
  ].filter(hasText)

  const sectionOrder = [
    skills.length > 0 && 'skills',
    projectItems.length > 0 && 'projects',
    experienceItems.length > 0 && 'experience',
    educationItems.length > 0 && 'education',
    certificationItems.length > 0 && 'certifications',
  ].filter(Boolean)

  const formatEducationTitle = (item) =>
    [item.degree, item.field].filter(hasText).join(' in ') || item.degree || item.field || 'Education'

  const formatDateRange = (item) => [item.startDate, item.isCurrent ? 'Present' : item.endDate].filter(hasText).join(' - ')

  return (
    <div>
      <div
        ref={themePanelRef}
        id="premium-resume-themes"
        className={`mb-6 grid gap-3 rounded-2xl transition lg:grid-cols-[1fr_auto] lg:items-center ${
          isThemeDeepLink ? 'border border-primary/40 bg-primary/[0.06] p-4 shadow-[0_20px_60px_rgba(182,79,82,0.16)]' : ''
        }`}
      >
        <div className="grid gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">Resume preview</div>
          <h2 className="text-2xl font-bold tracking-tight text-white">{templates.find((item) => item.id === selectedTemplate)?.label}</h2>
          <p className="max-w-xl text-sm leading-6 text-secondary">
            {isThemeDeepLink
              ? 'Premium resume themes are ready here. Pick a Pro layout and download an ATS-safe printable resume.'
              : 'Review the printable page while keeping ATS-friendly structure and readable spacing.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                if (template.pro && !user?.isPro) {
                  navigate('/upgrade', {
                    state: {
                      from: `/resume-builder?panel=themes&template=${template.id}`,
                      requiredFeature: `${template.label} resume theme`,
                    },
                  })
                  return
                }
                setSelectedTemplate(template.id)
              }}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                selectedTemplate === template.id ? 'bg-primary text-white shadow-[0_16px_48px_rgba(73,215,202,0.18)]' : 'bg-[#111418] text-secondary hover:bg-white/5'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {template.pro && !user?.isPro && <LockKeyhole size={12} />}
                {template.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0e131d] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.26)] sm:p-5">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1015]/90 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] sm:p-5">
          <div className="overflow-x-auto pb-2 shadow-2xl shadow-black/30">
            <div id="resume-print-preview" data-resume-template={selectedTemplate} className="resume-template mx-auto min-h-[1123px] w-full max-w-[794px] rounded-2xl border border-slate-200/10 bg-white px-8 py-12 text-slate-900 shadow-[0_28px_90px_rgba(15,23,42,0.12)] sm:px-12 sm:py-16">
              {!hasContent ? (
                <div className="flex flex-1 items-center justify-center text-center">
                  <div className="max-w-sm space-y-3">
                    <h2 className="text-2xl font-semibold text-slate-900">Resume preview</h2>
                    <p className="text-sm leading-6 text-slate-500">
                      Upload a resume or start editing the form to generate a structured ATS-ready preview.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <header className="border-b border-slate-200/70 pb-7">
                    <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/80">
                      Professional Resume
                    </span>
                    <h1 className="mt-4 break-words text-4xl font-bold uppercase leading-tight tracking-tight text-slate-950 sm:text-5xl">
                      {personalInfo.fullName || 'Your Name'}
                    </h1>
                    {contactItems.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6 text-slate-600">
                        {contactItems.map((item) => (
                          <span key={item} className="break-all">{item}</span>
                        ))}
                      </div>
                    )}
                  </header>

                  <div className="mt-8 space-y-8">
                    {personalInfo.summary && (
                      <ResumePreviewSection title="Summary">
                        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 p-4 text-sm leading-7 text-slate-700">
                          {personalInfo.summary}
                        </div>
                      </ResumePreviewSection>
                    )}

                    {atsAnalytics && atsAnalytics.score !== undefined && (
                      <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-700 sm:grid-cols-[140px_1fr]">
                        <div>
                          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">ATS Score</div>
                          <div className="mt-1 text-3xl font-semibold text-slate-900">{atsAnalytics.score || 0}%</div>
                          <div className="text-xs text-slate-500">{atsAnalytics.healthLabel || ''}</div>
                        </div>
                        <div className="min-w-0 space-y-3">
                          {(atsAnalytics.topSkills || []).length > 0 && (
                            <div>
                              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Top skills</div>
                              <div className="flex flex-wrap gap-2">
                                {(atsAnalytics.topSkills || []).slice(0, 6).map((skill) => (
                                  <span key={skill} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">{skill}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {(atsAnalytics.recommendations || []).length > 0 && (
                            <div>
                              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recommendations</div>
                              <ul className="grid gap-1 text-xs leading-5 text-slate-600 sm:grid-cols-2">
                                {atsAnalytics.recommendations.slice(0, 4).map((rec, index) => (
                                  <li key={`${rec}-${index}`}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {sectionOrder.map((section) => {
                      if (section === 'skills') {
                        return (
                          <ResumePreviewSection key={section} title="Skills">
                            <div className="flex flex-wrap gap-2">
                              {skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="inline-flex rounded-full border border-slate-200/80 bg-slate-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </ResumePreviewSection>
                        )
                      }

                      if (section === 'projects') {
                        return (
                          <ResumePreviewSection key={section} title="Projects">
                            <div className="space-y-4">
                              {projectItems.map((item, index) => (
                                <article key={`${item.name}-${index}`} className="space-y-2">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h4 className="text-base font-semibold text-slate-950">{item.name || item.title || 'Project'}</h4>
                                    {item.link && (
                                      <a href={item.link} target="_blank" rel="noreferrer" className="break-all text-xs text-slate-500 underline underline-offset-4">
                                        {item.link}
                                      </a>
                                    )}
                                  </div>
                                  {item.description && <p className="text-sm leading-6 text-slate-700">{item.description}</p>}
                                  {item.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {item.technologies.map((technology) => (
                                        <span key={technology} className="rounded-full border border-slate-200/80 bg-slate-100/90 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                                          {technology}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </article>
                              ))}
                            </div>
                          </ResumePreviewSection>
                        )
                      }

                      if (section === 'experience') {
                        return (
                          <ResumePreviewSection key={section} title="Experience">
                            <div className="space-y-4">
                              {experienceItems.map((item, index) => (
                                <article key={`${item.company}-${index}`} className="space-y-2">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <div>
                                      <h4 className="text-base font-semibold text-slate-950">{item.position || 'Position'}</h4>
                                      <p className="text-sm text-slate-600">{item.company || 'Company'}</p>
                                    </div>
                                    {formatDateRange(item) && <p className="text-xs uppercase tracking-wide text-slate-500">{formatDateRange(item)}</p>}
                                  </div>
                                  {item.description && <p className="text-sm leading-6 text-slate-700">{item.description}</p>}
                                </article>
                              ))}
                            </div>
                          </ResumePreviewSection>
                        )
                      }

                      if (section === 'education') {
                        return (
                          <ResumePreviewSection key={section} title="Education">
                            <div className="grid gap-4 sm:grid-cols-2">
                              {educationItems.map((item, index) => (
                                <article key={`${item.school}-${index}`} className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
                                  <h4 className="text-sm font-semibold leading-6 text-slate-950">{formatEducationTitle(item)}</h4>
                                  {item.school && <p className="mt-1 text-sm leading-6 text-slate-600">{item.school}</p>}
                                  {item.graduationYear && <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{item.graduationYear}</p>}
                                </article>
                              ))}
                            </div>
                          </ResumePreviewSection>
                        )
                      }

                      return (
                        <ResumePreviewSection key={section} title="Certifications">
                          <div className="grid gap-3 sm:grid-cols-2">
                            {certificationItems.map((item, index) => (
                              <article key={`${item.name}-${index}`} className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
                                <h4 className="text-sm font-semibold text-slate-950">{item.name || 'Certification'}</h4>
                                {[item.issuer, item.date].filter(hasText).length > 0 && (
                                  <p className="mt-1 text-sm text-slate-600">{[item.issuer, item.date].filter(hasText).join(' - ')}</p>
                                )}
                              </article>
                            ))}
                          </div>
                        </ResumePreviewSection>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumePreview
