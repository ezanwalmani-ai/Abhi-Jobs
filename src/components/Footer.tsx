import React from 'react';
import { Mail } from 'lucide-react';
import { AbhiJobsLogo } from './AbhiJobsLogo';

interface FooterProps {
  navigate: (route: string) => void;
  onReplayIntro?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ navigate, onReplayIntro }) => {
  return (
    <footer className="bg-[#081D36] text-white border-t border-[#102B4E]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/10">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-3.5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24] rounded-lg hover:opacity-90 transition-opacity"
              aria-label="ABHI JOBS Home"
            >
              <AbhiJobsLogo
                variant="horizontal"
                theme="dark"
                size="sm"
                showTagline={true}
              />
            </button>
            <p className="text-slate-300/90 text-[13.5px] leading-relaxed max-w-sm">
              ABHI JOBS is a recruitment consultancy and career platform connecting qualified candidates with vetted hiring opportunities across technology, finance, engineering, and business operations.
            </p>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F47A24]">
              Platform
            </h4>
            <ul className="space-y-2.5 text-[13.5px] text-slate-300">
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
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F47A24]">
              Company &amp; Support
            </h4>
            <ul className="space-y-2.5 text-[13.5px] text-slate-300">
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

          {/* Follow ABHI JOBS */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F47A24]">
              Follow ABHI JOBS
            </h4>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.instagram.com/abhijobsofficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow ABHI JOBS on Instagram"
                title="Follow ABHI JOBS on Instagram"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/15 hover:border-[#F47A24] hover:bg-[#F47A24]/15 text-slate-200 hover:text-white transition-colors inline-flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[18px] h-[18px]"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/abhi-jobs/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow ABHI JOBS on LinkedIn"
                title="Follow ABHI JOBS on LinkedIn"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/15 hover:border-[#F47A24] hover:bg-[#F47A24]/15 text-slate-200 hover:text-white transition-colors inline-flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[18px] h-[18px]"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="mailto:enquireabhijobs@gmail.com"
                aria-label="Email ABHI JOBS at enquireabhijobs@gmail.com"
                title="Email ABHI JOBS: enquireabhijobs@gmail.com"
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/15 hover:border-[#F47A24] hover:bg-[#F47A24]/15 text-slate-200 hover:text-white transition-colors inline-flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47A24]"
              >
                <Mail className="w-[18px] h-[18px]" aria-hidden="true" />
              </a>
            </div>
            <a
              href="mailto:enquireabhijobs@gmail.com"
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors break-all"
            >
              <span>enquireabhijobs@gmail.com</span>
            </a>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ABHI JOBS. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4">
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
            <button
              type="button"
              onClick={() => navigate('/abhi-control-center/login')}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              aria-label="Administrator Login"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
