import React, { useState } from 'react';
import { Wrench, Plus, X, ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';

interface SkillsFormProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  profileSkills?: string[];
}

export const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  onChange,
  profileSkills = [],
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddSkill = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    onChange([...skills, trimmed]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    onChange(skills.filter((s) => s !== skillToRemove));
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const next = [...skills];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveRight = (index: number) => {
    if (index === skills.length - 1) return;
    const next = [...skills];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  // Profile skills that are not yet added
  const suggestedSkills = profileSkills.filter(
    (ps) => !skills.some((s) => s.toLowerCase() === ps.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#004D40]" />
          Skills
        </h3>
        <p className="text-xs text-slate-500">
          List your technical capabilities, tools, and domain proficiencies
        </p>
      </div>

      {/* Input box */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a skill (e.g. Inventory Management, Python, Excel)"
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
        />
        <button
          type="button"
          onClick={handleAddSkill}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Quick suggestions from profile if available */}
      {suggestedSkills.length > 0 && (
        <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#004D40]">
            <Lightbulb className="w-3.5 h-3.5 text-[#004D40]" />
            <span>Suggested from your ABHI JOBS profile:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedSkills.slice(0, 8).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => onChange([...skills, skill])}
                className="px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-teal-900 text-xs font-medium hover:bg-teal-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#004D40]" />
                <span>{skill}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chips list */}
      {skills.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No skills added yet. Type a skill above and press Enter.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {skills.map((skill, index) => (
            <div
              key={`${skill}_${index}`}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold hover:border-slate-300 transition-all"
            >
              <span>{skill}</span>

              <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    title="Move Left"
                    onClick={() => handleMoveLeft(index)}
                    className="p-0.5 hover:text-[#004D40] cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                )}
                {index < skills.length - 1 && (
                  <button
                    type="button"
                    title="Move Right"
                    onClick={() => handleMoveRight(index)}
                    className="p-0.5 hover:text-[#004D40] cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  title="Remove Skill"
                  onClick={() => handleRemoveSkill(skill)}
                  className="p-0.5 hover:text-red-500 rounded-full cursor-pointer ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
