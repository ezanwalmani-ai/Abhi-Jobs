import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResumeData,
  ResumeSkillCategoryKey,
  EMPTY_SKILL_CATEGORIES,
  calculateResumeCompletion,
  flattenSkillCategories,
  getResumeDesign,
} from '../../../types/resume';
import {
  generateSummarySuggestion,
  improveExperienceBullet,
  SummaryAiAction,
  BulletAiAction,
} from '../../../services/resumeAiAssistant';
import { ResumeAdditionalSectionsEditor } from './ResumeAdditionalSectionsEditor';
import { TemplateGallery } from './TemplateGallery';
import {
  ResumeTemplateSpec,
  getTemplateSectionOrder,
} from '../templates/templateCatalog';
import { EASE_PREMIUM } from '../../../lib/motion';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Sparkles,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Search,
} from 'lucide-react';

interface ResumeGuidedWizardProps {
  resume: ResumeData;
  initialStep?: number;
  onChange: (updates: Partial<ResumeData>) => void;
  onSaveAndContinueLater: () => void;
  onFinishToStudio: (template?: ResumeTemplateSpec) => void;
  onBackToStart: () => void;
}

const WIZARD_STEPS = [
  { id: 1, label: 'Personal Info' },
  { id: 2, label: 'Summary' },
  { id: 3, label: 'Experience' },
  { id: 4, label: 'Education' },
  { id: 5, label: 'Skills' },
  { id: 6, label: 'Additional' },
  { id: 7, label: 'Review' },
  { id: 8, label: 'Template' },
];

const SKILL_SUGGESTIONS: Record<ResumeSkillCategoryKey, string[]> = {
  technical: [
    'Data Analysis',
    'SQL',
    'Python',
    'React',
    'TypeScript',
    'Financial Modeling',
    'SEO & SEM',
    'UI/UX Design',
  ],
  professional: [
    'Project Management',
    'Stakeholder Communication',
    'Team Leadership',
    'Problem Solving',
    'Client Relations',
    'Strategic Planning',
  ],
  industry: [
    'Recruitment & HR',
    'Enterprise Sales',
    'Supply Chain Operations',
    'Digital Marketing',
    'Corporate Finance',
    'SaaS Product Delivery',
  ],
  tools: [
    'Microsoft Excel',
    'Power BI',
    'Tableau',
    'Jira',
    'Salesforce',
    'Figma',
    'Google Workspace',
    'SAP',
  ],
};

const SKILL_CATEGORY_LABELS: Record<ResumeSkillCategoryKey, string> = {
  technical: 'Technical Skills',
  professional: 'Professional Skills',
  industry: 'Industry Skills',
  tools: 'Software & Tools',
};

