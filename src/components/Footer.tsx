import React from 'react';
import { AbhiJobsLogo } from './AbhiJobsLogo';

interface FooterProps {
  navigate: (route: string) => void;
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate, onReplayIntro }) => {
  return (
    <footer className="bg-[#081D36] text-white border-t border-[#102B4E]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/10">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-left cursor-pointer focus:outline-none hover:opacity-90 transition-opacity"
              aria-label="ABHI JOBS Home"
            >
              <AbhiJobsLogo
                variant="horizontal"
                theme="dark"
                size="sm"
                showTagline={true}
              />
            </button>
            <p className="text-slate-300 text-[13.5px] leading-relaxed max-w-sm">
              ABHI JOBS is a recruitment consultancy and career platform connecting qualified candidates with vetted hiring opportunities across technology, finance, engineering, and business operations.
            </p>
          </div>

          {/* Platform Links */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F47A24]">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/jobs')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Find Jobs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/applications')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  My Applications
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/learning')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Learn with ABHI
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/hire-talent')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Hire Talent
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="md:col-span-4 space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F47A24]">
              Company &amp; Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Terms and Conditions
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ABHI JOBS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Replay Brand Intro
              </button>
            )}
            <span className="text-slate-400">Discover. Apply. Grow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
