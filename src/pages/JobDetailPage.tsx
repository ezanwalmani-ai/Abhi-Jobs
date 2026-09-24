import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ApplyModal } from '../components/ApplyModal';
import { JobCard } from '../components/JobCard';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM } from '../lib/motion';
import {
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Building2,
  ArrowLeft,
  Share2,
  Send,
  ExternalLink,
  Calendar,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface JobDetailPageProps {
  jobId: string;
  navigate: (route: string) => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({ jobId, navigate }) => {
  const { jobs, savedJobIds, saveJob, unsaveJob, currentCandidate, applications, showToast, recordJobView } = useApp();
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const job = jobs.find((j) => j.id === jobId);

  // Automatically record view in recently_viewed_jobs in Supabase backend
  useEffect(() => {
    if (job?.id) {
      recordJobView(job.id);
    }
  }, [job?.id]);

  // Duplicate application detection
  const hasApplied = Boolean(
    job &&
      currentCandidate &&
      applications.some((a) => a.jobId === job.id && a.candidateId === currentCandidate.id)
  );

  if (!job) {
    return (
      <div className="min-h-[70vh] bg-slate-50 py-16 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Opportunity Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested opportunity may have been closed, removed, or is currently unpublished by the administrator.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/jobs')}
              className="px-5 py-2.5 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Jobs</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSaved = savedJobIds.includes(job.id);

  // Match score calculation with candidate skills
  let matchScore: number | null = null;
  let matchingSkills: string[] = [];
  if (
    currentCandidate &&
    Array.isArray(currentCandidate.skills) &&
    currentCandidate.skills.length > 0 &&
    Array.isArray(job?.preferredSkills) &&
    job.preferredSkills.length > 0
  ) {
    matchingSkills = currentCandidate.skills.filter((skill) =>
      typeof skill === 'string' &&
      job.preferredSkills.some((s) => typeof s === 'string' && s.toLowerCase().includes(skill.toLowerCase()))
    );
    if (matchingSkills.length > 0) {
      matchScore = Math.round(
        Math.min(98, 70 + (matchingSkills.length / Math.max(1, job.preferredSkills.length)) * 28)
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
        return `₹${minLakh} Lakh - ₹${maxLakh} Lakh per year`;
      }
      if (job.salary.min) {
        return `From ₹${(job.salary.min / 100000).toFixed(1).replace('.0', '')} Lakh per year`;
      }
      if (job.salary.max) {
        return `Up to ₹${(job.salary.max / 100000).toFixed(1).replace('.0', '')} Lakh per year`;
      }
    }
    if (job.salary.min && job.salary.max) {
      return `$${(job.salary.min / 1000).toFixed(0)}k - $${(job.salary.max / 1000).toFixed(0)}k`;
    }
    return 'Not specified';
  };

  const similarJobs = jobs
    .filter(
      (j) =>
        j.status === 'published' &&
        j.id !== job.id &&
        (j.department === job.department || j.industry === job.industry)
    )
    .slice(0, 3);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('info', 'Link Copied', 'Job opening link copied to clipboard.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Jobs</span>
        </button>

        {/* Main Job Header Card */}
        <ScrollReveal direction="up" distance={16}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-5 min-w-0">
                {job.companyLogo && !logoError ? (
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    onError={() => setLogoError(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#667085]">{job.companyName}</span>
                    {job.isVerifiedCompany && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#004D40]" />
                        Verified Employer
                      </span>
                    )}
                    {job.featured && (
                      <span className="px-2 py-0.5 rounded-md bg-red-50 text-[#FF2B1A] text-xs font-bold border border-red-200">
                        Featured
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#101828] leading-tight">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-[#667085] pt-1">
                    {job.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {job.location} {job.workMode ? `(${job.workMode})` : ''}
                      </span>
                    )}
                    {job.employmentType && (
                      <>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                          {job.employmentType}
                        </span>
                      </>
                    )}
                    <span>&bull;</span>
                    <span className="font-semibold text-[#101828]">
                      {formatSalary()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleShare}
                  className="p-3 rounded-xl border border-[#E4E7EC] hover:bg-[#F7F8FA] text-[#667085] transition-colors cursor-pointer"
                  title="Share Job"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => (isSaved ? unsaveJob(job.id) : saveJob(job.id))}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                    isSaved
                      ? 'border-red-200 bg-red-50 text-[#FF2B1A]'
                      : 'border-[#E4E7EC] hover:bg-[#F7F8FA] text-[#667085]'
                  }`}
                  title={isSaved ? 'Remove from Saved' : 'Save Job'}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#FF2B1A]" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      <span>Save</span>
                    </>
                  )}
                </button>

                {hasApplied ? (
                  <span className="px-5 py-3 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] text-xs sm:text-sm font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#004D40]" />
                    <span>Application Submitted</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setApplyModalOpen(true)}
                    className="px-6 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Apply Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Match Score Banner */}
            {matchScore && (
              <div className="mt-6 p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#004D40] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {matchScore}%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#101828] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#004D40]" />
                      <span>Profile Match Detected</span>
                    </div>
                    <div className="text-xs text-[#004D40] mt-0.5">
                      Your ABHI JOBS profile matches skills required for this opening: {matchingSkills.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#004D40] font-semibold flex items-center gap-3">
                  <span>&bull; Verified Profile Match</span>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Content Layout: Left 2 Cols (Job Content), Right 1 Col (Sidebar info) */}
        <ScrollReveal direction="up" delay={0.06} distance={18}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E7EC] shadow-xs space-y-5">
              {/* Overview */}
              {job.overview && (
                <div>
                  <h2 className="text-base font-bold text-[#101828]">Job Overview</h2>
                  <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mt-2">{job.overview}</p>
                </div>
              )}

              {/* Responsibilities */}
              {Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
                <div className="pt-3 space-y-3">
                  <h3 className="text-sm font-bold text-[#101828]">Key Responsibilities</h3>
                  <ul className="space-y-2.5">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-[#667085] flex items-start gap-2.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF2B1A] shrink-0 mt-2" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                <div className="pt-3 space-y-3">
                  <h3 className="text-sm font-bold text-[#101828]">Qualifications &amp; Requirements</h3>
                  <ul className="space-y-2.5">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-[#667085] flex items-start gap-2.5 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF2B1A] shrink-0 mt-2" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preferred Skills */}
              {Array.isArray(job.preferredSkills) && job.preferredSkills.length > 0 && (
                <div className="pt-3 space-y-2.5">
                  <h3 className="text-sm font-bold text-[#101828]">Required &amp; Preferred Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-lg bg-[#F7F8FA] text-[#101828] border border-[#E4E7EC] text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {Array.isArray(job.benefits) && job.benefits.length > 0 && (
                <div className="pt-3 space-y-3">
                  <h3 className="text-sm font-bold text-[#101828]">Benefits &amp; Perks</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {job.benefits.map((benefit, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] flex items-center gap-2.5 text-xs text-[#101828] font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#004D40] shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Summary Widget */}
            <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#101828] pb-2 border-b border-[#E4E7EC]">Job Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#667085]">Posted Date:</span>
                  <span className="font-semibold text-[#101828]">{job.postedDate || 'Recent'}</span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Application Deadline:</span>
                    <span className="font-semibold text-[#101828]">{job.deadline}</span>
                  </div>
                )}
                {job.department && (
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Department:</span>
                    <span className="font-semibold text-[#101828]">{job.department}</span>
                  </div>
                )}
                {job.experienceLevel && (
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Experience Level:</span>
                    <span className="font-semibold text-[#101828]">
                      {job.experienceLevel}
                      {typeof job.minExperienceYears === 'number' && job.minExperienceYears > 0
                        ? ` (${job.minExperienceYears}+ yrs)`
                        : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#667085]">Employment Type:</span>
                  <span className="font-semibold text-[#101828]">{job.employmentType || 'Full-time'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Work Mode:</span>
                  <span className="font-semibold text-[#101828]">{job.workMode || 'Remote'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Salary:</span>
                  <span className="font-semibold text-[#101828]">{formatSalary()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Total Applicants:</span>
                  <span className="font-semibold text-[#004D40]">{job.applicantsCount} applied</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4E7EC]">
                {hasApplied ? (
                  <div className="w-full py-3 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] text-xs font-bold text-center flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-[#004D40]" />
                    <span>Application Submitted</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setApplyModalOpen(true)}
                    className="w-full py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Apply Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* About Company Widget */}
            <div className="bg-white rounded-3xl p-6 border border-[#E4E7EC] shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                {job.companyLogo && !logoError ? (
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    onError={() => setLogoError(true)}
                    className="w-10 h-10 rounded-xl object-cover border border-[#E4E7EC]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-[#E4E7EC] flex items-center justify-center text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-[#101828]">{job.companyName}</h4>
                  <p className="text-[11px] text-[#667085]">{job.industry || 'Technology & Services'}</p>
                </div>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed pt-1">
                Verified hiring partner with authenticated recruiter credentials on the ABHI JOBS talent network.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/companies')}
                  className="text-xs font-semibold text-[#004D40] hover:text-[#061226] flex items-center gap-1 cursor-pointer"
                >
                  <span>View Verified Companies</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        </ScrollReveal>

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <ScrollReveal direction="up" delay={0.1}>
            <div className="pt-10 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Similar Verified Opportunities</h3>
              <StaggerGroup staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {similarJobs.map((sj) => (
                  <StaggerItem key={sj.id}>
                    <JobCard
                      job={sj}
                      onApply={() => {
                        setApplyModalOpen(true);
                      }}
                      onViewDetails={(id) => navigate(`/jobs/${id}`)}
                    />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Apply Modal */}
      <ApplyModal
        job={job}
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        navigate={navigate}
      />
    </div>
  );
};

