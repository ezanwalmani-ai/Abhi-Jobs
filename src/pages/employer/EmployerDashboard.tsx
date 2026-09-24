import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, StaggerGroup, StaggerItem, CountUpNumber, EASE_PREMIUM } from '../../lib/motion';
import { useApp } from '../../context/AppContext';
import { Application, Job, CandidateProfile } from '../../types';
import { ScheduleInterviewModal } from '../../components/ScheduleInterviewModal';
import { CandidateProfileModal } from '../../components/CandidateProfileModal';
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Clock,
  Sparkles,
  FileText,
  Video,
  Download,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface EmployerDashboardProps {
  navigate: (route: string) => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ navigate }) => {
  const {
    jobs,
    applications,
    updateApplicationStatus,
    candidates,
    interviews,
    currentEmployer,
    currentUser,
    currentRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'applicants' | 'jobs' | 'interviews'>('applicants');
  const [filterJobId, setFilterJobId] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Modals
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState<Application | null>(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<CandidateProfile | null>(null);

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (filterJobId !== 'All' && app.jobId !== filterJobId) return false;
    if (filterStatus !== 'All' && app.status !== filterStatus) return false;
    return true;
  });

  const employerJobs = jobs; // Filtered to current organization
  const orgName = currentEmployer?.companyName || currentEmployer?.name || currentUser?.name || 'Partner Organization';

  const statusOptions = [
    { value: 'All', label: 'All Statuses' },
    { value: 'applied', label: 'Applied' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview_scheduled', label: 'Interview Scheduled' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-[#061226] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-[11px] font-bold text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Employer Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mt-2">{orgName} &bull; Recruitment Hub</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Manage open positions, review verified candidates, and organize interview stages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/candidates')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold backdrop-blur-sm transition-colors cursor-pointer"
            >
              Search Talent Directory
            </button>
            <button
              onClick={() => navigate('/employer/post-job')}
              className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Job</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <StaggerGroup staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Job Listings</span>
                <Briefcase className="w-4 h-4 text-[#004D40]" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                <CountUpNumber target={employerJobs.filter((j) => j.status === 'published').length} duration={800} />
              </div>
              <div className="text-[11px] text-[#004D40] mt-1 font-medium">Published &amp; hiring</div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Applicants</span>
                <Users className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                <CountUpNumber target={applications.length} duration={800} />
              </div>
              <div className="text-[11px] text-blue-700 mt-1 font-medium">Verified candidate profiles</div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Scheduled Interviews</span>
                <Calendar className="w-4 h-4 text-purple-700" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                <CountUpNumber target={interviews.length} duration={800} />
              </div>
              <div className="text-[11px] text-purple-700 mt-1 font-medium">Synced with Google Meet</div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg. Match Score</span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                <CountUpNumber target={92} suffix="%" duration={900} />
              </div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">Skill-qualified talent</div>
            </motion.div>
          </StaggerItem>
        </StaggerGroup>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'applicants'
                ? 'bg-[#061226] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Candidate Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'jobs'
                ? 'bg-[#061226] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            My Job Postings ({employerJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'interviews'
                ? 'bg-[#061226] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Interview Calendar ({interviews.length})
          </button>
        </div>

        {/* TAB 1: APPLICANTS PIPELINE */}
        {activeTab === 'applicants' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Job:</span>
                  <select
                    value={filterJobId}
                    onChange={(e) => setFilterJobId(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    <option value="All">All Jobs</option>
                    {employerJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Stage:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing {filteredApps.length} applicant{filteredApps.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Applications List */}
            {filteredApps.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                No candidate applications match this criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredApps.map((app) => {
                  const candidate = candidates.find((c) => c.id === app.candidateId);

                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all"
                    >
                      {/* Left info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3
                            onClick={() => candidate && setSelectedCandidateForProfile(candidate)}
                            className="text-base font-bold text-slate-900 hover:text-[#004D40] transition-colors cursor-pointer"
                          >
                            {app.candidateName}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] text-[11px] font-bold border border-teal-200">
                            <Sparkles className="w-3 h-3 text-[#004D40]" />
                            {app.matchScore}% Match
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-slate-800">{app.jobTitle}</span>
                          <span>&bull;</span>
                          <span>Applied on {app.appliedDate}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <FileText className="w-3.5 h-3.5" />
                            {app.resumeName}
                          </span>
                        </div>

                        {app.coverNote && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-2xl leading-relaxed">
                            &ldquo;{app.coverNote}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Right: Actions & Status dropdown */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-auto">
                        {candidate && (
                          <button
                            onClick={() => setSelectedCandidateForProfile(candidate)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            View Profile
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedAppForSchedule(app)}
                          className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5 text-purple-700" />
                          <span>Schedule Interview</span>
                        </button>

                        {/* Status Select */}
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value as any)}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden cursor-pointer"
                        >
                          <option value="applied">Applied</option>
                          <option value="under_review">Under Review</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview_scheduled">Interview Scheduled</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY JOB OPENINGS */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {employerJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employerJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#004D40] uppercase tracking-wider">{job.department}</span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{job.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{job.location} &bull; {job.workMode}</p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          job.status === 'published'
                            ? 'bg-teal-50 text-[#004D40] border border-teal-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{job.applicantsCount} Applicants</span>
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="text-[#004D40] hover:text-[#061226] font-bold"
                      >
                        View Posting
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-xs text-slate-500 space-y-3">
                <Briefcase className="w-10 h-10 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">No opportunities posted yet</h4>
                <p className="text-slate-500 max-w-sm mx-auto">
                  You haven't posted any job openings. Publish your first opening to attract skill-verified applicants.
                </p>
                <button
                  onClick={() => navigate('/employer/post-job')}
                  className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-bold cursor-pointer transition-colors"
                >
                  + Post New Job
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INTERVIEW CALENDAR */}
        {activeTab === 'interviews' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Upcoming Candidate Interviews</h3>
            {interviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No interviews currently scheduled.</p>
            ) : (
              <div className="space-y-3">
                {interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{iv.candidateName}</h4>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                          {iv.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">{iv.jobTitle}</div>
                      <div className="text-xs text-purple-900 font-semibold mt-1">
                        {iv.scheduledDate} at {iv.scheduledTime}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {iv.meetingLink && (
                        <a
                          href={iv.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        application={selectedAppForSchedule}
        isOpen={Boolean(selectedAppForSchedule)}
        onClose={() => setSelectedAppForSchedule(null)}
      />

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        candidate={selectedCandidateForProfile}
        isOpen={Boolean(selectedCandidateForProfile)}
        onClose={() => setSelectedCandidateForProfile(null)}
      />
    </div>
  );
};
