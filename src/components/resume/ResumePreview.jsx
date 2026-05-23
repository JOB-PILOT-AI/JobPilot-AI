const ResumePreviewSection = ({ title, children }) => (
  <section className="space-y-3">
    <div className="border-b border-slate-200 pb-2">
      <h3 className="text-[12px] font-bold uppercase tracking-[0.22em] text-slate-600">{title}</h3>
    </div>
    {children}
  </section>
)

const ResumePreview = ({ resumeData }) => {
  const { personalInfo, skills, education, experience, projects, certifications } = resumeData
  const hasContent =
    personalInfo.fullName ||
    personalInfo.email ||
    personalInfo.phone ||
    personalInfo.linkedin ||
    personalInfo.github ||
    personalInfo.location ||
    personalInfo.summary ||
    skills.length > 0 ||
    education.length > 0 ||
    experience.length > 0 ||
    projects.length > 0 ||
    certifications.length > 0

  return (
    <div className="lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-3xl border border-border bg-secondary shadow-2xl">
        <div className="mx-auto flex min-h-[1120px] w-full max-w-[794px] flex-col bg-white px-8 py-10 text-slate-900 sm:px-10">
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
              <header className="border-b border-slate-200 pb-5">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  {personalInfo.fullName || 'Your Name'}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <span>{personalInfo.phone}</span>}
                  {personalInfo.location && <span>{personalInfo.location}</span>}
                  {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                  {personalInfo.github && <span>{personalInfo.github}</span>}
                </div>
              </header>

              <div className="mt-6 space-y-6">
                {personalInfo.summary && (
                  <ResumePreviewSection title="Summary">
                    <p className="text-sm leading-6 text-slate-700">{personalInfo.summary}</p>
                  </ResumePreviewSection>
                )}

                {skills.length > 0 && (
                  <ResumePreviewSection title="Skills">
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </ResumePreviewSection>
                )}

                {experience.length > 0 && (
                  <ResumePreviewSection title="Experience">
                    <div className="space-y-4">
                      {experience.map((item, index) => (
                        <article key={`${item.company}-${index}`} className="space-y-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-950">{item.position || 'Position'}</h4>
                              <p className="text-sm text-slate-600">{item.company || 'Company'}</p>
                            </div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              {[item.startDate, item.endDate].filter(Boolean).join(' - ')}
                            </p>
                          </div>
                          {item.description && <p className="text-sm leading-6 text-slate-700">{item.description}</p>}
                        </article>
                      ))}
                    </div>
                  </ResumePreviewSection>
                )}

                {projects.length > 0 && (
                  <ResumePreviewSection title="Projects">
                    <div className="space-y-4">
                      {projects.map((item, index) => (
                        <article key={`${item.name}-${index}`} className="space-y-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-950">{item.name || 'Project'}</h4>
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-slate-500 underline underline-offset-4"
                              >
                                {item.link}
                              </a>
                            )}
                          </div>
                          {item.description && <p className="text-sm leading-6 text-slate-700">{item.description}</p>}
                          {item.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {item.technologies.map((technology) => (
                                <span
                                  key={technology}
                                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                                >
                                  {technology}
                                </span>
                              ))}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </ResumePreviewSection>
                )}

                {education.length > 0 && (
                  <ResumePreviewSection title="Education">
                    <div className="space-y-4">
                      {education.map((item, index) => (
                        <article key={`${item.school}-${index}`} className="space-y-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-950">{item.school || 'School'}</h4>
                              <p className="text-sm text-slate-600">
                                {[item.degree, item.field].filter(Boolean).join(' • ') || 'Degree'}
                              </p>
                            </div>
                            {item.graduationYear && (
                              <p className="text-xs uppercase tracking-wide text-slate-500">{item.graduationYear}</p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </ResumePreviewSection>
                )}

                {certifications.length > 0 && (
                  <ResumePreviewSection title="Certifications">
                    <div className="space-y-3">
                      {certifications.map((item, index) => (
                        <article key={`${item.name}-${index}`} className="space-y-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h4 className="text-sm font-semibold text-slate-950">{item.name || 'Certification'}</h4>
                            {item.date && <p className="text-xs uppercase tracking-wide text-slate-500">{item.date}</p>}
                          </div>
                          {item.issuer && <p className="text-sm text-slate-600">{item.issuer}</p>}
                        </article>
                      ))}
                    </div>
                  </ResumePreviewSection>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumePreview
