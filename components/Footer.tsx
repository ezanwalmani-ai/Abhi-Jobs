import React from 'react';
import { AbhiJobsLogo } from './AbhiJobsLogo';
import { ScrollReveal } from '../lib/motion';
import { useApp } from '../context/AppContext';
import { Database } from 'lucide-react';

interface FooterProps {
  navigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate }) => {
  const { supabaseConnected } = useApp();

  return (
    <footer className="bg-[#061226] text-white pt-16 pb-12 border-t border-[#101828]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <button
                onClick={() => navigate('/')}
                className="text-left cursor-pointer focus:outline-hidden group"
                aria-label="ABHI JOBS Home"
              >
                <AbhiJobsLogo
                  variant="horizontal"
                  theme="dark"
                  size="md"
                  showTagline={true}
                />
              </button>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm pt-2">
                ABHI JOBS is a premier modern career-tech platform connecting qualified candidates with top companies and verified recruiters. Discover opportunities, apply with confidence, and grow your career.
              </p>
            </div>

            {/* For Job Seekers */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">For Job Seekers</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Find Jobs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/applications')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    My Applications
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/learning')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    My Learning
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/saved-jobs')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Saved Jobs
                  </button>
                </li>
              </ul>
            </div>

            {/* For Employers */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">For Employers</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    onClick={() => navigate('/register/employer')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Hire Talent
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/employer/post-job')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Post a Job
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/candidates')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Find Talent
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/employer/dashboard')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Employer Dashboard
                  </button>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF2B1A]">Company</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    onClick={() => navigate('/about')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    About
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/contact')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/privacy')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/terms')}
                    className="hover:text-white hover:translate-x-1 transition-all duration-200 cursor-pointer text-left inline-block"
                  >
                    Terms &amp; Conditions
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom Banner */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">ABHI JOBS</span>
            <span>&bull;</span>
            <span className="text-[#FF2B1A] font-medium">&ldquo;Discover. Apply. Grow.&rdquo;</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] text-slate-300 transition-colors cursor-pointer"
              title="Supabase Cloud Managed PostgreSQL Backend"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Supabase Cloud</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  supabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>
            <div>
              &copy; {new Date().getFullYear()} ABHI JOBS. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
