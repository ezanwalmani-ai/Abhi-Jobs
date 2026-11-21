import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ParsedResumeResult } from '../../../services/resumeParserService';
import { ResumeData, EMPTY_RESUME, EMPTY_SKILL_CATEGORIES } from '../../../types/resume';
import { EASE_PREMIUM } from '../../../lib/motion';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Plus,
  MoveRight,
  Edit3,
  FileCheck,
} from 'lucide-react';

interface ParsedResumeReviewPanelProps {
  parsed: ParsedResumeResult;
  sourceLabel: string;
  onBack: () => void;
  onConfirm: (confirmedData: Partial<ResumeData>, goTo: 'wizard' | 'templates') => void;
}

type AssignTarget = 'summary' | 'skills' | 'achievements' | 'custom';

export const ParsedResumeReviewPanel: React.FC<ParsedResumeReviewPanelProps> = ({
  parsed,
  sourceLabel,
  onBack,
  onConfirm,
}) => {
  const [draft, setDraft] = useState<Partial<ResumeData>>(() => ({
    ...EMPTY_RESUME,
    ...parsed.extracted,
  }));
  const [unassigned, setUnassigned] = useState<string[]>([...parsed.unassignedLines]);
  const [newSkill, setNewSkill] = useState('');

  const updateField = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleAssignUnassigned = (index: number, target: AssignTarget) => {
    const line = unassigned[index];
    if (!line) return;

    if (target === 'summary') {
      const nextSummary = draft.summary ? `${draft.summary} ${line}` : line;
      updateField('summary', nextSummary);
    } else if (target === 'skills') {
      const tokens = line
        .split(/[,|•·]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const nextSkills = Array.from(new Set([...(draft.skills || []), ...tokens]));
      updateField('skills', nextSkills);
      updateField('skillCategories', {
        ...(draft.skillCategories || { ...EMPTY_SKILL_CATEGORIES }),
        technical: nextSkills,
      });
    } else if (target === 'achievements') {
      updateField('achievements', [...(draft.achievements || []), line]);
    } else {
      const existingCustom = draft.customSections || [];
      if (existingCustom.length > 0) {
        const updated = existingCustom.map((cs, i) =>
          i === 0 ? { ...cs, items: [...cs.items, line] } : cs
        );
        updateField('customSections', updated);
      } else {
        updateField('customSections', [
          { id: `custom_${Date.now()}`, title: 'Additional Information', items: [line] },
        ]);
      }
    }

    setUnassigned((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUnassigned = (index: number) => {
    setUnassigned((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExperience = (id: string) => {
    updateField(
      'experiences',
      (draft.experiences || []).filter((e) => e.id !== id)
    );
  };

  const handleUpdateExperience = (
    id: string,
    updates: Partial<NonNullable<ResumeData['experiences']>[number]>
  ) => {
    updateField(
      'experiences',
      (draft.experiences || []).map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const handleRemoveEducation = (id: string) => {
    updateField(
      'education',
      (draft.education || []).filter((e) => e.id !== id)
    );
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const next = Array.from(new Set([...(draft.skills || []), trimmed]));
    updateField('skills', next);
    updateField('skillCategories', {
      ...(draft.skillCategories || { ...EMPTY_SKILL_CATEGORIES }),
      technical: next,
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    const next = (draft.skills || []).filter((s) => s !== skill);
    updateField('skills', next);
    if (draft.skillCategories) {
      updateField('skillCategories', {
        technical: (draft.skillCategories.technical || []).filter((s) => s !== skill),
        professional: (draft.skillCategories.professional || []).filter((s) => s !== skill),
        industry: (draft.skillCategories.industry || []).filter((s) => s !== skill),
        tools: (draft.skillCategories.tools || []).filter((s) => s !== skill),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_PREMIUM }}
      className="space-y-6"
    >
      {/* Confirmation Banner */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-[#102B4E]">
                Review &amp; Confirm Extracted Resume Content
              </h3>
              <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                Imported from <strong className="text-[#253449]">{sourceLabel}</strong>. Check each section, fix any parsing errors, and assign unclear lines before saving to your resume.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-[#778397] hover:text-[#102B4E] self-start cursor-pointer"
          >
            ← Re-import
          </button>
        </div>

        {/* Detected Sections Summary Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#778397]">
            Identified Sections:
          </span>
          {parsed.detectedSections.length > 0 ? (
            parsed.detectedSections.map((sec) => (
              <span
                key={sec}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#102B4E]/[0.06] border border-[#102B4E]/15 text-[#102B4E] text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{sec}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-amber-700 font-medium">
              Limited headings detected — review the unassigned lines below to organize your text.
            </span>
          )}
        </div>
      </div>

      {/* Unassigned / Unclear Content Review (Zero Silent Data Loss) */}
      {unassigned.length > 0 && (
        <div className="bg-amber-50/70 rounded-2xl border border-amber-200 p-5 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Unassigned Content ({unassigned.length} {unassigned.length === 1 ? 'item' : 'items'})
              </h4>
              <p className="text-xs text-amber-900/80">
                These lines were not matched to a specific heading. Nothing was discarded — assign each item to a section or remove it if not needed.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {unassigned.map((line, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <p className="text-xs text-[#253449] leading-relaxed flex-1">{line}</p>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAssignUnassigned(idx, 'summary')}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F8FB] hover:bg-[#102B4E] hover:text-white border border-[#E5EAF0] text-[11px] font-semibold text-[#102B4E] transition-colors cursor-pointer"
                  >
                    + Summary
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignUnassigned(idx, 'skills')}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F8FB] hover:bg-[#102B4E] hover:text-white border border-[#E5EAF0] text-[11px] font-semibold text-[#102B4E] transition-colors cursor-pointer"
                  >
                    + Skills
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignUnassigned(idx, 'achievements')}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F8FB] hover:bg-[#102B4E] hover:text-white border border-[#E5EAF0] text-[11px] font-semibold text-[#102B4E] transition-colors cursor-pointer"
                  >
                    + Achievement
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignUnassigned(idx, 'custom')}
                    className="px-2.5 py-1 rounded-lg bg-[#F6F8FB] hover:bg-[#102B4E] hover:text-white border border-[#E5EAF0] text-[11px] font-semibold text-[#102B4E] transition-colors cursor-pointer"
                  >
                    + Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnassigned(idx)}
                    aria-label="Discard line"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editable Extracted Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-3.5 shadow-2xs">
          <h4 className="text-sm font-bold text-[#102B4E] flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-[#F47A24]" />
            <span>Personal Information</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-semibold text-[#778397]">Full Name</span>
              <input
                type="text"
                value={draft.fullName || ''}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-[#778397]">Professional Title</span>
              <input
                type="text"
                value={draft.professionalTitle || ''}
                onChange={(e) => updateField('professionalTitle', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-[#778397]">Email</span>
              <input
                type="email"
                value={draft.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-[#778397]">Phone</span>
              <input
                type="text"
                value={draft.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-[#778397]">City</span>
              <input
                type="text"
                value={draft.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-[#778397]">LinkedIn</span>
              <input
                type="text"
                value={draft.linkedIn || ''}
                onChange={(e) => updateField('linkedIn', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
              />
            </label>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-3 shadow-2xs flex flex-col">
          <h4 className="text-sm font-bold text-[#102B4E] flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-[#F47A24]" />
            <span>Professional Summary</span>
          </h4>
          <textarea
            rows={6}
            value={draft.summary || ''}
            onChange={(e) => updateField('summary', e.target.value)}
            placeholder="No summary detected — you can add or edit it here or in the next step."
            className="w-full flex-1 p-3 text-xs sm:text-sm rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden leading-relaxed"
          />
        </div>
      </div>

      {/* Work Experience Review */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#102B4E]">
            Work Experience ({(draft.experiences || []).length})
          </h4>
        </div>

        {(draft.experiences || []).length === 0 ? (
          <p className="text-xs text-[#778397]">
            No work experience entries were detected. You can add them directly in the editor.
          </p>
        ) : (
          <div className="space-y-3">
            {(draft.experiences || []).map((exp) => (
              <div
                key={exp.id}
                className="p-4 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 text-xs">
                    <input
                      type="text"
                      value={exp.jobTitle}
                      onChange={(e) => handleUpdateExperience(exp.id, { jobTitle: e.target.value })}
                      placeholder="Job Title"
                      className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white font-semibold text-[#102B4E]"
                    />
                    <input
                      type="text"
                      value={exp.companyName}
                      onChange={(e) =>
                        handleUpdateExperience(exp.id, { companyName: e.target.value })
                      }
                      placeholder="Company Name"
                      className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white text-[#253449]"
                    />
                    <input
                      type="text"
                      value={
                        exp.currentlyWorking
                          ? `${exp.startYear} - Present`
                          : [exp.startYear, exp.endYear].filter(Boolean).join(' - ')
                      }
                      onChange={(e) => {
                        const parts = e.target.value.split('-').map((p) => p.trim());
                        handleUpdateExperience(exp.id, {
                          startYear: parts[0] || '',
                          endYear: /present/i.test(parts[1] || '') ? '' : parts[1] || '',
                          currentlyWorking: /present/i.test(parts[1] || ''),
                        });
                      }}
                      placeholder="Start - End"
                      className="px-3 py-2 rounded-lg border border-[#E5EAF0] bg-white text-[#778397]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(exp.id)}
                    aria-label="Remove role"
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {exp.responsibilities.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-[#253449] space-y-1">
                    {exp.responsibilities.map((r, rIdx) => (
                      <li key={rIdx}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Education & Skills Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Education */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-3 shadow-2xs">
          <h4 className="text-sm font-bold text-[#102B4E]">
            Education ({(draft.education || []).length})
          </h4>
          {(draft.education || []).length === 0 ? (
            <p className="text-xs text-[#778397]">No education entries detected.</p>
          ) : (
            <div className="space-y-2.5">
              {(draft.education || []).map((edu) => (
                <div
                  key={edu.id}
                  className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-[#102B4E]">{edu.degree || 'Degree'}</div>
                    <div className="text-[#778397]">
                      {[edu.institution, edu.endDate].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(edu.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 space-y-3 shadow-2xs">
          <h4 className="text-sm font-bold text-[#102B4E]">
            Skills ({(draft.skills || []).length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {(draft.skills || []).map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#102B4E]/[0.06] border border-[#102B4E]/15 text-[#102B4E] text-xs font-semibold"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-[#778397] hover:text-rose-600 cursor-pointer"
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add another skill..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden min-h-[40px]"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#102B4E] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Explicit Confirmation Footer */}
      <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <p className="text-xs text-[#778397]">
          Nothing is saved until you confirm. You can continue refining any section in the guided steps or jump directly to choosing a template.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onConfirm(draft, 'wizard')}
            className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#102B4E] text-[#102B4E] hover:bg-[#102B4E]/5 text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Confirm &amp; Edit Step by Step</span>
            <MoveRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onConfirm(draft, 'templates')}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Confirm &amp; Choose Template</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ParsedResumeReviewPanel;
