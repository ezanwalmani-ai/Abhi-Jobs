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
      className="bg-[#102B4E] text-white py-16 sm:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.5, ease: EASE_PREMIUM }}
          className="max-w-3xl mx-auto text-center space-y-6"
        >
          <p className="text-xs sm:text-sm font-semibold text-[#F47A24]">
            Learn with ABHI
          </p>

          <h2
            id="learn-final-cta-heading"
            className="font-display text-2xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight leading-tight text-white [text-wrap:balance]"
          >
            Your Next Opportunity Starts with Learning.
          </h2>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onStartLearning}
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] active:scale-[0.98] text-white text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102B4E]"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl border border-white/25 hover:border-white/50 hover:bg-white/5 text-white text-sm font-semibold transition-colors duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
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
