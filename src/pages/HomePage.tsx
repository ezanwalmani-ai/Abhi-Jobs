import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { JobCard } from '../components/JobCard';
import { ApplyModal } from '../components/ApplyModal';
import { AbhiJobsLogo } from '../components/AbhiJobsLogo';
import { Job } from '../types';
import { EASE_PREMIUM } from '../lib/motion';
import { ScrollReveal } from '../components/motion/ScrollReveal';
import { HeroTextReveal } from '../components/motion/HeroTextReveal';
import { ScrollProgress } from '../components/motion/ScrollProgress';
import { StaggerGroup, StaggerItem } from '../components/motion/StaggerGroup';
import { CountUpNumber } from '../components/motion/CountUpNumber';
import {
  Search,
  MapPin,
  Briefcase,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  TrendingUp,
  Award,
  GraduationCap,
  ChevronDown,
  BookOpen,
  Target,
  Compass,
  Layers,
  Check,
  Lightbulb,
  FileCheck,
  Send,
  Lock,
} from 'lucide-react';

interface HomePageProps {
  navigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const { jobs, currentUser, currentRole } = useApp();

  // Search input state for optional hero search bar
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Selected job for apply modal
  const [selectedJobForApply, setSelectedJobForApply] = useState<Job | null>(null);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const [isSearching, setIsSearching] = useState(false);

