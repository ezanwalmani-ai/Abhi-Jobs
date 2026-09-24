import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CandidateCard } from '../components/CandidateCard';
import { CandidateProfileModal } from '../components/CandidateProfileModal';
import { CandidateProfile } from '../types';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM, TextMaskReveal, ScrollProgress } from '../lib/motion';
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface CandidatesPageProps {
  navigate: (route: string) => void;
}

export const CandidatesPage: React.FC<CandidatesPageProps> = ({ navigate }) => {
  const { candidates, inviteCandidateToApply, jobs } = useApp();

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [expLevel, setExpLevel] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');

  // Selected candidate modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);

  // Skill pool
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [candidates]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Search text
      if (search) {
        const q = search.toLowerCase();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchHeadline = (c.headline || '').toLowerCase().includes(q);
        const matchSkills = (c.skills || []).some((s) => typeof s === 'string' && s.toLowerCase().includes(q));
        if (!matchName && !matchHeadline && !matchSkills) return false;
      }

      // Location
      if (location && !(c.location || '').toLowerCase().includes(location.toLowerCase())) {
        return false;
      }

      // Exp Level
      if (expLevel !== 'All' && c.experienceLevel !== expLevel) {
        return false;
      }

      // Availability
      if (availability !== 'All' && !(c.availability || '').toLowerCase().includes(availability.toLowerCase())) {
        return false;
      }

      // Skill
      if (selectedSkill !== 'All' && !c.skills.includes(selectedSkill)) {
        return false;
      }

      return true;
    });
  }, [candidates, search, location, expLevel, availability, selectedSkill]);

  const handleReset = () => {
    setSearch('');
    setLocation('');
    setExpLevel('All');
    setAvailability('All');
    setSelectedSkill('All');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <ScrollProgress />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Title */}
        <ScrollReveal direction="up" distance={16}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200/70 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />
                <span>ABHI JOBS Skill-Certified Network</span>
              </div>
              <TextMaskReveal
                as="h1"
                className="text-2xl sm:text-3xl font-extrabold text-[#101828]"
                delay={0.1}
                duration={0.65}
              >
                Talent &amp; Candidate Directory
              </TextMaskReveal>
              <p className="text-xs sm:text-sm text-[#667085] mt-1">
                Browse {filteredCandidates.length} pre-screened professionals ready for hiring and contract opportunities
              </p>
            </div>

            <button
              onClick={() => navigate('/employer/post-job')}
              className="px-4 py-2.5 rounded-xl bg-[#FF2B1A] text-white text-xs font-bold hover:bg-[#e02213] transition-colors self-start sm:self-auto cursor-pointer shadow-xs min-h-[44px]"
            >
              Post Job to Invite Talent
            </button>
          </div>
        </ScrollReveal>

        {/* Filter Bar */}
        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E4E7EC] shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
                <Search className="w-4 h-4 text-[#667085] shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Candidate name, role, or skill..."
                  className="w-full text-xs text-[#101828] bg-transparent focus:outline-hidden placeholder:text-[#667085]"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
                <MapPin className="w-4 h-4 text-[#667085] shrink-0" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or Region..."
                  className="w-full text-xs text-[#101828] bg-transparent focus:outline-hidden placeholder:text-[#667085]"
                />
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
                <Briefcase className="w-4 h-4 text-[#667085] shrink-0" />
                <select
                  value={expLevel}
                  onChange={(e) => setExpLevel(e.target.value)}
                  className="w-full text-xs text-[#101828] bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value="All">All Experience Levels</option>
                  <option value="Fresher">Fresher (0 yrs)</option>
                  <option value="Junior">Junior (1-2 yrs)</option>
                  <option value="Mid">Mid (3-5 yrs)</option>
                  <option value="Senior">Senior (5+ yrs)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#D0D5DD] bg-[#F7F8FA] focus-within:border-[#061226] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#061226]/10 transition-all">
                <Users className="w-4 h-4 text-[#667085] shrink-0" />
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full text-xs text-[#101828] bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value="All">All Availabilities</option>
                  <option value="Immediate">Immediate Joining</option>
                  <option value="15 Days">Within 15 Days</option>
                  <option value="1 Month">1 Month Notice</option>
                </select>
              </div>
            </div>

            {/* Skill pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E4E7EC]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider mr-1">Skills:</span>
                <button
                  onClick={() => setSelectedSkill('All')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedSkill === 'All' ? 'bg-[#061226] text-white shadow-xs' : 'bg-[#F7F8FA] text-[#667085] hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {allSkills.slice(0, 10).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => setSelectedSkill(skill)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      selectedSkill === skill ? 'bg-[#FF2B1A] text-white shadow-xs' : 'bg-[#F7F8FA] text-[#101828] hover:bg-slate-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              {(search || location || expLevel !== 'All' || availability !== 'All' || selectedSkill !== 'All') && (
                <button
                  onClick={handleReset}
                  className="text-xs text-[#FF2B1A] hover:text-[#e02213] font-semibold flex items-center gap-1 cursor-pointer py-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Candidates Grid */}
        {filteredCandidates.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F8FA] text-[#667085] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#101828]">No candidates match this search</h3>
            <p className="text-xs text-[#667085] max-w-sm mx-auto leading-relaxed">
              Try adjusting your skill filters or location to discover more qualified talent on ABHI JOBS.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-[#0c1f3d] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <StaggerGroup staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map((candidate) => (
              <StaggerItem key={candidate.id}>
                <CandidateCard
                  candidate={candidate}
                  onViewProfile={(c) => setSelectedCandidate(c)}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidate}
        isOpen={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        onInvite={(candId) => {
          const firstJob = jobs.find((j) => j.status === 'published');
          if (firstJob) {
            inviteCandidateToApply(candId, firstJob.id);
          }
        }}
      />
    </div>
  );
};
