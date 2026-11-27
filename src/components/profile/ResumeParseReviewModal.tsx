import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Check,
  ShieldAlert,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import type { CandidateLanguageItem, CandidateProfile } from '../../types';
import type {
  ParsedCandidateDraft,
  ParsedMergeSectionKey,
} from '../../utils/profileCompletion';

interface ResumeParseReviewModalProps {
  isOpen: boolean;
  existingProfile: CandidateProfile;
  initialDraft: ParsedCandidateDraft | null;
  onClose: () => void;
  onConfirmSave: (
    editedDraft: ParsedCandidateDraft,
    selectedSections: Record<ParsedMergeSectionKey, boolean>,
    overwriteExisting: boolean
  ) => void;
}

const EXPERIENCE_LEVELS: CandidateProfile['experienceLevel'][] = [
  'Fresher',
  'Junior',
  'Mid',
  'Senior',
  'Lead',
];

const LANGUAGE_PROFICIENCIES: CandidateLanguageItem['proficiency'][] = [
  'Native',
  'Fluent',
  'Professional',
  'Conversational',
  'Basic',
];

export const ResumeParseReviewModal: React.FC<ResumeParseReviewModalProps> = ({
  isOpen,
  existingProfile,
  initialDraft,
  onClose,
  onConfirmSave,
}) => {
  const [draft, setDraft] = useState<ParsedCandidateDraft | null>(initialDraft);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [newSkillText, setNewSkillText] = useState('');
  const [newLanguageText, setNewLanguageText] = useState('');
  const [selected, setSelected] = useState<Record<ParsedMergeSectionKey, boolean>>({
    personal: true,
    summary: true,
    employment: true,
    skills: true,
    education: true,
    certifications: true,
    projects: true,
    languages: true,
    preferences: true,
    links: true,
  });

  useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
      setOverwriteExisting(false);
      setSelected({
        personal: Boolean(
          initialDraft.personal.name ||
            initialDraft.personal.headline ||
            initialDraft.personal.phone ||
            initialDraft.personal.location ||
            initialDraft.personal.yearsOfExperience > 0
        ),
        summary: Boolean(initialDraft.summary),
        employment: initialDraft.experiences.length > 0,
        skills: initialDraft.skills.length > 0,
        education: initialDraft.education.length > 0,
        certifications: initialDraft.certifications.length > 0,
        projects: initialDraft.projects.length > 0,
        languages: initialDraft.languages.length > 0,
        preferences: Boolean(
          initialDraft.careerPreferences?.desiredRole ||
            initialDraft.careerPreferences?.preferredLocation ||
            initialDraft.careerPreferences?.preferredIndustry
        ),
        links: Boolean(
          initialDraft.links.linkedinUrl ||
            initialDraft.links.githubUrl ||
            initialDraft.links.portfolioUrl ||
            (initialDraft.links.otherLinks && initialDraft.links.otherLinks.length > 0)
        ),
      });
    }
  }, [initialDraft]);

  if (!isOpen || !draft) return null;

  const hasExistingSubstantialData = Boolean(
    existingProfile.about?.trim() ||
      (existingProfile.experiences && existingProfile.experiences.length > 0) ||
      (existingProfile.education && existingProfile.education.length > 0) ||
      (existingProfile.skills && existingProfile.skills.length > 0)
  );

  const toggleSection = (key: ParsedMergeSectionKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddSkill = () => {
    const clean = newSkillText.trim();
    if (!clean) return;
    if (draft.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setNewSkillText('');
      return;
    }
    setDraft({
      ...draft,
      skills: [...draft.skills, clean],
      detailedSkills: [
        ...(draft.detailedSkills || []),
        { name: clean, proficiency: 'Intermediate', isPrimary: (draft.detailedSkills || []).length < 3 },
      ],
    });
    setSelected((prev) => ({ ...prev, skills: true }));
    setNewSkillText('');
  };

  const handleAddLanguage = () => {
    const clean = newLanguageText.trim();
    if (!clean) return;
    if (draft.languages.some((l) => l.language.toLowerCase() === clean.toLowerCase())) {
      setNewLanguageText('');
      return;
    }
    setDraft({
      ...draft,
      languages: [
        ...draft.languages,
        {
          id: `lang_edit_${Date.now()}`,
          language: clean,
          proficiency: 'Professional',
          canRead: true,
          canWrite: true,
          canSpeak: true,
        },
      ],
    });
    setSelected((prev) => ({ ...prev, languages: true }));
    setNewLanguageText('');
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#081D36]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-review-title"
    >
      <div className="bg-white rounded-2xl border border-[#D4DCE6] shadow-2xl w-full max-w-[min(880px,calc(100vw-2rem))] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-[#E5EAF0] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#DE6816]">
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {draft.fileName} · {draft.fileSize}
              </span>
            </div>
            <h2
              id="resume-review-title"
              className="text-lg sm:text-xl font-bold text-[#102B4E] mt-1 tracking-tight"
            >
              Review Extracted Resume Details
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Verify or edit extracted details below before saving them to your ABHI JOBS profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review modal"
            className="p-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Review Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 space-y-5 bg-[#FAFBFD]">
          {/* Merge Strategy Safety Guard */}
          <div className="bg-white rounded-xl border border-[#D4DCE6] p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-[#102B4E] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#102B4E]">
                  How should extracted details be applied?
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {hasExistingSubstantialData
                    ? 'Your profile already has saved information. Use Safe Merge to keep existing entries, or Replace Selected Sections to refresh your profile cleanly from this resume.'
                    : 'Choose how to save the extracted resume data into your candidate profile.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOverwriteExisting(false)}
                className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  !overwriteExisting
                    ? 'border-[#102B4E] bg-[#F1F5FA]'
                    : 'border-[#E5EAF0] bg-white hover:bg-[#FAFBFD]'
                }`}
              >
                <p className="text-xs font-semibold text-[#102B4E]">
                  Merge Safely (Recommended)
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Fill empty fields and append new entries without overwriting saved profile data.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setOverwriteExisting(true)}
                className={`text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                  overwriteExisting
                    ? 'border-[#DE6816] bg-[#FFF7F1]'
                    : 'border-[#E5EAF0] bg-white hover:bg-[#FAFBFD]'
                }`}
              >
                <p className="text-xs font-semibold text-[#0F172A]">
                  Replace Selected Sections
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Replace existing entries in the checked sections below with this clean scan.
                </p>
              </button>
            </div>
          </div>

          {/* 1. Personal Details */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.personal}
                  onChange={() => toggleSection('personal')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">Personal Details</span>
              </span>
              <span className="text-[11px] text-[#64748B]">Headline, location, phone &amp; experience</span>
            </label>

            {selected.personal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={draft.personal.name}
                    onChange={(e) =>
                      setDraft({ ...draft, personal: { ...draft.personal, name: e.target.value } })
                    }
                    className="w-full px-3 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Professional Headline</label>
                  <input
                    type="text"
                    value={draft.personal.headline}
                    placeholder="e.g. Purchase Executive | Procurement & SAP MM"
                    onChange={(e) =>
                      setDraft({ ...draft, personal: { ...draft.personal, headline: e.target.value } })
                    }
                    className="w-full px-3 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Phone</label>
                  <input
                    type="text"
                    value={draft.personal.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, personal: { ...draft.personal, phone: e.target.value } })
                    }
                    className="w-full px-3 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Location</label>
                  <input
                    type="text"
                    value={draft.personal.location}
                    placeholder="e.g. Bengaluru, Karnataka"
                    onChange={(e) =>
                      setDraft({ ...draft, personal: { ...draft.personal, location: e.target.value } })
                    }
                    className="w-full px-3 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">Experience Level</label>
                    <select
                      value={draft.personal.experienceLevel}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          personal: {
                            ...draft.personal,
                            experienceLevel: e.target.value as CandidateProfile['experienceLevel'],
                          },
                        })
                      }
                      className="w-full px-2.5 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                    >
                      {EXPERIENCE_LEVELS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#475569] mb-1">Years of Exp.</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={draft.personal.yearsOfExperience}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          personal: {
                            ...draft.personal,
                            yearsOfExperience: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                      className="w-full px-3 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#475569] mb-1">Current Work Status</label>
                  <select
                    value={draft.personal.workStatus || 'Looking for a job'}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        personal: { ...draft.personal, workStatus: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-2 min-h-[40px] text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                  >
                    <option value="Working">Working</option>
                    <option value="Looking for a job">Looking for a job</option>
                    <option value="Currently not working">Currently not working</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Profile Summary */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.summary}
                  onChange={() => toggleSection('summary')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">Professional Summary</span>
              </span>
              <span className="text-[11px] text-[#64748B] tabular-nums">
                {draft.summary.length} chars
              </span>
            </label>

            {selected.summary && (
              <textarea
                rows={3}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                placeholder="No summary detected — you can type or paste one here."
                className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
              />
            )}
          </div>

          {/* 3. Work Experience */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.employment}
                  onChange={() => toggleSection('employment')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">
                  Work Experience ({draft.experiences.length})
                </span>
              </span>
              <span className="text-[11px] text-[#64748B]">Editable roles</span>
            </label>

            {selected.employment && (
              <div className="space-y-3">
                {draft.experiences.length === 0 ? (
                  <p className="text-xs text-[#64748B]">
                    No work experience entries were detected in this resume. You can add them manually in the Employment section.
                  </p>
                ) : (
                  draft.experiences.map((exp, idx) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#334155]">
                          Role #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              experiences: draft.experiences.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          value={exp.jobTitle}
                          placeholder="Designation / Job Title"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, jobTitle: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                          className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          placeholder="Company Name"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, company: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                          className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                        />
                        <input
                          type="text"
                          value={exp.location || ''}
                          placeholder="Location (e.g. Bengaluru / Remote)"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, location: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                          className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                        />
                        <input
                          type="text"
                          value={exp.employmentType || 'Full-time'}
                          placeholder="Employment Type (e.g. Full-time)"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, employmentType: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                          className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                        />
                        <input
                          type="text"
                          value={exp.startDate}
                          placeholder="Joining Date (e.g. 2024-06)"
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            next[idx] = { ...exp, startDate: e.target.value };
                            setDraft({ ...draft, experiences: next });
                          }}
                          className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={exp.current ? 'Present' : exp.endDate}
                            disabled={exp.current}
                            placeholder="Last Working Date"
                            onChange={(e) => {
                              const next = [...draft.experiences];
                              next[idx] = { ...exp, endDate: e.target.value };
                              setDraft({ ...draft, experiences: next });
                            }}
                            className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1] disabled:bg-[#F1F5F9]"
                          />
                          <label className="inline-flex items-center gap-1.5 text-xs text-[#334155] shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => {
                                const next = [...draft.experiences];
                                next[idx] = {
                                  ...exp,
                                  current: e.target.checked,
                                  endDate: e.target.checked ? '' : exp.endDate,
                                };
                                setDraft({ ...draft, experiences: next });
                              }}
                              className="accent-[#102B4E]"
                            />
                            <span>Current</span>
                          </label>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={exp.description}
                        placeholder="Responsibilities & description"
                        onChange={(e) => {
                          const next = [...draft.experiences];
                          next[idx] = { ...exp, description: e.target.value };
                          setDraft({ ...draft, experiences: next });
                        }}
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 4. Key Skills */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.skills}
                  onChange={() => toggleSection('skills')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">
                  Key Skills ({draft.skills.length})
                </span>
              </span>
            </label>

            {selected.skills && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add missing skill..."
                    className="flex-1 min-w-0 px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-[#102B4E] text-white text-xs font-semibold cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {draft.skills.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No skills detected from resume.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5FA] border border-[#D4DCE6] text-xs font-medium text-[#102B4E]"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              skills: draft.skills.filter((s) => s !== skill),
                              detailedSkills: (draft.detailedSkills || []).filter(
                                (s) => s.name.toLowerCase() !== skill.toLowerCase()
                              ),
                            })
                          }
                          aria-label={`Remove ${skill}`}
                          className="text-[#64748B] hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. Education */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.education}
                  onChange={() => toggleSection('education')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">
                  Education ({draft.education.length})
                </span>
              </span>
              <span className="text-[11px] text-[#64748B]">Separate degrees &amp; schools</span>
            </label>

            {selected.education && (
              <div className="space-y-2.5">
                {draft.education.length === 0 ? (
                  <p className="text-xs text-[#64748B]">No education entries detected.</p>
                ) : (
                  draft.education.map((edu, idx) => (
                    <div
                      key={edu.id}
                      className="p-3 rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                    >
                      <input
                        type="text"
                        value={edu.qualification}
                        placeholder="Degree / Qualification"
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...edu, qualification: e.target.value };
                          setDraft({ ...draft, education: next });
                        }}
                        className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        placeholder="Institution / University / School"
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...edu, institution: e.target.value };
                          setDraft({ ...draft, education: next });
                        }}
                        className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                      />
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ''}
                        placeholder="Field of Study / Stream (optional)"
                        onChange={(e) => {
                          const next = [...draft.education];
                          next[idx] = { ...edu, fieldOfStudy: e.target.value };
                          setDraft({ ...draft, education: next });
                        }}
                        className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.startYear}
                          placeholder="Start Year"
                          onChange={(e) => {
                            const next = [...draft.education];
                            next[idx] = { ...edu, startYear: e.target.value };
                            setDraft({ ...draft, education: next });
                          }}
                          className="px-2.5 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                        />
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={edu.endYear}
                            placeholder="End Year"
                            onChange={(e) => {
                              const next = [...draft.education];
                              next[idx] = { ...edu, endYear: e.target.value };
                              setDraft({ ...draft, education: next });
                            }}
                            className="flex-1 min-w-0 px-2.5 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                education: draft.education.filter((_, i) => i !== idx),
                              })
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md cursor-pointer shrink-0"
                            aria-label="Remove education entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 6. Career Preferences */}
          <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 sm:p-5 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selected.preferences}
                  onChange={() => toggleSection('preferences')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">Career Preferences</span>
              </span>
              <span className="text-[11px] text-[#64748B]">Target role, city &amp; industry</span>
            </label>

            {selected.preferences && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={draft.careerPreferences?.desiredRole || ''}
                  placeholder="Desired Role"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      careerPreferences: {
                        ...draft.careerPreferences,
                        desiredRole: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                />
                <input
                  type="text"
                  value={draft.careerPreferences?.preferredLocation || ''}
                  placeholder="Preferred Location"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      careerPreferences: {
                        ...draft.careerPreferences,
                        preferredLocation: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                />
                <input
                  type="text"
                  value={draft.careerPreferences?.preferredIndustry || ''}
                  placeholder="Preferred Industry"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      careerPreferences: {
                        ...draft.careerPreferences,
                        preferredIndustry: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1]"
                />
              </div>
            )}
          </div>

          {/* 7. Certifications, Projects, Languages & Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.certifications}
                  onChange={() => toggleSection('certifications')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">
                  Certifications ({draft.certifications.length})
                </span>
              </label>
              {draft.certifications.length === 0 ? (
                <p className="text-xs text-[#64748B]">None detected</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-[#334155]">
                  {draft.certifications.map((c, idx) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {c.title}
                        {c.issuer ? ` · ${c.issuer}` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            certifications: draft.certifications.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-[#94A3B8] hover:text-red-600 cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.projects}
                  onChange={() => toggleSection('projects')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">
                  Projects ({draft.projects.length})
                </span>
              </label>
              {draft.projects.length === 0 ? (
                <p className="text-xs text-[#64748B]">None detected</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-[#334155]">
                  {draft.projects.map((p, idx) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">{p.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            projects: draft.projects.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-[#94A3B8] hover:text-red-600 cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.languages}
                  onChange={() => toggleSection('languages')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">
                  Languages ({draft.languages.length})
                </span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newLanguageText}
                  onChange={(e) => setNewLanguageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                  placeholder="Add language..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white rounded-md border border-[#CBD5E1]"
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-2.5 py-1.5 rounded-md bg-[#102B4E] text-white text-xs font-semibold cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
              {draft.languages.length === 0 ? (
                <p className="text-xs text-[#64748B]">None detected</p>
              ) : (
                <ul className="space-y-1.5">
                  {draft.languages.map((lang, idx) => (
                    <li key={lang.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-[#1E293B] truncate">{lang.language}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          value={lang.proficiency}
                          onChange={(e) => {
                            const next = [...draft.languages];
                            next[idx] = {
                              ...lang,
                              proficiency: e.target.value as CandidateLanguageItem['proficiency'],
                            };
                            setDraft({ ...draft, languages: next });
                          }}
                          className="px-2 py-1 text-[11px] bg-white rounded border border-[#CBD5E1]"
                        >
                          {LANGUAGE_PROFICIENCIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              languages: draft.languages.filter((_, i) => i !== idx),
                            })
                          }
                          aria-label={`Remove ${lang.language}`}
                          className="text-[#94A3B8] hover:text-red-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#E5EAF0] p-4 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.links}
                  onChange={() => toggleSection('links')}
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span className="text-sm font-semibold text-[#102B4E]">Professional Links</span>
              </label>
              {selected.links ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={draft.links.linkedinUrl}
                    placeholder="LinkedIn URL"
                    onChange={(e) =>
                      setDraft({ ...draft, links: { ...draft.links, linkedinUrl: e.target.value } })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-md border border-[#CBD5E1]"
                  />
                  <input
                    type="url"
                    value={draft.links.githubUrl}
                    placeholder="GitHub URL"
                    onChange={(e) =>
                      setDraft({ ...draft, links: { ...draft.links, githubUrl: e.target.value } })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-md border border-[#CBD5E1]"
                  />
                  <input
                    type="url"
                    value={draft.links.portfolioUrl}
                    placeholder="Portfolio / Website URL"
                    onChange={(e) =>
                      setDraft({ ...draft, links: { ...draft.links, portfolioUrl: e.target.value } })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded-md border border-[#CBD5E1]"
                  />
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">Skipped</p>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-4 sm:px-6 border-t border-[#E5EAF0] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="tabular-nums">
              {selectedCount} section{selectedCount === 1 ? '' : 's'} selected ·{' '}
              {overwriteExisting ? 'Replace mode' : 'Safe merge mode'}
            </span>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirmSave(draft, selected, overwriteExisting)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm &amp; Save to Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
