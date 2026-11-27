import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import { useApp } from '../context/AppContext';
import { Button } from './ui/Button';
import { EASE_PREMIUM, AnimatedTextSwap } from '../lib/motion';
import {
  MapPin,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Building2,
  Calendar,
  Eye,
  Check,
} from 'lucide-react';
import { EnterpriseMonolithIcon } from './brand/BrandIcons';

interface JobCardProps {
  job: Job;
  onApply: (job: Job) => void;
  onViewDetails: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onViewDetails }) => {
  const { savedJobIds, saveJob, unsaveJob, currentCandidate, applications } = useApp();
  const [logoError, setLogoError] = useState(false);
  const isSaved = savedJobIds.includes(job.id);

  // Duplicate application detection
  const hasApplied = Boolean(
    currentCandidate &&
      applications.some(
        (a) => a.jobId === job.id && a.candidateId === currentCandidate.id
      )
  );

  // Calculate Match Score with candidate skills if profile exists
  let matchScore: number | null = null;
  if (
    currentCandidate &&
    Array.isArray(currentCandidate.skills) &&
    currentCandidate.skills.length > 0 &&
    Array.isArray(job?.preferredSkills) &&
    job.preferredSkills.length > 0
  ) {
    const matchingCount = currentCandidate.skills.filter((skill) =>
      typeof skill === 'string' &&
      job.preferredSkills.some(
        (s) => typeof s === 'string' && s.toLowerCase().includes(skill.toLowerCase())
      )
    ).length;

    if (matchingCount > 0) {
      matchScore = Math.round(
        Math.min(98, 70 + (matchingCount / Math.max(1, job.preferredSkills.length)) * 28)
      );
    }
  }

  const formatSalary = () => {
    if (!job.salary || (!job.salary.min && !job.salary.max)) {
      return 'Not specified';
    }
    const currency = job.salary.currency || 'INR';
    if (currency === 'INR') {
      if (job.salary.min && job.salary.max) {
        const minLakh = (job.salary.min / 100000).toFixed(1).replace('.0', '');
        const maxLakh = (job.salary.max / 100000).toFixed(1).replace('.0', '');
        return `₹${minLakh}L - ₹${maxLakh}L / yr`;
      }
      if (job.salary.min) {
        return `From ₹${(job.salary.min / 100000).toFixed(1).replace('.0', '')}L / yr`;
      }
      if (job.salary.max) {
        return `Up to ₹${(job.salary.max / 100000).toFixed(1).replace('.0', '')}L / yr`;
      }
    }
    if (job.salary.min && job.salary.max) {
      return `$${(job.salary.min / 1000).toFixed(0)}k - $${(job.salary.max / 1000).toFixed(0)}k`;
    }
    return 'Not specified';
  };

  return (
    <div className="group relative bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/35 p-5 sm:p-6 shadow-[0_1px_2px_rgba(16,43,78,0.03)] hover:shadow-[0_6px_20px_-10px_rgba(16,43,78,0.14)] transition-all duration-200 flex flex-col justify-between">
      {/* Top Header: Logo, Company, Title, Save */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {job.companyLogo && !logoError ? (
              <img
                src={job.companyLogo}
                alt={job.companyName || 'Company'}
                onError={() => setLogoError(true)}
                className="w-11 h-11 rounded-lg object-cover border border-[#E5EAF0] shadow-2xs shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg bg-[#F1F5FA] border border-[#E5EAF0] flex items-center justify-center shrink-0">
                <EnterpriseMonolithIcon size={22} colorMode="palette" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs text-[#64748B]">
                <span className="font-semibold text-[#1E293B] truncate max-w-[180px] sm:max-w-[220px]">
                  {job.companyName || 'Company'}
                </span>
                {job.isVerifiedCompany && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#102B4E] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#F47A24]" />
                      Verified Mandate
                    </span>
                  </>
                )}
              </div>
              <h3
                onClick={() => onViewDetails(job.id)}
                className="font-display text-[17px] sm:text-[18px] font-semibold text-[#102B4E] group-hover:text-[#F47A24] transition-colors mt-1 cursor-pointer leading-snug tracking-[-0.01em] line-clamp-1"
                title={job.title}
              >
                {job.title}
              </h3>
            </div>
          </div>

          {/* Save Job button with immediate tactile confirmation */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => (isSaved ? unsaveJob(job.id) : saveJob(job.id))}
            className={`relative px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-semibold overflow-visible ${
              isSaved
                ? 'bg-[#FFF4EC] text-[#F47A24] border border-[#F47A24]/35'
                : 'text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] border border-transparent hover:border-[#E5EAF0]'
            }`}
            title={isSaved ? 'Job Saved — Click to remove' : 'Save Job for later'}
            aria-label={isSaved ? 'Saved Job' : 'Save Job'}
            aria-pressed={isSaved}
          >
            <AnimatePresence>
              {isSaved && (
                <motion.span
                  key="save-ring"
                  aria-hidden="true"
                  initial={{ scale: 0.7, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_PREMIUM }}
                  className="pointer-events-none absolute inset-0 rounded-lg border border-[#F47A24]"
                />
              )}
            </AnimatePresence>

            <motion.span
              key={isSaved ? 'saved-icon' : 'unsaved-icon'}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 24 }}
              className="inline-flex items-center"
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4 text-[#F47A24]" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </motion.span>
            <AnimatedTextSwap
              stateKey={isSaved ? 'saved' : 'save'}
              className="hidden sm:inline-flex text-[11px]"
            >
              {isSaved ? (
                <span className="font-semibold text-[#F47A24]">Saved</span>
              ) : (
                <span>Save</span>
              )}
            </AnimatedTextSwap>
          </motion.button>
        </div>

        {/* Clean Metadata items */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[13px] text-[#475569] mt-4">
          {job.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span>{job.location}</span>
            </div>
          )}
          {(job.employmentType || job.workMode) && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              <span>{[job.employmentType, job.workMode].filter(Boolean).join(' · ')}</span>
            </div>
          )}
          {job.experienceLevel && (
            <div className="font-medium text-[#1E293B]">
              {job.experienceLevel}
              {typeof job.minExperienceYears === 'number' && job.minExperienceYears > 0
                ? ` (${job.minExperienceYears}+ yrs)`
                : ''}
            </div>
          )}
          <div className="flex items-center gap-1 font-semibold text-[#102B4E] tabular-nums">
            <span className="text-[#64748B] font-normal">Salary:</span>
            <span>{formatSalary()}</span>
          </div>
        </div>

        {/* Short description */}
        {job.overview && (
          <p className="text-[13px] text-[#475569] line-clamp-2 mt-3 leading-relaxed">
            {job.overview}
          </p>
        )}

        {/* Skills text line */}
        {Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3.5 text-xs text-[#1E293B]">
            <span className="text-[#64748B] font-medium">Skills:</span>
            {job.preferredSkills.slice(0, 4).map((skill, idx) => (
              <React.Fragment key={skill}>
                {idx > 0 && <span className="text-[#CBD5E1]">·</span>}
                <span className="font-medium">{skill}</span>
              </React.Fragment>
            ))}
            {job.preferredSkills.length > 4 && (
              <span className="text-[#64748B]">+{job.preferredSkills.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-4 mt-5 border-t border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
          <span>Posted {job.postedDate || 'recently'}</span>
          {matchScore && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#102B4E] tabular-nums">{matchScore}% Profile Match</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(job.id)}
            iconLeft={<Eye className="w-3.5 h-3.5 text-[#64748B]" />}
            className="flex-1 sm:flex-none min-h-[38px]"
            title="View complete job details"
          >
            View Details
          </Button>

          <AnimatePresence mode="wait" initial={false}>
            {hasApplied ? (
              <motion.span
                key="applied-state"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 min-h-[38px]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Applied</span>
              </motion.span>
            ) : (
              <motion.div
                key="apply-cta"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 sm:flex-none"
              >
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onApply(job)}
                  iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                  className="w-full min-h-[38px]"
                  title="Apply for this opportunity"
                >
                  Apply Now
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

