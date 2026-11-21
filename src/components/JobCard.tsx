import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Job } from '../types';
import { useApp } from '../context/AppContext';
import { Button } from './ui/Button';
import { EASE_PREMIUM } from '../lib/motion';
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
    <div className="group relative bg-white rounded-2xl border border-[#E4E7EC] hover:border-slate-300 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 md:hover:-translate-y-1 flex flex-col justify-between">
      {/* Top Header: Logo, Company, Title, Save */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {job.companyLogo && !logoError ? (
              <img
                src={job.companyLogo}
                alt={job.companyName || 'Company'}
                onError={() => setLogoError(true)}
                className="w-12 h-12 rounded-xl object-cover border border-[#E4E7EC] shadow-2xs shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[#061226]/5 border border-[#E4E7EC] flex items-center justify-center shrink-0">
                <EnterpriseMonolithIcon size={24} colorMode="palette" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap text-xs text-[#778397]">
                <span className="font-semibold text-[#253449] truncate max-w-[180px] sm:max-w-[220px]">
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
                className="font-display text-base sm:text-lg font-bold text-[#102B4E] group-hover:text-[#F47A24] transition-colors mt-0.5 cursor-pointer leading-snug line-clamp-1"
                title={job.title}
              >
                {job.title}
              </h3>
            </div>
          </div>

          {/* Save Job button */}
          <button
            onClick={() => (isSaved ? unsaveJob(job.id) : saveJob(job.id))}
            className={`p-2 rounded-lg transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold ${
              isSaved
                ? 'bg-[#FFF4EC] text-[#F47A24] border border-[#F47A24]/30'
                : 'text-[#778397] hover:text-[#102B4E] hover:bg-[#F6F8FB] border border-transparent'
            }`}
            title={isSaved ? 'Job Saved — Click to remove' : 'Save Job for later'}
            aria-label={isSaved ? 'Saved Job' : 'Save Job'}
          >
            <motion.span
              key={isSaved ? 'saved' : 'unsaved'}
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2, ease: EASE_PREMIUM }}
              className="inline-flex items-center gap-1"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-[#F47A24]" />
                  <span className="hidden sm:inline text-[11px] font-semibold text-[#F47A24]">Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Save</span>
                </>
              )}
            </motion.span>
          </button>
        </div>

        {/* Clean Metadata items */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-[#778397] mt-3.5">
          {job.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#102B4E]/50 shrink-0" />
              <span>{job.location}</span>
            </div>
          )}
          {(job.employmentType || job.workMode) && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#102B4E]/50 shrink-0" />
              <span>{[job.employmentType, job.workMode].filter(Boolean).join(' · ')}</span>
            </div>
          )}
          {job.experienceLevel && (
            <div className="font-medium text-[#253449]">
              {job.experienceLevel}
              {typeof job.minExperienceYears === 'number' && job.minExperienceYears > 0
                ? ` (${job.minExperienceYears}+ yrs)`
                : ''}
            </div>
          )}
          <div className="flex items-center gap-1 font-semibold text-[#102B4E]">
            <span className="text-[#778397] font-normal">Salary:</span>
            <span>{formatSalary()}</span>
          </div>
        </div>

        {/* Short description */}
        {job.overview && (
          <p className="text-xs text-[#778397] line-clamp-2 mt-3 leading-relaxed">
            {job.overview}
          </p>
        )}

        {/* Skills text line */}
        {Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3.5 text-[11px] text-[#253449]">
            <span className="text-[#778397] font-medium">Skills:</span>
            {job.preferredSkills.slice(0, 4).map((skill, idx) => (
              <React.Fragment key={skill}>
                {idx > 0 && <span className="text-[#E5EAF0]">•</span>}
                <span className="font-medium">{skill}</span>
              </React.Fragment>
            ))}
            {job.preferredSkills.length > 4 && (
              <span className="text-[#778397]">+{job.preferredSkills.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-4 mt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#778397]">
          <Clock className="w-3.5 h-3.5 shrink-0 text-[#102B4E]/50" />
          <span>Posted {job.postedDate || 'recently'}</span>
          {matchScore && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#102B4E]">{matchScore}% Profile Match</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(job.id)}
            iconLeft={<Eye className="w-3.5 h-3.5 text-[#778397]" />}
            className="flex-1 sm:flex-none min-h-[38px]"
            title="View complete job details"
          >
            View Details
          </Button>

          {hasApplied ? (
            <span className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 min-h-[38px]">
              <Check className="w-3.5 h-3.5" />
              <span>Applied</span>
            </span>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onApply(job)}
              iconRight={<ArrowRight className="w-3.5 h-3.5" />}
              className="flex-1 sm:flex-none min-h-[38px]"
              title="Apply for this opportunity"
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

