import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { ASSESSMENT_PREVIEW_DOMAINS } from '../../data/learningCatalog';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

interface CareerAssessmentSectionProps {
  onStartAssessment: () => void;
}

export const CareerAssessmentSection: React.FC<CareerAssessmentSectionProps> = ({
  onStartAssessment,
}) => {
  return (
    <section
      id="career-assessment"
      aria-labelledby="career-assessment-heading"
      className="py-10 sm:py-12 bg-[#F6F8FB] border-b border-[#E5EAF0] scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.42, ease: EASE_PREMIUM }}
          className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-7 lg:p-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Heading, Description & CTA */}
            <div className="lg:col-span-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
                Career Readiness Assessment
              </p>

              <h2
                id="career-assessment-heading"
                className="font-display text-2xl sm:text-[28px] font-bold text-[#102B4E] tracking-tight leading-snug [text-wrap:balance]"
              >
                Discover Your Career Readiness
              </h2>

              <p className="text-sm sm:text-[15px] text-[#566479] leading-relaxed max-w-xl">
                Take a short assessment to understand your current skills, identify areas for improvement and discover courses that match your career goals.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onStartAssessment}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#102B4E] hover:bg-[#081D36] active:scale-[0.98] text-white text-sm font-semibold transition-all duration-150 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] focus-visible:ring-offset-2"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="w-4 h-4 text-[#F47A24] shrink-0" />
                </button>
              </div>
            </div>

            {/* Right: Clean Hairline-Separated Readiness Areas (No Nested Cards) */}
            <div className="lg:col-span-6 lg:border-l lg:border-[#E5EAF0] lg:pl-8 divide-y divide-[#E5EAF0]">
              {ASSESSMENT_PREVIEW_DOMAINS.map((domain, idx) => (
                <div
                  key={domain.id}
                  className={`${idx === 0 ? 'pb-4' : idx === ASSESSMENT_PREVIEW_DOMAINS.length - 1 ? 'pt-4' : 'py-4'} flex items-start gap-3.5`}
                >
                  <span className="font-display text-xs font-bold text-[#F47A24] tabular-nums pt-1 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="font-display text-[15px] font-bold text-[#102B4E]">
                      {domain.title}
                    </h3>
                    <p className="text-[13.5px] text-[#566479] leading-relaxed">
                      {domain.focus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CareerAssessmentSection;
