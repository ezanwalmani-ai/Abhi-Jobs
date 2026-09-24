import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Search,
  Calendar,
} from 'lucide-react';
import { AbhiJobsLogo } from './AbhiJobsLogo';

interface AboutAbhiJobsSectionProps {
  navigate: (route: string) => void;
}

export const AboutAbhiJobsSection: React.FC<AboutAbhiJobsSectionProps> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<'talent' | 'employers'>('talent');

  return (
    <section
      id="about"
      aria-label="About ABHI JOBS"
      className="py-16 sm:py-24 bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-red-600" />
            <span>Curated Career Ecosystem • Discover. Apply. Grow.</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Bridging Verified Talent and Real Opportunity.
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            ABHI JOBS was built to eliminate the noise from hiring. We replace keyword-stuffed resumes and phantom job postings with verified skills, transparent processes, and direct human connections.
          </p>
        </div>

        {/* The Core Story: Real & Grounded */}
        <div className="mt-14 max-w-4xl mx-auto bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Our Foundation</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 leading-snug">
                A single source of truth for genuine careers.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Most modern job boards are cluttered with automated scrapers, outdated listings, and synthetic profiles.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                At ABHI JOBS, every published job is created and verified by human administrators and approved company representatives. There are zero placeholder jobs, zero fake salaries, and zero artificial applicant counts.
              </p>
            </div>

            <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                What Sets ABHI JOBS Apart
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Admin-Verified Openings</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jobs exist only when active hiring teams have confirmed the vacancy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Skill-Centric Profiles</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Demonstrated proficiencies and project experience over keyword inflation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Direct Recruiter Access</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidates apply straight to hiring managers with transparent tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dual Perspectives: Clean Tab Switcher */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8 px-2">
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab('talent')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'talent'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-red-600 shrink-0" />
                <span>For Job Seekers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('employers')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'employers'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4 text-red-600 shrink-0" />
                <span>For Employers</span>
              </button>
            </div>
          </div>

          {/* Tab Content: Job Seekers */}
          {activeTab === 'talent' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">1. Discover Verified Jobs</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Search live openings across technology, engineering, design, operations, and finance with clear skill requirements.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">2. One-Click Applications</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Apply directly with your stored ABHI JOBS profile credentials. Track the review and interview stages in real time.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">3. Targeted Upskilling</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Access guided learning tracks and skill benchmarks designed to qualify you for higher-tier market opportunities.
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Employers */}
          {activeTab === 'employers' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">1. Fast Role Publishing</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Post detailed vacancies with defined compensation tiers and required candidate proficiencies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">2. Pre-Screened Candidates</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Filter applicants by verified qualifications, salary alignment, and immediate availability.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-300 transition-all shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">3. Direct Applicant Pipeline</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Manage incoming submissions, conduct interview loops, and extend offers from a clean recruiter dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4 Guarantees & Values */}
        <div className="mt-16 pt-12 border-t border-slate-200 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-xl font-extrabold text-slate-900">Our Platform Standards</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Built on transparency, real-world data, and mutual respect.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Pillar 01</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Zero Fake Content</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                No simulated vacancies, no invented reviews, and no artificial job counts.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Pillar 02</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Skills Over Fluff</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Objective proficiency indicators prioritize actual readiness over resume length.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Pillar 03</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Direct Communication</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Hiring managers and candidates correspond directly without middleman brokers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Pillar 04</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">Continuous Progress</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Integrated learning pathways to bridge skill gaps and unlock upward mobility.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Verified Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/job-seeker/upskill')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 transition-all shadow-2xs flex items-center justify-center cursor-pointer"
            >
              <span>View Learning Modules</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export const AboutHunarSection = AboutAbhiJobsSection;
export default AboutAbhiJobsSection;
