import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM, TextMaskReveal, ScrollProgress } from '../lib/motion';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Target,
  BookOpen,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Compass,
  FileCheck,
  Layers,
  Lightbulb,
  Send,
  Lock,
  Award,
  GraduationCap,
  Check,
  Search,
  Zap,
  RefreshCw,
  Eye,
  HelpCircle,
  HeartHandshake,
} from 'lucide-react';

interface AboutPageProps {
  navigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  const { currentUser, currentRole } = useApp();

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Set SEO Page Title and Meta Description
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'About ABHI JOBS | Discover. Apply. Grow.';

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Learn about ABHI JOBS — a dedicated skills-first career platform designed to connect verified capabilities, continuous learning, and employment opportunities into a unified ecosystem.'
      );
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, []);

  const handleJobSeekerCTA = () => {
    if (currentUser) {
      navigate('/jobs');
    } else {
      navigate('/register/job-seeker');
    }
  };

  const handleEmployerCTA = () => {
    if (currentUser && currentRole === 'employer') {
      navigate('/employer/dashboard');
    } else {
      navigate('/register/employer');
    }
  };

  const faqItems = [
    {
      question: 'What is ABHI JOBS?',
      answer:
        'ABHI JOBS is a skills-first talent and career platform designed to bridge the gap between proven capabilities and real employment opportunities. We provide job seekers with tools to benchmark skills, access upskilling, and apply to verified openings, while helping employers evaluate candidates based on demonstrated competencies rather than resume buzzwords.',
    },
    {
      question: 'Who is ABHI JOBS designed for?',
      answer:
        'ABHI JOBS serves two core groups: Job Seekers (including students, fresh graduates, and experienced professionals seeking merit-driven career advancement) and Employers (including recruiters, hiring managers, and enterprise organizations seeking verified, competent talent with clear skill signals).',
    },
    {
      question: 'What makes ABHI JOBS different from a traditional job portal?',
      answer:
        'Traditional job portals function as static bulletin boards where unvetted resumes compete against automated keyword filters. ABHI JOBS integrates the entire career continuum — skills evaluation, role-relevant upskilling, professional credentialing, and direct employer connection — ensuring both sides have clear, honest context before making hiring decisions.',
    },
    {
      question: 'What does "skills-first" mean?',
      answer:
        'A "skills-first" approach means evaluating candidates primarily on what they can actually do, solve, and build — rather than solely relying on formal credentials, school prestige, or resume keyword density. It expands access to qualified talent with non-traditional or self-directed backgrounds while ensuring employers hire proven capability.',
    },
    {
      question: 'How does ABHI JOBS support Job Seekers?',
      answer:
        'Job Seekers can discover verified job vacancies, identify skill gaps against real industry requirements, access structured career preparation pathways, build a standardized professional profile, and track application review stages in real time without third-party middleman brokers.',
    },
    {
      question: 'How does ABHI JOBS support Employers?',
      answer:
        'Employers can publish structured vacancies with explicit skill criteria, search a pre-screened talent directory, evaluate candidates against objective benchmarks, schedule interviews directly, and streamline their hiring pipeline with verified applicant data.',
    },
    {
      question: 'Does ABHI JOBS provide learning and upskilling?',
      answer:
        'Yes. Through our learning ecosystem, candidates can access career preparation resources, explore recommended skill tracks, and prepare for practical workplace requirements to continuously improve their employability and readiness for advancement.',
    },
    {
      question: 'How are jobs added to ABHI JOBS?',
      answer:
        'Every job published on ABHI JOBS is created directly by verified employer partners or platform moderators with defined role requirements, confirmed compensation details, and active hiring intent. We do not aggregate scraped, unvetted web postings.',
    },
  ];

  return (
    <div id="abhi-jobs-about-page" className="min-h-screen bg-white text-slate-900 selection:bg-red-200 selection:text-slate-950">
      <ScrollProgress />
      {/* ========================================================================= */}
      {/* 1. ABOUT HERO SECTION */}
      {/* ========================================================================= */}
      <section
        id="about-hero"
        aria-label="About Hero"
        className="relative overflow-hidden bg-[#061226] border-b border-slate-800 text-white pt-14 pb-20 sm:pt-20 sm:pb-28"
      >
        {/* Subtle geometric grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal direction="up" distance={16}>
            <div className="text-center max-w-3xl mx-auto space-y-5">
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FF2B1A] shrink-0" />
                <span>About ABHI JOBS &bull; Company &amp; Philosophy</span>
              </div>

              {/* Main Headline (Text Mask Reveal) */}
              <TextMaskReveal
                as="h1"
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
                delay={0.15}
                duration={0.7}
              >
                Building a Better Connection Between{' '}
                <span className="text-[#FF2B1A]">
                  Skills and Opportunity.
                </span>
              </TextMaskReveal>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
                ABHI JOBS is built around a simple idea: people should have better opportunities to demonstrate what they can do, develop what they need to learn, and connect their skills with the right opportunities.
              </p>

              {/* Hero CTA Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  id="hero-btn-find-jobs"
                  onClick={() => navigate('/jobs')}
                  className="px-6 py-3.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-white" />
                  <span>Explore Jobs</span>
                </button>

                <button
                  id="hero-btn-learning"
                  onClick={() => navigate('/learning')}
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-300" />
                  <span>Skills &amp; Learning</span>
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. WHO WE ARE */}
      {/* ========================================================================= */}
      <section id="who-we-are" aria-label="Who We Are" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
              Who We Are
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              A Unified Talent and Career Platform
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              ABHI JOBS is a skills-first career ecosystem designed to bring together Job Seekers, Employers, Skills, Learning, and Career opportunities into one cohesive experience.
            </p>
          </div>

          {/* Narrative Card */}
          <div className="max-w-4xl mx-auto bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs mb-14">
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Beyond Traditional Job Listing Platforms
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Conventional job portals often operate as passive repositories where unvetted resumes compete against automated keyword filters. This approach frequently fails both sides: talented individuals are overlooked because their CV format does not trigger an algorithm, while employers spend valuable time sifting through unverified applications.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ABHI JOBS is engineered to go beyond bulletin boards. We create an integrated journey that connects practical skills, targeted learning, professional credentialing, and active hiring managers within a single platform.
              </p>
            </div>
          </div>

          {/* Progressive Journey Flow */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xs font-bold text-[#004D40] uppercase tracking-wider text-center mb-8">
              The ABHI JOBS Career Journey
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#004D40]/30 transition-colors relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                    01
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#004D40]" />
                    <span>Discover Potential</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Identify personal strengths, technical interests, and career pathways tailored to your unique capabilities.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Initial self-assessment
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#004D40]/30 transition-colors relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                    02
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#004D40]" />
                    <span>Build Relevant Skills</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Develop in-demand competencies through targeted learning tracks mapped to contemporary workplace requirements.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Capability building
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#004D40]/30 transition-colors relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                    03
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-[#004D40]" />
                    <span>Create Profile</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Construct a standardized, professional profile showcasing verified skills, work history, and portfolio projects.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Standardized credentials
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#004D40]/30 transition-colors relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                    04
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#004D40]" />
                    <span>Discover Opportunities</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Explore curated positions published by verified employers with transparent compensation and skill criteria.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Transparent job matching
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#004D40]/30 transition-colors relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                    05
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#004D40]" />
                    <span>Apply for Roles</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Submit applications with verified profile data and monitor real-time review, interview, and decision milestones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Direct submission &amp; tracking
                </div>
              </div>

              {/* Step 6 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#004D40]/30 transition-colors relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                    06
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#004D40]" />
                    <span>Continuous Growth</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Continue learning, benchmark new competencies, and unlock higher-impact opportunities as your career progresses.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Long-term career mobility
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE PROBLEM WE SOLVE */}
      {/* ========================================================================= */}
      <section id="problem-we-solve" aria-label="The Problem We Solve" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              The Real Challenges
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The Problem We Solve
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Modern hiring faces systemic friction. Talented individuals often struggle to showcase true ability, while employers face immense uncertainty when evaluating candidates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Problem 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">The Resume Representation Gap</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Traditional resumes reduce rich, practical capabilities into dry bullet points. Highly capable candidates are frequently eliminated by keyword screening software before any human evaluates their actual work.
              </p>
            </div>

            {/* Problem 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Difficulty Connecting Learning to Work</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Many learners invest substantial time in coursework and tutorials, yet struggle to translate that knowledge into verifiable portfolio evidence that proves real workplace readiness to hiring managers.
              </p>
            </div>

            {/* Problem 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Unaddressed Skill Gaps</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Applicants frequently receive automated rejections without actionable feedback, leaving them unsure of which specific tools or concepts they must improve to become competitive for target positions.
              </p>
            </div>

            {/* Problem 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900">Opportunity Discovery Friction</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Job seekers spend hours scrolling through repetitive listings, ambiguous job titles, and phantom advertisements that do not represent actively hiring teams or accurate compensation.
              </p>
            </div>

            {/* Problem 5 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                05
              </div>
              <h3 className="text-base font-bold text-slate-900">Employer Guesswork &amp; Screening Costs</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hiring managers are inundated with hundreds of generic applications, making it difficult and expensive to identify applicants who possess the genuine problem-solving capabilities required for the role.
              </p>
            </div>

            {/* Problem 6 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-xs">
                06
              </div>
              <h3 className="text-base font-bold text-slate-900">The Curriculum &amp; Industry Divide</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rapid technological change widens the gap between traditional educational syllabi and contemporary business workflows. Candidates need continuous real-world alignment to stay competitive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OUR APPROACH */}
      {/* ========================================================================= */}
      <section id="our-approach" aria-label="Our Approach" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
              Guiding Principles
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Our Four Foundational Principles
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              ABHI JOBS organizes every platform feature, profile attribute, and matching mechanism around four core principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Principle 01 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-[#004D40] tracking-wider uppercase mb-3">
                  01 &mdash; Skills
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#004D40]" />
                  <span>Demonstrated Capability</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Focus on what people can actually do. We evaluate candidates through demonstrated competencies, practical projects, and tangible skills rather than resume length alone.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-[#004D40]">
                Capability over pedigree
              </div>
            </div>

            {/* Principle 02 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-[#004D40] tracking-wider uppercase mb-3">
                  02 &mdash; Learning
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#004D40]" />
                  <span>Continuous Development</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Encourage ongoing upskilling and professional preparation. The platform helps individuals identify gaps and systematically strengthen their employability.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-[#004D40]">
                Lifelong competency growth
              </div>
            </div>

            {/* Principle 03 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-[#004D40] tracking-wider uppercase mb-3">
                  03 &mdash; Opportunity
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#004D40]" />
                  <span>Direct Connection</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Connect skilled individuals with genuine, verified career opportunities published directly by active hiring teams and accredited employers.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-[#004D40]">
                Direct employer access
              </div>
            </div>

            {/* Principle 04 */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-[#004D40] tracking-wider uppercase mb-3">
                  04 &mdash; Growth
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#004D40]" />
                  <span>Sustainable Trajectory</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Support long-term professional development rather than only the next job application. Foster career resilience, upward mobility, and sustained relevance.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-[#004D40]">
                Enduring career resilience
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SKILLS-FIRST PHILOSOPHY */}
      {/* ========================================================================= */}
      <section id="skills-first-philosophy" aria-label="Skills-First Philosophy" className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-300 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-[#FF2B1A]" />
              <span>Core Philosophy</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Skills Should Open Doors.
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-3xl mx-auto">
              Traditional resumes provide only a limited, backward-looking snapshot of a person's potential. They tend to favor conventional career paths and pedigree, while overlooking self-taught mastery, grit, and practical execution.
            </p>
          </div>

          {/* Core Values Emphasis Grid */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">Pillar 01</div>
              <h3 className="text-base font-bold text-white mb-1.5">Skills &amp; Capabilities</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Objective proficiency in the tools, methods, and practical frameworks required to perform the job effectively from day one.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">Pillar 02</div>
              <h3 className="text-base font-bold text-white mb-1.5">Demonstrated Experience</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tangible proof of work &mdash; repositories, shipped projects, portfolio artifacts, and verifiable case studies that speak for themselves.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">Pillar 03</div>
              <h3 className="text-base font-bold text-white mb-1.5">Continuous Learning</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A track record of taking initiative to acquire new capabilities, adapt to changing workflows, and expand technical depth.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">Pillar 04</div>
              <h3 className="text-base font-bold text-white mb-1.5">Career Interests &amp; Alignment</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deep alignment between an individual's personal aspirations, values, and the operational mission of prospective teams.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">Pillar 05</div>
              <h3 className="text-base font-bold text-white mb-1.5">Untapped Potential</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Recognizing foundational curiosity, cognitive agility, and problem-solving instinct that indicate high trajectory over time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
              <div className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2">Pillar 06</div>
              <h3 className="text-base font-bold text-white mb-1.5">Willingness to Grow</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A commitment to receptive collaboration, intellectual humility, and continuous improvement across changing team dynamics.
              </p>
            </div>
          </div>

          {/* Balanced Clarification Note */}
          <div className="mt-12 max-w-3xl mx-auto p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>Our Objective:</strong> We do not claim to abolish traditional resumes or established hiring workflows overnight. Rather, ABHI JOBS elevates verified skill evidence to the center of the conversation, creating stronger, fairer alignment between talented individuals and organizations.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FOR JOB SEEKERS */}
      {/* ========================================================================= */}
      <section id="for-job-seekers" aria-label="For Job Seekers" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 max-w-6xl mx-auto">
            {/* Left Header */}
            <div className="lg:max-w-md space-y-4">
              <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
                For Job Seekers
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Empowering Your Career at Every Stage
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                ABHI JOBS gives you the clarity, structure, and direct employer connections necessary to turn your demonstrated capabilities into a sustainable career.
              </p>
              <div className="pt-2">
                <button
                  id="btn-explore-jobs-seekers"
                  onClick={() => navigate('/jobs')}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-slate-300" />
                  <span>Explore Jobs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right 6 Pillars */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Discover */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Discover</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Explore relevant career opportunities matched to your verified skills, experience, and career aspirations.
                </p>
              </div>

              {/* Build */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Build</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Develop targeted competencies that bridge knowledge gaps and enhance your practical job readiness.
                </p>
              </div>

              {/* Showcase */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Showcase</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Create a structured professional profile that represents verified capabilities, portfolio items, and credentials.
                </p>
              </div>

              {/* Apply */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Apply</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manage job applications, review stages, interview schedules, and employer updates from a single dashboard.
                </p>
              </div>

              {/* Learn */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Learn</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Continue developing through curated career preparation modules, role benchmarks, and practical challenges.
                </p>
              </div>

              {/* Grow */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Grow</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Build a resilient, long-term professional journey with documented proof of your continuous capability expansion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOR EMPLOYERS */}
      {/* ========================================================================= */}
      <section id="for-employers" aria-label="For Employers" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-12 max-w-6xl mx-auto">
            {/* Left Header */}
            <div className="lg:max-w-md space-y-4">
              <span className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
                For Employers &amp; Hiring Teams
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Hire Based on Verified Capability
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect with candidates whose proficiencies have been systematically structured against actual job requirements. Eliminate screening noise and build stronger teams.
              </p>
              <div className="pt-2">
                <button
                  id="btn-find-talent-employers"
                  onClick={handleEmployerCTA}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-300" />
                  <span>Find Talent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Capabilities Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-slate-900">Publish Job Opportunities</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Post structured vacancies with explicit skill criteria, department parameters, compensation, and requirements.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-slate-900">Discover Skilled Candidates</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Access a pre-screened directory of talent evaluated on verified competencies rather than resume formatting.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="text-sm font-bold text-slate-900">Search for Relevant Talent</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Filter applicants by demonstrated tools, experience levels, and practical project outputs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h3 className="text-sm font-bold text-slate-900">Evaluate Candidates Objectively</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Review standardized profiles, verifiable credentials, and portfolio links in a single structured view.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h3 className="text-sm font-bold text-slate-900">Connect Skills with Requirements</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Achieve tight operational alignment between day-to-day team demands and applicant capabilities.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  06
                </div>
                <h3 className="text-sm font-bold text-slate-900">Build Stronger Teams</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Shorten hiring cycles, reduce costly mis-hires, and foster high-performing, resilient team cultures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. THE ABHI JOBS ECOSYSTEM (VISUAL DIAGRAM) */}
      {/* ========================================================================= */}
      <section id="abhi-jobs-ecosystem" aria-label="The ABHI JOBS Ecosystem" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
              Interconnected Platform
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The ABHI JOBS Ecosystem
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Our platform elements are designed to work together as a continuous, reinforcing loop rather than isolated, disjointed features.
            </p>
          </div>

          {/* Connected Ecosystem Diagram */}
          <div className="max-w-5xl mx-auto bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Node 1 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <span className="text-[11px] font-bold text-[#004D40] uppercase tracking-wider">Foundation</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#004D40]" />
                  <span>Job Seekers</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ambitious professionals, fresh graduates, and experienced specialists bringing their unique experience and desire to grow.
                </p>
              </div>

              {/* Node 2 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <span className="text-[11px] font-bold text-[#004D40] uppercase tracking-wider">Currency</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#004D40]" />
                  <span>Skills</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The shared, objective benchmark uniting what people can do with what organizations need to achieve.
                </p>
              </div>

              {/* Node 3 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <span className="text-[11px] font-bold text-[#004D40] uppercase tracking-wider">Preparation</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#004D40]" />
                  <span>Learning</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Targeted pathways that systematically close competency gaps, build interview confidence, and sharpen readiness.
                </p>
              </div>

              {/* Node 4 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <span className="text-[11px] font-bold text-[#004D40] uppercase tracking-wider">Destination</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#004D40]" />
                  <span>Opportunities</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verified roles published by accredited employers with transparent salary bands and clear expectations.
                </p>
              </div>

              {/* Node 5 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                    05
                  </div>
                  <span className="text-[11px] font-bold text-[#004D40] uppercase tracking-wider">Partners</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#004D40]" />
                  <span>Employers</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Forward-thinking organizations seeking dependable, competent talent evaluated on demonstrated ability.
                </p>
              </div>

              {/* Node 6 */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                    06
                  </div>
                  <span className="text-[11px] font-bold text-[#004D40] uppercase tracking-wider">Outcome</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#004D40]" />
                  <span>Career Growth</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sustainable upward mobility and career resilience that continuously feeds back into mentorship and lifelong learning.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center">
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                By integrating these components into one ecosystem, ABHI JOBS ensures that learning leads to verifiable credentials, credentials lead to real interviews, and interviews lead to fulfilling, long-term careers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. LEARNING & UPSKILLING */}
      {/* ========================================================================= */}
      <section id="learning-upskilling" aria-label="Learning and Upskilling" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-14">
              <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
                Preparation &amp; Readiness
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Don't Just Search for Your Next Opportunity. Prepare for It.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                ABHI JOBS's learning ecosystem is designed to ensure candidates are genuinely equipped to excel in the positions they apply for.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h3 className="text-sm font-bold text-slate-900">Identify Areas for Improvement</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Understand exactly which competencies and technical skills are in demand for your desired career trajectory.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h3 className="text-sm font-bold text-slate-900">Develop Relevant Skills</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Focus on practical, contemporary workflows that mirror actual industry standards and team environments.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h3 className="text-sm font-bold text-slate-900">Become Career-Ready</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Move beyond theoretical concepts into practical problem-solving that translates directly to workplace productivity.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h3 className="text-sm font-bold text-slate-900">Prepare for Opportunities</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Approach technical evaluations and recruiter interviews with well-founded confidence and verified credentials.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h3 className="text-sm font-bold text-slate-900">Stay Competitive</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Keep pace with emerging technologies, modern tools, and evolving best practices across fast-moving industries.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                  06
                </div>
                <h3 className="text-sm font-bold text-slate-900">Continue Professional Development</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unlock promotions, higher compensation bands, and senior responsibilities as your verified knowledge deepens.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <button
                id="btn-explore-learning-about"
                onClick={() => navigate('/learning')}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-slate-300" />
                <span>Explore Learning Pathways</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. HOW ABHI JOBS WORKS (6-STEP PROCESS) */}
      {/* ========================================================================= */}
      <section id="how-abhi-jobs-works" aria-label="How ABHI JOBS Works" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              Step-by-Step
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              How ABHI JOBS Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A transparent, streamlined journey from building your profile to securing your next milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                  01
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Create Your Profile</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Establish your professional identity, state your career goals, and document your academic and vocational background.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                Foundational identity
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                  02
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Showcase Your Skills</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Highlight verified proficiencies, technical tools, and project evidence so hiring managers understand what you can build.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                Demonstrated capability
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                  03
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Learn &amp; Upskill</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Close competency gaps with role-relevant learning modules and prepare for interview expectations before applying.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                Continuous readiness
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                  04
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Discover Opportunities</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Browse curated, verified vacancies published by accredited employers with transparent requirements and compensation.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                Transparent matching
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                  05
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Apply &amp; Connect</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Submit applications directly to active hiring teams and track review, interview, and decision stages in real time.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                Direct recruiter loops
              </div>
            </div>

            {/* Step 6 */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm mb-4">
                  06
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Continue Growing</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Maintain your credentials, benchmark new skills, and unlock senior-level roles as your professional experience deepens.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                Enduring trajectory
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11 & 12. OUR MISSION & OUR VISION */}
      {/* ========================================================================= */}
      <section id="mission-and-vision" aria-label="Our Mission and Vision" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Mission Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
                  <Target className="w-3.5 h-3.5 text-[#004D40]" />
                  <span>Our Mission</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  To make career opportunities more connected to skills, potential and continuous growth.
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  We exist to eliminate artificial hiring barriers and replace subjective guesswork with verified capability. By uniting skills, targeted learning, and direct employer access into one platform, we help people reach their highest potential.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Improving access:</strong> Expanding opportunity for candidates from diverse and non-traditional backgrounds.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Connecting skills with careers:</strong> Bridging demonstrated capabilities directly to verified job vacancies.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Encouraging continuous learning:</strong> Fostering professional upskilling as a standard career practice.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Empowering employers:</strong> Giving hiring managers objective signals to discover reliable talent quickly.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
                Action-oriented &bull; Merit-driven &bull; Transparent
              </div>
            </div>

            {/* Vision Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#061226] text-white border border-slate-800 shadow-md space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-[#FF2B1A]" />
                  <span>Our Vision</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  To build a future where skills, learning and opportunity are connected in one career ecosystem.
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  We envision a world where a person's career trajectory is shaped by what they can solve, build, and learn &mdash; not by superficial resume formatting or institutional prestige alone.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    <span><strong>Fluid skill mobility:</strong> Allowing professionals to transition seamlessly between industries as demands shift.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    <span><strong>Integrated education &amp; work:</strong> Eliminating the disconnect between workplace needs and learning tracks.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    <span><strong>Transparent employment:</strong> Promoting authentic compensation bands and verified role parameters across all sectors.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    <span><strong>Lifelong relevance:</strong> Empowering individuals to remain competitive across decades of technological transformation.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
                Future-ready &bull; Human-centered &bull; Sustainable
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. WHY ABHI JOBS */}
      {/* ========================================================================= */}
      <section id="why-abhi-jobs" aria-label="Why ABHI JOBS" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-bold uppercase tracking-wider">
              Distinct Advantages
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Why ABHI JOBS
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Built from the ground up to create genuine alignment between individual capabilities and organizational objectives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* 1. Skills-First Thinking */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">Skills-First Thinking</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We prioritize demonstrated competency and proven problem-solving over passive resume length or keyword stuffing.
              </p>
            </div>

            {/* 2. Career-Focused Learning */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Career-Focused Learning</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our upskilling pathways are mapped directly to live industry requirements, ensuring your preparation has direct market value.
              </p>
            </div>

            {/* 3. Opportunity Discovery */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Opportunity Discovery</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Discover positions with verified compensation, explicit role responsibilities, and confirmed hiring intent from active employers.
              </p>
            </div>

            {/* 4. Professional Profiles */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900">Professional Profiles</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Build a standardized, verified credential package that speaks clearly and authoritatively to modern recruiters.
              </p>
            </div>

            {/* 5. Centralized Job Application Experience */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                05
              </div>
              <h3 className="text-base font-bold text-slate-900">Centralized Applications</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage every application stage, interview invite, and feedback response in one intuitive, organized dashboard.
              </p>
            </div>

            {/* 6. Continuous Growth */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs">
                06
              </div>
              <h3 className="text-base font-bold text-slate-900">Continuous Growth</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                We support your journey through multiple career milestones, providing the tools to upskill and advance continually.
              </p>
            </div>

            {/* 7. Employer-Talent Connection */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2 md:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-xs shrink-0">
                  07
                </div>
                <h3 className="text-base font-bold text-slate-900">Direct Employer-Talent Connection</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Candidates communicate directly with genuine hiring managers without arbitrary middleman agencies or commission fees, preserving transparency and dignity for both parties throughout the process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. TRUST & TRANSPARENCY */}
      {/* ========================================================================= */}
      <section id="trust-and-transparency" aria-label="Trust and Transparency" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider">
              Accountability
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Trust &amp; Transparency
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Our marketplace is built upon verifiable processes and factual standards rather than fabricated metrics or unsupported claims.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#004D40]" />
              <h3 className="text-sm font-bold text-slate-900">Verified Openings</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Job vacancies are created by approved employers and verified moderators with confirmed hiring intent.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <Layers className="w-6 h-6 text-[#004D40]" />
              <h3 className="text-sm font-bold text-slate-900">No Inflated Metrics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We do not display fabricated statistics or synthetic user counts. Content reflects authentic platform activity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <Users className="w-6 h-6 text-[#004D40]" />
              <h3 className="text-sm font-bold text-slate-900">Direct Communication</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Candidates communicate directly with employers, eliminating unauthorized brokers or undisclosed intermediaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <Lock className="w-6 h-6 text-[#004D40]" />
              <h3 className="text-sm font-bold text-slate-900">Candidate Data Privacy</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Job seekers retain full ownership of personal documentation, portfolio assets, and profile visibility settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. ABOUT PAGE FAQ */}
      {/* ========================================================================= */}
      <section id="about-faq" aria-label="Frequently Asked Questions" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-14">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider">
              Answers
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Everything you need to know about ABHI JOBS, our skills-first philosophy, and our platform operations.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  id={`faq-item-${index}`}
                  className="rounded-2xl border border-slate-200/90 overflow-hidden transition-all bg-white shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 text-left font-bold text-slate-900 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="text-xs sm:text-sm">{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#004D40]' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: EASE_PREMIUM }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 16. FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section id="about-final-cta" aria-label="Join ABHI JOBS" className="py-16 sm:py-24 bg-[#061226] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold">
            <HeartHandshake className="w-3.5 h-3.5 text-[#FF2B1A]" />
            <span>Connect With Purpose</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
            Build Your Skills. Discover Your Opportunity.
          </h2>

          <p className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Whether you're building your career or building your team, ABHI JOBS is designed to connect skills with opportunity.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              id="cta-btn-find-jobs"
              onClick={() => navigate('/jobs')}
              className="px-7 py-3.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-950/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-white" />
              <span>Find Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="cta-btn-join-abhi-jobs"
              onClick={handleJobSeekerCTA}
              className="px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs sm:text-sm font-bold backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-300" />
              <span>Join ABHI JOBS</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
