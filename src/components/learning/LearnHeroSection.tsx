import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { EASE_PREMIUM } from '../../lib/motion';
import heroWorkspaceImg from '../../assets/images/learn_abhi_hero_workspace_1795266025484.jpg';

interface LearnHeroSectionProps {
  onExploreCourses: () => void;
  onTakeAssessment: () => void;
  candidateFirstName?: string | null;
}

const HERO_IMAGE_SRC = heroWorkspaceImg;

export const LearnHeroSection: React.FC<LearnHeroSectionProps> = ({
  onExploreCourses,
  onTakeAssessment,
  candidateFirstName,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <section className="bg-white border-b border-[#E5EAF0]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Editorial Headline, Copy & Primary Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4 sm:space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE_PREMIUM }}
              className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#778397]"
            >
              <span className="font-semibold text-[#102B4E]">Learn with ABHI</span>
              <span aria-hidden="true">·</span>
              <span>Free Career Learning</span>
              {candidateFirstName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#253449]">Welcome back, {candidateFirstName}</span>
                </>
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: EASE_PREMIUM }}
              className="font-display text-[30px] sm:text-[36px] lg:text-[40px] font-extrabold text-[#102B4E] tracking-tight leading-[1.14] [text-wrap:balance] max-w-2xl"
            >
              Learn Skills. Build Confidence. Grow Your Career.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.1, ease: EASE_PREMIUM }}
              className="text-[15px] sm:text-base text-[#566479] leading-relaxed max-w-xl"
            >
              Free practical courses designed to help you develop workplace skills, explore new career opportunities and become job-ready.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16, ease: EASE_PREMIUM }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1"
            >
              <button
                type="button"
                onClick={onExploreCourses}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-sm font-semibold shadow-2xs transition-all duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24] focus-visible:ring-offset-2"
              >
                <span>Explore Free Courses</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <button
                type="button"
                onClick={onTakeAssessment}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-[#F6F8FB] active:scale-[0.98] border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold transition-all duration-150 inline-flex items-center justify-center whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] focus-visible:ring-offset-2"
              >
                Take Your Career Assessment
              </button>
            </motion.div>

            {/* Quiet structural summary line — unboxed typography */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.22, ease: EASE_PREMIUM }}
              className="pt-3 border-t border-[#E5EAF0] flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs sm:text-[13px] text-[#778397]"
            >
              <span>6 Career Categories</span>
              <span aria-hidden="true">·</span>
              <span>Self-Paced Format</span>
              <span aria-hidden="true">·</span>
              <span>No Separate Login Required</span>
            </motion.div>
          </div>

          {/* Right Column: Subtle Professional Editorial Visual */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.08, ease: EASE_PREMIUM }}
            className="lg:col-span-5 flex"
          >
            <div className="relative w-full min-h-[220px] sm:min-h-[280px] lg:min-h-0 rounded-xl overflow-hidden border border-[#E5EAF0] bg-[#F6F8FB]">
              {!imageError ? (
                <img
                  src={HERO_IMAGE_SRC}
                  alt="Calm sunlit workspace with a laptop showing structured career learning modules alongside a navy notebook"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#F6F8FB] via-white to-[#EDF2F8] flex flex-col items-center justify-center p-6 text-center space-y-2.5">
                  <div className="w-11 h-11 rounded-xl bg-[#102B4E] text-white flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#F47A24]" />
                  </div>
                  <p className="font-display text-base font-bold text-[#102B4E]">
                    Structured Career Learning
                  </p>
                  <p className="text-xs text-[#778397] max-w-xs">
                    Practical workplace courses designed by ABHI JOBS for every stage of your career.
                  </p>
                </div>
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102B4E]/15 via-transparent to-transparent"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LearnHeroSection;
