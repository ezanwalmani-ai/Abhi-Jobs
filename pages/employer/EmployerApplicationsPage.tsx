import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Application, ApplicationStatus, CandidateProfile } from '../../types';
import { ScheduleInterviewModal } from '../../components/ScheduleInterviewModal';
import { CandidateProfileModal } from '../../components/CandidateProfileModal';
import { Users, Building2, Calendar, Clock, CheckCircle2, ChevronRight, Filter, Search, ShieldCheck } from 'lucide-react';

interface EmployerApplicationsPageProps {
  navigate: (route: string) => void;
}

export const EmployerApplicationsPage: React.FC<EmployerApplicationsPageProps> = ({ navigate }) => {
  const { applications, updateApplicationStatus, candidates, jobs } = useApp();
  const [filterJobId, setFilterJobId] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState<Application | null>(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<CandidateProfile | null>(null);

  const filteredApps = applications.filter((app) => {
    if (filterJobId !== 'All' && app.jobId !== filterJobId) return false;
    if (filterStatus !== 'All' && app.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return app.candidateName.toLowerCase().includes(q) || app.jobTitle.toLowerCase().includes(q);
    }
    return true;
  });

  const statusOptions: { value: string; label: string }[] = [
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5 text-slate-700" />
              <span>Employer Journey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Candidate Applications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review received resumes, evaluate verified skill scores, and update candidate hiring stages.
            </p>
          </div>

          <button
            onClick={() => navigate('/candidates')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Users className="w-4 h-4" />
            <span>Search Talent Pool</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or role..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={filterJobId}
              onChange={(e) => setFilterJobId(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="All">All Job Positions</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 text-slate-700 focus:outline-hidden cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No applications received yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Candidate submissions for your open positions will appear here once job seekers apply.
              </p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">
              No applications match your filter criteria.
            </div>
          ) : (
            filteredApps.map((app) => {
              const matchedCandidate = candidates.find((c) => c.id === app.candidateId);

              return (
                <div
                  key={app.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => matchedCandidate && setSelectedCandidateForProfile(matchedCandidate)}
                        className="text-left font-bold text-slate-900 text-base hover:text-[#FF2B1A] transition-colors cursor-pointer"
                      >
                        {app.candidateName}
                      </button>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-[#004D40] border border-teal-200">
                        {app.matchScore}% Verified Match
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="text-slate-700 font-medium">Applied for: {app.jobTitle}</span>
                      <span>&bull;</span>
                      <span>Submitted on {app.appliedDate}</span>
                    </div>

                    {Array.isArray(app.skillsMatched) && app.skillsMatched.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.skillsMatched.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                    <select
                      value={app.status}
                      onChange={(e) => updateApplicationStatus(app.id, e.target.value as ApplicationStatus)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
                    >
                      <option value="applied">Applied</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview_scheduled">Interview</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <button
                      onClick={() => setSelectedAppForSchedule(app)}
                      className="px-3 py-1.5 rounded-lg bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Interview</span>
                    </button>
                  </div>
                </div>
              );
            })
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
    </div>
  );
};
