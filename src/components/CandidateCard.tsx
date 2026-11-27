import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateProfile } from '../types';
import { useApp } from '../context/AppContext';
import { EASE_PREMIUM } from '../lib/motion';
import {
  MapPin,
  Briefcase,
  Sparkles,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import { VerifiedSkillIcon } from './brand/BrandIcons';

interface CandidateCardProps {
  candidate: CandidateProfile;
  onViewProfile: (candidate: CandidateProfile) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onViewProfile }) => {
  const { jobs, inviteCandidateToApply, currentRole } = useApp();
  const [inviteJobId, setInviteJobId] = useState<string>('');
  const [showInviteMenu, setShowInviteMenu] = useState(false);

  const activeJobs = jobs.filter((j) => j.status === 'published');

  const handleInvite = () => {
    if (!inviteJobId) return;
    inviteCandidateToApply(candidate.id, inviteJobId);
    setShowInviteMenu(false);
    setInviteJobId('');
  };

  return (
    <div className="group bg-white rounded-2xl border border-[#E5EAF0] hover:border-slate-300 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 md:hover:-translate-y-1 flex flex-col justify-between">
      <div>
        {/* Top profile banner */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 overflow-hidden rounded-2xl">
            {candidate.avatar ? (
              <img
                src={candidate.avatar}
                alt={candidate.name}
                className="w-14 h-14 rounded-2xl object-cover border border-[#E5EAF0] shadow-xs group-hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                loading="lazy"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#102B4E] to-[#0B192C] text-white border border-[#102B4E] flex flex-col items-center justify-center font-bold text-base relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                <span className="relative z-10 font-sora">{candidate.name.charAt(0)}</span>
                <div className="absolute -bottom-1 -right-1 opacity-20">
                  <VerifiedSkillIcon size={28} colorMode="white" />
                </div>
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                candidate.availableForOpportunities ? 'bg-[#102B4E]' : 'bg-slate-400'
              }`}
              title={candidate.availableForOpportunities ? 'Available immediately' : 'Not actively looking'}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                onClick={() => onViewProfile(candidate)}
                className="text-base font-bold text-[#101828] hover:text-[#102B4E] transition-colors cursor-pointer"
              >
                {candidate.name}
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#F1F5FA] text-[#102B4E] text-[10px] font-bold border border-[#D4DCE6]/70">
                <ShieldCheck className="w-3 h-3 text-[#102B4E]" />
                ABHI JOBS Verified
              </span>
            </div>

            <p className="text-xs text-[#667085] line-clamp-1 mt-0.5">{candidate.headline}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#667085] mt-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{candidate.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>{candidate.yearsOfExperience} yrs exp &bull; {candidate.experienceLevel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[#102B4E] font-semibold">{candidate.availability}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio excerpt */}
        {candidate.about && (
          <p className="text-xs text-[#667085] line-clamp-2 mt-3 leading-relaxed">
            {candidate.about}
          </p>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {(candidate.skills || []).slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] text-[#101828] text-[11px] font-medium border border-[#E5EAF0]"
            >
              {skill}
            </span>
          ))}
          {(candidate.skills || []).length > 5 && (
            <span className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] text-[#667085] text-[11px] border border-[#E5EAF0]">
              +{(candidate.skills || []).length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-5 border-t border-[#E5EAF0] flex items-center justify-between gap-2 relative">
        <button
          onClick={() => onViewProfile(candidate)}
          className="text-xs font-semibold text-[#101828] hover:text-[#F47A24] transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>View Profile</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Invite to Apply (for employers) */}
        <div className="relative">
          <button
            onClick={() => setShowInviteMenu(!showInviteMenu)}
            className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#F47A24] text-xs font-semibold border border-red-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3 h-3 text-[#F47A24]" />
            <span>Invite to Apply</span>
          </button>

          <AnimatePresence>
            {showInviteMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                className="absolute right-0 bottom-10 w-64 bg-white rounded-2xl shadow-xl border border-[#E5EAF0] p-3.5 z-30"
              >
                <div className="text-xs font-bold text-[#101828] mb-2">Select Active Job Opening:</div>
                {activeJobs.length === 0 ? (
                  <div className="text-xs text-[#667085]">No active job listings found.</div>
                ) : (
                  <div className="space-y-2.5">
                    <select
                      value={inviteJobId}
                      onChange={(e) => setInviteJobId(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-[#D4DCE6] bg-white focus:outline-hidden focus:border-[#102B4E]"
                    >
                      <option value="">Select a job...</option>
                      {activeJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.companyName})
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowInviteMenu(false)}
                        className="px-2.5 py-1.5 text-xs text-[#667085] hover:bg-[#F7F8FA] rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleInvite}
                        disabled={!inviteJobId}
                        className="px-3.5 py-1.5 text-xs font-bold bg-[#F47A24] hover:bg-[#DE6816] text-white rounded-xl disabled:opacity-50 cursor-pointer shadow-xs transition-colors"
                      >
                        Send Invite
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
