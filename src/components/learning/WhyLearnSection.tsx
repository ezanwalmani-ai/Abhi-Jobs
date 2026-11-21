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
      className="py-16 sm:py-24 bg-[#F6F8FB] border-b border-[#E5EAF0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT_ONCE}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
          className="max-w-2xl space-y-3"
        >
          <p className="text-xs sm:text-sm font-semibold text-[#F47A24]">
            Built for Career Progression
          </p>
          <h2
            id="why-learn-heading"
            className="font-display text-2xl sm:text-4xl font-extrabold text-[#102B4E] tracking-tight leading-tight [text-wrap:balance]"
          >
            Why Learn with ABHI?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          {BENEFITS.map((benefit, idx) => (
            <motion.div
              key={benefit.index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT_ONCE}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: EASE_PREMIUM }}
              className="pt-6 border-t border-[#CBD5E1] space-y-3"
            >
              <span className="block font-display text-sm font-bold text-[#F47A24] tabular-nums">
                {benefit.index}
              </span>
              <h3 className="font-display text-xl font-bold text-[#102B4E] leading-snug">
                {benefit.title}
              </h3>
              <p className="text-sm sm:text-base text-[#566479] leading-relaxed">
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
