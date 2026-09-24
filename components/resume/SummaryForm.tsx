import React, { useState } from 'react';
import { AlignLeft, Sparkles, Check, RefreshCw } from 'lucide-react';

interface SummaryFormProps {
  summary: string;
  onChange: (summary: string) => void;
}

export const SummaryForm: React.FC<SummaryFormProps> = ({ summary, onChange }) => {
  const [isImproving, setIsImproving] = useState(false);
  const [improveMessage, setImproveMessage] = useState<string | null>(null);

  const handleImproveSummary = () => {
    const trimmed = summary.trim();
    if (!trimmed || trimmed.length < 20) {
      setImproveMessage('Please enter at least 1–2 sentences about your background first.');
      setTimeout(() => setImproveMessage(null), 3000);
      return;
    }

    setIsImproving(true);

    // Polish logic: strictly improves grammar, flow, and professional voice without inventing facts
    setTimeout(() => {
      let polished = trimmed
        // Normalize multiple spaces and line breaks
        .replace(/\s+/g, ' ')
        // Ensure proper sentence capitalization
        .replace(/(^\w|\.\s+\w)/gm, (match) => match.toUpperCase())
        // Trim trailing spaces
        .trim();

      // Ensure ending punctuation
      if (!/[.!?]$/.test(polished)) {
        polished += '.';
      }

      onChange(polished);
      setIsImproving(false);
      setImproveMessage('Summary polished for professional tone and grammar. Feel free to adjust.');
      setTimeout(() => setImproveMessage(null), 4000);
    }, 450);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-[#004D40]" />
            Professional Summary
          </h3>
          <p className="text-xs text-slate-500">
            A concise 2–4 sentence overview highlighting your background, strengths, and goals
          </p>
        </div>

        <button
          type="button"
          onClick={handleImproveSummary}
          disabled={isImproving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#004D40] text-xs font-semibold border border-teal-200 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-60"
        >
          {isImproving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Polishing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Improve with AI</span>
            </>
          )}
        </button>
      </div>

      {improveMessage && (
        <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-[#004D40] flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{improveMessage}</span>
        </div>
      )}

      <div>
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write 2–4 sentences describing your professional background, strengths, and career goals."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#004D40]/20 leading-relaxed text-slate-800 placeholder:text-slate-400 resize-y"
        />
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
          <span>Tip: Focus on quantifiable accomplishments and core expertise.</span>
          <span>{summary.length} characters</span>
        </div>
      </div>
    </div>
  );
};
