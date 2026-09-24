import React from 'react';
import {
  Home,
  Briefcase,
  Search,
  Building2,
  Users,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AbhiJobsSymbol } from '../components/AbhiJobsLogo';
import { Button } from '../components/ui/Button';
import { EASE_PREMIUM } from '../lib/motion';

interface NotFoundPageProps {
  navigate: (route: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-[82vh] bg-[#061226] text-white flex flex-col justify-center items-center px-4 py-16 sm:py-24 relative overflow-hidden">
      {/* Subtle Background Radial Glows */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: EASE_PREMIUM }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] bg-[#FF2B1A]/10 rounded-full blur-3xl pointer-events-none"
      />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-[#004D40]/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_PREMIUM }}
        className="max-w-3xl w-full mx-auto text-center relative z-10 space-y-8"
      >
        {/* Brand Crest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE_PREMIUM }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs"
        >
          <AbhiJobsSymbol size="xs" theme="red" />
          <span className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            ABHI JOBS • Error 404
          </span>
        </motion.div>

        {/* Big 404 Display */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE_PREMIUM }}
            className="relative inline-block"
          >
            <h1 className="text-7xl sm:text-9xl font-extrabold tracking-tight font-display text-white select-none">
              4<span className="text-[#FF2B1A]">0</span>4
            </h1>
            <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-[#FF2B1A] text-white text-[11px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap shadow-md">
              Page Not Found
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: EASE_PREMIUM }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white pt-3 tracking-tight"
          >
            Lost in the Career Jungle? We’ll Guide You Back.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: EASE_PREMIUM }}
            className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-normal"
          >
            The job listing, profile, or link you are searching for might have expired, been relocated, or is temporarily unavailable. Let's get you back to discover, apply, and grow.
          </motion.p>
        </div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: EASE_PREMIUM }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto"
        >
          {/* Find Jobs (Red-Orange CTA) */}
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => navigate('/jobs')}
            iconLeft={<Briefcase className="w-4 h-4" />}
            className="sm:w-auto px-6 py-3 min-h-[46px]"
          >
            Find Jobs
          </Button>

          {/* Back to Home (White / Secondary) */}
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => navigate('/')}
            iconLeft={<Home className="w-4 h-4" />}
            className="sm:w-auto px-6 py-3 min-h-[46px]"
          >
            Back to Home
          </Button>
        </motion.div>

        {/* Fast Exploration Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease: EASE_PREMIUM }}
          className="pt-8 border-t border-white/10 max-w-2xl mx-auto"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Popular Destinations on ABHI JOBS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => navigate('/jobs')}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer"
            >
              <Search className="w-4 h-4 text-[#FF2B1A] mb-1.5 transition-transform group-hover:scale-110" />
              <div className="text-xs font-bold text-white group-hover:text-[#FF2B1A] transition-colors">
                Browse Jobs
              </div>
              <div className="text-[11px] text-slate-400">Verified openings</div>
            </button>

            <button
              onClick={() => navigate('/companies')}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-teal-400 mb-1.5 transition-transform group-hover:scale-110" />
              <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                Top Companies
              </div>
              <div className="text-[11px] text-slate-400">Actively hiring</div>
            </button>

            <button
              onClick={() => navigate('/candidates')}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-400 mb-1.5 transition-transform group-hover:scale-110" />
              <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                Verified Talent
              </div>
              <div className="text-[11px] text-slate-400">Skilled candidates</div>
            </button>

            <button
              onClick={() => navigate('/contact')}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400 mb-1.5 transition-transform group-hover:scale-110" />
              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                Need Help?
              </div>
              <div className="text-[11px] text-slate-400">Contact Support</div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
