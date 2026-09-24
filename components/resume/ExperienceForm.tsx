import React, { useState } from 'react';
import { ResumeExperience, ResumeEmploymentType } from '../../types/resume';
import { Briefcase, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, GripVertical, Check, PlusCircle } from 'lucide-react';

interface ExperienceFormProps {
  experiences: ResumeExperience[];
  onChange: (experiences: ResumeExperience[]) => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const EMPLOYMENT_TYPES: ResumeEmploymentType[] = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Temporary',
  'Freelance',
];

export const ExperienceForm: React.FC<ExperienceFormProps> = ({ experiences, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    experiences.length > 0 ? experiences[0].id : null
  );

  const handleAddExperience = () => {
    const newEntry: ResumeExperience = {
      id: `exp_${Date.now()}`,
      jobTitle: '',
      companyName: '',
      employmentType: 'Full-time',
      location: '',
      startMonth: 'January',
      startYear: `${new Date().getFullYear() - 1}`,
      endMonth: '',
      endYear: '',
      currentlyWorking: true,
      responsibilities: [''],
    };
    onChange([...experiences, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleUpdateEntry = (id: string, updates: Partial<ResumeExperience>) => {
    onChange(
      experiences.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const handleDeleteEntry = (id: string) => {
    onChange(experiences.filter((exp) => exp.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...experiences];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === experiences.length - 1) return;
    const next = [...experiences];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  // Bullet point handlers
  const handleAddBullet = (expId: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;
    handleUpdateEntry(expId, {
      responsibilities: [...(exp.responsibilities || []), ''],
    });
  };

  const handleUpdateBullet = (expId: string, bulletIdx: number, value: string) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;
    const updated = [...exp.responsibilities];
    updated[bulletIdx] = value;
    handleUpdateEntry(expId, { responsibilities: updated });
  };

  const handleDeleteBullet = (expId: string, bulletIdx: number) => {
    const exp = experiences.find((e) => e.id === expId);
    if (!exp) return;
    const updated = exp.responsibilities.filter((_, idx) => idx !== bulletIdx);
    handleUpdateEntry(expId, { responsibilities: updated });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#004D40]" />
            Work Experience
          </h3>
          <p className="text-xs text-slate-500">
            Add relevant jobs, internships, or freelance roles in reverse chronological order
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddExperience}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>

      {experiences.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">No work experience added yet</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click &quot;Add Experience&quot; to list your current or past employment
          </p>
          <button
            type="button"
            onClick={handleAddExperience}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#004D40] text-xs font-semibold border border-teal-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((exp, index) => {
            const isExpanded = expandedId === exp.id;
            const displayTitle = exp.jobTitle || 'Untitled Position';
            const displayCompany = exp.companyName || 'Company Name';

            return (
              <div
                key={exp.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30 transition-all"
              >
                {/* Header row / Accordion toggle */}
                <div className="p-3.5 sm:p-4 bg-white flex items-center justify-between gap-3 border-b border-slate-100">
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90 text-[#004D40]' : ''
                      }`}
                    />
                    <div className="min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {displayTitle}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {displayCompany} &bull; {exp.startYear || 'Start'}{' '}
                        &ndash; {exp.currentlyWorking ? 'Present' : exp.endYear || 'End'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title="Move Up"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Move Down"
                      disabled={index === experiences.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete Entry"
                      onClick={() => handleDeleteEntry(exp.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Form Fields */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.jobTitle}
                          onChange={(e) => handleUpdateEntry(exp.id, { jobTitle: e.target.value })}
                          placeholder="e.g. Operations Coordinator"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.companyName}
                          onChange={(e) => handleUpdateEntry(exp.id, { companyName: e.target.value })}
                          placeholder="e.g. Acme Logistics"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Employment Type
                        </label>
                        <select
                          value={exp.employmentType}
                          onChange={(e) =>
                            handleUpdateEntry(exp.id, {
                              employmentType: e.target.value as ResumeEmploymentType,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20 bg-white"
                        >
                          {EMPLOYMENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleUpdateEntry(exp.id, { location: e.target.value })}
                          placeholder="e.g. Bengaluru, India / Remote"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>
                    </div>

                    {/* Dates & Currently working */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Period of Employment</label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={exp.currentlyWorking}
                            onChange={(e) =>
                              handleUpdateEntry(exp.id, { currentlyWorking: e.target.checked })
                            }
                            className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
                          />
                          <span>Currently Working Here</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {/* Start Month */}
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Start Month</label>
                          <select
                            value={exp.startMonth}
                            onChange={(e) => handleUpdateEntry(exp.id, { startMonth: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Start Year */}
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">Start Year</label>
                          <input
                            type="text"
                            maxLength={4}
                            value={exp.startYear}
                            onChange={(e) => handleUpdateEntry(exp.id, { startYear: e.target.value })}
                            placeholder="YYYY"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>

                        {/* End Month */}
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">End Month</label>
                          <select
                            disabled={exp.currentlyWorking}
                            value={exp.endMonth}
                            onChange={(e) => handleUpdateEntry(exp.id, { endMonth: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            <option value="">Month</option>
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* End Year */}
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-1">End Year</label>
                          <input
                            type="text"
                            maxLength={4}
                            disabled={exp.currentlyWorking}
                            value={exp.currentlyWorking ? 'Present' : exp.endYear}
                            onChange={(e) => handleUpdateEntry(exp.id, { endYear: e.target.value })}
                            placeholder="YYYY"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bullet Points / Responsibilities */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Key Responsibilities &amp; Achievements (Bullet Points)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddBullet(exp.id)}
                          className="text-xs font-semibold text-[#004D40] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add Bullet</span>
                        </button>
                      </div>

                      {exp.responsibilities?.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <span className="text-slate-400 mt-2 font-bold text-sm">&bull;</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleUpdateBullet(exp.id, bIdx, e.target.value)}
                            placeholder="e.g. Managed daily operations for a logistics team across 3 distribution hubs"
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                          />
                          <button
                            type="button"
                            title="Remove Bullet"
                            onClick={() => handleDeleteBullet(exp.id, bIdx)}
                            className="p-2 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
