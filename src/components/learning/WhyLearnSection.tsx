import React from 'react';
import { motion } from 'motion/react';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

const BENEFITS = [
  {
    index: '01',
    title: '100% Free Learning',
    description:
      'Every course on Learn with ABHI is open to job seekers with no tuition fees or separate subscriptions.',
  },
  {
    index: '02',
    title: 'Practical, Job-Focused Skills',
    description:
      'Focused on the real tools, communication habits, and interview readiness hiring teams evaluate every day.',
  },
  {
    index: '03',
    title: 'Certificates on Course Completion',
    description:
      'Earn completion certificates tied to your ABHI JOBS candidate profile as courses launch and you finish each track.',
  },
];

export const WhyLearnSection: React.FC = () => {
  return (
    <section
      id="why-learn-with-abhi"
      aria-labelledby="why-learn-heading"
      className="py-10 sm:py-12 bg-[#F6F8FB] border-b border-[#E5EAF0]"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.4, ease: EASE_PREMIUM }}
          className="max-w-2xl space-y-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
            Built for Career Progression
          </p>
          <h2
            id="why-learn-heading"
            className="font-display text-2xl sm:text-[28px] font-bold text-[#102B4E] tracking-tight leading-snug [text-wrap:balance]"
          >
            Why Learn with ABHI?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {BENEFITS.map((benefit, idx) => (
            <motion.div
              key={benefit.index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.36, delay: idx * 0.06, ease: EASE_PREMIUM }}
              className="pt-5 border-t border-[#CBD5E1] space-y-2"
            >
              <span className="block font-display text-xs font-bold text-[#F47A24] tabular-nums">
                {benefit.index}
              </span>
              <h3 className="font-display text-[18px] font-bold text-[#102B4E] leading-snug">
                {benefit.title}
              </h3>
              <p className="text-sm text-[#566479] leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyLearnSection;
