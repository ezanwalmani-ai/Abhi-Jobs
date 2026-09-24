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
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 border border-[#E4E7EC] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px] sm:max-w-[200px]">
                  {job.companyName || 'Company'}
                </span>
                {job.isVerifiedCompany && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-teal-50 text-[#004D40] text-[10px] font-bold border border-teal-200/60">
                    <CheckCircle2 className="w-3 h-3 text-[#004D40]" />
                    Verified
                  </span>
                )}
                {job.featured && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                    Featured
                  </span>
                )}
              </div>
              <h3
                onClick={() => onViewDetails(job.id)}
                className="text-base sm:text-lg font-bold text-[#101828] group-hover:text-[#FF2B1A] transition-colors mt-0.5 cursor-pointer leading-snug line-clamp-1"
                title={job.title}
              >
                {job.title}
              </h3>
            </div>
          </div>

          {/* Save Job button with subtle scale interaction */}
          <button
            onClick={() => (isSaved ? unsaveJob(job.id) : saveJob(job.id))}
            className={`p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 flex items-center gap-1 text-xs font-semibold ${
              isSaved
                ? 'bg-red-50 text-[#FF2B1A] border border-red-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent'
            }`}
            title={isSaved ? 'Job Saved — Click to remove' : 'Save Job for later'}
            aria-label={isSaved ? 'Saved Job' : 'Save Job'}
          >
            <motion.span
              key={isSaved ? 'saved' : 'unsaved'}
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.9, 1.05, 1] }}
              transition={{ duration: 0.3, ease: EASE_PREMIUM }}
              className="inline-flex items-center gap-1"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-[#FF2B1A]" />
                  <span className="hidden sm:inline text-[11px] font-bold text-[#FF2B1A]">Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px] text-slate-500">Save</span>
                </>
              )}
            </motion.span>
          </button>
        </div>

        {/* Metadata items */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-3.5 text-xs text-[#667085] mt-3.5">
          {job.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{job.location}</span>
            </div>
          )}
          {(job.employmentType || job.workMode) && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {[job.employmentType, job.workMode].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}
          {job.experienceLevel && (
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#101828] text-[10px] font-semibold border border-slate-200/60">
                {job.experienceLevel}
                {typeof job.minExperienceYears === 'number' && job.minExperienceYears > 0
                  ? ` (${job.minExperienceYears}+ yrs)`
                  : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 font-semibold text-[#101828]">
            <span className="text-[#667085] font-normal">Salary:</span>
            <span>{formatSalary()}</span>
          </div>
          {job.deadline && (
            <div className="flex items-center gap-1 text-[#667085] text-[11px]">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Deadline: {job.deadline}</span>
            </div>
          )}
        </div>

        {/* Short description */}
        {job.overview && (
          <p className="text-xs text-[#667085] line-clamp-2 mt-3 leading-relaxed">
            {job.overview}
          </p>
        )}

        {/* Skills Pills */}
        {Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {job.preferredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] text-[#101828] text-[11px] font-medium border border-[#E4E7EC]"
              >
                {skill}
              </span>
            ))}
            {job.preferredSkills.length > 4 && (
              <span className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] text-[#667085] text-[11px] border border-[#E4E7EC]">
                +{job.preferredSkills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Match Score & Action Buttons */}
      <div className="pt-4 mt-4 border-t border-[#E4E7EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {matchScore ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-teal-50 border border-teal-200/60 text-[#004D40]">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40] shrink-0" />
              <span className="text-xs font-bold">{matchScore}% Match</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-[#667085]">
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>Posted {job.postedDate || 'recently'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(job.id)}
            iconLeft={<Eye className="w-3.5 h-3.5 text-[#667085]" />}
            className="flex-1 sm:flex-none min-h-[38px]"
            title="View complete job posting"
          >
            View Job
          </Button>

          {hasApplied ? (
            <span className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] text-xs font-bold inline-flex items-center justify-center gap-1.5 min-h-[38px]">
              <Check className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Already Applied</span>
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

