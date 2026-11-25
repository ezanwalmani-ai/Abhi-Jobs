import React, { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { LessonStudyGuide, StudyGuideTableExample } from '../../types/learning';

interface CollapsibleStudyGuideProps {
  lessonId: string;
  studyGuide: LessonStudyGuide;
}

const renderCompactTable = (table: StudyGuideTableExample) => (
  <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
    <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-[#E5EAF0] space-y-0.5">
      <p className="text-xs font-semibold text-[#102B4E]">{table.title}</p>
      {table.subtitle && (
        <p className="text-[11px] text-[#566479] leading-relaxed">{table.subtitle}</p>
      )}
    </div>
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs min-w-[440px]">
        <thead>
          <tr className="bg-[#FAFBFD] border-b border-[#E5EAF0]">
            {table.columns.map((col, cIdx) => (
              <th
                key={cIdx}
                className="py-2 px-3 font-semibold text-[#102B4E] border-r last:border-r-0 border-[#E5EAF0] whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF2F6]">
          {table.rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-[#FAFBFD]">
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="py-2 px-3 text-[#253449] border-r last:border-r-0 border-[#EEF2F6] tabular-nums whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const CollapsibleStudyGuide: React.FC<CollapsibleStudyGuideProps> = ({
  lessonId,
  studyGuide,
}) => {
  // Always collapsed by default; never persisted across navigation or refresh
  const [isOpen, setIsOpen] = useState(false);
  const [openTopicIndex, setOpenTopicIndex] = useState<number | null>(null);
  const baseId = useId();

  useEffect(() => {
    setIsOpen(false);
    setOpenTopicIndex(null);
  }, [lessonId]);

  const sections = studyGuide.sections || [];
  const topicCount = sections.length;

  const handleToggleGuide = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setOpenTopicIndex(null);
      }
      return next;
    });
  };

  const handleToggleTopic = (index: number) => {
    setOpenTopicIndex((prev) => (prev === index ? null : index));
  };

  const guidePanelId = `${baseId}-guide-panel`;

  return (
    <section
      aria-label="Study Guide"
      className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden"
    >
      {/* Top-level Collapsible Study Guide Header */}
      <button
        type="button"
        onClick={handleToggleGuide}
        aria-expanded={isOpen}
        aria-controls={guidePanelId}
        className="w-full min-h-[58px] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#FAFBFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#102B4E] transition-colors duration-150 cursor-pointer"
      >
        <div className="min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:gap-2.5">
          <h2 className="font-display text-base sm:text-lg font-bold text-[#102B4E] leading-snug">
            Study Guide
          </h2>
          <span className="text-xs text-[#778397] tabular-nums">
            {topicCount} {topicCount === 1 ? 'topic' : 'topics'}
            <span aria-hidden="true"> · </span>
            {isOpen ? 'Click to collapse' : 'Click to view topics'}
          </span>
        </div>

        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-[#566479] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable Topic List (Hidden completely when collapsed) */}
      {isOpen && (
        <div
          id={guidePanelId}
          className="border-t border-[#E5EAF0] px-4 sm:px-6 py-4 sm:py-5 space-y-4 bg-white"
        >
          <p className="text-xs sm:text-sm text-[#566479] leading-relaxed max-w-[68ch]">
            {studyGuide.subtitle ||
              'These topics cover the important concepts from this module. Select a topic below to open its explanation.'}
          </p>

          <div className="border border-[#E5EAF0] rounded-xl divide-y divide-[#E5EAF0] overflow-hidden bg-white">
            {sections.map((sec, idx) => {
              const isTopicOpen = openTopicIndex === idx;
              const topicNumber = String(idx + 1).padStart(2, '0');
              const topicPanelId = `${baseId}-topic-${idx}`;

              return (
                <div key={idx} className="bg-white">
                  <button
                    type="button"
                    onClick={() => handleToggleTopic(idx)}
                    aria-expanded={isTopicOpen}
                    aria-controls={topicPanelId}
                    className={`w-full min-h-[54px] px-4 sm:px-5 py-3.5 text-left flex items-start justify-between gap-3 sm:gap-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#102B4E] cursor-pointer ${
                      isTopicOpen ? 'bg-[#F8FAFC]' : 'bg-white hover:bg-[#FAFBFD]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-[#778397] tabular-nums pt-0.5 w-5 shrink-0">
                        {topicNumber}
                      </span>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h3 className="text-sm sm:text-[15px] font-semibold text-[#102B4E] leading-snug">
                          {sec.heading}
                        </h3>
                        {sec.shortDescription && (
                          <p className="text-xs sm:text-[13px] text-[#566479] leading-relaxed">
                            {sec.shortDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      aria-hidden="true"
                      className={`w-4 h-4 text-[#778397] shrink-0 mt-1 transition-transform duration-150 ${
                        isTopicOpen ? 'rotate-180 text-[#102B4E]' : ''
                      }`}
                    />
                  </button>

                  {isTopicOpen && (
                    <div
                      id={topicPanelId}
                      className="border-t border-[#E5EAF0] bg-[#FAFBFD] px-4 sm:px-5 py-4 sm:py-5 sm:pl-12 space-y-4"
                    >
                      {/* Concise explanation */}
                      <p className="text-[13.5px] sm:text-sm text-[#253449] leading-[1.65] max-w-[68ch]">
                        {sec.body}
                      </p>

                      {/* Formula / Syntax Block (when relevant) */}
                      {sec.formula && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-[#102B4E]">
                            Formula / Syntax
                          </p>
                          <div className="rounded-lg bg-white border border-[#D4DCE6] px-3.5 py-2.5 overflow-x-auto">
                            <code className="font-mono text-xs sm:text-[13px] text-[#102B4E] whitespace-pre tabular-nums">
                              {sec.formula}
                            </code>
                          </div>
                        </div>
                      )}

                      {/* Key Points */}
                      {sec.bullets && sec.bullets.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-[#102B4E]">Key Points</p>
                          <ul className="space-y-1.5">
                            {sec.bullets.map((bullet, bIdx) => (
                              <li
                                key={bIdx}
                                className="flex items-start gap-2.5 text-[13.5px] sm:text-sm text-[#253449] leading-relaxed"
                              >
                                <span
                                  aria-hidden="true"
                                  className="text-[#778397] select-none shrink-0"
                                >
                                  •
                                </span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concise Steps (when relevant) */}
                      {sec.steps && sec.steps.length > 0 && (
                        <div className="rounded-lg bg-white border border-[#E5EAF0] p-3.5 sm:p-4 space-y-2">
                          <p className="text-xs font-semibold text-[#102B4E]">
                            How to Apply It
                          </p>
                          <ol className="space-y-1.5">
                            {sec.steps.map((step, sIdx) => (
                              <li
                                key={sIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-[13.5px] text-[#253449] leading-relaxed"
                              >
                                <span className="text-xs font-semibold text-[#566479] tabular-nums shrink-0 mt-0.5">
                                  {sIdx + 1}.
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Worked Example / Practical Workplace Application */}
                      {sec.example && (
                        <div className="rounded-lg bg-white border border-[#E5EAF0] px-3.5 py-3 space-y-1">
                          <p className="text-xs font-semibold text-[#102B4E]">
                            Workplace Example
                          </p>
                          <p className="text-xs sm:text-[13.5px] text-[#253449] leading-relaxed">
                            {sec.example}
                          </p>
                        </div>
                      )}

                      {/* Inline Reference / Sample Table (when useful) */}
                      {sec.table && renderCompactTable(sec.table)}

                      {/* Common Mistake / Caution */}
                      {sec.commonMistake && (
                        <div className="rounded-lg bg-white border border-amber-200/90 px-3.5 py-3 space-y-1">
                          <p className="text-xs font-semibold text-amber-900">
                            Common Mistake to Avoid
                          </p>
                          <p className="text-xs sm:text-[13.5px] text-[#253449] leading-relaxed">
                            {sec.commonMistake}
                          </p>
                        </div>
                      )}

                      {/* Useful Shortcuts (when present) */}
                      {sec.shortcuts && sec.shortcuts.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-[#102B4E]">
                            Helpful Shortcuts
                          </p>
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {sec.shortcuts.map((sc, scIdx) => (
                              <div
                                key={scIdx}
                                className="inline-flex items-center gap-2 text-xs text-[#253449]"
                              >
                                <kbd className="font-mono text-[11px] font-semibold text-[#102B4E] bg-white px-1.5 py-0.5 rounded border border-[#D4DCE6]">
                                  {sc.keys}
                                </kbd>
                                <span>{sc.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CollapsibleStudyGuide;
