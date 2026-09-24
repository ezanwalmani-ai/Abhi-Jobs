import React, { useState } from 'react';
import { ResumeEducation } from '../../types/resume';
import { GraduationCap, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';

interface EducationFormProps {
  education: ResumeEducation[];
  onChange: (education: ResumeEducation[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({ education, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    education.length > 0 ? education[0].id : null
  );

  const handleAddEducation = () => {
    const newEntry: ResumeEducation = {
      id: `edu_${Date.now()}`,
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: `${new Date().getFullYear()}`,
      description: '',
    };
    onChange([...education, newEntry]);
    setExpandedId(newEntry.id);
  };

  const handleUpdate = (id: string, updates: Partial<ResumeEducation>) => {
    onChange(education.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleDelete = (id: string) => {
    onChange(education.filter((e) => e.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...education];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === education.length - 1) return;
    const next = [...education];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#004D40]" />
            Education
          </h3>
          <p className="text-xs text-slate-500">
            List your degrees, diplomas, or relevant academic qualifications
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddEducation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>

      {education.length === 0 ? (
        <div className="text-center py-7 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs sm:text-sm font-semibold text-slate-700">No education entries added</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Add your degree, university, or college credentials
          </p>
          <button
            type="button"
            onClick={handleAddEducation}
            className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#004D40] text-xs font-semibold border border-teal-200 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {education.map((edu, index) => {
            const isExpanded = expandedId === edu.id;
            const displayDegree = edu.degree || 'Degree / Qualification';
            const displayInst = edu.institution || 'Institution';

            return (
              <div
                key={edu.id}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/30"
              >
                <div className="p-3.5 sm:p-4 bg-white flex items-center justify-between gap-3 border-b border-slate-100">
                  <div
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : edu.id)}
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isExpanded ? 'rotate-90 text-[#004D40]' : ''
                      }`}
                    />
                    <div className="min-w-0 truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {displayDegree}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {displayInst} &bull; {edu.endDate || edu.startDate || 'Present'}
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
                      disabled={index === education.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete Entry"
                      onClick={() => handleDelete(edu.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-4 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Degree / Qualification <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleUpdate(edu.id, { degree: e.target.value })}
                          placeholder="e.g. Bachelor of Commerce (B.Com)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Institution / University <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdate(edu.id, { institution: e.target.value })}
                          placeholder="e.g. Bangalore University"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Location (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => handleUpdate(edu.id, { location: e.target.value })}
                          placeholder="e.g. Bengaluru, India"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Start Year
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            value={edu.startDate}
                            onChange={(e) => handleUpdate(edu.id, { startDate: e.target.value })}
                            placeholder="YYYY"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            End Year
                          </label>
                          <input
                            type="text"
                            maxLength={4}
                            value={edu.endDate}
                            onChange={(e) => handleUpdate(edu.id, { endDate: e.target.value })}
                            placeholder="YYYY"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Highlights / Description (Optional)
                      </label>
                      <input
                        type="text"
                        value={edu.description}
                        onChange={(e) => handleUpdate(edu.id, { description: e.target.value })}
                        placeholder="e.g. Graduated First Class with Distinction, Major in Finance"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
                      />
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
