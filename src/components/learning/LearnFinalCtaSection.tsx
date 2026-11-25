import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

interface LearnFinalCtaSectionProps {
  onStartLearning: () => void;
  isAuthenticated: boolean;
  onNavigateLogin: () => void;
}

export const LearnFinalCtaSection: React.FC<LearnFinalCtaSectionProps> = ({
  onStartLearning,
  isAuthenticated,
  onNavigateLogin,
}) => {
  return (
    <section
      aria-labelledby="learn-final-cta-heading"
      className="bg-[#102B4E] text-white py-10 sm:py-14"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.42, ease: EASE_PREMIUM }}
          className="max-w-2xl mx-auto text-center space-y-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
            Learn with ABHI
          </p>

          <h2
            id="learn-final-cta-heading"
            className="font-display text-2xl sm:text-[28px] lg:text-[30px] font-bold tracking-tight leading-snug text-white [text-wrap:balance]"
          >
            Your Next Opportunity Starts with Learning.
          </h2>

          <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartLearning}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-sm font-semibold transition-all duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102B4E]"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-white/25 hover:border-white/50 hover:bg-white/5 text-white text-sm font-semibold transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Sign in with ABHI JOBS
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LearnFinalCtaSection;
