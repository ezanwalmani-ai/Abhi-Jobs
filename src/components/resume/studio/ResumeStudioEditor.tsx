import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResumeData,
  ResumeDesignSettings,
  ResumeFontFamily,
  ResumeFontSize,
  ResumeLineSpacing,
  ResumeMarginSize,
  ResumeSectionKey,
  ResumeSkillCategoryKey,
  DEFAULT_DESIGN_SETTINGS,
  DEFAULT_SECTION_TITLES,
  EMPTY_SKILL_CATEGORIES,
  calculateResumeCompletion,
  flattenSkillCategories,
  getResumeDesign,
} from '../../../types/resume';
import {
  RESUME_TEMPLATES,
  ACCENT_COLOR_PRESETS,
  ResumeTemplateSpec,
  getTemplateSpec,
  getTemplateSectionOrder,
} from '../templates/templateCatalog';
import { ResumeDocumentRenderer } from '../templates/ResumeDocumentRenderer';
import { ResumeAdditionalSectionsEditor } from './ResumeAdditionalSectionsEditor';
import { ResumeQualityAssistant } from './ResumeQualityAssistant';
import { TemplateGallery } from './TemplateGallery';
import {
  generateSummarySuggestion,
  improveExperienceBullet,
  SummaryAiAction,
  BulletAiAction,
} from '../../../services/resumeAiAssistant';
import { EASE_PREMIUM } from '../../../lib/motion';
import {
  ArrowLeft,
  Save,
  Download,
  Sparkles,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Edit3,
  Palette,
  LayoutGrid,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Upload,
  ZoomIn,
  ZoomOut,
  X,
  ListChecks,
  ShieldCheck,
  Scissors,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export type StudioSaveStatus = 'saved' | 'saving' | 'unsaved';

interface ResumeStudioEditorProps {
  resume: ResumeData;
  saveStatus: StudioSaveStatus;
  onChange: (updates: Partial<ResumeData>) => void;
  onManualSave: () => void;
  onOpenPdfPreview: () => void;
  onOpenWizard: (step?: number) => void;
  onBackToLanding: () => void;
}

type EditorContentSection =
  | 'personal'
  | 'summary'
  | 'experiences'
  | 'education'
  | 'skills'
  | 'additional';

const CONTENT_SECTIONS: Array<{ id: EditorContentSection; label: string; sectionKey?: ResumeSectionKey }> = [
  { id: 'personal', label: 'Personal' },
  { id: 'summary', label: 'Summary', sectionKey: 'summary' },
  { id: 'experiences', label: 'Experience', sectionKey: 'experiences' },
  { id: 'education', label: 'Education', sectionKey: 'education' },
  { id: 'skills', label: 'Skills', sectionKey: 'skills' },
  { id: 'additional', label: 'Optional' },
];

const FONT_OPTIONS: Array<{ id: ResumeFontFamily; label: string; sample: string }> = [
  { id: 'inter', label: 'Inter', sample: 'Clean Sans' },
  { id: 'manrope', label: 'Manrope', sample: 'Modern Geometric' },
  { id: 'georgia', label: 'Georgia', sample: 'Classic Serif' },
  { id: 'merriweather', label: 'Merriweather', sample: 'Editorial Serif' },
  { id: 'mono', label: 'JetBrains Mono', sample: 'Technical Mono' },
];

const SKILL_CATEGORY_LABELS: Record<ResumeSkillCategoryKey, string> = {
  technical: 'Technical',
  professional: 'Professional',
  industry: 'Industry',
  tools: 'Tools & Software',
};

const ZOOM_LEVELS = [0.55, 0.7, 0.85, 1.0];

export const ResumeStudioEditor: React.FC<ResumeStudioEditorProps> = ({
  resume,
  saveStatus,
  onChange,
  onManualSave,
  onOpenPdfPreview,
  onOpenWizard,
  onBackToLanding,
}) => {
  // Responsive mobile/tablet tab mode
  const [mobileMode, setMobileMode] = useState<'edit' | 'design' | 'preview'>('edit');

  // Left pane state
  const [leftTab, setLeftTab] = useState<'content' | 'quality'>('content');
  const [activeSection, setActiveSection] = useState<EditorContentSection>('personal');

  // Right pane state
  const [rightTab, setRightTab] = useState<'templates' | 'styling' | 'layout'>('templates');
  const [showFullGalleryModal, setShowFullGalleryModal] = useState(false);

  // Center preview zoom
  const [zoomIndex, setZoomIndex] = useState<number>(1); // default 70% fits A4 nicely in 3-pane
  const zoom = ZOOM_LEVELS[zoomIndex];

  // Skills local inputs
  const [activeSkillCat, setActiveSkillCat] = useState<ResumeSkillCategoryKey>('technical');
  const [skillInput, setSkillInput] = useState('');

  // Fact-safe AI suggestion previews (never applied without explicit click)
  const [summarySuggestion, setSummarySuggestion] = useState<{ text: string; note: string } | null>(
    null
  );
  const [bulletSuggestion, setBulletSuggestion] = useState<{
    expId: string;
    field: 'responsibilities' | 'achievements';
    idx: number;
    text: string;
    note: string;
  } | null>(null);

  const design = useMemo(() => getResumeDesign(resume), [resume]);
  const templateSpec = useMemo(() => getTemplateSpec(design.templateId), [design.templateId]);
  const completion = useMemo(() => calculateResumeCompletion(resume), [resume]);

  const updateDesign = (patch: Partial<ResumeDesignSettings>) => {
    const nextDesign: ResumeDesignSettings = {
      ...design,
      ...patch,
    };
    onChange({
      template: nextDesign.templateId,
      design: nextDesign,
    });
  };

  const applyTemplate = (spec: ResumeTemplateSpec) => {
    // Strictly preserves all resume content — only updates design layer
    updateDesign({
      templateId: spec.id,
      accentColor: spec.defaultAccent,
      fontFamily: spec.defaultFont,
      sectionOrder: getTemplateSectionOrder(spec.id),
    });
  };

  // --- Photo Upload ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ photoUrl: reader.result, showPhoto: true });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Experience helpers ---
  const addExperience = () => {
    onChange({
      experiences: [
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
        ...resume.experiences,
      ],
    });
  };

  const duplicateExperience = (expId: string) => {
    const idx = resume.experiences.findIndex((e) => e.id === expId);
    if (idx === -1) return;
    const src = resume.experiences[idx];
    const copy = {
      ...src,
      id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      responsibilities: [...src.responsibilities],
      achievements: [...(src.achievements || [])],
    };
    const next = [...resume.experiences];
    next.splice(idx + 1, 0, copy);
    onChange({ experiences: next });
  };

  const updateExperience = (
    expId: string,
    patch: Partial<ResumeData['experiences'][number]>
  ) => {
    onChange({
      experiences: resume.experiences.map((e) => (e.id === expId ? { ...e, ...patch } : e)),
    });
  };

  const moveExperience = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= resume.experiences.length) return;
    const next = [...resume.experiences];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ experiences: next });
  };

  const removeExperience = (expId: string) => {
    onChange({ experiences: resume.experiences.filter((e) => e.id !== expId) });
  };

  // --- Education helpers ---
  const addEducation = () => {
    onChange({
      education: [
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
        ...resume.education,
      ],
    });
  };

  const duplicateEducation = (eduId: string) => {
    const idx = resume.education.findIndex((e) => e.id === eduId);
    if (idx === -1) return;
    const copy = {
      ...resume.education[idx],
      id: `edu_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    };
    const next = [...resume.education];
    next.splice(idx + 1, 0, copy);
    onChange({ education: next });
  };

  const updateEducation = (eduId: string, patch: Partial<ResumeData['education'][number]>) => {
    onChange({
      education: resume.education.map((e) => (e.id === eduId ? { ...e, ...patch } : e)),
    });
  };

  const moveEducation = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= resume.education.length) return;
    const next = [...resume.education];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ education: next });
  };

  const removeEducation = (eduId: string) => {
    onChange({ education: resume.education.filter((e) => e.id !== eduId) });
  };

  // --- Skill category helpers ---
  const skillCategories = resume.skillCategories || {
    ...EMPTY_SKILL_CATEGORIES,
    technical: resume.skills || [],
  };

  const updateCategorySkills = (cat: ResumeSkillCategoryKey, items: string[]) => {
    const nextCats = { ...skillCategories, [cat]: items };
    onChange({
      skillCategories: nextCats,
      skills: flattenSkillCategories(nextCats),
    });
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const parts = trimmed
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const existing = skillCategories[activeSkillCat] || [];
    const merged = [...existing];
    parts.forEach((p) => {
      if (!merged.some((m) => m.toLowerCase() === p.toLowerCase())) {
        merged.push(p);
      }
    });
    updateCategorySkills(activeSkillCat, merged);
    setSkillInput('');
  };

  const moveSkill = (cat: ResumeSkillCategoryKey, idx: number, dir: -1 | 1) => {
    const list = [...(skillCategories[cat] || [])];
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    updateCategorySkills(cat, list);
  };

  // --- Section layout controls ---
  const moveSectionOrder = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= design.sectionOrder.length) return;
    const nextOrder = [...design.sectionOrder];
    [nextOrder[idx], nextOrder[target]] = [nextOrder[target], nextOrder[idx]];
    updateDesign({ sectionOrder: nextOrder });
  };

  const toggleSectionVisibility = (key: ResumeSectionKey) => {
    const hidden = new Set<ResumeSectionKey>(design.hiddenSections);
    if (hidden.has(key)) hidden.delete(key);
    else hidden.add(key);
    updateDesign({ hiddenSections: Array.from(hidden) });
  };

  const togglePageBreakBefore = (key: ResumeSectionKey) => {
    const breaks = new Set<ResumeSectionKey>(design.pageBreakBefore);
    if (breaks.has(key)) breaks.delete(key);
    else breaks.add(key);
    updateDesign({ pageBreakBefore: Array.from(breaks) });
  };

  const activeSectionKey = CONTENT_SECTIONS.find((s) => s.id === activeSection)?.sectionKey;

  return (
    <div className="space-y-4">
      {/* 1. Top Studio Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] px-3.5 py-3 sm:px-5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back + Editable Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBackToLanding}
            title="Back to Saved Resumes"
            className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#102B4E] inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1 max-w-xs">
            <input
              type="text"
              value={resume.title || ''}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Untitled Resume"
              aria-label="Resume title"
              className="w-full text-sm sm:text-base font-extrabold text-[#102B4E] bg-transparent border border-transparent hover:border-[#E5EAF0] focus:border-[#102B4E] focus:bg-[#F6F8FB] rounded-lg px-2 py-1 focus:outline-none truncate"
            />
            <div className="flex items-center gap-2 px-2 text-[11px] text-[#778397]">
              <span className="font-semibold text-[#102B4E]">{completion.total}% complete</span>
              <span>·</span>
              <span className="truncate">{templateSpec.name}</span>
            </div>
          </div>
        </div>

        {/* Right: Status + Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Save Status Indicator */}
          <span
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 ${
              saveStatus === 'saved'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : saveStatus === 'saving'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-[#F6F8FB] text-[#778397] border border-[#E5EAF0]'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </>
            ) : (
              <span>Unsaved</span>
            )}
          </span>

          <button
            type="button"
            onClick={() => onOpenWizard(1)}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 hover:bg-[#F6F8FB] text-[#253449] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ListChecks className="w-3.5 h-3.5 text-[#F47A24]" />
            <span className="hidden sm:inline">Guided Steps</span>
          </button>

          <button
            type="button"
            onClick={onManualSave}
            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 hover:bg-[#F6F8FB] text-[#102B4E] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={onOpenPdfPreview}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Mobile / Tablet Segmented Mode Switcher */}
      <div className="xl:hidden grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-white border border-[#E5EAF0] shadow-2xs">
        {[
          { id: 'edit' as const, label: 'Edit', icon: Edit3 },
          { id: 'design' as const, label: 'Design', icon: Palette },
          { id: 'preview' as const, label: 'Preview', icon: Eye },
        ].map((mode) => {
          const Icon = mode.icon;
          const active = mobileMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setMobileMode(mode.id)}
              className={`min-h-[44px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                active
                  ? 'bg-[#102B4E] text-white shadow-xs'
                  : 'text-[#778397] hover:bg-[#F6F8FB] hover:text-[#102B4E]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#F47A24]' : ''}`} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main 3-Pane Studio Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE: Content Editor & Quality Assistant */}
        <section
          className={`xl:col-span-4 bg-white rounded-2xl border border-[#E5EAF0] shadow-2xs overflow-hidden flex flex-col xl:max-h-[calc(100vh-12rem)] ${
            mobileMode === 'edit' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          {/* Left Pane Top Tab Bar */}
          <div className="p-3 border-b border-[#E5EAF0] bg-[#FAFBFD] grid grid-cols-2 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab('content')}
              className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                leftTab === 'content'
                  ? 'bg-[#102B4E] text-white shadow-2xs'
                  : 'text-[#778397] hover:text-[#102B4E] hover:bg-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Content Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('quality')}
              className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                leftTab === 'quality'
                  ? 'bg-[#102B4E] text-white shadow-2xs'
                  : 'text-[#778397] hover:text-[#102B4E] hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Quality & JD</span>
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {leftTab === 'quality' ? (
              <ResumeQualityAssistant resume={resume} />
            ) : (
              <>
                {/* Section Selector Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {CONTENT_SECTIONS.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSection(sec.id)}
                        className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[#102B4E] text-white border-[#102B4E] shadow-2xs'
                            : 'bg-[#F6F8FB] text-[#253449] border-[#E5EAF0] hover:border-[#102B4E]/30'
                        }`}
                      >
                        {sec.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Section Heading Rename (for standard sections) */}
                {activeSectionKey && (
                  <div className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-[#778397] shrink-0">
                      Heading:
                    </label>
                    <input
                      type="text"
                      value={
                        design.sectionTitles[activeSectionKey] ??
                        DEFAULT_SECTION_TITLES[activeSectionKey]
                      }
                      onChange={(e) =>
                        updateDesign({
                          sectionTitles: {
                            ...design.sectionTitles,
                            [activeSectionKey]: e.target.value,
                          },
                        })
                      }
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF0] text-xs font-semibold text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                    />
                  </div>
                )}

                {/* SECTION 1: PERSONAL INFO */}
                {activeSection === 'personal' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={resume.fullName}
                          onChange={(e) => onChange({ fullName: e.target.value })}
                          placeholder="e.g. Ananya Sharma"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs sm:text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          Professional Title
                        </label>
                        <input
                          type="text"
                          value={resume.professionalTitle}
                          onChange={(e) => onChange({ professionalTitle: e.target.value })}
                          placeholder="e.g. Senior Financial Analyst"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs sm:text-sm text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={resume.email}
                          onChange={(e) => onChange({ email: e.target.value })}
                          placeholder="name@email.com"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={resume.phone}
                          onChange={(e) => onChange({ phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={resume.city}
                          onChange={(e) => onChange({ city: e.target.value })}
                          placeholder="Bengaluru"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          State / Country
                        </label>
                        <input
                          type="text"
                          value={resume.state}
                          onChange={(e) => onChange({ state: e.target.value })}
                          placeholder="Karnataka"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          value={resume.linkedIn}
                          onChange={(e) => onChange({ linkedIn: e.target.value })}
                          placeholder="linkedin.com/in/yourname"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#253449] mb-1">
                          Portfolio / Website
                        </label>
                        <input
                          type="text"
                          value={resume.portfolio}
                          onChange={(e) => onChange({ portfolio: e.target.value })}
                          placeholder="yourportfolio.com"
                          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                        />
                      </div>
                    </div>

                    {/* Optional Photo Block */}
                    <div className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {resume.photoUrl ? (
                          <img
                            src={resume.photoUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border border-[#E5EAF0] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white border border-[#E5EAF0] flex items-center justify-center text-[#778397] shrink-0">
                            <Upload className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#102B4E]">
                            Profile Photo (Optional)
                          </div>
                          <label className="inline-flex items-center gap-1.5 text-[11px] text-[#778397] cursor-pointer mt-0.5">
                            <input
                              type="checkbox"
                              checked={resume.showPhoto}
                              onChange={(e) => onChange({ showPhoto: e.target.checked })}
                              className="accent-[#102B4E]"
                            />
                            <span>Show on resume</span>
                          </label>
                        </div>
                      </div>
                      <label className="px-3 py-1.5 rounded-lg bg-white border border-[#E5EAF0] hover:border-[#102B4E] text-[11px] font-bold text-[#102B4E] cursor-pointer shrink-0">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* SECTION 2: PROFESSIONAL SUMMARY */}
                {activeSection === 'summary' && (
                  <div className="space-y-3">
                    <textarea
                      rows={6}
                      value={resume.summary}
                      onChange={(e) => onChange({ summary: e.target.value })}
                      placeholder="Write a 2–4 sentence professional summary grounded in your actual experience and target role..."
                      className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs sm:text-sm text-[#102B4E] leading-relaxed focus:outline-none focus:border-[#102B4E]"
                    />

                    {/* Fact-safe AI writing buttons */}
                    <div className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#102B4E]">
                        <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
                        <span>AI Writing Assistance (Fact-Safe)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { id: 'write', label: 'Draft from Profile' },
                            { id: 'improve', label: 'Improve Clarity' },
                            { id: 'concise', label: 'Make Concise' },
                            { id: 'tone_executive', label: 'Executive Tone' },
                          ] as Array<{ id: SummaryAiAction; label: string }>
                        ).map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() =>
                              setSummarySuggestion(generateSummarySuggestion(resume, btn.id))
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF0] hover:border-[#F47A24] text-[11px] font-semibold text-[#102B4E] cursor-pointer transition-colors"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {summarySuggestion && (
                        <div className="p-3 rounded-xl bg-white border border-[#F47A24]/40 space-y-2">
                          <p className="text-xs text-[#253449] leading-relaxed">
                            {summarySuggestion.text}
                          </p>
                          <p className="text-[10px] text-[#778397]">{summarySuggestion.note}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                onChange({ summary: summarySuggestion.text });
                                setSummarySuggestion(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#102B4E] text-white text-[11px] font-bold cursor-pointer"
                            >
                              Apply Suggestion
                            </button>
                            <button
                              type="button"
                              onClick={() => setSummarySuggestion(null)}
                              className="px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-[#778397] text-[11px] font-semibold cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 3: WORK EXPERIENCE */}
                {activeSection === 'experiences' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={addExperience}
                      className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#F47A24]" />
                      <span>Add Experience Entry</span>
                    </button>

                    {resume.experiences.length === 0 ? (
                      <div className="p-5 rounded-xl bg-[#F6F8FB] border border-dashed border-[#CBD5E1] text-center text-xs text-[#778397]">
                        No work experience entries yet. Add your roles or internships above.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {resume.experiences.map((exp, expIdx) => (
                          <div
                            key={exp.id}
                            className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-extrabold text-[#102B4E] truncate">
                                {exp.jobTitle || `Role #${expIdx + 1}`}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveExperience(expIdx, -1)}
                                  disabled={expIdx === 0}
                                  title="Move up"
                                  className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white text-[#253449] disabled:opacity-35 cursor-pointer"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveExperience(expIdx, 1)}
                                  disabled={expIdx === resume.experiences.length - 1}
                                  title="Move down"
                                  className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white text-[#253449] disabled:opacity-35 cursor-pointer"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => duplicateExperience(exp.id)}
                                  title="Duplicate entry"
                                  className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeExperience(exp.id)}
                                  title="Delete entry"
                                  className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={exp.jobTitle}
                                onChange={(e) =>
                                  updateExperience(exp.id, { jobTitle: e.target.value })
                                }
                                placeholder="Job Title"
                                className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E]"
                              />
                              <input
                                type="text"
                                value={exp.companyName}
                                onChange={(e) =>
                                  updateExperience(exp.id, { companyName: e.target.value })
                                }
                                placeholder="Company Name"
                                className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E]"
                              />
                              <input
                                type="text"
                                value={exp.location}
                                onChange={(e) =>
                                  updateExperience(exp.id, { location: e.target.value })
                                }
                                placeholder="Location"
                                className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E]"
                              />
                              <select
                                value={exp.employmentType}
                                onChange={(e) =>
                                  updateExperience(exp.id, {
                                    employmentType: e.target.value as any,
                                  })
                                }
                                className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E]"
                              >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                                <option value="Freelance">Freelance</option>
                                <option value="Temporary">Temporary</option>
                              </select>
                              <input
                                type="text"
                                value={
                                  [exp.startMonth, exp.startYear].filter(Boolean).join(' ')
                                }
                                onChange={(e) => {
                                  const parts = e.target.value.trim().split(/\s+/);
                                  if (parts.length >= 2) {
                                    updateExperience(exp.id, {
                                      startMonth: parts[0],
                                      startYear: parts.slice(1).join(' '),
                                    });
                                  } else {
                                    updateExperience(exp.id, {
                                      startMonth: '',
                                      startYear: e.target.value,
                                    });
                                  }
                                }}
                                placeholder="Start (e.g. Jan 2022)"
                                className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E]"
                              />
                              <input
                                type="text"
                                disabled={exp.currentlyWorking}
                                value={
                                  exp.currentlyWorking
                                    ? 'Present'
                                    : [exp.endMonth, exp.endYear].filter(Boolean).join(' ')
                                }
                                onChange={(e) => {
                                  const parts = e.target.value.trim().split(/\s+/);
                                  if (parts.length >= 2) {
                                    updateExperience(exp.id, {
                                      endMonth: parts[0],
                                      endYear: parts.slice(1).join(' '),
                                    });
                                  } else {
                                    updateExperience(exp.id, {
                                      endMonth: '',
                                      endYear: e.target.value,
                                    });
                                  }
                                }}
                                placeholder="End (e.g. Dec 2024)"
                                className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E] disabled:opacity-50"
                              />
                            </div>

                            <label className="inline-flex items-center gap-2 text-[11px] font-medium text-[#253449] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={exp.currentlyWorking}
                                onChange={(e) =>
                                  updateExperience(exp.id, {
                                    currentlyWorking: e.target.checked,
                                  })
                                }
                                className="accent-[#102B4E]"
                              />
                              <span>I currently work here</span>
                            </label>

                            {/* Responsibilities Bullets */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#778397]">
                                  Responsibilities & Impact Bullets
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateExperience(exp.id, {
                                      responsibilities: [...exp.responsibilities, ''],
                                    })
                                  }
                                  className="text-[11px] font-bold text-[#F47A24] hover:underline cursor-pointer"
                                >
                                  + Bullet
                                </button>
                              </div>

                              {exp.responsibilities.map((bullet, bIdx) => (
                                <div key={bIdx} className="space-y-1">
                                  <div className="flex items-start gap-1.5">
                                    <textarea
                                      rows={2}
                                      value={bullet}
                                      onChange={(e) => {
                                        const next = [...exp.responsibilities];
                                        next[bIdx] = e.target.value;
                                        updateExperience(exp.id, { responsibilities: next });
                                      }}
                                      placeholder="Describe an authentic responsibility or achievement..."
                                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#E5EAF0] text-xs text-[#102B4E] leading-relaxed"
                                    />
                                    <div className="flex flex-col gap-1">
                                      <button
                                        type="button"
                                        title="Polish bullet wording"
                                        onClick={() => {
                                          const res = improveExperienceBullet(
                                            bullet,
                                            'improve' as BulletAiAction
                                          );
                                          setBulletSuggestion({
                                            expId: exp.id,
                                            field: 'responsibilities',
                                            idx: bIdx,
                                            text: res.text,
                                            note: res.note,
                                          });
                                        }}
                                        className="p-1.5 rounded-lg bg-[#F47A24]/10 text-[#F47A24] hover:bg-[#F47A24]/20 cursor-pointer"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Remove bullet"
                                        onClick={() =>
                                          updateExperience(exp.id, {
                                            responsibilities: exp.responsibilities.filter(
                                              (_, i) => i !== bIdx
                                            ),
                                          })
                                        }
                                        className="p-1.5 rounded-lg bg-white border border-[#E5EAF0] text-rose-500 cursor-pointer"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {bulletSuggestion &&
                                    bulletSuggestion.expId === exp.id &&
                                    bulletSuggestion.field === 'responsibilities' &&
                                    bulletSuggestion.idx === bIdx && (
                                      <div className="p-2.5 rounded-lg bg-white border border-[#F47A24]/40 space-y-1.5">
                                        <p className="text-[11px] text-[#102B4E]">
                                          {bulletSuggestion.text}
                                        </p>
                                        <p className="text-[10px] text-[#778397]">
                                          {bulletSuggestion.note}
                                        </p>
                                        <div className="flex gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const next = [...exp.responsibilities];
                                              next[bIdx] = bulletSuggestion.text;
                                              updateExperience(exp.id, {
                                                responsibilities: next,
                                              });
                                              setBulletSuggestion(null);
                                            }}
                                            className="px-2.5 py-1 rounded-md bg-[#102B4E] text-white text-[10px] font-bold cursor-pointer"
                                          >
                                            Apply
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setBulletSuggestion(null)}
                                            className="px-2.5 py-1 rounded-md border border-[#E5EAF0] text-[#778397] text-[10px] cursor-pointer"
                                          >
                                            Dismiss
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 4: EDUCATION */}
                {activeSection === 'education' && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={addEducation}
                      className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#F47A24]" />
                      <span>Add Education Entry</span>
                    </button>

                    {resume.education.map((edu, eduIdx) => (
                      <div
                        key={edu.id}
                        className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E5EAF0] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#102B4E] truncate">
                            {edu.degree || `Education #${eduIdx + 1}`}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveEducation(eduIdx, -1)}
                              disabled={eduIdx === 0}
                              className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveEducation(eduIdx, 1)}
                              disabled={eduIdx === resume.education.length - 1}
                              className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => duplicateEducation(edu.id)}
                              title="Duplicate"
                              className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEducation(edu.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                            placeholder="Degree (e.g. B.Tech)"
                            className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                          <input
                            type="text"
                            value={edu.fieldOfStudy || ''}
                            onChange={(e) =>
                              updateEducation(edu.id, { fieldOfStudy: e.target.value })
                            }
                            placeholder="Field of Study"
                            className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) =>
                              updateEducation(edu.id, { institution: e.target.value })
                            }
                            placeholder="University / Institution"
                            className="sm:col-span-2 px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                          <input
                            type="text"
                            value={edu.startDate}
                            onChange={(e) =>
                              updateEducation(edu.id, { startDate: e.target.value })
                            }
                            placeholder="Start Year"
                            className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                          <input
                            type="text"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                            placeholder="End Year"
                            className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                          <input
                            type="text"
                            value={edu.grade || ''}
                            onChange={(e) => updateEducation(edu.id, { grade: e.target.value })}
                            placeholder="Grade / CGPA (Optional)"
                            className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                          <input
                            type="text"
                            value={edu.location}
                            onChange={(e) =>
                              updateEducation(edu.id, { location: e.target.value })
                            }
                            placeholder="Location"
                            className="px-2.5 py-2 rounded-lg bg-white border border-[#E5EAF0] text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION 5: SKILLS */}
                {activeSection === 'skills' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(SKILL_CATEGORY_LABELS) as ResumeSkillCategoryKey[]).map(
                        (cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveSkillCat(cat)}
                            className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              activeSkillCat === cat
                                ? 'bg-[#102B4E] text-white border-[#102B4E]'
                                : 'bg-[#F6F8FB] text-[#253449] border-[#E5EAF0]'
                            }`}
                          >
                            {SKILL_CATEGORY_LABELS[cat]} ({(skillCategories[cat] || []).length})
                          </button>
                        )
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="Type skill(s), comma separated..."
                        className="flex-1 min-h-[40px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#102B4E] focus:outline-none focus:border-[#102B4E]"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-3.5 min-h-[40px] rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 min-h-[48px] p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0]">
                      {(skillCategories[activeSkillCat] || []).length === 0 ? (
                        <span className="text-[11px] text-[#778397]">
                          No skills added in {SKILL_CATEGORY_LABELS[activeSkillCat]} yet.
                        </span>
                      ) : (
                        (skillCategories[activeSkillCat] || []).map((skill, sIdx) => (
                          <span
                            key={`${skill}-${sIdx}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#E5EAF0] text-xs font-semibold text-[#102B4E]"
                          >
                            <button
                              type="button"
                              onClick={() => moveSkill(activeSkillCat, sIdx, -1)}
                              disabled={sIdx === 0}
                              className="text-[#778397] hover:text-[#102B4E] disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => moveSkill(activeSkillCat, sIdx, 1)}
                              disabled={sIdx === (skillCategories[activeSkillCat] || []).length - 1}
                              className="text-[#778397] hover:text-[#102B4E] disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateCategorySkills(
                                  activeSkillCat,
                                  (skillCategories[activeSkillCat] || []).filter(
                                    (_, i) => i !== sIdx
                                  )
                                )
                              }
                              className="text-rose-500 hover:text-rose-700 cursor-pointer ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 6: OPTIONAL / ADDITIONAL SECTIONS */}
                {activeSection === 'additional' && (
                  <ResumeAdditionalSectionsEditor resume={resume} onChange={onChange} />
                )}
              </>
            )}
          </div>
        </section>

        {/* CENTER PANE: Large Live A4 Resume Preview */}
        <section
          className={`xl:col-span-5 bg-[#EEF2F7] rounded-2xl border border-[#DCE3EC] overflow-hidden flex flex-col xl:max-h-[calc(100vh-12rem)] ${
            mobileMode === 'preview' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          {/* Preview Controls Bar */}
          <div className="px-4 py-2.5 bg-white border-b border-[#E5EAF0] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-extrabold text-[#102B4E] truncate">
                Live A4 Preview
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[10px] font-bold text-[#253449]">
                {templateSpec.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
                disabled={zoomIndex === 0}
                aria-label="Zoom out"
                className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white text-[#102B4E] disabled:opacity-35 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-bold text-[#253449] w-10 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                aria-label="Zoom in"
                className="p-1.5 rounded-lg border border-[#E5EAF0] bg-white text-[#102B4E] disabled:opacity-35 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowFullGalleryModal(true)}
                className="ml-1 px-2.5 py-1.5 rounded-lg bg-[#102B4E] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <LayoutGrid className="w-3 h-3 text-[#F47A24]" />
                <span className="hidden sm:inline">All 12</span>
              </button>
            </div>
          </div>

          {/* Scaled A4 Canvas */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start">
            <div
              style={{
                width: `${794 * zoom}px`,
                minHeight: `${1123 * zoom}px`,
              }}
              className="relative shrink-0 transition-all duration-200"
            >
              <div
                style={{
                  width: '794px',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
                className="shadow-xl ring-1 ring-black/10 rounded-xs overflow-hidden bg-white"
              >
                <ResumeDocumentRenderer
                  id="resume-studio-preview"
                  resume={resume}
                  showPlaceholderWhenEmpty
                />
              </div>
            </div>
          </div>

          {/* Honest ATS Guidance Footer */}
          <div className="px-4 py-2 bg-white border-t border-[#E5EAF0] text-[11px] text-[#778397] flex items-center justify-between gap-2 shrink-0">
            <span className="truncate">{templateSpec.atsGuidance}</span>
          </div>
        </section>

        {/* RIGHT PANE: Templates, Typography, Colors, Spacing & Section Order */}
        <section
          className={`xl:col-span-3 bg-white rounded-2xl border border-[#E5EAF0] shadow-2xs overflow-hidden flex flex-col xl:max-h-[calc(100vh-12rem)] ${
            mobileMode === 'design' ? 'flex' : 'hidden xl:flex'
          }`}
        >
          {/* Right Pane Tabs */}
          <div className="p-3 border-b border-[#E5EAF0] bg-[#FAFBFD] grid grid-cols-3 gap-1 shrink-0">
            {[
              { id: 'templates' as const, label: 'Templates', icon: LayoutGrid },
              { id: 'styling' as const, label: 'Style', icon: Palette },
              { id: 'layout' as const, label: 'Sections', icon: SlidersHorizontal },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = rightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={`min-h-[38px] px-2 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#102B4E] text-white shadow-2xs'
                      : 'text-[#778397] hover:text-[#102B4E] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-5">
            {/* RIGHT TAB 1: TEMPLATES */}
            {rightTab === 'templates' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#102B4E]">
                    12 Studio Templates
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFullGalleryModal(true)}
                    className="text-[11px] font-bold text-[#F47A24] hover:underline cursor-pointer"
                  >
                    Full Gallery
                  </button>
                </div>

                <p className="text-[11px] text-[#778397] leading-relaxed">
                  Switch templates instantly — your content stays completely intact.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                  {RESUME_TEMPLATES.map((spec) => {
                    const isSelected = design.templateId === spec.id;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => applyTemplate(spec)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'border-[#F47A24] bg-[#F47A24]/[0.05] ring-1 ring-[#F47A24]/30'
                            : 'border-[#E5EAF0] bg-white hover:border-[#102B4E]/30 hover:bg-[#F6F8FB]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              style={{ backgroundColor: spec.defaultAccent }}
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                            />
                            <span className="text-xs font-bold text-[#102B4E] truncate">
                              {spec.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#778397] mt-0.5 truncate">
                            {spec.layoutLabel}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#F47A24] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RIGHT TAB 2: TYPOGRAPHY, COLORS & SPACING */}
            {rightTab === 'styling' && (
              <div className="space-y-5">
                {/* Accent Color */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[#102B4E]">
                    Accent Color
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENT_COLOR_PRESETS.map((preset) => {
                      const active =
                        design.accentColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() => updateDesign({ accentColor: preset.hex })}
                          style={{ backgroundColor: preset.hex }}
                          className={`w-8 h-8 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                            active
                              ? 'ring-2 ring-offset-2 ring-[#F47A24] scale-105'
                              : 'hover:scale-105'
                          }`}
                        >
                          {active && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}

                    <label
                      title="Custom accent color"
                      className="w-8 h-8 rounded-full border border-dashed border-[#94A3B8] flex items-center justify-center text-[10px] font-bold text-[#102B4E] cursor-pointer overflow-hidden"
                    >
                      <input
                        type="color"
                        value={design.accentColor}
                        onChange={(e) => updateDesign({ accentColor: e.target.value })}
                        className="w-10 h-10 cursor-pointer border-0 p-0"
                      />
                    </label>
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[#102B4E]">
                    Font Family
                  </label>
                  <div className="space-y-1.5">
                    {FONT_OPTIONS.map((font) => {
                      const active = design.fontFamily === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => updateDesign({ fontFamily: font.id })}
                          className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between text-xs cursor-pointer transition-all ${
                            active
                              ? 'border-[#102B4E] bg-[#102B4E] text-white font-bold'
                              : 'border-[#E5EAF0] bg-white text-[#253449] hover:bg-[#F6F8FB]'
                          }`}
                        >
                          <span>{font.label}</span>
                          <span
                            className={`text-[10px] ${
                              active ? 'text-white/75' : 'text-[#778397]'
                            }`}
                          >
                            {font.sample}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[#102B4E]">
                    Text Size
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['compact', 'standard', 'comfortable'] as ResumeFontSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => updateDesign({ fontSize: sz })}
                        className={`py-2 rounded-xl text-[11px] font-bold capitalize border cursor-pointer ${
                          design.fontSize === sz
                            ? 'bg-[#102B4E] text-white border-[#102B4E]'
                            : 'bg-[#F6F8FB] text-[#253449] border-[#E5EAF0]'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Spacing */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[#102B4E]">
                    Line Spacing
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['tight', 'normal', 'relaxed'] as ResumeLineSpacing[]).map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => updateDesign({ lineSpacing: sp })}
                        className={`py-2 rounded-xl text-[11px] font-bold capitalize border cursor-pointer ${
                          design.lineSpacing === sp
                            ? 'bg-[#102B4E] text-white border-[#102B4E]'
                            : 'bg-[#F6F8FB] text-[#253449] border-[#E5EAF0]'
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Margins */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[#102B4E]">
                    Page Margins
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['narrow', 'standard', 'wide'] as ResumeMarginSize[]).map((mg) => (
                      <button
                        key={mg}
                        type="button"
                        onClick={() => updateDesign({ margins: mg })}
                        className={`py-2 rounded-xl text-[11px] font-bold capitalize border cursor-pointer ${
                          design.margins === mg
                            ? 'bg-[#102B4E] text-white border-[#102B4E]'
                            : 'bg-[#F6F8FB] text-[#253449] border-[#E5EAF0]'
                        }`}
                      >
                        {mg}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateDesign({
                      fontFamily: templateSpec.defaultFont,
                      fontSize: DEFAULT_DESIGN_SETTINGS.fontSize,
                      lineSpacing: DEFAULT_DESIGN_SETTINGS.lineSpacing,
                      margins: DEFAULT_DESIGN_SETTINGS.margins,
                      accentColor: templateSpec.defaultAccent,
                    })
                  }
                  className="w-full py-2 rounded-xl border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[11px] font-bold text-[#778397] hover:text-[#102B4E] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Style to Template Defaults</span>
                </button>
              </div>
            )}

            {/* RIGHT TAB 3: SECTION ORDER, VISIBILITY & PAGE BREAKS */}
            {rightTab === 'layout' && (
              <div className="space-y-3">
                <p className="text-[11px] text-[#778397] leading-relaxed">
                  Reorder sections, toggle visibility, or insert a clean page break before any section.
                </p>

                <div className="space-y-1.5">
                  {design.sectionOrder.map((secKey, idx) => {
                    const isHidden = design.hiddenSections.includes(secKey);
                    const hasBreak = design.pageBreakBefore.includes(secKey);
                    const label =
                      design.sectionTitles[secKey] || DEFAULT_SECTION_TITLES[secKey];
                    return (
                      <div
                        key={secKey}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          isHidden
                            ? 'bg-[#F8FAFC] border-[#E5EAF0] opacity-60'
                            : 'bg-white border-[#E5EAF0]'
                        }`}
                      >
                        <span className="text-[11px] font-bold text-[#102B4E] truncate">
                          {label}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveSectionOrder(idx, -1)}
                            disabled={idx === 0}
                            title="Move section up"
                            className="p-1 rounded-md border border-[#E5EAF0] text-[#253449] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSectionOrder(idx, 1)}
                            disabled={idx === design.sectionOrder.length - 1}
                            title="Move section down"
                            className="p-1 rounded-md border border-[#E5EAF0] text-[#253449] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePageBreakBefore(secKey)}
                            title={
                              hasBreak ? 'Remove page break before section' : 'Start on new page'
                            }
                            className={`p-1 rounded-md border cursor-pointer ${
                              hasBreak
                                ? 'bg-[#F47A24] text-white border-[#F47A24]'
                                : 'border-[#E5EAF0] text-[#778397] hover:text-[#102B4E]'
                            }`}
                          >
                            <Scissors className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(secKey)}
                            title={isHidden ? 'Show section' : 'Hide section'}
                            className={`p-1 rounded-md border cursor-pointer ${
                              isHidden
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'border-[#E5EAF0] text-[#102B4E]'
                            }`}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Full 12-Template Visual Gallery Modal */}
      <AnimatePresence>
        {showFullGalleryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullGalleryModal(false)}
            className="fixed inset-0 z-50 bg-[#081D36]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.22, ease: EASE_PREMIUM }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[calc(100vw-1.5rem)] xl:max-w-6xl max-h-[92vh] bg-[#F6F8FB] rounded-3xl border border-[#E5EAF0] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 bg-white border-b border-[#E5EAF0] flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#102B4E]">
                    Switch Resume Template
                  </h3>
                  <p className="text-xs text-[#778397]">
                    Live preview with your actual resume content — switching never alters your text.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullGalleryModal(false)}
                  aria-label="Close gallery"
                  className="min-h-[40px] min-w-[40px] rounded-xl border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#102B4E] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <TemplateGallery
                  resume={resume}
                  selectedTemplateId={design.templateId}
                  onSelectTemplate={(spec) => {
                    applyTemplate(spec);
                    setShowFullGalleryModal(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeStudioEditor;
