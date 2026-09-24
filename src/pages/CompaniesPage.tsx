import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM } from '../lib/motion';
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  Briefcase,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface CompaniesPageProps {
  navigate: (route: string) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({ navigate }) => {
  const { companies, jobs } = useApp();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');

  const filteredCompanies = companies.filter((comp) => {
    const compName = comp.companyName || comp.name || '';
    const compInd = comp.industry || '';
    if (search) {
      const q = search.toLowerCase();
      if (!compName.toLowerCase().includes(q) && !compInd.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (industryFilter !== 'All' && compInd !== industryFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <ScrollReveal direction="up" distance={16}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />
                <span>Accredited Hiring Partners</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">Verified Companies</h1>
              <p className="text-xs sm:text-sm text-[#667085] mt-1">
                Connect with vetted enterprises and startups committed to skill-based recruitment
              </p>
            </div>

            <button
              onClick={() => navigate('/employer/post-job')}
              className="px-4 py-2.5 rounded-xl bg-[#FF2B1A] text-white text-xs font-bold hover:bg-[#e02213] transition-colors cursor-pointer shadow-xs min-h-[44px]"
            >
              Register Your Company
            </button>
          </div>
        </ScrollReveal>

        {/* Search & Filter */}
        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4E7EC] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:max-w-md flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
              <Search className="w-4 h-4 text-[#667085] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies by name or industry..."
                className="w-full text-xs text-[#101828] bg-transparent focus:outline-hidden placeholder:text-[#667085]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#667085]">Industry:</span>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-white text-[#101828] focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Industries</option>
                <option value="Cloud Infrastructure & AI">Cloud &amp; AI</option>
                <option value="Logistics & Supply Chain">Logistics</option>
                <option value="Financial Services & FinTech">FinTech</option>
                <option value="Healthcare & Life Sciences">Healthcare</option>
              </select>
            </div>
          </div>
        </ScrollReveal>

        {/* Companies Grid */}
        <StaggerGroup staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((comp) => {
            const compName = comp.companyName || comp.name || 'Company';
            const companyJobs = jobs.filter((j) => {
              const jComp = j.companyName || '';
              return (
                (j.employerId === comp.id || (jComp && compName && jComp.toLowerCase() === compName.toLowerCase())) &&
                j.status === 'published'
              );
            });

            return (
              <StaggerItem key={comp.id}>
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
                  className="bg-white rounded-2xl border border-[#E4E7EC] hover:border-[#061226]/30 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      <img
                        src={comp.logo}
                        alt={compName}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#E4E7EC] shadow-xs shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-[#101828] leading-tight">{compName}</h3>
                          {(comp.verificationStatus === 'verified' || comp.verified) && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 text-[#004D40] text-[10px] font-bold border border-teal-200">
                              <CheckCircle2 className="w-3 text-[#004D40]" />
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#004D40] font-medium mt-0.5">{comp.industry}</p>
                        <div className="flex items-center gap-3 text-xs text-[#667085] mt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#667085]" />
                            {comp.location}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#667085]" />
                            {comp.companySize || comp.size}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#667085] line-clamp-3 mt-4 leading-relaxed">{comp.about || comp.description}</p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-[#E4E7EC] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#004D40]">
                      <Briefcase className="w-3.5 h-3.5 text-[#004D40]" />
                      <span>{companyJobs.length} Open Position{companyJobs.length === 1 ? '' : 's'}</span>
                    </div>

                    <button
                      onClick={() => navigate(`/jobs?query=${encodeURIComponent(compName)}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#F7F8FA] hover:bg-[#061226] text-[#101828] hover:text-white text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>View Jobs</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </div>
  );
};
