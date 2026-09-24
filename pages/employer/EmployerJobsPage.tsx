import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Job } from '../../types';
import { Briefcase, PlusCircle, Building2, Users, Clock, ShieldCheck, ArrowRight, Eye, MoreVertical } from 'lucide-react';

interface EmployerJobsPageProps {
  navigate: (route: string) => void;
}

export const EmployerJobsPage: React.FC<EmployerJobsPageProps> = ({ navigate }) => {
  const { jobs, applications, updateJobStatus, currentEmployer } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const employerJobs = jobs; // Filter or view employer's jobs

  const filteredJobs = employerJobs.filter((job) => {
    if (filterStatus !== 'All' && job.status !== filterStatus) return false;
    return true;
  });

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
              Manage Jobs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active openings, applicant pipelines, and publishing controls for {currentEmployer?.companyName || 'your organization'}.
            </p>
          </div>

          <button
            onClick={() => navigate('/employer/post-job')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post a New Job</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            {['All', 'published', 'paused', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#061226] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st === 'All' ? 'All Listings' : st}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredJobs.length} openings
          </span>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No jobs posted yet.</p>
              <p className="text-xs text-slate-500">Post a new position or adjust the status filter above.</p>
              <button
                onClick={() => navigate('/employer/post-job')}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-[#e02213] transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Your First Job Posting</span>
              </button>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const applicantsForJob = applications.filter((a) => a.jobId === job.id);

              return (
                <div
                  key={job.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold capitalize border ${
                          job.status === 'published'
                            ? 'bg-teal-50 text-[#004D40] border-teal-200'
                            : job.status === 'paused'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{job.department}</span>
                      <span>&bull;</span>
                      <span>{job.location} ({job.workMode || 'On-site'})</span>
                      <span>&bull;</span>
                      <span>Posted on {job.postedDate}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(job.preferredSkills || (job as any).requiredSkills || []).slice(0, 4).map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 justify-end">
                        <Users className="w-3.5 h-3.5 text-[#004D40]" />
                        <span>{applicantsForJob.length} Applicants</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {applicantsForJob.filter((a) => a.status === 'shortlisted').length} shortlisted
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="View Public Listing"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate('/employer/dashboard')}
                        className="px-3.5 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Review Applicants
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
