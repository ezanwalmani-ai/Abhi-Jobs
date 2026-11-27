import React, { useMemo, useState } from 'react';
import { Plus, Search, Star, Trash2, Check } from 'lucide-react';
import type { CandidateSkillItem, SkillProficiency } from '../../types';
import { CURATED_SKILLS_SUGGESTIONS } from '../../utils/profileCompletion';

interface SkillSelectorEditorProps {
  skills: CandidateSkillItem[];
  onChange: (next: CandidateSkillItem[]) => void;
  onSave: () => void;
  onCancel: () => void;
}

const PROFICIENCY_LEVELS: SkillProficiency[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const SkillSelectorEditor: React.FC<SkillSelectorEditorProps> = ({
  skills,
  onChange,
  onSave,
  onCancel,
}) => {
  const [query, setQuery] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState<SkillProficiency>('Intermediate');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const existingKeys = useMemo(
    () => new Set(skills.map((s) => s.name.toLowerCase())),
    [skills]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = CURATED_SKILLS_SUGGESTIONS.filter((s) => !existingKeys.has(s.toLowerCase()));
    if (!q) return pool.slice(0, 12);
    return pool.filter((s) => s.toLowerCase().includes(q)).slice(0, 12);
  }, [query, existingKeys]);

  const addSkill = (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) return;
    if (existingKeys.has(clean.toLowerCase())) {
      setQuery('');
      return;
    }
    const primaryCount = skills.filter((s) => s.isPrimary).length;
    onChange([
      ...skills,
      {
        name: clean,
        proficiency: selectedProficiency,
        isPrimary: primaryCount < 3,
      },
    ]);
    setQuery('');
    setDropdownOpen(false);
  };

  const updateProficiency = (name: string, proficiency: SkillProficiency) => {
    onChange(skills.map((s) => (s.name === name ? { ...s, proficiency } : s)));
  };

  const togglePrimary = (name: string) => {
    onChange(
      skills.map((s) => (s.name === name ? { ...s, isPrimary: !s.isPrimary } : s))
    );
  };

  const removeSkill = (name: string) => {
    onChange(skills.filter((s) => s.name !== name));
  };

  return (
    <div className="space-y-5">
      {/* Searchable Selector Bar */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[#334155]">
          Search or add a skill
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 180)}
              onChange={(e) => {
                setQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(query);
                }
              }}
              placeholder="Search skills (e.g. Microsoft Excel, React, Tally Prime, B2B Sales)..."
              className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm bg-white rounded-lg border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#102B4E] focus:ring-2 focus:ring-[#102B4E]/10"
            />

            {dropdownOpen && (suggestions.length > 0 || query.trim().length > 1) && (
              <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-[#D4DCE6] rounded-lg shadow-lg max-h-56 overflow-y-auto py-1">
                {query.trim().length > 1 &&
                  !existingKeys.has(query.trim().toLowerCase()) &&
                  !suggestions.some((s) => s.toLowerCase() === query.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addSkill(query);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-[#102B4E] hover:bg-[#F6F8FB] flex items-center justify-between gap-2 cursor-pointer border-b border-[#EEF2F6]"
                    >
                      <span>
                        Add <span className="font-semibold">"{query.trim()}"</span>
                      </span>
                      <Plus className="w-4 h-4 text-[#F47A24] shrink-0" />
                    </button>
                  )}

                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addSkill(suggestion);
                    }}
                    className="w-full text-left px-3.5 py-2 text-sm text-[#334155] hover:bg-[#F6F8FB] hover:text-[#102B4E] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span>{suggestion}</span>
                    <span className="text-[11px] font-medium text-[#64748B]">Add</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <select
              value={selectedProficiency}
              onChange={(e) => setSelectedProficiency(e.target.value as SkillProficiency)}
              aria-label="Default proficiency for added skill"
              className="px-3 py-2.5 min-h-[44px] text-xs sm:text-sm bg-white rounded-lg border border-[#CBD5E1] text-[#0F172A] focus:outline-hidden focus:border-[#102B4E] cursor-pointer"
            >
              {PROFICIENCY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addSkill(query)}
              disabled={!query.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-45 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Quick Suggested Additions */}
        <div className="pt-1">
          <p className="text-[11px] font-medium text-[#64748B] mb-2">
            Popular suggestions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 8).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => addSkill(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E2E8F0] bg-[#FAFBFD] hover:border-[#102B4E]/40 hover:text-[#102B4E] text-xs text-[#475569] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#64748B]" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Skills Management Table */}
      <div className="border border-[#E5EAF0] rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 bg-[#FAFBFD] border-b border-[#E5EAF0] flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#334155]">
            Your Listed Skills ({skills.length})
          </span>
          <span className="text-[11px] text-[#64748B]">
            Star your top primary skills for recruiter search ranking
          </span>
        </div>

        {skills.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs sm:text-sm text-[#64748B]">
            No skills added yet. Search above or click a suggestion to add your core competencies.
          </div>
        ) : (
          <ul className="divide-y divide-[#EEF2F6]">
            {skills.map((skill) => (
              <li
                key={skill.name}
                className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#FAFBFD]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => togglePrimary(skill.name)}
                    title={skill.isPrimary ? 'Primary skill (click to unset)' : 'Mark as primary skill'}
                    className={`p-1.5 rounded-md border transition-colors cursor-pointer shrink-0 ${
                      skill.isPrimary
                        ? 'bg-[#FFF4EC] border-[#F47A24]/40 text-[#DE6816]'
                        : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:text-[#475569]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${skill.isPrimary ? 'fill-[#F47A24]' : ''}`} />
                  </button>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-[#0F172A] break-words">
                      {skill.name}
                    </span>
                    {skill.isPrimary && (
                      <span className="ml-2 text-[11px] font-semibold text-[#DE6816]">
                        Primary
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0 pl-9 sm:pl-0">
                  <select
                    value={skill.proficiency}
                    onChange={(e) =>
                      updateProficiency(skill.name, e.target.value as SkillProficiency)
                    }
                    aria-label={`Proficiency for ${skill.name}`}
                    className="px-2.5 py-1.5 min-h-[36px] text-xs bg-white rounded-md border border-[#CBD5E1] text-[#334155] focus:outline-hidden focus:border-[#102B4E] cursor-pointer"
                  >
                    {PROFICIENCY_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeSkill(skill.name)}
                    aria-label={`Remove ${skill.name}`}
                    className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Save Skills</span>
        </button>
      </div>
    </div>
  );
};
