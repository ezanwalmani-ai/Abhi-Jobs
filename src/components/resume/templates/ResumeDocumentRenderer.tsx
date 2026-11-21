import React from 'react';
import {
  ResumeData,
  ResumeSectionKey,
  DEFAULT_SECTION_TITLES,
  getResumeDesign,
  flattenSkillCategories,
} from '../../../types/resume';
import { getTemplateSpec } from './templateCatalog';

interface ResumeDocumentRendererProps {
  resume: ResumeData;
  id?: string;
  showPlaceholderWhenEmpty?: boolean;
}

const FONT_STACKS: Record<string, string> = {
  inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  manrope: "'Manrope', 'Plus Jakarta Sans', 'Inter', sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
  merriweather: "'Merriweather', Georgia, Cambria, serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

const FONT_SIZE_SCALE = {
  compact: { base: 11.5, heading: 12, name: 24, title: 13 },
  standard: { base: 12.5, heading: 13, name: 27, title: 14 },
  comfortable: { base: 13.5, heading: 14, name: 30, title: 15 },
};

const LINE_HEIGHT_SCALE = {
  tight: 1.38,
  normal: 1.52,
  relaxed: 1.68,
};

const MARGIN_PADDING = {
  narrow: '28px 32px',
  standard: '40px 44px',
  wide: '52px 56px',
};

const SIDEBAR_SECTIONS: ResumeSectionKey[] = [
  'skills',
  'certifications',
  'languages',
  'awards',
  'memberships',
];

function formatExpDates(exp: ResumeData['experiences'][number]): string {
  const start = [exp.startMonth, exp.startYear].filter(Boolean).join(' ').trim();
  const end = exp.currentlyWorking
    ? 'Present'
    : [exp.endMonth, exp.endYear].filter(Boolean).join(' ').trim();
  if (!start && !end) return '';
  if (!end) return start;
  return `${start || 'Start'} – ${end}`;
}

/**
 * High-fidelity A4 document renderer supporting 12 genuinely distinct layouts,
 * real-time typography, spacing, margin, accent color, section ordering,
 * custom section headings, visibility toggles, and print-ready page breaks.
 */
export const ResumeDocumentRenderer: React.FC<ResumeDocumentRendererProps> = ({
  resume,
  id,
  showPlaceholderWhenEmpty = false,
}) => {
  const design = getResumeDesign(resume);
  const spec = getTemplateSpec(design.templateId);
  const templateId = design.templateId;
  const accent = design.accentColor || spec.defaultAccent;
  const fontStack = FONT_STACKS[design.fontFamily] || FONT_STACKS.inter;
  const typeScale = FONT_SIZE_SCALE[design.fontSize] || FONT_SIZE_SCALE.standard;
  const lineHeight = LINE_HEIGHT_SCALE[design.lineSpacing] || 1.52;
  const pagePadding = MARGIN_PADDING[design.margins] || MARGIN_PADDING.standard;

  const isTwoColumnLeft = templateId === 'modern-two-column';
  const isTwoColumnRight = templateId === 'contemporary';
  const isBannerHeader = templateId === 'modern-corporate' || templateId === 'sales-marketing';
  const isMinimalCentered = templateId === 'minimal-elegant' || templateId === 'academic-cv';
  const isExecutive = templateId === 'executive';
  const isTechnology = templateId === 'technology';
  const isCreative = templateId === 'creative';
  const isFinance = templateId === 'finance-accounting';

  const allSkills = flattenSkillCategories(resume.skillCategories, resume.skills);

  const locationStr = [resume.city?.trim(), resume.state?.trim()].filter(Boolean).join(', ');
  const contactItems = [
    resume.email?.trim(),
    resume.phone?.trim(),
    locationStr,
    resume.linkedIn?.trim(),
    resume.portfolio?.trim(),
  ].filter(Boolean) as string[];

  const displayName =
    resume.fullName?.trim() || (showPlaceholderWhenEmpty ? 'Your Full Name' : '');
  const displayTitle =
    resume.professionalTitle?.trim() ||
    (showPlaceholderWhenEmpty ? 'Target Professional Title' : '');

  const getSectionTitle = (key: ResumeSectionKey): string =>
    design.sectionTitles?.[key]?.trim() || DEFAULT_SECTION_TITLES[key];

  const hasSectionContent = (key: ResumeSectionKey): boolean => {
    if (design.hiddenSections.includes(key)) return false;
    switch (key) {
      case 'summary':
        return Boolean(resume.summary?.trim());
      case 'experiences':
        return resume.experiences.length > 0;
      case 'education':
        return resume.education.length > 0;
      case 'skills':
        return allSkills.length > 0;
      case 'projects':
        return resume.projects.length > 0;
      case 'certifications':
        return resume.certifications.length > 0;
      case 'languages':
        return resume.languages.length > 0;
      case 'achievements':
        return (resume.achievements || []).some((a) => a.trim());
      case 'awards':
        return (resume.awards || []).length > 0;
      case 'training':
        return (resume.training || []).length > 0;
      case 'volunteer':
        return (resume.volunteer || []).length > 0;
      case 'publications':
        return (resume.publications || []).length > 0;
      case 'memberships':
        return (resume.memberships || []).some((m) => m.trim());
      case 'customSections':
        return (resume.customSections || []).some((cs) => cs.title.trim() || cs.items.length > 0);
      default:
        return false;
    }
  };

  const renderSectionHeading = (title: string, compactSidebar = false) => {
    if (isTechnology) {
      return (
        <div className="flex items-center gap-2 mb-2.5">
          <span
            style={{
              color: accent,
              fontFamily: FONT_STACKS.mono,
              fontSize: compactSidebar ? '11px' : `${typeScale.heading}px`,
            }}
            className="font-bold uppercase tracking-wider shrink-0"
          >
            // {title}
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      );
    }

    if (isFinance || templateId === 'academic-cv') {
      return (
        <h2
          style={{
            color: accent,
            borderBottomColor: accent,
            fontSize: `${typeScale.heading}px`,
          }}
          className="font-bold uppercase tracking-[0.12em] border-b pb-1 mb-2.5"
        >
          {title}
        </h2>
      );
    }

    if (isMinimalCentered) {
      return (
        <h2
          style={{ color: accent, fontSize: `${typeScale.heading - 0.5}px` }}
          className="font-semibold uppercase tracking-[0.2em] text-slate-700 border-b border-slate-200 pb-1.5 mb-3"
        >
          {title}
        </h2>
      );
    }

    if (isExecutive) {
      return (
        <div className="mb-2.5">
          <h2
            style={{ color: accent, fontSize: `${typeScale.heading}px` }}
            className="font-extrabold uppercase tracking-[0.14em]"
          >
            {title}
          </h2>
          <div className="flex items-center gap-1 mt-1">
            <span style={{ backgroundColor: '#F47A24' }} className="h-[2.5px] w-8 inline-block" />
            <span style={{ backgroundColor: accent }} className="h-px flex-1 opacity-25 inline-block" />
          </div>
        </div>
      );
    }

    if (isCreative || templateId === 'sales-marketing') {
      return (
        <div className="flex items-center gap-2 mb-2.5">
          <span
            style={{ backgroundColor: accent }}
            className="w-2 h-2 rounded-xs shrink-0 inline-block"
          />
          <h2
            style={{ color: '#102B4E', fontSize: `${typeScale.heading}px` }}
            className="font-extrabold uppercase tracking-wider"
          >
            {title}
          </h2>
        </div>
      );
    }

    if (templateId === 'modern-corporate' || templateId === 'graduate-fresher') {
      return (
        <div
          style={{ borderLeftColor: accent }}
          className="border-l-[3px] pl-2.5 mb-2.5"
        >
          <h2
            style={{ color: accent, fontSize: `${typeScale.heading}px` }}
            className="font-extrabold uppercase tracking-wider"
          >
            {title}
          </h2>
        </div>
      );
    }

    // Classic Professional & Two-column clean default
    return (
      <h2
        style={{
          color: accent,
          borderBottomColor: compactSidebar ? '#CBD5E1' : `${accent}33`,
          fontSize: compactSidebar ? `${typeScale.heading - 1}px` : `${typeScale.heading}px`,
        }}
        className="font-bold uppercase tracking-widest border-b pb-1 mb-2.5"
      >
        {title}
      </h2>
    );
  };

  const renderSectionBody = (key: ResumeSectionKey, inSidebar = false) => {
    const breakBefore = design.pageBreakBefore.includes(key);
    const sectionStyle: React.CSSProperties = breakBefore
      ? { breakBefore: 'page', pageBreakBefore: 'always' }
      : {};

    switch (key) {
      case 'summary':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('summary'), inSidebar)}
            <p
              className={`text-slate-700 whitespace-pre-line ${
                isExecutive ? 'bg-slate-50/90 border-l-2 border-[#102B4E] pl-3.5 py-2.5 rounded-r-lg' : ''
              }`}
            >
              {resume.summary}
            </p>
          </section>
        );

      case 'experiences':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('experiences'), inSidebar)}
            <div className="space-y-4">
              {resume.experiences.map((exp) => {
                const dateLabel = formatExpDates(exp);
                const responsibilities = (exp.responsibilities || []).filter((r) => r.trim());
                const achievements = (exp.achievements || []).filter((a) => a.trim());

                return (
                  <div
                    key={exp.id}
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    className="space-y-1"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold text-slate-900" style={{ fontSize: `${typeScale.base + 1}px` }}>
                        {exp.jobTitle || 'Role Title'}
                      </h3>
                      {dateLabel && (
                        <span className="text-[0.88em] font-semibold text-slate-500 whitespace-nowrap shrink-0">
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[0.92em]">
                      <span style={{ color: accent }} className="font-semibold">
                        {[exp.companyName, exp.employmentType].filter(Boolean).join(' · ')}
                      </span>
                      {exp.location && <span className="text-slate-500">{exp.location}</span>}
                    </div>

                    {responsibilities.length > 0 && (
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 pt-1">
                        {responsibilities.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}

                    {achievements.length > 0 && (
                      <div className="pt-1.5 space-y-1">
                        <div className="text-[0.85em] font-bold uppercase tracking-wide text-slate-500">
                          Key Achievements
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                          {achievements.map((ach, idx) => (
                            <li key={idx} className="font-medium">
                              {ach}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'education':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('education'), inSidebar)}
            <div className="space-y-3">
              {resume.education.map((edu) => {
                const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
                return (
                  <div
                    key={edu.id}
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    className="space-y-0.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-bold text-slate-900">
                        {edu.degree || 'Degree'}
                        {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}
                      </h3>
                      {dates && (
                        <span className="text-[0.88em] font-semibold text-slate-500 whitespace-nowrap shrink-0">
                          {dates}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[0.92em] text-slate-600">
                      <span className="font-medium">
                        {[edu.institution, edu.location].filter(Boolean).join(', ')}
                      </span>
                      {edu.grade && (
                        <span className="font-semibold text-slate-700">Grade: {edu.grade}</span>
                      )}
                    </div>
                    {edu.description && (
                      <p className="text-[0.92em] text-slate-600 pt-0.5">{edu.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'skills': {
        const cats = resume.skillCategories;
        const hasCategorized =
          cats &&
          ((cats.technical?.length || 0) > 0 ||
            (cats.professional?.length || 0) > 0 ||
            (cats.industry?.length || 0) > 0 ||
            (cats.tools?.length || 0) > 0);
        const nonEmptyCats = hasCategorized
          ? [
              { label: 'Technical', items: cats!.technical || [] },
              { label: 'Professional', items: cats!.professional || [] },
              { label: 'Industry', items: cats!.industry || [] },
              { label: 'Tools & Software', items: cats!.tools || [] },
            ].filter((c) => c.items.length > 0)
          : [];

        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('skills'), inSidebar)}
            {nonEmptyCats.length > 1 || isTechnology ? (
              <div className="space-y-2">
                {(nonEmptyCats.length > 0
                  ? nonEmptyCats
                  : [{ label: 'Core Skills', items: allSkills }]
                ).map((cat) => (
                  <div key={cat.label} className={inSidebar ? 'space-y-1' : 'flex flex-wrap gap-1.5 items-baseline'}>
                    <span className="font-bold text-slate-800 text-[0.92em] mr-1">
                      {cat.label}:
                    </span>
                    {inSidebar || isCreative ? (
                      <div className="flex flex-wrap gap-1">
                        {cat.items.map((skill, idx) => (
                          <span
                            key={idx}
                            style={{
                              borderColor: `${accent}30`,
                              backgroundColor: inSidebar ? '#FFFFFF' : `${accent}0D`,
                            }}
                            className="px-2 py-0.5 rounded-md border text-[0.86em] font-medium text-slate-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-700">{cat.items.join(' · ')}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : inSidebar || isCreative || templateId === 'graduate-fresher' ? (
              <div className="flex flex-wrap gap-1.5">
                {allSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      borderColor: `${accent}30`,
                      backgroundColor: inSidebar ? '#FFFFFF' : `${accent}0D`,
                    }}
                    className="px-2 py-0.5 rounded-md border text-[0.88em] font-medium text-slate-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-700">{allSkills.join('  •  ')}</p>
            )}
          </section>
        );
      }

      case 'projects':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('projects'), inSidebar)}
            <div className="space-y-3">
              {resume.projects.map((proj) => (
                <div
                  key={proj.id}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="space-y-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{proj.name || 'Project'}</h3>
                    {proj.role && (
                      <span style={{ color: accent }} className="text-[0.88em] font-semibold">
                        {proj.role}
                      </span>
                    )}
                  </div>
                  {proj.technologies && (
                    <div className="text-[0.86em] text-slate-500 font-medium">
                      Stack: {proj.technologies}
                    </div>
                  )}
                  {proj.description && <p className="text-slate-700">{proj.description}</p>}
                  {proj.url && (
                    <div className="text-[0.85em] text-slate-500 break-all">{proj.url}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'certifications':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('certifications'), inSidebar)}
            <div className="space-y-2">
              {resume.certifications.map((cert) => (
                <div
                  key={cert.id}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className={inSidebar ? 'space-y-0.5' : 'flex items-baseline justify-between gap-3'}
                >
                  <div>
                    <span className="font-bold text-slate-900">{cert.name}</span>
                    {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                    {cert.credentialId && (
                      <span className="text-[0.86em] text-slate-500"> (ID: {cert.credentialId})</span>
                    )}
                  </div>
                  {cert.issueDate && (
                    <span className="text-[0.86em] text-slate-500 shrink-0 block">
                      {cert.issueDate}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'languages':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('languages'), inSidebar)}
            <div className={inSidebar ? 'space-y-1' : 'flex flex-wrap gap-x-5 gap-y-1'}>
              {resume.languages.map((lang) => (
                <div key={lang.id} className="text-slate-700">
                  <span className="font-semibold text-slate-900">{lang.language}</span>{' '}
                  <span className="text-slate-500">({lang.proficiency})</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'achievements':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('achievements'), inSidebar)}
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              {(resume.achievements || [])
                .filter((a) => a.trim())
                .map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
            </ul>
          </section>
        );

      case 'awards':
      case 'training':
      case 'volunteer':
      case 'publications': {
        const list = resume[key] || [];
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle(key), inSidebar)}
            <div className="space-y-2.5">
              {list.map((entry) => (
                <div
                  key={entry.id}
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="space-y-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{entry.title}</h3>
                    {entry.date && (
                      <span className="text-[0.86em] text-slate-500 shrink-0">{entry.date}</span>
                    )}
                  </div>
                  {entry.organization && (
                    <div className="text-[0.9em] font-medium text-slate-600">
                      {entry.organization}
                    </div>
                  )}
                  {entry.description && <p className="text-slate-700">{entry.description}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'memberships':
        return (
          <section key={key} style={sectionStyle} className="mb-5">
            {renderSectionHeading(getSectionTitle('memberships'), inSidebar)}
            <ul className="list-disc pl-4 space-y-1 text-slate-700">
              {(resume.memberships || [])
                .filter((m) => m.trim())
                .map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
            </ul>
          </section>
        );

      case 'customSections':
        return (
          <React.Fragment key={key}>
            {(resume.customSections || []).map((cs) => {
              const items = (cs.items || []).filter((i) => i.trim());
              if (!cs.title.trim() && items.length === 0) return null;
              return (
                <section key={cs.id} style={sectionStyle} className="mb-5">
                  {renderSectionHeading(cs.title || 'Additional Information', inSidebar)}
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  const orderedVisibleSections = design.sectionOrder.filter(hasSectionContent);

  const renderHeaderBlock = () => {
    // 1. Modern Corporate & Sales/Marketing — Bold Colored Banner Header
    if (isBannerHeader) {
      const bannerBg = templateId === 'sales-marketing' ? '#102B4E' : accent;
      return (
        <header
          style={{
            backgroundColor: bannerBg,
            padding: '32px 44px',
            borderBottom: templateId === 'sales-marketing' ? `4px solid ${accent}` : '4px solid #F47A24',
          }}
          className="text-white"
        >
          <div className="flex items-center justify-between gap-5">
            <div className="min-w-0 space-y-1.5">
              {displayName && (
                <h1
                  style={{ fontSize: `${typeScale.name}px`, lineHeight: 1.15 }}
                  className="font-extrabold tracking-tight text-white"
                >
                  {displayName}
                </h1>
              )}
              {displayTitle && (
                <p
                  style={{ fontSize: `${typeScale.title}px` }}
                  className="font-semibold text-[#F47A24]"
                >
                  {displayTitle}
                </p>
              )}
              {contactItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[0.88em] text-white/85">
                  {contactItems.map((item, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="opacity-50">|</span>}
                      <span>{item}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
            {resume.showPhoto && resume.photoUrl && (
              <img
                src={resume.photoUrl}
                alt={displayName}
                className="w-20 h-20 rounded-xl object-cover border-2 border-white/25 shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </header>
      );
    }

    // 2. Minimal Elegant & Academic CV — Centered Editorial Masthead
    if (isMinimalCentered) {
      return (
        <header className="text-center pb-5 mb-6 border-b border-slate-300 space-y-2">
          {resume.showPhoto && resume.photoUrl && (
            <img
              src={resume.photoUrl}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover mx-auto border border-slate-200 mb-2"
              referrerPolicy="no-referrer"
            />
          )}
          {displayName && (
            <h1
              style={{ color: accent, fontSize: `${typeScale.name}px`, lineHeight: 1.15 }}
              className="font-bold tracking-tight"
            >
              {displayName}
            </h1>
          )}
          {displayTitle && (
            <p style={{ fontSize: `${typeScale.title}px` }} className="text-slate-600 font-medium">
              {displayTitle}
            </p>
          )}
          {contactItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.88em] text-slate-500 pt-1">
              {contactItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-300">•</span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </header>
      );
    }

    // 3. Executive — Authoritative Double-Ruled Split Masthead
    if (isExecutive) {
      return (
        <header
          style={{ borderTopColor: accent, borderBottomColor: accent }}
          className="border-t-4 border-b-2 py-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1 min-w-0">
            {displayName && (
              <h1
                style={{ color: accent, fontSize: `${typeScale.name + 2}px`, lineHeight: 1.1 }}
                className="font-extrabold uppercase tracking-wide"
              >
                {displayName}
              </h1>
            )}
            {displayTitle && (
              <p style={{ fontSize: `${typeScale.title}px` }} className="font-semibold text-[#F47A24]">
                {displayTitle}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right text-[0.86em] text-slate-600 space-y-0.5 shrink-0">
            {contactItems.map((item, i) => (
              <div key={i}>{item}</div>
            ))}
          </div>
        </header>
      );
    }

    // 4. Creative — Asymmetric Accent Left-Block Header
    if (isCreative) {
      return (
        <header
          style={{ borderLeftColor: accent }}
          className="border-l-[6px] pl-5 pb-4 mb-6 flex items-start justify-between gap-4"
        >
          <div className="space-y-1.5 min-w-0">
            {displayName && (
              <h1
                style={{ color: '#102B4E', fontSize: `${typeScale.name + 2}px`, lineHeight: 1.1 }}
                className="font-black tracking-tight"
              >
                {displayName}
              </h1>
            )}
            {displayTitle && (
              <p style={{ color: accent, fontSize: `${typeScale.title}px` }} className="font-bold">
                {displayTitle}
              </p>
            )}
            {contactItems.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1.5 text-[0.84em] text-slate-600">
                {contactItems.map((item, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
          {resume.showPhoto && resume.photoUrl && (
            <img
              src={resume.photoUrl}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover border-2 shrink-0"
              style={{ borderColor: accent }}
              referrerPolicy="no-referrer"
            />
          )}
        </header>
      );
    }

    // 5. Technology — Monospace Accent Header
    if (isTechnology) {
      return (
        <header className="pb-4 mb-5 border-b-2 border-slate-200 space-y-1.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              {displayName && (
                <h1
                  style={{ color: '#0F172A', fontSize: `${typeScale.name}px`, lineHeight: 1.15 }}
                  className="font-extrabold tracking-tight"
                >
                  {displayName}
                </h1>
              )}
              {displayTitle && (
                <p
                  style={{ color: accent, fontFamily: FONT_STACKS.mono, fontSize: `${typeScale.title - 0.5}px` }}
                  className="font-semibold mt-0.5"
                >
                  {displayTitle}
                </p>
              )}
            </div>
            {resume.showPhoto && resume.photoUrl && (
              <img
                src={resume.photoUrl}
                alt={displayName}
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          {contactItems.length > 0 && (
            <div
              style={{ fontFamily: FONT_STACKS.mono }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.82em] text-slate-600 pt-1"
            >
              {contactItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-300">/</span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </header>
      );
    }

    // 6. Classic Professional, Finance, Graduate, Contemporary default crisp header
    return (
      <header
        style={{ borderBottomColor: accent }}
        className="pb-4 mb-5 border-b-2 flex items-start justify-between gap-4"
      >
        <div className="space-y-1 min-w-0">
          {displayName && (
            <h1
              style={{ color: accent, fontSize: `${typeScale.name}px`, lineHeight: 1.15 }}
              className="font-extrabold tracking-tight"
            >
              {displayName}
            </h1>
          )}
          {displayTitle && (
            <p style={{ fontSize: `${typeScale.title}px` }} className="font-semibold text-slate-600">
              {displayTitle}
            </p>
          )}
          {contactItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[0.88em] text-slate-600">
              {contactItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-300">•</span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
        {resume.showPhoto && resume.photoUrl && (
          <img
            src={resume.photoUrl}
            alt={displayName}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
            referrerPolicy="no-referrer"
          />
        )}
      </header>
    );
  };

  // Layout A: Modern Two-Column (32% Tinted Left Sidebar + 68% Main)
  if (isTwoColumnLeft) {
    const sidebarKeys = orderedVisibleSections.filter((k) => SIDEBAR_SECTIONS.includes(k));
    const mainKeys = orderedVisibleSections.filter((k) => !SIDEBAR_SECTIONS.includes(k));

    return (
      <div
        id={id}
        style={{
          width: '794px',
          minHeight: '1123px',
          fontFamily: fontStack,
          fontSize: `${typeScale.base}px`,
          lineHeight,
        }}
        className="bg-white text-slate-800 grid grid-cols-12 box-border overflow-hidden"
      >
        {/* Left Sidebar */}
        <aside
          style={{ backgroundColor: '#F3F6FA', borderRight: '1px solid #E2E8F0' }}
          className="col-span-4 p-7 space-y-6"
        >
          <div className="space-y-3">
            {resume.showPhoto && resume.photoUrl && (
              <img
                src={resume.photoUrl}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-xs"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              {displayName && (
                <h1
                  style={{ color: accent, fontSize: `${typeScale.name - 4}px`, lineHeight: 1.15 }}
                  className="font-extrabold tracking-tight"
                >
                  {displayName}
                </h1>
              )}
              {displayTitle && (
                <p className="font-semibold text-[#F47A24] mt-1" style={{ fontSize: `${typeScale.title - 1}px` }}>
                  {displayTitle}
                </p>
              )}
            </div>
          </div>

          {contactItems.length > 0 && (
            <div>
              {renderSectionHeading('Contact', true)}
              <div className="space-y-1.5 text-[0.88em] text-slate-700 break-words">
                {contactItems.map((item, i) => (
                  <div key={i}>{item}</div>
                ))}
              </div>
            </div>
          )}

          {sidebarKeys.map((k) => renderSectionBody(k, true))}
        </aside>

        {/* Right Main Column */}
        <main className="col-span-8 p-8">
          {mainKeys.map((k) => renderSectionBody(k, false))}
        </main>
      </div>
    );
  }

  // Layout B: Contemporary (Top Navy Accent Bar + 66% Left Main + 34% Right Sidebar)
  if (isTwoColumnRight) {
    const sidebarKeys = orderedVisibleSections.filter((k) => SIDEBAR_SECTIONS.includes(k));
    const mainKeys = orderedVisibleSections.filter((k) => !SIDEBAR_SECTIONS.includes(k));

    return (
      <div
        id={id}
        style={{
          width: '794px',
          minHeight: '1123px',
          fontFamily: fontStack,
          fontSize: `${typeScale.base}px`,
          lineHeight,
        }}
        className="bg-white text-slate-800 box-border flex flex-col"
      >
        <div style={{ backgroundColor: accent }} className="h-2.5 w-full shrink-0" />
        <div style={{ padding: pagePadding }} className="flex-1 flex flex-col">
          {renderHeaderBlock()}
          <div className="grid grid-cols-12 gap-7 flex-1">
            <main className="col-span-8">
              {mainKeys.map((k) => renderSectionBody(k, false))}
            </main>
            <aside className="col-span-4 border-l border-slate-200 pl-6">
              {sidebarKeys.map((k) => renderSectionBody(k, true))}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // Layout C: Banner Header Single-Column (Modern Corporate & Sales/Marketing)
  if (isBannerHeader) {
    return (
      <div
        id={id}
        style={{
          width: '794px',
          minHeight: '1123px',
          fontFamily: fontStack,
          fontSize: `${typeScale.base}px`,
          lineHeight,
        }}
        className="bg-white text-slate-800 box-border"
      >
        {renderHeaderBlock()}
        <div style={{ padding: pagePadding }}>
          {orderedVisibleSections.map((k) => renderSectionBody(k, false))}
        </div>
      </div>
    );
  }

  // Layout D: Single-Column Variants (Classic, Minimal, Executive, Technology, Creative, Finance, Graduate, Academic)
  return (
    <div
      id={id}
      style={{
        width: '794px',
        minHeight: '1123px',
        fontFamily: fontStack,
        fontSize: `${typeScale.base}px`,
        lineHeight,
        padding: pagePadding,
      }}
      className="bg-white text-slate-800 box-border"
    >
      {renderHeaderBlock()}
      <div>{orderedVisibleSections.map((k) => renderSectionBody(k, false))}</div>
    </div>
  );
};

export default ResumeDocumentRenderer;
