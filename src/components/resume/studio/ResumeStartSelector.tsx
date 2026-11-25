import React, { useState } from 'react';
import { motion } from 'motion/react';
import { EASE_PREMIUM } from '../../../lib/motion';
import {
  ListChecks,
  MessageSquareText,
  Upload,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface ResumeStartSelectorProps {
  hasProfileData: boolean;
  onStartStepByStep: (prefillFromProfile: boolean) => void;
  onStartChatGpt: () => void;
  onStartUpload: () => void;
  onBack: () => void;
}

export const ResumeStartSelector: React.FC<ResumeStartSelectorProps> = ({
  hasProfileData,
  onStartStepByStep,
  onStartChatGpt,
  onStartUpload,
  onBack,
}) => {
  const [prefillProfile, setPrefillProfile] = useState<boolean>(hasProfileData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_PREMIUM }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#778397] hover:text-[#102B4E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Resume Studio</span>
        </button>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F47A24]/10 text-[#102B4E] text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#F47A24]" />
          <span>Choose How You Want to Begin</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102B4E] tracking-tight">
          Three Ways to Start Your Resume
        </h2>
        <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
          Every path leads to the same live ABHI JOBS editor, 12 professional templates, and selectable-text PDF export.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        {/* Option A — Build Step by Step */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: EASE_PREMIUM }}
          className="bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-6 shadow-2xs hover:shadow-md flex flex-col justify-between gap-5 transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#102B4E] text-white flex items-center justify-center">
                <ListChecks className="w-6 h-6 text-[#F47A24]" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F6F8FB] border border-[#E5EAF0] text-[11px] font-bold text-[#102B4E]">
                Option A
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[#102B4E]">Build Step by Step</h3>
              <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                Follow our guided 8-step experience to enter your background cleanly, with optional writing assistance at each step.
              </p>
            </div>

            {hasProfileData && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] text-xs text-[#253449] cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefillProfile}
                  onChange={(e) => setPrefillProfile(e.target.checked)}
                  className="w-4 h-4 accent-[#102B4E] rounded cursor-pointer"
                />
                <span className="font-medium inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#F47A24] shrink-0" />
                  Pre-fill from my ABHI JOBS profile
                </span>
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={() => onStartStepByStep(prefillProfile)}
            className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Start Guided Builder</span>
            <ArrowRight className="w-4 h-4 text-[#F47A24]" />
          </button>
        </motion.div>

        {/* Option B — Create with ChatGPT */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: EASE_PREMIUM }}
          className="bg-white rounded-xl border-2 border-[#F47A24]/40 hover:border-[#F47A24] p-6 shadow-sm hover:shadow-md flex flex-col justify-between gap-5 transition-all relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#F47A24] text-white flex items-center justify-center">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F47A24]/10 text-[11px] font-bold text-[#F47A24]">
                Option B · AI Assisted
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[#102B4E]">Create with ChatGPT</h3>
              <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                Generate a personalized ChatGPT prompt from your real details, paste back the result, and let ABHI JOBS organize it into editable sections.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartChatGpt}
            className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Create with ChatGPT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Option C — Upload Existing Resume */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2, ease: EASE_PREMIUM }}
          className="bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-6 shadow-2xs hover:shadow-md flex flex-col justify-between gap-5 transition-all"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#F6F8FB] border border-[#E5EAF0] text-[#102B4E] flex items-center justify-center">
                <Upload className="w-6 h-6 text-[#102B4E]" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F6F8FB] border border-[#E5EAF0] text-[11px] font-bold text-[#102B4E]">
                Option C
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-[#102B4E]">Upload Existing Resume</h3>
              <p className="text-xs sm:text-sm text-[#778397] leading-relaxed">
                Upload your existing PDF or Word (.docx) resume. We extract your information into structured, reviewable sections.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartUpload}
            className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-white border-2 border-[#102B4E] hover:bg-[#102B4E] text-[#102B4E] hover:text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Upload PDF or DOCX</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResumeStartSelector;
