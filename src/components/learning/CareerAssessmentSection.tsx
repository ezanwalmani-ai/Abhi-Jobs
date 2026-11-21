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
      className="py-16 sm:py-24 bg-[#F6F8FB] border-b border-[#E5EAF0] scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.5, ease: EASE_PREMIUM }}
          className="bg-white rounded-2xl border border-[#E5EAF0] p-7 sm:p-10 lg:p-14"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left: Heading, Description & CTA */}
            <div className="lg:col-span-6 space-y-5">
              <p className="text-xs sm:text-sm font-semibold text-[#F47A24]">
                Career Readiness Assessment
              </p>

              <h2
                id="career-assessment-heading"
                className="font-display text-2xl sm:text-4xl font-extrabold text-[#102B4E] tracking-tight leading-tight [text-wrap:balance]"
              >
                Discover Your Career Readiness
              </h2>

              <p className="text-sm sm:text-base text-[#566479] leading-relaxed max-w-xl">
                Take a short assessment to understand your current skills, identify areas for improvement and discover courses that match your career goals.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartAssessment}
                  className="min-h-[46px] px-7 py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] active:scale-[0.98] text-white text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E] focus-visible:ring-offset-2"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="w-4 h-4 text-[#F47A24] shrink-0" />
                </button>
              </div>
            </div>

            {/* Right: Clean Hairline-Separated Readiness Areas (No Nested Cards) */}
            <div className="lg:col-span-6 lg:border-l lg:border-[#E5EAF0] lg:pl-12 divide-y divide-[#E5EAF0]">
              {ASSESSMENT_PREVIEW_DOMAINS.map((domain, idx) => (
                <div
                  key={domain.id}
                  className={`${idx === 0 ? 'pb-5' : idx === ASSESSMENT_PREVIEW_DOMAINS.length - 1 ? 'pt-5' : 'py-5'} flex items-start gap-4`}
                >
                  <span className="font-display text-sm font-bold text-[#F47A24] tabular-nums pt-0.5 shrink-0">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-display text-base font-bold text-[#102B4E]">
                      {domain.title}
                    </h3>
                    <p className="text-sm text-[#778397] leading-relaxed">
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
