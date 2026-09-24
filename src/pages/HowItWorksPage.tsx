import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM, HeroTextReveal } from '../lib/motion';
import {
  CheckCircle2,
  Briefcase,
  Users,
  GraduationCap,
  Building2,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Layers,
  Award,
  Zap,
  Target,
  FileCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HowItWorksPageProps {
  navigate: (route: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ navigate }) => {
  const { currentUser, currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'How ABHI JOBS Works | Discover. Apply. Grow.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const jobSeekerSteps = [
    {
      step: '01',
      title: 'Build Your Verified Profile',
      desc: 'Create your comprehensive candidate profile with verified contact details, education, career preferences, and portfolio links.',
      detail: 'State your availability, preferred work formats (remote, hybrid, on-site), and target departments so employers can discover you directly.',
      badge: 'Identity & Preferences',
    },
    {
      step: '02',
      title: 'Showcase & Verify Your Skills',
      desc: 'Add competencies with proficiency levels. Verified skills provide direct visibility to hiring teams over generic resume bullet points.',
      detail: 'ABHI JOBS highlights demonstrated capabilities, GitHub projects, portfolio artifacts, and certifications to validate your genuine readiness.',
      badge: 'Competency Proof',
    },
    {
      step: '03',
      title: 'Learn & Upskill Directly',
      desc: 'Bridge competency gaps with targeted learning modules, practical exercises, and industry-standard course tracks.',
      detail: 'Track your completion metrics, earn verified progress badges, and boost your job recommendation match score automatically.',
      badge: 'Continuous Readiness',
    },
    {
      step: '04',
      title: 'Apply & Get Hired Confidently',
      desc: 'Explore open positions tailored to your skill set. Submit structured applications and track your status through every hiring stage.',
      detail: 'Receive direct updates from employers, review interview invitations, and access career tools to optimize your submissions.',
      badge: 'Direct Employment',
    },
  ];

  const employerSteps = [
    {
      step: '01',
      title: 'Set Up Your Company Account',
      desc: 'Verify your company identity, establish team credentials, and configure your organization profile with industry and location details.',
      detail: 'Showcase your company culture, mission, and benefits to attract top-tier talent who value verified capability.',
      badge: 'Verified Employer',
    },
    {
      step: '02',
      title: 'Post Structured Opportunities',
      desc: 'Publish jobs with precise skill requirements, compensation ranges, experience tiers, and department parameters.',
      detail: 'Clear, skill-mapped requirements filter out unqualified applicants before they reach your review queue.',
      badge: 'Transparent Hiring',
    },
    {
      step: '03',
      title: 'Discover Pre-Screened Talent',
      desc: 'Search our directory using automated skill-match percentages instead of sifting through thousands of keyword-stuffed resumes.',
      detail: 'Review verified portfolio projects, candidate readiness scores, and proven track records with total clarity.',
      badge: 'Algorithmic Matching',
    },
    {
      step: '04',
      title: 'Evaluate & Make Offers',
      desc: 'Manage application stages, schedule interviews, and collaborate with your team to extend offers with speed.',
      detail: 'Cut time-to-hire significantly while drastically improving candidate retention and day-one readiness.',
      badge: 'Streamlined Decisions',
    },
  ];

  const faqs = [
    {
      question: 'How is ABHI JOBS different from traditional job boards?',
      answer:
        'Traditional job boards rely on unverified keyword resumes that waste both candidate and employer time. ABHI JOBS is a skills-first platform that benchmarks real capabilities, integrates targeted upskilling, and provides employers with transparent, verified candidate profiles.',
    },
    {
      question: 'Is ABHI JOBS completely free for Job Seekers?',
      answer:
        'Yes. Job seekers can create verified profiles, explore all published jobs, bookmark opportunities, access upskilling materials, and submit applications with zero hidden costs.',
    },
    {
      question: 'How do skills get verified on ABHI JOBS?',
      answer:
        'Skills are validated through coursework completions, portfolio and code evaluations, assessment tracks, and verified work experience documented in candidate profiles.',
    },
    {
      question: 'How quickly can employers post jobs and find talent?',
      answer:
        'Employers can create a company account and publish jobs in minutes. Our talent search and algorithmic skill matching immediately show qualified candidates based on exact requirement overlaps.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 1. Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#061226] via-[#0c1f3d] to-[#061226] text-white py-16 sm:py-24 border-b border-slate-800">
        <ScrollReveal direction="up" distance={16}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#FF2B1A] shrink-0" />
              <span>How ABHI JOBS Works</span>
            </div>

            <HeroTextReveal
              as="h1"
              text="Where verified skills meet real employment opportunities."
              highlightWords={['skills', 'opportunities.']}
              highlightClassName="text-[#FF2B1A]"
              justify="center"
              className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sora text-center w-full"
              delay={0.15}
              stagger={0.08}
              duration={0.65}
            />

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              A transparent, streamlined ecosystem designed to eliminate guesswork from hiring and give skilled professionals a direct route to career advancement.
            </p>

            {/* Role Toggle Tabs */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <button
                  type="button"
                  onClick={() => setActiveTab('job_seeker')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'job_seeker'
                      ? 'bg-[#FF2B1A] text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>For Job Seekers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('employer')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'employer'
                      ? 'bg-[#FF2B1A] text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>For Employers</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 2. Step-by-Step Pathway */}
      <section className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delay={0.05} distance={18}>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">
              {activeTab === 'job_seeker' ? 'Candidate Journey' : 'Recruiter Workflow'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
              {activeTab === 'job_seeker'
                ? '4 Simple Steps to Your Next Career Milestone'
                : '4 Simple Steps to High-Signal Hiring'}
            </h2>
            <p className="text-xs sm:text-sm text-[#667085]">
              {activeTab === 'job_seeker'
                ? 'Follow our structured process to showcase verified competencies and connect directly with vetted hiring managers.'
                : 'Cut time-to-hire in half by connecting with candidates whose capabilities have already been evaluated.'}
            </p>
          </div>
        </ScrollReveal>

        <StaggerGroup key={activeTab} staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(activeTab === 'job_seeker' ? jobSeekerSteps : employerSteps).map((item) => (
            <StaggerItem key={item.step}>
              <motion.div
                whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
                className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-[#061226] text-white font-extrabold flex items-center justify-center text-sm">
                      {item.step}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#F7F8FA] text-[#101828] text-[10px] font-bold border border-[#E4E7EC]">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#101828]">{item.title}</h3>
                  <p className="text-xs text-[#667085] leading-relaxed">{item.desc}</p>
                  <p className="text-[11px] text-[#667085] leading-normal pt-1 border-t border-[#E4E7EC]">
                    {item.detail}
                  </p>
                </div>

                <div className="mt-6 pt-3 flex items-center gap-1.5 text-xs font-semibold text-[#004D40]">
                  <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                  <span>Step {item.step} Complete</span>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Action Bar based on Active Tab */}
        <ScrollReveal direction="up" delay={0.1} distance={18}>
          <div className="mt-12 p-8 rounded-3xl bg-[#F7F8FA] border border-[#E4E7EC] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-[#101828]">
                {activeTab === 'job_seeker'
                  ? 'Ready to build your skills and find jobs?'
                  : 'Looking to hire verified, skilled talent?'}
              </h3>
              <p className="text-xs sm:text-sm text-[#667085]">
                {activeTab === 'job_seeker'
                  ? 'Create your free account today and discover jobs tailored to your verified capabilities.'
                  : 'Publish your open roles and search our talent directory with zero friction.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {activeTab === 'job_seeker' ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/register/job-seeker')}
                    className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                  >
                    <span>Get Started as Job Seeker</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/jobs')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F7F8FA] text-[#101828] text-xs sm:text-sm font-semibold border border-[#D0D5DD] transition-colors cursor-pointer min-h-[44px]"
                  >
                    Browse Jobs
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/register/employer')}
                    className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                  >
                    <span>Register as Employer</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/candidates')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F7F8FA] text-[#101828] text-xs sm:text-sm font-semibold border border-[#D0D5DD] transition-colors cursor-pointer min-h-[44px]"
                  >
                    Discover Talent
                  </button>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. Core Principles / Pillars */}
      <section className="py-16 bg-white border-y border-[#E4E7EC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" distance={16}>
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">
                Why ABHI JOBS Works
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
                Built on 3 Core Principles
              </h2>
            </div>
          </ScrollReveal>

          <StaggerGroup staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-3 h-full">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center border border-teal-100">
                  <Target className="w-6 h-6 text-[#004D40]" />
                </div>
                <h3 className="text-base font-bold text-[#101828]">1. Skill Verification</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  We replace keyword fluff with demonstrable proof. Candidates showcase what they can actually do, and employers evaluate real competencies.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-3 h-full">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center border border-teal-100">
                  <Zap className="w-6 h-6 text-[#004D40]" />
                </div>
                <h3 className="text-base font-bold text-[#101828]">2. Integrated Upskilling</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Learning is not disconnected from employment. Candidates access tailored learning paths specifically matched to market demand and employer openings.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-3 h-full">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center border border-teal-100">
                  <ShieldCheck className="w-6 h-6 text-[#004D40]" />
                </div>
                <h3 className="text-base font-bold text-[#101828]">3. Direct Accountability</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Zero fake listings, zero phantom applicants. Every employer and job listing on ABHI JOBS is verified, ensuring honest and accountable interactions.
                </p>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* 4. Frequently Asked Questions */}
      <section className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" distance={16}>
          <div className="text-center space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">
              Common Questions About the Platform
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-[#E4E7EC] bg-white overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-[#101828] text-sm sm:text-base cursor-pointer hover:bg-[#F7F8FA] transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#667085] transition-transform duration-200 shrink-0 ${
                    openFaqIndex === idx ? 'rotate-180 text-[#FF2B1A]' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaqIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE_PREMIUM }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-[#667085] leading-relaxed border-t border-[#E4E7EC] pt-3">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-[#667085]">
            Want to learn more about our origins, mission, and leadership?{' '}
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="text-[#FF2B1A] font-bold hover:underline cursor-pointer"
            >
              Visit our full About page
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};
export default HowItWorksPage;