export const ResumeGuidedWizard: React.FC<ResumeGuidedWizardProps> = ({
  resume,
  initialStep = 1,
  onChange,
  onSaveAndContinueLater,
  onFinishToStudio,
  onBackToStart,
}) => {
  const [step, setStep] = useState<number>(initialStep);

  // Step 2 AI Suggestion preview state (requires explicit candidate approval)
  const [summarySuggestion, setSummarySuggestion] = useState<{ text: string; note: string } | null>(
    null
  );

  // Step 3 AI Bullet Suggestion preview state
  const [bulletSuggestion, setBulletSuggestion] = useState<{
    expId: string;
    field: 'responsibilities' | 'achievements';
    idx: number;
    text: string;
    note: string;
  } | null>(null);

  // Step 5 Skill search & active category
  const [activeSkillCategory, setActiveSkillCategory] =
    useState<ResumeSkillCategoryKey>('technical');
  const [skillInput, setSkillInput] = useState('');

  const completion = useMemo(() => calculateResumeCompletion(resume), [resume]);
  const design = useMemo(() => getResumeDesign(resume), [resume]);

  const skillCategories = useMemo(
    () =>
      resume.skillCategories || {
        ...EMPTY_SKILL_CATEGORIES,
        technical: [...(resume.skills || [])],
      },
    [resume.skillCategories, resume.skills]
  );

  const updateSkillCategory = (cat: ResumeSkillCategoryKey, nextItems: string[]) => {
    const nextCats = {
      ...skillCategories,
      [cat]: nextItems,
    };
    onChange({
      skillCategories: nextCats,
      skills: flattenSkillCategories(nextCats),
    });
  };

  const handleAddSkill = (rawSkill: string, cat = activeSkillCategory) => {
    const clean = rawSkill.trim();
    if (!clean) return;
    const current = skillCategories[cat] || [];
    if (current.some((s) => s.toLowerCase() === clean.toLowerCase())) return;
    updateSkillCategory(cat, [...current, clean]);
    setSkillInput('');
  };

  const handleMoveSkill = (cat: ResumeSkillCategoryKey, idx: number, dir: -1 | 1) => {
    const current = [...(skillCategories[cat] || [])];
    const target = idx + dir;
    if (target < 0 || target >= current.length) return;
    [current[idx], current[target]] = [current[target], current[idx]];
    updateSkillCategory(cat, current);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 3 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ photoUrl: reader.result, showPhoto: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSummaryAi = (action: SummaryAiAction) => {
    const result = generateSummarySuggestion(resume, action);
    setSummarySuggestion(result);
  };

  const handleExperienceMove = (idx: number, dir: -1 | 1) => {
    const list = [...resume.experiences];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    onChange({ experiences: list });
  };

  const handleBulletAi = (
    expId: string,
    field: 'responsibilities' | 'achievements',
    idx: number,
    text: string,
    action: BulletAiAction
  ) => {
    const result = improveExperienceBullet(text, action);
    if (!result.text) return;
    setBulletSuggestion({ expId, field, idx, text: result.text, note: result.note });
  };

  const handleSelectTemplateStep8 = (spec: ResumeTemplateSpec) => {
    const nextDesign = {
      ...design,
      templateId: spec.id,
      accentColor: spec.defaultAccent,
      fontFamily: spec.defaultFont,
      sectionOrder: getTemplateSectionOrder(spec.id),
    };
    onChange({
      template: spec.id,
      design: nextDesign,
    });
    onFinishToStudio(spec);
  };

  const filteredSuggestions = SKILL_SUGGESTIONS[activeSkillCategory].filter(
    (s) =>
      !skillCategories[activeSkillCategory].includes(s) &&
      (!skillInput.trim() || s.toLowerCase().includes(skillInput.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Bar: Back + Resume Name + Save & Continue Later */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToStart}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#778397] hover:text-[#102B4E] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span className="text-[#CBD5E1]">|</span>
          <input
            type="text"
            value={resume.title || ''}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Resume Name (e.g. Product Manager Resume)"
            className="bg-transparent text-sm sm:text-base font-extrabold text-[#102B4E] focus:outline-hidden border-b border-transparent focus:border-[#F47A24] truncate min-w-0 max-w-xs"
          />
        </div>

        <button
          type="button"
          onClick={onSaveAndContinueLater}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#102B4E]/30 text-[#102B4E] text-xs font-bold inline-flex items-center justify-center gap-1.5 self-start sm:self-auto shadow-2xs transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-[#F47A24]" />
          <span>Save &amp; Continue Later</span>
        </button>
      </div>

      {/* 8-Step Progress Indicator */}
      <nav
        aria-label="Resume builder steps"
        className="bg-white rounded-2xl border border-[#E5EAF0] p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {WIZARD_STEPS.map((s) => {
            const isCurrent = step === s.id;
            const isDone = step > s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`relative min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-[#102B4E] text-white shadow-xs'
                    : isDone
                    ? 'bg-[#102B4E]/[0.06] text-[#102B4E] hover:bg-[#102B4E]/10'
                    : 'text-[#778397] hover:bg-[#F6F8FB] hover:text-[#102B4E]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-[#F47A24] text-white'
                      : isDone
                      ? 'bg-[#102B4E] text-white'
                      : 'bg-[#E5EAF0] text-[#778397]'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24, ease: EASE_PREMIUM }}
          className={
            step === 8
              ? ''
              : 'bg-white rounded-3xl border border-[#E5EAF0] p-5 sm:p-8 shadow-2xs space-y-6'
          }
        >
          {/* STEP 1 — Personal Information */}
          {step === 1 && (
            <>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                  Step 1 of 8
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                  Personal Information
                </h2>
                <p className="text-xs sm:text-sm text-[#778397]">
                  Enter accurate contact details so employers and ABHI JOBS recruiters can reach you easily.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">Full Name *</span>
                  <input
                    type="text"
                    value={resume.fullName}
                    onChange={(e) => onChange({ fullName: e.target.value })}
                    placeholder="e.g. Rohan Kulkarni"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">Professional Title</span>
                  <input
                    type="text"
                    value={resume.professionalTitle}
                    onChange={(e) =>
                      onChange({ professionalTitle: e.target.value, targetRole: e.target.value })
                    }
                    placeholder="e.g. Senior Business Analyst"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">Email Address *</span>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) => onChange({ email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">Phone Number</span>
                  <input
                    type="tel"
                    value={resume.phone}
                    onChange={(e) => onChange({ phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">City</span>
                  <input
                    type="text"
                    value={resume.city}
                    onChange={(e) => onChange({ city: e.target.value })}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">State / Country</span>
                  <input
                    type="text"
                    value={resume.state}
                    onChange={(e) => onChange({ state: e.target.value })}
                    placeholder="e.g. Karnataka"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">LinkedIn URL</span>
                  <input
                    type="url"
                    value={resume.linkedIn}
                    onChange={(e) => onChange({ linkedIn: e.target.value })}
                    placeholder="linkedin.com/in/yourprofile"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="font-semibold text-[#253449]">Portfolio / Website URL</span>
                  <input
                    type="url"
                    value={resume.portfolio}
                    onChange={(e) => onChange({ portfolio: e.target.value })}
                    placeholder="yourportfolio.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[44px]"
                  />
                </label>
              </div>

              {/* Optional Profile Photograph */}
              <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {resume.photoUrl ? (
                    <img
                      src={resume.photoUrl}
                      alt="Profile preview"
                      className="w-12 h-12 rounded-xl object-cover border border-[#E5EAF0]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E5EAF0] flex items-center justify-center text-[#778397]">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <div className="text-xs">
                    <div className="font-bold text-[#102B4E]">Profile Photograph (Optional)</div>
                    <p className="text-[#778397]">
                      Include a headshot if appropriate for your industry or region.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="min-h-[38px] px-3.5 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#102B4E] text-xs font-semibold text-[#102B4E] cursor-pointer inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#F47A24]" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#253449] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resume.showPhoto}
                      onChange={(e) => onChange({ showPhoto: e.target.checked })}
                      className="w-4 h-4 accent-[#102B4E]"
                    />
                    <span>Show on resume</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Professional Summary */}
          {step === 2 && (
            <>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                  Step 2 of 8
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                  Professional Summary
                </h2>
                <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                  A strong summary is 2–4 concise sentences highlighting your core role, real strengths, and the type of contribution you bring to an employer.
                </p>
              </div>

              {/* Optional AI Writing Assistance Controls */}
              <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#102B4E]">
                  <Sparkles className="w-4 h-4 text-[#F47A24]" />
                  <span>Optional Writing Assistance (Fact-Safe — Never Invents Experience)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'write' as const, label: 'Write Summary from My Info' },
                    { id: 'improve' as const, label: 'Improve Wording' },
                    { id: 'concise' as const, label: 'Make Concise' },
                    { id: 'tone_executive' as const, label: 'Executive Tone' },
                    { id: 'tone_confident' as const, label: 'Confident Tone' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => handleSummaryAi(btn.id)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F47A24] hover:text-[#102B4E] text-[#253449] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Candidate-Approved Suggestion Preview */}
                {summarySuggestion && (
                  <div className="p-4 rounded-xl bg-white border-2 border-[#F47A24]/40 space-y-3">
                    <div className="text-[11px] font-bold text-[#F47A24] uppercase tracking-wider">
                      Suggested Draft — Review Before Applying
                    </div>
                    <textarea
                      rows={4}
                      value={summarySuggestion.text}
                      onChange={(e) =>
                        setSummarySuggestion({ ...summarySuggestion, text: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs sm:text-sm text-[#253449] leading-relaxed"
                    />
                    <p className="text-[11px] text-[#778397]">{summarySuggestion.note}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onChange({ summary: summarySuggestion.text });
                          setSummarySuggestion(null);
                        }}
                        className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold cursor-pointer"
                      >
                        Approve &amp; Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummarySuggestion(null)}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#E5EAF0] text-[#778397] hover:text-[#102B4E] text-xs font-semibold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={7}
                  value={resume.summary}
                  onChange={(e) => onChange({ summary: e.target.value })}
                  placeholder="Write 2–4 concise sentences summarizing your background, key strengths, and career focus..."
                  className="w-full p-4 rounded-2xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden text-sm text-[#253449] leading-relaxed"
                />
                <div className="text-right text-[11px] text-[#778397]">
                  {resume.summary.trim().split(/\s+/).filter(Boolean).length} words (recommended: 40–75)
                </div>
              </div>
            </>
          )}

          {/* STEP 3 — Work Experience */}
          {step === 3 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                    Step 3 of 8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                    Work Experience
                  </h2>
                  <p className="text-xs sm:text-sm text-[#778397]">
                    Add your full-time roles, internships, or contract positions in reverse chronological order.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      experiences: [
                        ...resume.experiences,
                        {
                          id: `exp_${Date.now()}`,
                          jobTitle: '',
                          companyName: '',
                          employmentType: 'Full-time',
                          location: '',
                          startMonth: '',
                          startYear: '',
                          endMonth: '',
                          endYear: '',
                          currentlyWorking: false,
                          responsibilities: [''],
                          achievements: [],
                        },
                      ],
                    })
                  }
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold inline-flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#F47A24]" />
                  <span>Add Experience</span>
                </button>
              </div>

              {resume.experiences.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#F6F8FB] border border-dashed border-[#CBD5E1] text-center space-y-3">
                  <p className="text-sm font-semibold text-[#102B4E]">
                    No work experience added yet
                  </p>
                  <p className="text-xs text-[#778397] max-w-md mx-auto">
                    Add a job, internship, or freelance role. If you are a recent graduate with no formal experience yet, you can skip ahead to Education &amp; Projects.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {resume.experiences.map((exp, expIdx) => (
                    <div
                      key={exp.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#102B4E]">
                          Position #{expIdx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleExperienceMove(expIdx, -1)}
                            disabled={expIdx === 0}
                            title="Move up"
                            className="p-1.5 rounded-lg hover:bg-white text-[#778397] hover:text-[#102B4E] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExperienceMove(expIdx, 1)}
                            disabled={expIdx === resume.experiences.length - 1}
                            title="Move down"
                            className="p-1.5 rounded-lg hover:bg-white text-[#778397] hover:text-[#102B4E] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onChange({
                                experiences: resume.experiences.filter((e) => e.id !== exp.id),
                              })
                            }
                            title="Delete position"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, jobTitle: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Job Title *"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white font-semibold text-[#102B4E] min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={exp.companyName}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, companyName: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Company Name *"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, location: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Location (e.g. Mumbai / Remote)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs items-center">
                        <input
                          type="text"
                          value={exp.startMonth}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, startMonth: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Start Month (Jan)"
                          className="px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white min-h-[40px]"
                        />
                        <input
                          type="text"
                          value={exp.startYear}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, startYear: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Start Year (2022)"
                          className="px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white min-h-[40px]"
                        />
                        <input
                          type="text"
                          value={exp.endMonth}
                          disabled={exp.currentlyWorking}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, endMonth: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="End Month"
                          className="px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white disabled:opacity-45 min-h-[40px]"
                        />
                        <input
                          type="text"
                          value={exp.endYear}
                          disabled={exp.currentlyWorking}
                          onChange={(e) =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id ? { ...item, endYear: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="End Year"
                          className="px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white disabled:opacity-45 min-h-[40px]"
                        />
                        <label className="col-span-2 sm:col-span-1 flex items-center gap-2 font-semibold text-[#253449] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.currentlyWorking}
                            onChange={(e) =>
                              onChange({
                                experiences: resume.experiences.map((item) =>
                                  item.id === exp.id
                                    ? { ...item, currentlyWorking: e.target.checked }
                                    : item
                                ),
                              })
                            }
                            className="w-4 h-4 accent-[#102B4E]"
                          />
                          <span>Current role</span>
                        </label>
                      </div>

                      {/* Responsibilities */}
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-[#102B4E]">Responsibilities</div>
                        {exp.responsibilities.map((resp, rIdx) => (
                          <div key={rIdx} className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <input
                                type="text"
                                value={resp}
                                onChange={(e) =>
                                  onChange({
                                    experiences: resume.experiences.map((item) =>
                                      item.id === exp.id
                                        ? {
                                            ...item,
                                            responsibilities: item.responsibilities.map((b, i) =>
                                              i === rIdx ? e.target.value : b
                                            ),
                                          }
                                        : item
                                    ),
                                  })
                                }
                                placeholder="Describe a core responsibility..."
                                className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white min-h-[40px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleBulletAi(exp.id, 'responsibilities', rIdx, resp, 'improve')
                                }
                                title="Improve wording with AI"
                                className="min-h-[40px] px-2.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F47A24] text-[#102B4E] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
                                <span className="hidden sm:inline">Polish</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    experiences: resume.experiences.map((item) =>
                                      item.id === exp.id
                                        ? {
                                            ...item,
                                            responsibilities: item.responsibilities.filter(
                                              (_, i) => i !== rIdx
                                            ),
                                          }
                                        : item
                                    ),
                                  })
                                }
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {bulletSuggestion &&
                              bulletSuggestion.expId === exp.id &&
                              bulletSuggestion.field === 'responsibilities' &&
                              bulletSuggestion.idx === rIdx && (
                                <div className="p-3 rounded-xl bg-white border-2 border-[#F47A24]/40 space-y-2">
                                  <input
                                    type="text"
                                    value={bulletSuggestion.text}
                                    onChange={(e) =>
                                      setBulletSuggestion({
                                        ...bulletSuggestion,
                                        text: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-xs"
                                  />
                                  <p className="text-[11px] text-[#778397]">
                                    {bulletSuggestion.note}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onChange({
                                          experiences: resume.experiences.map((item) =>
                                            item.id === exp.id
                                              ? {
                                                  ...item,
                                                  responsibilities: item.responsibilities.map(
                                                    (b, i) =>
                                                      i === rIdx ? bulletSuggestion.text : b
                                                  ),
                                                }
                                              : item
                                          ),
                                        });
                                        setBulletSuggestion(null);
                                      }}
                                      className="px-3 py-1 rounded-lg bg-[#102B4E] text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Apply
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setBulletSuggestion(null)}
                                      className="px-2.5 py-1 rounded-lg border border-[#E5EAF0] text-[11px] text-[#778397] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id
                                  ? { ...item, responsibilities: [...item.responsibilities, ''] }
                                  : item
                              ),
                            })
                          }
                          className="text-xs font-bold text-[#102B4E] hover:text-[#F47A24] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Responsibility</span>
                        </button>
                      </div>

                      {/* Achievements */}
                      <div className="space-y-2 text-xs pt-2 border-t border-[#E5EAF0]">
                        <div className="font-bold text-[#102B4E]">
                          Achievements (Optional Highlights)
                        </div>
                        {(exp.achievements || []).map((ach, aIdx) => (
                          <div key={aIdx} className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <input
                                type="text"
                                value={ach}
                                onChange={(e) =>
                                  onChange({
                                    experiences: resume.experiences.map((item) =>
                                      item.id === exp.id
                                        ? {
                                            ...item,
                                            achievements: (item.achievements || []).map((b, i) =>
                                              i === aIdx ? e.target.value : b
                                            ),
                                          }
                                        : item
                                    ),
                                  })
                                }
                                placeholder="Highlight a measurable result or win..."
                                className="flex-1 px-3 py-2 rounded-xl border border-[#E5EAF0] bg-white min-h-[40px]"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleBulletAi(exp.id, 'achievements', aIdx, ach, 'impact')
                                }
                                title="Refine achievement wording"
                                className="min-h-[40px] px-2.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#F47A24] text-[#102B4E] font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
                                <span className="hidden sm:inline">Refine</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    experiences: resume.experiences.map((item) =>
                                      item.id === exp.id
                                        ? {
                                            ...item,
                                            achievements: (item.achievements || []).filter(
                                              (_, i) => i !== aIdx
                                            ),
                                          }
                                        : item
                                    ),
                                  })
                                }
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {bulletSuggestion &&
                              bulletSuggestion.expId === exp.id &&
                              bulletSuggestion.field === 'achievements' &&
                              bulletSuggestion.idx === aIdx && (
                                <div className="p-3 rounded-xl bg-white border-2 border-[#F47A24]/40 space-y-2">
                                  <input
                                    type="text"
                                    value={bulletSuggestion.text}
                                    onChange={(e) =>
                                      setBulletSuggestion({
                                        ...bulletSuggestion,
                                        text: e.target.value,
                                      })
                                    }
                                    className="w-full px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-xs"
                                  />
                                  <p className="text-[11px] text-[#778397]">
                                    {bulletSuggestion.note}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onChange({
                                          experiences: resume.experiences.map((item) =>
                                            item.id === exp.id
                                              ? {
                                                  ...item,
                                                  achievements: (item.achievements || []).map(
                                                    (b, i) =>
                                                      i === aIdx ? bulletSuggestion.text : b
                                                  ),
                                                }
                                              : item
                                          ),
                                        });
                                        setBulletSuggestion(null);
                                      }}
                                      className="px-3 py-1 rounded-lg bg-[#102B4E] text-white text-[11px] font-bold cursor-pointer"
                                    >
                                      Apply
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setBulletSuggestion(null)}
                                      className="px-2.5 py-1 rounded-lg border border-[#E5EAF0] text-[11px] text-[#778397] cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              experiences: resume.experiences.map((item) =>
                                item.id === exp.id
                                  ? { ...item, achievements: [...(item.achievements || []), ''] }
                                  : item
                              ),
                            })
                          }
                          className="text-xs font-bold text-[#102B4E] hover:text-[#F47A24] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Achievement</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 4 — Education */}
          {step === 4 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                    Step 4 of 8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">Education</h2>
                  <p className="text-xs sm:text-sm text-[#778397]">
                    Include your university degrees, diplomas, or specialized academic qualifications.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      education: [
                        ...resume.education,
                        {
                          id: `edu_${Date.now()}`,
                          degree: '',
                          fieldOfStudy: '',
                          institution: '',
                          location: '',
                          startDate: '',
                          endDate: '',
                          grade: '',
                          description: '',
                        },
                      ],
                    })
                  }
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold inline-flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#F47A24]" />
                  <span>Add Education</span>
                </button>
              </div>

              {resume.education.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#F6F8FB] border border-dashed border-[#CBD5E1] text-center space-y-2">
                  <p className="text-sm font-semibold text-[#102B4E]">No education records yet</p>
                  <p className="text-xs text-[#778397]">
                    Click "Add Education" above to enter your degree and institution.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resume.education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold uppercase tracking-wider text-[#102B4E]">
                          Education #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              education: resume.education.filter((e) => e.id !== edu.id),
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) =>
                            onChange({
                              education: resume.education.map((item) =>
                                item.id === edu.id ? { ...item, institution: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Institution / University *"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white font-semibold text-[#102B4E] min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            onChange({
                              education: resume.education.map((item) =>
                                item.id === edu.id ? { ...item, degree: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Degree (e.g. B.Tech, MBA, B.Com) *"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={edu.fieldOfStudy || ''}
                          onChange={(e) =>
                            onChange({
                              education: resume.education.map((item) =>
                                item.id === edu.id
                                  ? { ...item, fieldOfStudy: e.target.value }
                                  : item
                              ),
                            })
                          }
                          placeholder="Field of Study (e.g. Computer Science)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={edu.grade || ''}
                          onChange={(e) =>
                            onChange({
                              education: resume.education.map((item) =>
                                item.id === edu.id ? { ...item, grade: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Grade / CGPA (optional)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) =>
                            onChange({
                              education: resume.education.map((item) =>
                                item.id === edu.id ? { ...item, startDate: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="Start Year (e.g. 2019)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) =>
                            onChange({
                              education: resume.education.map((item) =>
                                item.id === edu.id ? { ...item, endDate: e.target.value } : item
                              ),
                            })
                          }
                          placeholder="End Year (or Expected 2026)"
                          className="px-3 py-2.5 rounded-xl border border-[#E5EAF0] bg-white min-h-[42px]"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={edu.description}
                        onChange={(e) =>
                          onChange({
                            education: resume.education.map((item) =>
                              item.id === edu.id ? { ...item, description: e.target.value } : item
                            ),
                          })
                        }
                        placeholder="Additional details (honors, coursework, thesis — optional)"
                        className="w-full p-3 rounded-xl border border-[#E5EAF0] bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 5 — Skills (Searchable Categorized Tags, User-Approved Only) */}
          {step === 5 && (
            <>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                  Step 5 of 8
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">Skills</h2>
                <p className="text-xs sm:text-sm text-[#778397]">
                  Organize your verified skills across categories. Reorder or remove any tag anytime — skills are only added when you choose them.
                </p>
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SKILL_CATEGORY_LABELS) as ResumeSkillCategoryKey[]).map((cat) => {
                  const isActive = activeSkillCategory === cat;
                  const count = (skillCategories[cat] || []).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveSkillCategory(cat)}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#102B4E] text-white'
                          : 'bg-[#F6F8FB] border border-[#E5EAF0] text-[#253449] hover:border-[#102B4E]/30'
                      }`}
                    >
                      <span>{SKILL_CATEGORY_LABELS[cat]}</span>
                      {count > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                            isActive ? 'bg-[#F47A24] text-white' : 'bg-white text-[#102B4E]'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search / Add Skill Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(skillInput);
                      }
                    }}
                    placeholder={`Type a skill for ${SKILL_CATEGORY_LABELS[activeSkillCategory]} and press Enter...`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden text-xs sm:text-sm min-h-[44px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddSkill(skillInput)}
                  className="min-h-[44px] px-5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold cursor-pointer shrink-0"
                >
                  Add Skill
                </button>
              </div>

              {/* Selected Skills in Current Category with Reorder */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#102B4E]">
                  Your {SKILL_CATEGORY_LABELS[activeSkillCategory]} (
                  {(skillCategories[activeSkillCategory] || []).length})
                </div>
                {(skillCategories[activeSkillCategory] || []).length === 0 ? (
                  <p className="text-xs text-[#778397]">
                    No skills added in this category yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(skillCategories[activeSkillCategory] || []).map((skill, idx) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102B4E] text-white text-xs font-semibold"
                      >
                        <button
                          type="button"
                          onClick={() => handleMoveSkill(activeSkillCategory, idx, -1)}
                          disabled={idx === 0}
                          title="Move left"
                          className="text-white/60 hover:text-white disabled:opacity-25 cursor-pointer"
                        >
                          ‹
                        </button>
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleMoveSkill(activeSkillCategory, idx, 1)}
                          disabled={idx === (skillCategories[activeSkillCategory] || []).length - 1}
                          title="Move right"
                          className="text-white/60 hover:text-white disabled:opacity-25 cursor-pointer"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateSkillCategory(
                              activeSkillCategory,
                              (skillCategories[activeSkillCategory] || []).filter(
                                (s) => s !== skill
                              )
                            )
                          }
                          aria-label={`Remove ${skill}`}
                          className="ml-1 text-[#F47A24] hover:text-white font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Clickable Skill Ideas (Never Auto-Added) */}
              {filteredSuggestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#778397]">
                    Common {SKILL_CATEGORY_LABELS[activeSkillCategory]} (Click to Add Only If Applicable)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleAddSkill(item)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E5EAF0] hover:border-[#F47A24] text-[#253449] text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[#F47A24]" />
                        <span>{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 6 — Additional Information */}
          {step === 6 && (
            <>
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                  Step 6 of 8 · Optional
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                  Additional Information
                </h2>
                <p className="text-xs sm:text-sm text-[#778397]">
                  Add only the sections that strengthen your application. Skip anything you don&apos;t need.
                </p>
              </div>

              <ResumeAdditionalSectionsEditor resume={resume} onChange={onChange} />
            </>
          )}

          {/* STEP 7 — Review Your Information */}
          {step === 7 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#F47A24]">
                    Step 7 of 8
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                    Review Your Information
                  </h2>
                  <p className="text-xs sm:text-sm text-[#778397]">
                    Confirm your details before selecting a professional resume template.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] min-w-[200px] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#102B4E]">Completeness</span>
                    <span className="font-extrabold text-[#F47A24]">{completion.total}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E5EAF0] overflow-hidden">
                    <div
                      style={{ width: `${completion.total}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#102B4E] to-[#F47A24]"
                    />
                  </div>
                </div>
              </div>

              {completion.missingTips.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs text-amber-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Optional suggestions before choosing your template:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-amber-900/85">
                    {completion.missingTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {[
                  {
                    stepNum: 1,
                    title: 'Personal Information',
                    done: completion.sections.personalInfo,
                    summary:
                      [resume.fullName, resume.professionalTitle, resume.email, resume.phone]
                        .filter(Boolean)
                        .join(' · ') || 'No personal details entered yet',
                  },
                  {
                    stepNum: 2,
                    title: 'Professional Summary',
                    done: completion.sections.summary,
                    summary: resume.summary.trim()
                      ? `${resume.summary.trim().slice(0, 140)}${resume.summary.length > 140 ? '...' : ''}`
                      : 'No summary written yet',
                  },
                  {
                    stepNum: 3,
                    title: 'Work Experience',
                    done: completion.sections.experience,
                    summary:
                      resume.experiences.length > 0
                        ? `${resume.experiences.length} ${
                            resume.experiences.length === 1 ? 'position' : 'positions'
                          }: ${resume.experiences
                            .map((e) => e.jobTitle || e.companyName)
                            .filter(Boolean)
                            .join(', ')}`
                        : 'No work experience entered',
                  },
                  {
                    stepNum: 4,
                    title: 'Education',
                    done: completion.sections.education,
                    summary:
                      resume.education.length > 0
                        ? resume.education
                            .map((e) => [e.degree, e.institution].filter(Boolean).join(' — '))
                            .join('; ')
                        : 'No education entries added',
                  },
                  {
                    stepNum: 5,
                    title: 'Skills',
                    done: completion.sections.skills,
                    summary:
                      resume.skills.length > 0
                        ? `${resume.skills.length} skills: ${resume.skills.slice(0, 6).join(', ')}${
                            resume.skills.length > 6 ? '...' : ''
                          }`
                        : 'No skills listed yet',
                  },
                  {
                    stepNum: 6,
                    title: 'Additional Sections',
                    done: completion.sections.additional,
                    summary:
                      [
                        resume.certifications.length > 0 &&
                          `${resume.certifications.length} Certifications`,
                        resume.projects.length > 0 && `${resume.projects.length} Projects`,
                        resume.languages.length > 0 && `${resume.languages.length} Languages`,
                        (resume.achievements || []).length > 0 &&
                          `${resume.achievements!.length} Achievements`,
                        (resume.awards || []).length > 0 && `${resume.awards!.length} Awards`,
                        (resume.customSections || []).length > 0 &&
                          `${resume.customSections!.length} Custom`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'No optional sections added (totally fine)',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="p-4 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-bold text-[#102B4E] text-sm">
                        {card.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#F47A24] shrink-0" />
                        )}
                        <span>{card.title}</span>
                      </div>
                      <p className="text-[#778397] leading-relaxed">{card.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(card.stepNum)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#102B4E] text-[#102B4E] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 8 — Choose Your Resume Template */}
          {step === 8 && (
            <TemplateGallery
              resume={resume}
              selectedTemplateId={design.templateId}
              onSelectTemplate={handleSelectTemplateStep8}
              title="Step 8 — Choose Your Resume Template"
              subtitle="Every thumbnail below renders your real resume content. Select any design to launch the live Resume Studio Editor."
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Step Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => (step > 1 ? setStep(step - 1) : onBackToStart())}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#102B4E]/30 text-[#253449] text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step > 1 ? 'Previous Step' : 'Back'}</span>
        </button>

        {step < 8 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>
              {step === 7 ? 'Choose Resume Template' : `Next: ${WIZARD_STEPS[step].label}`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFinishToStudio()}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Open Full Resume Editor</span>
            <ArrowRight className="w-4 h-4 text-[#F47A24]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeGuidedWizard;