  // Real published jobs from backend context
  const publishedJobs = (jobs || []).filter((j) => j.status === 'published');
  const previewJobs = publishedJobs.slice(0, 3);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      const queryParam = searchQuery.trim() ? `query=${encodeURIComponent(searchQuery.trim())}` : '';
      const locParam = searchLocation.trim() ? `location=${encodeURIComponent(searchLocation.trim())}` : '';
      const params = [queryParam, locParam].filter(Boolean).join('&');
      navigate(params ? `/jobs?${params}` : '/jobs');
    }, 200);
  };

  const handleStartJobSeekerJourney = () => {
    if (currentUser && (currentRole === 'job_seeker' || (currentRole as any) === 'candidate')) {
      navigate('/jobs');
    } else {
      navigate('/register/job-seeker');
    }
  };

  const handleStartEmployerJourney = () => {
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
        'ABHI JOBS is a dedicated career platform and skills-first marketplace. We connect skilled individuals with verified employment opportunities while offering pathways to build, certify, and strengthen career-ready competencies.',
    },
    {
      question: 'Who can use ABHI JOBS?',
      answer:
        'ABHI JOBS serves two primary communities: Job Seekers (students, fresh graduates, and experienced professionals looking to build skills and secure employment) and Employers (companies, hiring managers, and recruiters seeking verified, qualified talent).',
    },
    {
      question: 'How does ABHI JOBS help Job Seekers?',
      answer:
        'ABHI JOBS shifts the focus from static text resumes to verified skills. We provide curated job discovery, skill benchmarking, continuous upskilling pathways, centralized application management, and direct communication with verified employers.',
    },
    {
      question: 'Can I improve my skills through ABHI JOBS?',
      answer:
        'Yes. Through our learning ecosystem, you can identify in-demand skill requirements, access career preparation resources, participate in upskilling programs, and enhance your overall employability.',
    },
    {
      question: 'How do I find jobs?',
      answer:
        'Visit the Find Jobs section to search and filter positions by department, location, work mode, and experience level. You can review detailed job requirements, responsibilities, and benefits before applying.',
    },
    {
      question: 'How do I apply for a job?',
      answer:
        'Once you build your profile as a Job Seeker, you can apply directly to open positions. You can attach your verified profile details, upload customized resumes, and track your submission status from your applications dashboard.',
    },
    {
      question: 'How can employers use ABHI JOBS?',
      answer:
        'Employers can create a verified company account, publish open positions, review structured candidate applications with verified skill matches, schedule interviews, and build high-performing teams.',
    },
    {
      question: 'Are jobs added directly to the platform?',
      answer:
        'Yes. Every opportunity on ABHI JOBS is published directly by verified employers or platform moderators. We do not aggregate unvetted external postings or generate simulated job ads.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#101828] flex flex-col selection:bg-[#FF2B1A] selection:text-white">
      {/* 29. Subtly pinned scroll progress indicator */}
      <ScrollProgress />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION WITH VIDEO BACKGROUND */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden text-white pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 min-h-[580px] lg:min-h-[640px] flex flex-col justify-center">
        {/* Full-bleed background video: edge-to-edge, muted, loop, autoplay, inline, no controls */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-video-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover object-[25%_center] sm:object-[35%_center] lg:object-[28%_center] pointer-events-none select-none z-0"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Readability overlays: subtle gradient to ensure text readability without hiding or heavily darkening the video */}
        {/* Directional gradient: darker on the right (where text sits) and subtle/clear on the left (where the subject is) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061226]/90 via-[#061226]/55 to-[#061226]/75 lg:bg-gradient-to-r lg:from-[#061226]/25 lg:via-[#061226]/60 lg:to-[#061226]/90 pointer-events-none z-1" />
        {/* Subtle vignette layer for edge contrast balance */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(6,18,38,0.65)_100%)] pointer-events-none z-1" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Kept clear on desktop so the woman with the laptop and headphones is unobstructed */}
            <div className="hidden lg:block lg:col-span-5" />

            {/* Right Column: Hero text placed in the area of natural contrast and readability */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* 1. Small brand label */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.0, ease: EASE_PREMIUM }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#061226]/60 border border-white/20 backdrop-blur-md text-white/95 text-xs font-semibold shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-[#FF2B1A] animate-pulse" />
                <span className="tracking-wider uppercase font-sora text-[11px] font-bold text-white">ABHI JOBS</span>
                <span className="text-white/40">|</span>
                <span className="text-slate-200 font-normal">Skills-First Career Platform</span>
              </motion.div>

              {/* 2. Primary Headline */}
              <HeroTextReveal
                text="Discover. Apply. Grow."
                highlightWords={['Grow.']}
                highlightClassName="text-[#FF2B1A]"
                justify="start"
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] font-sora text-left w-full drop-shadow-sm"
                delay={0.1}
                stagger={0.08}
                duration={0.65}
              />

              {/* 3. Supporting Text */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.3, ease: EASE_PREMIUM }}
                className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-normal max-w-xl font-inter drop-shadow-xs"
              >
                ABHI JOBS connects skilled individuals with meaningful career opportunities while helping people build relevant skills for the future of work.
              </motion.p>

              {/* 4. Primary CTA and Secondary CTA */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.45, ease: EASE_PREMIUM }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/jobs')}
                  className="px-6 py-3.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <Briefcase className="w-4 h-4 text-white" />
                  <span>Find Jobs</span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.52, ease: EASE_PREMIUM }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/about')}
                  className="px-6 py-3.5 rounded-xl bg-[#061226]/60 hover:bg-[#061226]/80 text-white border border-white/25 text-sm font-bold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <span>Explore ABHI JOBS</span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>

              {/* 5. Search container */}
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6, ease: EASE_PREMIUM }}
                className="pt-2 max-w-xl"
              >
                <form
                  onSubmit={handleHeroSearch}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-white/40 flex flex-col sm:flex-row items-stretch gap-2 transition-all duration-300 focus-within:shadow-[0_20px_45px_-12px_rgba(0,0,0,0.35)] focus-within:border-[#FF2B1A]/40"
                >
                  <div className="flex-1 flex items-center gap-2.5 px-3 py-2 border-b sm:border-b-0 sm:border-r border-slate-200/80 group transition-colors">
                    <Search className="w-4 h-4 text-slate-500 group-focus-within:text-[#FF2B1A] shrink-0 transition-colors duration-200" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Job title, skill, or department..."
                      className="w-full text-xs sm:text-sm text-[#101828] placeholder:text-slate-400 focus:outline-hidden bg-transparent"
                    />
                  </div>

                  <div className="flex-1 flex items-center gap-2.5 px-3 py-2 group transition-colors">
                    <MapPin className="w-4 h-4 text-slate-500 group-focus-within:text-[#FF2B1A] shrink-0 transition-colors duration-200" />
                    <input
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="City or 'Remote'..."
                      className="w-full text-xs sm:text-sm text-[#101828] placeholder:text-slate-400 focus:outline-hidden bg-transparent"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSearching}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="min-w-[110px] px-5 py-2.5 rounded-xl bg-[#061226] hover:bg-[#0B192C] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs hover:shadow-md group disabled:opacity-80"
                  >
                    {isSearching ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <span>Search</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
                      </>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            </div>
          </div>

          {/* 6. Metric Highlights / Proof Points */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.72, ease: EASE_PREMIUM }}
            className="mt-12 pt-6 sm:pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center max-w-4xl mx-auto backdrop-blur-xs"
          >
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-sora tracking-tight drop-shadow-xs">
                <CountUpNumber target={10000} suffix="+" duration={1000} />
              </div>
              <div className="text-xs text-slate-300 font-medium">Verified Opportunities</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FF2B1A] font-sora tracking-tight drop-shadow-xs">
                <CountUpNumber target={500} suffix="+" duration={1100} />
              </div>
              <div className="text-xs text-slate-300 font-medium">Accredited Employers</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-sora tracking-tight drop-shadow-xs">
                <CountUpNumber target={98} suffix="%" duration={1200} />
              </div>
              <div className="text-xs text-slate-300 font-medium">Competency Alignment</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-sora tracking-tight drop-shadow-xs">
                <CountUpNumber target={100} suffix="%" duration={1000} />
              </div>
              <div className="text-xs text-slate-300 font-medium">Verified Free for Seekers</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ABHI JOBS VALUE PROPOSITION */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#F7F8FA] border-b border-[#E4E7EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full bg-red-50 text-[#FF2B1A] border border-red-200 text-xs font-bold">
                The ABHI JOBS Model
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight font-sora">
                A Complete Career Ecosystem
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                ABHI JOBS is designed around more than simply listing vacancies. We bridge the critical gap between demonstrated capability and employment through a unified continuum.
              </p>
            </div>
          </ScrollReveal>

          {/* Continuum: SKILLS -> LEARNING -> OPPORTUNITY -> CAREER */}
          <StaggerGroup className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs relative hover:-translate-y-1 hover:shadow-md transition-all duration-200 h-full">
                <div className="text-[#004D40] font-extrabold text-xs tracking-wider mb-2">STAGE 01</div>
                <h3 className="text-lg font-bold text-[#101828] mb-1.5 flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#004D40]" />
                  <span>Skills</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Benchmark demonstrated ability rather than relying solely on traditional resume keywords.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs relative hover:-translate-y-1 hover:shadow-md transition-all duration-200 h-full">
                <div className="text-[#004D40] font-extrabold text-xs tracking-wider mb-2">STAGE 02</div>
                <h3 className="text-lg font-bold text-[#101828] mb-1.5 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#004D40]" />
                  <span>Learning</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Close competency gaps through guided career preparation, upskilling, and skill certifications.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs relative hover:-translate-y-1 hover:shadow-md transition-all duration-200 h-full">
                <div className="text-[#004D40] font-extrabold text-xs tracking-wider mb-2">STAGE 03</div>
                <h3 className="text-lg font-bold text-[#101828] mb-1.5 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#004D40]" />
                  <span>Opportunity</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect directly with verified employers looking for precisely what you know and can deliver.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs relative hover:-translate-y-1 hover:shadow-md transition-all duration-200 h-full">
                <div className="text-[#004D40] font-extrabold text-xs tracking-wider mb-2">STAGE 04</div>
                <h3 className="text-lg font-bold text-[#101828] mb-1.5 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#004D40]" />
                  <span>Career</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Progress forward with transparent hiring stages, continuous evaluation, and sustainable growth.
                </p>
              </div>
            </StaggerItem>
          </StaggerGroup>

          {/* Pillars Overview */}
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs">
            <h4 className="text-sm font-bold text-[#101828] uppercase tracking-wider mb-4 text-center sm:text-left">
              The Platform Brings Together
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#101828]">Job Discovery</div>
                  <div className="text-slate-500">Transparent role expectations</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#101828]">Skills Development</div>
                  <div className="text-slate-500">Continuous competency growth</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#101828]">Career Readiness</div>
                  <div className="text-slate-500">Interview and role preparation</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#101828]">Talent Discovery</div>
                  <div className="text-slate-500">Pre-vetted skill evaluations</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#101828]">Employer Opportunities</div>
                  <div className="text-slate-500">Accredited recruitment pipeline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOR JOB SEEKERS */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10">
              {/* Left Header & CTA */}
              <div className="lg:max-w-md space-y-4">
                <span className="px-3 py-1 rounded-full bg-red-50 text-[#FF2B1A] border border-red-200 text-xs font-bold">
                  For Job Seekers
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#101828] tracking-tight leading-tight font-sora">
                  Empowering your career at every stage.
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Whether taking your first professional step or advancing to senior leadership, ABHI JOBS equips you with the tools, clarity, and connections to succeed.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleStartJobSeekerJourney}
                    className="px-6 py-3.5 rounded-xl bg-[#061226] hover:bg-[#0B192C] text-white text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Start Your Journey</span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>

              {/* Right Feature Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#FF2B1A] flex items-center justify-center mb-3">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Discover Opportunities</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Find relevant jobs based on your skills, experience, and career goals across verified companies.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Build Your Skills</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Improve your employability through targeted learning, workshops, and verified skill certifications.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#FF2B1A] flex items-center justify-center mb-3">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Create Your Profile</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Build a structured, professional profile that highlights your verified competencies and portfolio.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-[#E4E7EC] bg-[#F7F8FA] hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-3">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Apply With Confidence</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Apply with verified credentials and manage every submission status from one centralized dashboard.
                  </p>
                </div>

                <div className="sm:col-span-2 p-5 rounded-2xl border border-red-200/80 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#101828] mb-0.5">Grow Your Career Continuously</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Continue learning, benchmarking new abilities, and unlocking higher-tier roles as your career progresses.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/learning')}
                    className="px-4 py-2 rounded-xl bg-white border border-red-200 text-[#FF2B1A] text-xs font-bold hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                  >
                    Explore Learning
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FOR EMPLOYERS */}
      {/* ========================================================================= */}
      <section id="for-employers" className="py-16 sm:py-20 bg-gradient-to-br from-[#061226] via-[#0B192C] to-[#061226] text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              {/* Left Header */}
              <div className="lg:max-w-lg space-y-4">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 text-xs font-bold">
                  For Employers &amp; Hiring Teams
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-sora">
                  Hire based on verified capability, not guesswork.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Connect with candidates whose competencies have been structured and verified against real industry needs. Shorten time-to-hire with transparent candidate profiles.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleStartEmployerJourney}
                    className="px-6 py-3.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-white" />
                    <span>Find Talent</span>
                  </button>
                </div>
              </div>

              {/* Right Capabilities Grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5 hover:bg-white/10 transition-colors">
                  <div className="text-[#FF2B1A] font-bold text-xs uppercase tracking-wider">01</div>
                  <h3 className="text-sm font-bold text-white">Discover Skilled Talent</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Search through a pre-screened talent directory with clear skill tags, experience, and availability.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5 hover:bg-white/10 transition-colors">
                  <div className="text-[#FF2B1A] font-bold text-xs uppercase tracking-wider">02</div>
                  <h3 className="text-sm font-bold text-white">Publish Opportunities</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Post structured job listings with exact skill requirements, department parameters, and compensation.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5 hover:bg-white/10 transition-colors">
                  <div className="text-[#FF2B1A] font-bold text-xs uppercase tracking-wider">03</div>
                  <h3 className="text-sm font-bold text-white">Search for Suitable Candidates</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Filter applicants using precise skill match calculations instead of keyword-stuffed resumes.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1.5 hover:bg-white/10 transition-colors">
                  <div className="text-[#FF2B1A] font-bold text-xs uppercase tracking-wider">04</div>
                  <h3 className="text-sm font-bold text-white">Evaluate Skills &amp; Build Teams</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Manage stages, schedule interviews directly, and make confident hiring decisions with your team.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOW ABHI JOBS WORKS */}
      {/* ========================================================================= */}
      <section id="how-abhi-jobs-works" className="py-16 sm:py-20 bg-[#F7F8FA] border-b border-[#E4E7EC] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full bg-slate-200 text-[#101828] text-xs font-bold">
                Simple 4-Step Process
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight font-sora">
                How ABHI JOBS Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
                From onboarding to your next professional milestone, the platform is streamlined for clarity and momentum.
              </p>
            </div>
          </ScrollReveal>

          <StaggerGroup className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#FF2B1A] font-extrabold flex items-center justify-center text-sm">
                    01
                  </div>
                  <h3 className="text-base font-bold text-[#101828]">Create Your Profile</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Build your professional identity and showcase your verified competencies, credentials, and achievements.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Setup your credentials
                </div>
              </div>
            </StaggerItem>

            {/* Step 2 */}
            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#FF2B1A] font-extrabold flex items-center justify-center text-sm">
                    02
                  </div>
                  <h3 className="text-base font-bold text-[#101828]">Build Your Skills</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Learn, improve, and strengthen your career readiness with targeted upskilling pathways.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Close competency gaps
                </div>
              </div>
            </StaggerItem>

            {/* Step 3 */}
            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#FF2B1A] font-extrabold flex items-center justify-center text-sm">
                    03
                  </div>
                  <h3 className="text-base font-bold text-[#101828]">Discover Opportunities</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Explore curated jobs that match your skills, preferences, and long-term career aspirations.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Transparent matching
                </div>
              </div>
            </StaggerItem>

            {/* Step 4 */}
            <StaggerItem>
              <div className="bg-white rounded-2xl p-6 border border-[#E4E7EC] shadow-xs hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#FF2B1A] font-extrabold flex items-center justify-center text-sm">
                    04
                  </div>
                  <h3 className="text-base font-bold text-[#101828]">Take the Next Step</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Apply with confidence, track updates in real-time, and move forward in your career journey.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-semibold text-[#004D40]">
                  Real-time tracking
                </div>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SKILLS-FIRST APPROACH */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bg-gradient-to-r from-[#061226] via-[#0B192C] to-[#101828] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
              <div className="max-w-3xl space-y-4 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#FF2B1A] border border-white/15 text-xs font-bold">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Our Core Philosophy</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-sora">
                  A person's potential should not be judged only by a traditional resume.
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                  Static CVs often fail to capture demonstrated capability, practical problem-solving, and continuous learning. At ABHI JOBS, skills, verified competencies, hands-on experience, and willingness to grow all contribute to how talent is discovered.
                </p>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  ABHI JOBS aims to make opportunity more connected to what people can actually do and what they can become, creating fair, merit-driven pathways across industries.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. LEARNING & UPSKILLING */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#F7F8FA] border-b border-[#E4E7EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="lg:max-w-md space-y-4">
                <span className="px-3 py-1 rounded-full bg-red-50 text-[#FF2B1A] border border-red-200 text-xs font-bold">
                  Learning &amp; Upskilling
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight leading-tight font-sora">
                  Don't just look for your next job. Prepare for it.
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Continuous improvement is the foundation of long-term career resilience. ABHI JOBS's learning ecosystem prepares you for changing market demands through structured, role-relevant preparation.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/learning')}
                    className="px-6 py-3.5 rounded-xl bg-[#061226] hover:bg-[#0B192C] text-white text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-300" />
                    <span>Explore Learning</span>
                  </button>
                </div>
              </div>

              {/* Benefit Items */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E4E7EC] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Close Skill Gaps</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Identify specific competencies sought by top employers and systematically address gaps.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4E7EC] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Improve Employability</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Strengthen your candidate profile with verified skills that recruiters actively search for.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4E7EC] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Prepare for Interviews</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Practice technical and domain-specific challenges to build confidence before live recruiter rounds.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4E7EC] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Develop Job-Relevant Skills</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Focus on practical, contemporary workflows that match current business needs.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4E7EC] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Stay Competitive</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Keep up with fast-evolving technologies and methodologies across key industry sectors.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4E7EC] shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <h3 className="text-sm font-bold text-[#101828] mb-1">Progress Professionally</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Unlock promotions and higher-impact roles with documented proof of your continuous growth.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. OPPORTUNITIES SECTION */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                Live Openings
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight mt-2 font-sora">
                Latest Opportunities
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Explore real, verified positions currently published by accredited employers.
              </p>
            </div>

            <button
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#FF2B1A] hover:text-[#e02213] transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>Browse Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {previewJobs.length > 0 ? (
            <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewJobs.map((job) => (
                <StaggerItem key={job.id}>
                  <JobCard
                    job={job}
                    onApply={(selected) => setSelectedJobForApply(selected)}
                    onViewDetails={(jobId) => navigate(`/jobs/${jobId}`)}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <div className="p-12 text-center bg-[#F7F8FA] rounded-2xl border border-[#E4E7EC] space-y-3">
              <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-[#101828]">New opportunities are coming soon.</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Check Find Jobs regularly for the latest opportunities published by verified employers.
              </p>
              <button
                onClick={() => navigate('/jobs')}
                className="mt-2 px-4 py-2 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-[#0B192C] transition-colors cursor-pointer"
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. WHY ABHI JOBS */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#F7F8FA] border-t border-[#E4E7EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full bg-red-50 text-[#FF2B1A] border border-red-200 text-xs font-bold">
                The Clear Difference
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight font-sora">
                Why Choose ABHI JOBS
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
                Delivering authentic alignment between individual capabilities and organizational objectives.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Job Seekers */}
            <ScrollReveal direction="left" delay={0.1}>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E7EC] shadow-xs hover:shadow-md transition-shadow space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#FF2B1A] flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#FF2B1A] uppercase tracking-wider">Built for</span>
                    <h3 className="text-lg font-extrabold text-[#101828]">Job Seekers &amp; Professionals</h3>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Skills-focused opportunities:</strong> Connect with jobs mapped directly to your verified strengths.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Career development:</strong> Access structured guidance to reach the next tier in your industry.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Learning and upskilling:</strong> Continuously improve through career readiness programs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Centralized applications:</strong> Manage status stages, interviews, and feedback in one place.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Professional profile:</strong> Present a verified credential package trusted by employers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Sustainable career growth:</strong> Step into positions that offer real upward trajectory.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>

            {/* For Employers */}
            <ScrollReveal direction="right" delay={0.15}>
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E7EC] shadow-xs hover:shadow-md transition-shadow space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#004D40] uppercase tracking-wider">Built for</span>
                    <h3 className="text-lg font-extrabold text-[#101828]">Employers &amp; Recruiters</h3>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Access to skilled talent:</strong> Browse candidates evaluated on proven competencies.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Skills-focused discovery:</strong> Find applicants that precisely match required capabilities.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Streamlined job posting:</strong> Publish clear, standardized requirements in minutes.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Talent pipeline management:</strong> Track hiring stages and schedule interviews directly.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#004D40] shrink-0 mt-0.5" />
                    <span><strong>Better alignment:</strong> Higher retention and productivity through accurate role fitting.</span>
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. TRUST & TRANSPARENCY */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
                Accountability
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight font-sora">
                Trust &amp; Transparency
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl mx-auto">
                Our marketplace is built upon verifiable processes and factual standards rather than fabricated metrics or unsupported guarantees.
              </p>
            </div>
          </ScrollReveal>

          <StaggerGroup className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-2 hover:-translate-y-0.5 hover:shadow-xs transition-all h-full">
                <ShieldCheck className="w-6 h-6 text-[#004D40]" />
                <h3 className="text-sm font-bold text-[#101828]">Verified Credentials</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Candidate competencies and employer identities are reviewed to prevent misleading representations.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-2 hover:-translate-y-0.5 hover:shadow-xs transition-all h-full">
                <Layers className="w-6 h-6 text-[#004D40]" />
                <h3 className="text-sm font-bold text-[#101828]">Single Source of Truth</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every published vacancy reflects genuine hiring needs with specified parameters, responsibilities, and terms.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-2 hover:-translate-y-0.5 hover:shadow-xs transition-all h-full">
                <Users className="w-6 h-6 text-[#004D40]" />
                <h3 className="text-sm font-bold text-[#101828]">Direct Communication</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Applicants connect directly with employers without unauthorized third-party brokers or commission agents.
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="p-6 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] space-y-2 hover:-translate-y-0.5 hover:shadow-xs transition-all h-full">
                <Lock className="w-6 h-6 text-[#004D40]" />
                <h3 className="text-sm font-bold text-[#101828]">Privacy &amp; Control</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Job seekers maintain full ownership of their personal documentation, resume uploads, and contact visibility.
                </p>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FAQ SECTION */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-20 bg-[#F7F8FA] border-t border-[#E4E7EC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight font-sora">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Everything you need to know about the ABHI JOBS skills-first platform and hiring process.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={item.question}
                  className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden shadow-2xs transition-shadow hover:shadow-xs"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#101828]">{item.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-colors duration-200 ${
                          isOpen ? 'text-[#FF2B1A]' : 'text-slate-500'
                        }`}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: EASE_PREMIUM }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-[#F7F8FA]">
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
      {/* 12. FINAL CTA */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-[#061226] via-[#0B192C] to-[#061226] text-white">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <AbhiJobsLogo variant="horizontal" theme="dark" size="lg" className="mx-auto" />
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-sora">
              Your next opportunity starts with your skills.
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Build your skills. Discover opportunities. Take the next step in your career with ABHI JOBS.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/jobs')}
                className="px-6 py-3.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-md hover:-translate-y-0.5 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-white" />
                <span>Find Jobs</span>
              </button>
              <button
                onClick={handleStartJobSeekerJourney}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold backdrop-blur-sm hover:-translate-y-0.5 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FF2B1A]" />
                <span>Join ABHI JOBS</span>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Apply Modal */}
      <ApplyModal
        job={selectedJobForApply}
        isOpen={Boolean(selectedJobForApply)}
        onClose={() => setSelectedJobForApply(null)}
        navigate={navigate}
      />
    </div>
  );
};

export default HomePage;
