import React, { useMemo, useState } from 'react';
import { ResumeData, calculateResumeCompletion } from '../../../types/resume';
import {
  runResumeQualityChecks,
  analyzeJobDescriptionMatch,
} from '../../../services/resumeAiAssistant';
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target,
  Info,
  ShieldCheck,
} from 'lucide-react';

interface ResumeQualityAssistantProps {
  resume: ResumeData;
}

export const ResumeQualityAssistant: React.FC<ResumeQualityAssistantProps> = ({ resume }) => {
  const [activeTab, setActiveTab] = useState<'checks' | 'jd'>('checks');
  const [jobDescription, setJobDescription] = useState('');

  const completion = useMemo(() => calculateResumeCompletion(resume), [resume]);
  const issues = useMemo(() => runResumeQualityChecks(resume), [resume]);
  const jdAnalysis = useMemo(
    () => analyzeJobDescriptionMatch(resume, jobDescription),
    [resume, jobDescription]
  );

  const importantIssues = issues.filter((i) => i.severity === 'important');
  const suggestions = issues.filter((i) => i.severity === 'suggestion');

  return (
    <div className="space-y-4">
      {/* Mini Tab Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0]">
        <button
          type="button"
          onClick={() => setActiveTab('checks')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'checks'
              ? 'bg-[#102B4E] text-white shadow-2xs'
              : 'text-[#778397] hover:text-[#102B4E]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Quality Check ({issues.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('jd')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'jd'
              ? 'bg-[#102B4E] text-white shadow-2xs'
              : 'text-[#778397] hover:text-[#102B4E]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>JD Match</span>
        </button>
      </div>

      {activeTab === 'checks' ? (
        <div className="space-y-3.5">
          {/* Completeness Score Card */}
          <div className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#102B4E]">Resume Completeness</span>
              <span className="font-extrabold text-[#F47A24] tabular-nums">{completion.total}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#E5EAF0] overflow-hidden">
              <div
                style={{ width: `${completion.total}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#102B4E] to-[#F47A24] transition-all duration-300"
              />
            </div>
            <p className="text-[11px] text-[#778397] leading-relaxed">
              Suggestions below are advisory only — your resume text is never altered without your approval.
            </p>
          </div>

          {issues.length === 0 ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
              <div className="text-sm font-bold text-emerald-900">All Quality Checks Passed</div>
              <p className="text-xs text-emerald-800/80">
                Contact info, summary, dates, formatting, and proofreading look clean and consistent.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {importantIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{issue.title}</span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">{issue.detail}</p>
                  <span className="inline-block text-[10px] font-semibold text-amber-700">
                    {issue.section}
                  </span>
                </div>
              ))}

              {suggestions.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-xl bg-white border border-[#E5EAF0] text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-[#102B4E]">
                    <Info className="w-3.5 h-3.5 text-[#F47A24] shrink-0" />
                    <span>{issue.title}</span>
                  </div>
                  <p className="text-[11px] text-[#778397] leading-relaxed">{issue.detail}</p>
                  <span className="inline-block text-[10px] font-semibold text-[#94A3B8]">
                    {issue.section}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[#102B4E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
              <span>Paste a Target Job Description</span>
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a real job description to see which skills and domain keywords already appear in your resume..."
              className="w-full p-3 rounded-xl border border-[#E5EAF0] bg-[#F6F8FB] focus:bg-white focus:border-[#102B4E] focus:outline-hidden text-xs leading-relaxed"
            />
          </div>

          {jobDescription.trim().length > 20 && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#253449]">Keyword Alignment</span>
                <span className="font-extrabold text-[#102B4E] tabular-nums">
                  {jdAnalysis.matchPercent}%
                </span>
              </div>

              {jdAnalysis.matchedKeywords.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Already Reflected ({jdAnalysis.matchedKeywords.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {jdAnalysis.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {jdAnalysis.missingKeywords.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#102B4E] uppercase tracking-wider">
                    Consider Highlighting ({jdAnalysis.missingKeywords.length})
                  </div>
                  <p className="text-[11px] text-[#778397]">
                    Add any of these keywords manually only if they genuinely reflect your real experience.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {jdAnalysis.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[#253449] text-[11px] font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeQualityAssistant;
