import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResumeData,
  ResumeTemplateId,
  EMPTY_RESUME,
  DEFAULT_DESIGN_SETTINGS,
  getResumeDesign,
} from '../../../types/resume';
import {
  RESUME_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TemplateCategory,
  ResumeTemplateSpec,
  getTemplateSectionOrder,
} from '../templates/templateCatalog';
import { ResumeDocumentRenderer } from '../templates/ResumeDocumentRenderer';
import { EASE_PREMIUM } from '../../../lib/motion';
import { Check, Eye, ShieldCheck, Sparkles, X, ArrowRight } from 'lucide-react';

interface TemplateGalleryProps {
  resume?: ResumeData | null;
  selectedTemplateId?: ResumeTemplateId;
  onSelectTemplate: (template: ResumeTemplateSpec) => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const PREVIEW_SAMPLE_RESUME: ResumeData = {
  ...EMPTY_RESUME,
  id: 'sample_preview',
  userId: 'preview',
  title: 'Sample Preview',
  fullName: 'Aarav Mehta',
  professionalTitle: 'Senior Operations & Strategy Manager',
  email: 'aarav.mehta@example.com',
  phone: '+91 98765 43210',
  city: 'Bengaluru',
  state: 'Karnataka',
  linkedIn: 'linkedin.com/in/aaravmehta',
  portfolio: 'aaravmehta.in',
  summary:
    'Operations leader with 6+ years guiding cross-functional delivery, process optimization, and enterprise client accounts across technology and consulting teams.',
  experiences: [
    {
      id: 'sample_exp_1',
      jobTitle: 'Operations Manager',
      companyName: 'Meridian Consulting Group',
      employmentType: 'Full-time',
      location: 'Bengaluru',
      startMonth: 'Apr',
      startYear: '2021',
      endMonth: '',
      endYear: '',
      currentlyWorking: true,
      responsibilities: [
        'Led regional service delivery across 18 enterprise client accounts and a 12-person operations team.',
        'Standardized quarterly reporting workflows and client onboarding playbooks.',
      ],
      achievements: ['Improved on-time milestone delivery from 84% to 97% within two quarters.'],
    },
    {
      id: 'sample_exp_2',
      jobTitle: 'Business Analyst',
      companyName: 'Apex Financial Systems',
      employmentType: 'Full-time',
      location: 'Mumbai',
      startMonth: 'Jun',
      startYear: '2018',
      endMonth: 'Mar',
      endYear: '2021',
      currentlyWorking: false,
      responsibilities: [
        'Analyzed operational KPIs and prepared executive dashboards for leadership reviews.',
      ],
      achievements: [],
    },
  ],
  education: [
    {
      id: 'sample_edu_1',
      degree: 'MBA',
      fieldOfStudy: 'Operations & Strategy',
      institution: 'NMIMS University',
      location: 'Mumbai',
      startDate: '2016',
      endDate: '2018',
      grade: '3.8 / 4.0',
      description: '',
    },
  ],
  skills: [
    'Operations Strategy',
    'Stakeholder Management',
    'Process Optimization',
    'SQL & Excel',
    'Tableau',
    'Project Governance',
  ],
  skillCategories: {
    technical: ['SQL', 'Data Modeling', 'KPI Dashboards'],
    professional: ['Operations Strategy', 'Stakeholder Management', 'Cross-Functional Leadership'],
    industry: ['Enterprise Consulting', 'Process Optimization'],
    tools: ['Tableau', 'Jira', 'Microsoft Excel'],
  },
  projects: [
    {
      id: 'sample_proj_1',
      name: 'Client Onboarding Modernization',
      role: 'Program Lead',
      technologies: 'Jira, Power BI',
      description: 'Unified 4 regional onboarding checklists into a single trackable workflow.',
      url: '',
    },
  ],
  certifications: [
    {
      id: 'sample_cert_1',
      name: 'Lean Six Sigma Green Belt',
      issuer: 'ASQ',
      issueDate: '2022',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
    },
  ],
  languages: [
    { id: 'sample_lang_1', language: 'English', proficiency: 'Fluent' },
    { id: 'sample_lang_2', language: 'Hindi', proficiency: 'Native' },
  ],
  achievements: ['Recognized with Annual Delivery Excellence Award (2023).'],
  template: 'classic-professional',
  design: { ...DEFAULT_DESIGN_SETTINGS },
  updatedAt: new Date().toISOString(),
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  resume,
  selectedTemplateId,
  onSelectTemplate,
  title = 'Choose Your Resume Template',
  subtitle = 'Preview every layout using your actual content. You can switch templates anytime without losing your information.',
  compact = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('All');
  const [inspectTemplate, setInspectTemplate] = useState<ResumeTemplateSpec | null>(null);

  const hasUserContent = Boolean(
    resume &&
      (resume.fullName?.trim() ||
        resume.summary?.trim() ||
        resume.experiences.length > 0 ||
        resume.education.length > 0 ||
        resume.skills.length > 0)
  );

  const previewBaseResume = hasUserContent && resume ? resume : PREVIEW_SAMPLE_RESUME;

  const filteredTemplates = useMemo(() => {
    if (activeCategory === 'All') return RESUME_TEMPLATES;
    return RESUME_TEMPLATES.filter((t) => t.categories.includes(activeCategory));
  }, [activeCategory]);

  const buildPreviewResume = (spec: ResumeTemplateSpec): ResumeData => {
    const baseDesign = getResumeDesign(previewBaseResume);
    return {
      ...previewBaseResume,
      template: spec.id,
      design: {
        ...baseDesign,
        templateId: spec.id,
        accentColor: spec.defaultAccent,
        fontFamily: spec.defaultFont,
        sectionOrder: getTemplateSectionOrder(spec.id),
      },
    };
  };

  return (
    <div className="space-y-6">
      {/* Header & Category Filter Strip */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E] tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#778397] max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>
          {!hasUserContent && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#102B4E]/[0.06] border border-[#102B4E]/15 text-[#102B4E] text-[11px] font-semibold self-start sm:self-auto shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
              <span>Showing sample preview</span>
            </span>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TEMPLATE_CATEGORIES.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`relative min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'text-white'
                    : 'bg-white border border-[#E5EAF0] text-[#253449] hover:border-[#102B4E]/30 hover:text-[#102B4E]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="template-gallery-cat-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#102B4E]"
                  />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Grid */}
      <div
        className={`grid gap-5 ${
          compact
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {filteredTemplates.map((spec, idx) => {
          const isSelected = selectedTemplateId === spec.id;
          const previewDoc = buildPreviewResume(spec);

          return (
            <motion.div
              key={spec.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.035, 0.25), ease: EASE_PREMIUM }}
              className={`group bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 ${
                isSelected
                  ? 'border-[#F47A24] ring-2 ring-[#F47A24]/20 shadow-md'
                  : 'border-[#E5EAF0] hover:border-[#102B4E]/35 hover:shadow-md shadow-2xs'
              }`}
            >
              {/* Scaled Miniature Actual Document Preview */}
              <div className="relative bg-[#EFF3F8] border-b border-[#E5EAF0] h-[270px] sm:h-[290px] overflow-hidden flex justify-center pt-4">
                <div
                  style={{
                    width: '794px',
                    transform: 'scale(0.31)',
                    transformOrigin: 'top center',
                  }}
                  className="pointer-events-none select-none shadow-lg rounded-xs bg-white shrink-0"
                >
                  <ResumeDocumentRenderer resume={previewDoc} showPlaceholderWhenEmpty />
                </div>

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#F47A24] text-white text-[11px] font-bold shadow-sm inline-flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Selected</span>
                  </div>
                )}

                {/* Hover Quick Inspect Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#081D36]/80 via-[#081D36]/35 to-transparent flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    type="button"
                    onClick={() => setInspectTemplate(spec)}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(spec)}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Use This Template</span>
                  </button>
                </div>
              </div>

              {/* Template Metadata Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#102B4E]">
                      {spec.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[#778397] text-[10px] font-semibold shrink-0">
                      {spec.layoutLabel}
                    </span>
                  </div>

                  <p className="text-xs text-[#778397] leading-relaxed">{spec.description}</p>

                  {/* Honest ATS Compatibility Guidance */}
                  <div className="p-2.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-start gap-2 text-[11px] text-[#253449]">
                    <ShieldCheck
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        spec.atsTier === 'high'
                          ? 'text-emerald-600'
                          : spec.atsTier === 'moderate'
                          ? 'text-[#102B4E]'
                          : 'text-[#F47A24]'
                      }`}
                    />
                    <span className="leading-snug">{spec.atsGuidance}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(spec)}
                    className={`flex-1 min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#102B4E] text-white'
                        : 'bg-[#F6F8FB] hover:bg-[#102B4E] text-[#102B4E] hover:text-white border border-[#E5EAF0]'
                    }`}
                  >
                    <span>{isSelected ? 'Selected Template' : 'Use This Template'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full-Size Template Preview Modal */}
      <AnimatePresence>
        {inspectTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInspectTemplate(null)}
            className="fixed inset-0 z-50 bg-[#081D36]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE_PREMIUM }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[calc(100vw-1.5rem)] lg:max-w-4xl bg-white rounded-xl border border-[#E5EAF0] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="px-5 py-4 bg-[#102B4E] text-white flex items-center justify-between gap-4 border-b-2 border-[#F47A24] shrink-0">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold truncate">
                    {inspectTemplate.name} — {inspectTemplate.layoutLabel}
                  </h3>
                  <p className="text-xs text-white/75 truncate">{inspectTemplate.atsGuidance}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectTemplate(null)}
                  aria-label="Close template preview"
                  className="p-2 rounded-xl hover:bg-white/10 text-white cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 bg-[#EFF3F8] overflow-auto flex-1 flex justify-center">
                <div className="origin-top scale-[0.42] sm:scale-[0.68] md:scale-[0.8] lg:scale-[0.88] shadow-xl bg-white shrink-0 mb-8">
                  <ResumeDocumentRenderer
                    resume={buildPreviewResume(inspectTemplate)}
                    showPlaceholderWhenEmpty
                  />
                </div>
              </div>

              <div className="px-5 py-4 bg-white border-t border-[#E5EAF0] flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setInspectTemplate(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5EAF0] text-[#253449] text-xs sm:text-sm font-semibold hover:bg-[#F6F8FB] cursor-pointer"
                >
                  Back to Gallery
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(inspectTemplate);
                    setInspectTemplate(null);
                  }}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TemplateGallery;
