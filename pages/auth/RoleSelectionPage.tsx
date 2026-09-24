import React from 'react';
import { motion } from 'motion/react';
import { User, Building2, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AbhiJobsLogo } from '../../components/AbhiJobsLogo';
import { ScrollReveal, EASE_PREMIUM } from '../../lib/motion';

export interface RoleSelectionPageProps {
  navigate: (route: string) => void;
}

export const RoleSelectionPage: React.FC<RoleSelectionPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F7F8FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <ScrollReveal direction="up" distance={16}>
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <AbhiJobsLogo size="lg" theme="color" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101828] font-sora tracking-tight">
              Join ABHI JOBS
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[#667085] max-w-lg mx-auto">
              Choose how you want to experience the platform. Select your account type to get started.
            </p>
          </div>
        </ScrollReveal>

        {/* Two Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* 1. Job Seeker Card */}
          <ScrollReveal direction="up" delay={0.05} distance={18}>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white rounded-2xl border border-[#E4E7EC] p-8 shadow-xs hover:shadow-md hover:border-[#FF2B1A]/40 transition-all duration-200 flex flex-col justify-between group text-left h-full"
            >
              <div>
                <div className="w-14 h-14 rounded-xl bg-red-50 text-[#FF2B1A] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <User className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#FF2B1A] mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  For Candidates
                </div>
                <h2 className="text-2xl font-bold text-[#101828] font-sora">
                  Job Seeker
                </h2>
                <p className="mt-2 text-sm text-[#667085] leading-relaxed">
                  Connect with verified employers, explore meaningful job openings, and accelerate your career trajectory.
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2.5 text-sm text-[#101828] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                    Find verified career opportunities
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#101828] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                    Track applications in real-time
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#101828] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                    Build your career and grow skills
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E4E7EC]">
                <button
                  onClick={() => navigate('/register/job-seeker')}
                  className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continue as Job Seeker</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* 2. Employer Card */}
          <ScrollReveal direction="up" delay={0.1} distance={18}>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white rounded-2xl border border-[#E4E7EC] p-8 shadow-xs hover:shadow-md hover:border-[#004D40]/40 transition-all duration-200 flex flex-col justify-between group text-left h-full"
            >
              <div>
                <div className="w-14 h-14 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <Building2 className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#004D40] mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  For Companies
                </div>
                <h2 className="text-2xl font-bold text-[#101828] font-sora">
                  Employer
                </h2>
                <p className="mt-2 text-sm text-[#667085] leading-relaxed">
                  Post positions, source pre-vetted professionals, and manage your end-to-end recruitment lifecycle seamlessly.
                </p>

                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2.5 text-sm text-[#101828] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                    Find and hire skilled talent
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#101828] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                    Post jobs and manage candidates
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-[#101828] font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                    Build team &amp; grow business
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E4E7EC]">
                <button
                  onClick={() => navigate('/register/employer')}
                  className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#061226] hover:bg-[#0d1e3d] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continue as Employer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>

        {/* Existing account footer */}
        <div className="mt-10 text-center text-sm text-[#667085]">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-semibold text-[#FF2B1A] hover:underline cursor-pointer"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
