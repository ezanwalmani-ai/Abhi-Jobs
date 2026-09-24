import React, { useState } from 'react';
import { ResumeLanguage, ResumeLanguageProficiency } from '../../types/resume';
import { Languages, Plus, Trash2 } from 'lucide-react';

interface LanguagesFormProps {
  languages: ResumeLanguage[];
  onChange: (languages: ResumeLanguage[]) => void;
}

const PROFICIENCIES: ResumeLanguageProficiency[] = [
  'Basic',
  'Conversational',
  'Professional',
  'Fluent',
  'Native',
];

export const LanguagesForm: React.FC<LanguagesFormProps> = ({ languages, onChange }) => {
  const [langInput, setLangInput] = useState('');
  const [profInput, setProfInput] = useState<ResumeLanguageProficiency>('Professional');

  const handleAddLanguage = () => {
    const trimmed = langInput.trim();
    if (!trimmed) return;
    onChange([
      ...languages,
      {
        id: `lang_${Date.now()}`,
        language: trimmed,
        proficiency: profInput,
      },
    ]);
    setLangInput('');
  };

  const handleDelete = (id: string) => {
    onChange(languages.filter((l) => l.id !== id));
  };

  const handleUpdateProficiency = (id: string, proficiency: ResumeLanguageProficiency) => {
    onChange(languages.map((l) => (l.id === id ? { ...l, proficiency } : l)));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#004D40]" />
          Languages (Optional)
        </h3>
        <p className="text-xs text-slate-500">
          List spoken and written languages for multilingual or regional roles
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={langInput}
          onChange={(e) => setLangInput(e.target.value)}
          placeholder="e.g. English, Hindi, Tamil"
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
        />

        <select
          value={profInput}
          onChange={(e) => setProfInput(e.target.value as ResumeLanguageProficiency)}
          className="px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004D40]/20"
        >
          {PROFICIENCIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleAddLanguage}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {languages.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-1">
          No languages added yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          {languages.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
            >
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  {l.language}
                </span>
                <select
                  value={l.proficiency}
                  onChange={(e) =>
                    handleUpdateProficiency(l.id, e.target.value as ResumeLanguageProficiency)
                  }
                  className="text-[11px] font-medium text-slate-500 bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
                >
                  {PROFICIENCIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(l.id)}
                className="p-1 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
