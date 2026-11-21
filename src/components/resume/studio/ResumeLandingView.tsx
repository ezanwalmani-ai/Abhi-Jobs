import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResumeData,
  calculateResumeCompletion,
  getResumeDesign,
} from '../../../types/resume';
import { getTemplateSpec } from '../templates/templateCatalog';
import { HeroTextReveal, EASE_PREMIUM } from '../../../lib/motion';
import {
  FileText,
  Plus,
  Edit3,
  Copy,
  Download,
  Trash2,
  LayoutGrid,
  Sparkles,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Upload,
  MessageSquareText,
  ListChecks,
} from 'lucide-react';

interface ResumeLandingViewProps {
  resumes: ResumeData[];
  onCreateMyResume: () => void;
  onExploreTemplates: () => void;
  onEditResume: (resume: ResumeData) => void;
  onDuplicateResume: (resumeId: string) => void;
  onDownloadResumePdf: (resume: ResumeData) => void;
  onDeleteResume: (resumeId: string) => void;
  downloadingId?: string | null;
}

function formatLastEdited(iso?: string): string {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const ResumeLandingView: React.FC<ResumeLandingViewProps> = ({
  resumes,
  onCreateMyResume,
  onExploreTemplates,
  onEditResume,
  onDuplicateResume,
  onDownloadResumePdf,
  onDeleteResume,
  downloadingId,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<ResumeData | null>(null);

  return (
    <div className="space-y-8">
      {/* 1. Premium Hero Introduction */}
      <section className="relative overflow-hidden rounded-3xl bg-[#102B4E] text-white p-6 sm:p-10 lg:p-12 shadow-lg">
        {/* Subtle geometric accent */}
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-[#F47A24]/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-20 -bottom-24 w-64 h-64 rounded-full bg-white/[0.04] blur-2xl pointer-events-none"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
              <span>ABHI JOBS Resume Creation Studio</span>
            </div>

            <HeroTextReveal
              as="h1"
              text="Build a Resume That Moves Your Career Forward."
              highlightWords={['Career', 'Forward.']}
              highlightClassName="text-[#F47A24]"
              className="text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-white leading-[1.12]"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: EASE_PREMIUM }}
              className="text-sm sm:text-base text-white/80 max-w-xl leading-relaxed"
            >
              Create a professional resume in minutes. Choose a guided experience, use AI assistance, and select a design that represents you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22, ease: EASE_PREMIUM }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <button
                type="button"
                onClick={onCreateMyResume}
                className="min-h-[48px] px-7 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-sm font-bold shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create My Resume</span>
              </button>

              <button
                type="button"
                onClick={onExploreTemplates}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-[#F47A24]" />
                <span>Explore Templates</span>
              </button>
            </motion.div>
          </div>

          {/* Right Highlight Feature Pillars */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              {
                icon: ListChecks,
                title: 'Guided 8-Step Studio',
                desc: 'Clear prompts with optional fact-safe writing assistance.',
              },
              {
                icon: MessageSquareText,
                title: 'Create with ChatGPT',
                desc: 'Personalized prompt builder plus automatic section parser.',
              },
              {
                icon: Upload,
                title: 'Import PDF or DOCX',
                desc: 'Upload your existing resume and organize it into 12 templates.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.16 + idx * 0.06, ease: EASE_PREMIUM }}
                  className="p-4 rounded-2xl bg-white/[0.07] border border-white/10 flex items-start gap-3.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F47A24]/20 border border-[#F47A24]/30 text-[#F47A24] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{item.title}</div>
                    <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Saved Resumes Library (Multiple Resumes for Different Job Roles) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#102B4E] tracking-tight">
              Your Saved Resumes
            </h2>
            <p className="text-xs sm:text-sm text-[#778397]">
              Maintain tailored resumes for different roles. Switch templates or duplicate anytime.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateMyResume}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 self-start sm:self-auto transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F47A24]" />
            <span>Create New Resume</span>
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-8 sm:p-12 text-center space-y-4 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] text-[#102B4E] mx-auto flex items-center justify-center">
              <FileText className="w-7 h-7 text-[#F47A24]" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-[#102B4E]">
                No saved resumes yet
              </h3>
              <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                Start step-by-step, generate structured content with ChatGPT, or upload an existing PDF or Word resume.
              </p>
            </div>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onCreateMyResume}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Create My Resume</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onExploreTemplates}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white border border-[#E5EAF0] hover:border-[#102B4E]/30 text-[#253449] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Browse 12 Templates
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {resumes.map((resume, idx) => {
              const design = getResumeDesign(resume);
              const templateSpec = getTemplateSpec(design.templateId);
              const completion = calculateResumeCompletion(resume);
              const isBusyPdf = downloadingId === resume.id;

              return (
                <motion.article
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04, ease: EASE_PREMIUM }}
                  className="bg-white rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/30 hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          style={{ backgroundColor: `${design.accentColor}14`, color: design.accentColor }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-black/5"
                        >
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-[#102B4E] truncate">
                            {resume.title || resume.fullName || 'Untitled Resume'}
                          </h3>
                          <p className="text-xs text-[#778397] truncate">
                            {resume.professionalTitle || resume.targetRole || 'General Role'}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[#253449] text-[10px] font-semibold shrink-0">
                        {templateSpec.name}
                      </span>
                    </div>

                    {/* Completeness & Last Edited */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 text-[#778397]">
                          <Clock className="w-3 h-3" />
                          <span>Edited {formatLastEdited(resume.updatedAt)}</span>
                        </span>
                        <span className="font-bold text-[#102B4E] inline-flex items-center gap-1">
                          {completion.total >= 80 && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{completion.total}% complete</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#EFF3F8] overflow-hidden">
                        <div
                          style={{ width: `${completion.total}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-[#102B4E] to-[#F47A24] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-[#F0F3F7] flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditResume(resume)}
                      className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span>Edit Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadResumePdf(resume)}
                      disabled={isBusyPdf}
                      title="Download PDF"
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 hover:bg-[#F6F8FB] text-[#253449] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span className="hidden sm:inline">{isBusyPdf ? '...' : 'PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateResume(resume.id)}
                      title="Duplicate Resume"
                      aria-label="Duplicate resume"
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 hover:bg-[#F6F8FB] text-[#253449] inline-flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(resume)}
                      title="Delete Resume"
                      aria-label="Delete resume"
                      className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-[#E5EAF0] hover:border-rose-200 hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
            className="fixed inset-0 z-50 bg-[#081D36]/60 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: EASE_PREMIUM }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md bg-white rounded-3xl p-6 border border-[#E5EAF0] shadow-2xl space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-extrabold text-[#102B4E]">Delete Resume?</h3>
                <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[#102B4E]">
                    "{deleteTarget.title || deleteTarget.fullName || 'this resume'}"
                  </strong>
                  ? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-[#E5EAF0] text-[#253449] text-xs sm:text-sm font-semibold hover:bg-[#F6F8FB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteResume(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeLandingView;
