import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  PauseCircle,
  Lock,
  MessageSquarePlus,
  CalendarPlus,
  Loader2,
  X,
} from 'lucide-react';
import { AdminDataTable, type AdminColumn } from '../AdminDataTable';
import {
  deleteJobAdminFromFirestore,
  type AdminUserRecord,
  type Application,
  type CandidateProfile,
  type EmployerProfile,
  type HiringEnquiry,
  type Interview,
  type Job,
} from '../../../services/adminPanelService';
import { CANDIDATE_ID_LABEL, isValidCandidateCode } from '../../../services/candidateIdService';
import {
  saveJobToFirestore,
  updateJobModerationInFirestore,
  updateApplicationStatusInFirestore,
  listApplicationInternalNotes,
  addApplicationInternalNote,
  scheduleInterviewInFirestore,
  updateHiringEnquiryAdminInFirestore,
} from '../../../services/recruitmentFirestoreService';
import type { ApplicationStatus, InternalNote } from '../../../types';
import type { AdminModuleId } from '../adminNavConfig';
import type { ResolvedAdminSession } from '../../../services/adminRbacService';
import type { AdminConfirmDialogProps } from '../AdminConfirmDialog';

export interface RecruitmentSectionProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  jobs: Job[];
  employers: EmployerProfile[];
  applications: Application[];
  interviews: Interview[];
  hiringEnquiries: HiringEnquiry[];
  candidates?: CandidateProfile[];
  users?: AdminUserRecord[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onInspectRecord: (title: string, subtitle: string, record: Record<string, unknown>) => void;
  onRequestConfirm: (
    config: Omit<AdminConfirmDialogProps, 'isOpen' | 'busy' | 'onCancel'>
  ) => void;
}

const APPLICATION_STAGES: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview',
  'Interview Scheduled',
  'Selected',
  'Rejected',
  'Not Selected',
  'Withdrawn',
];

export const RecruitmentSection: React.FC<RecruitmentSectionProps> = ({
  activeModule,
  adminSession,
  jobs,
  employers,
  applications,
  interviews,
  hiringEnquiries,
  candidates = [],
  users = [],
  loading,
  onRefresh,
  onNotify,
  onInspectRecord,
  onRequestConfirm,
}) => {
  const candidateCodeByUid = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      if (isValidCandidateCode(u.candidateCode)) {
        map.set(u.id, u.candidateCode.trim());
      }
    }
    for (const c of candidates) {
      if (isValidCandidateCode(c.candidateCode)) {
        map.set(c.userId || c.id, c.candidateCode.trim());
      }
    }
    return map;
  }, [candidates, users]);

  const resolveAppCandidateCode = (app: Application): string | undefined => {
    if (isValidCandidateCode(app.candidateCode)) return app.candidateCode.trim();
    return candidateCodeByUid.get(app.candidateId);
  };
  const canManageJobs = Boolean(adminSession.permissions?.canManageJobs);
  const canManageApps = Boolean(adminSession.permissions?.canManageApplications);
  const canManageEnquiries = Boolean(adminSession.permissions?.canManageHiringEnquiries);
  const canExportCsv = Boolean(adminSession.permissions?.canExportCsv);

  const handleCsvExported = (rowCount: number, filename: string) => {
    onNotify(
      'success',
      'CSV Export Downloaded',
      `Exported ${rowCount} visible ${rowCount === 1 ? 'record' : 'records'} to ${filename}.`
    );
  };

  // Create / Edit Job Modal
  const [showJobForm, setShowJobForm] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobEmployerId, setJobEmployerId] = useState('');
  const [jobLocation, setJobLocation] = useState('Bengaluru, India');
  const [jobDepartment, setJobDepartment] = useState('Engineering');
  const [jobIndustry, setJobIndustry] = useState('Technology');
  const [jobStatus, setJobStatus] = useState<Job['status']>('published');
  const [jobOverview, setJobOverview] = useState('');

  // Private internal notes modal for an application
  const [notesApp, setNotesApp] = useState<Application | null>(null);
  const [notesList, setNotesList] = useState<InternalNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Schedule interview form
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [intAppId, setIntAppId] = useState('');
  const [intDate, setIntDate] = useState('');
  const [intTime, setIntTime] = useState('11:00 AM');
  const [intType, setIntType] = useState<Interview['type']>('Video');
  const [intLink, setIntLink] = useState('');
  const [savingInterview, setSavingInterview] = useState(false);

  // Status filters
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [enquiryFilter, setEnquiryFilter] = useState('all');

  // All hooks MUST run unconditionally before any conditional returns
  const filteredJobs = useMemo(() => {
    if (activeModule === 'recruitment-jobs-pending') {
      return jobs.filter((j) => j.status === 'draft');
    }
    if (activeModule === 'recruitment-jobs-published') {
      return jobs.filter((j) => j.status === 'published');
    }
    if (activeModule === 'recruitment-jobs-closed') {
      return jobs.filter((j) => j.status === 'closed' || j.status === 'paused');
    }
    return jobs;
  }, [jobs, activeModule]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employers.find((item) => item.id === jobEmployerId) || employers[0];
    if (!emp) {
      onNotify(
        'warning',
        'Employer Required',
        'Firestore security rules require a valid /employers/{employerId} document before creating a job.'
      );
      return;
    }
    setSavingJob(true);
    try {
      await saveJobToFirestore({
        job: {
          id: `job_${Date.now()}`,
          employerId: emp.id,
          companyName: emp.companyName,
          companyLogo: emp.logo || '',
          title: jobTitle.trim(),
          department: jobDepartment.trim() || 'General',
          industry: jobIndustry.trim() || emp.industry || 'General',
          location: jobLocation.trim() || emp.location || 'India',
          employmentType: 'Full-time',
          workMode: 'Hybrid',
          experienceLevel: 'Mid',
          minExperienceYears: 1,
          salary: { min: 400000, max: 900000, currency: 'INR', period: 'yearly' },
          overview: jobOverview.trim() || jobTitle.trim(),
          responsibilities: ['Collaborate with hiring managers to deliver role objectives.'],
          requirements: ['Relevant domain experience and strong communication skills.'],
          preferredSkills: ['Communication', 'Problem Solving'],
          benefits: ['Health Insurance'],
          deadline: '',
          postedDate: new Date().toISOString(),
          status: jobStatus,
          applicantsCount: 0,
          viewsCount: 0,
          isVerifiedCompany: emp.verified,
          featured: false,
        },
        employerOwnerUid: emp.userId || adminSession.uid || '',
        isNew: true,
      });
      onNotify('success', 'Job Created in Firestore', `Saved "${jobTitle.trim()}" (${jobStatus}).`);
      setShowJobForm(false);
      setJobTitle('');
      setJobOverview('');
      await onRefresh();
    } catch (err: any) {
      onNotify('error', 'Job Creation Failed', err?.message || 'Firestore rejected the job document.');
    } finally {
      setSavingJob(false);
    }
  };

  const handleChangeJobStatus = (job: Job, nextStatus: Job['status']) => {
    onRequestConfirm({
      title: `Change Job Status to "${nextStatus}"?`,
      description: `This updates /jobs/${job.id} directly in Firestore.`,
      confirmLabel: `Set ${nextStatus}`,
      tone: nextStatus === 'closed' ? 'danger' : 'primary',
      details: [
        { label: 'Job Title', value: job.title },
        { label: 'Company', value: job.companyName },
        { label: 'Current Status', value: job.status },
      ],
      onConfirm: async () => {
        try {
          await updateJobModerationInFirestore(job.id, { status: nextStatus });
          onNotify('success', 'Job Status Updated', `"${job.title}" is now ${nextStatus}.`);
          await onRefresh();
        } catch (err: any) {
          onNotify('error', 'Update Failed', err?.message || 'Could not update job status.');
        }
      },
    });
  };

  const handleDeleteJob = (job: Job) => {
    onRequestConfirm({
      title: 'Delete Job Listing Permanently?',
      description: 'Deleting removes /jobs/{jobId} from Firestore. This action cannot be undone.',
      confirmLabel: 'Delete Job',
      tone: 'danger',
      details: [
        { label: 'Job Title', value: job.title },
        { label: 'Company', value: job.companyName },
        { label: 'Job ID', value: job.id },
      ],
      onConfirm: async () => {
        try {
          await deleteJobAdminFromFirestore(job.id);
          onNotify('info', 'Job Deleted', `Removed /jobs/${job.id}.`);
          await onRefresh();
        } catch (err: any) {
          onNotify('error', 'Delete Failed', err?.message || 'Could not delete job.');
        }
      },
    });
  };

  const openInternalNotes = async (app: Application) => {
    setNotesApp(app);
    setNotesList([]);
    setNewNoteText('');
    setLoadingNotes(true);
    try {
      const notes = await listApplicationInternalNotes(app.id);
      setNotesList(notes);
    } catch (err: any) {
      onNotify('error', 'Unable to Load Notes', err?.message || 'Permission or network issue.');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesApp || !newNoteText.trim() || !adminSession.uid) return;
    setSavingNote(true);
    try {
      const created = await addApplicationInternalNote({
        applicationId: notesApp.id,
        authorUid: adminSession.uid,
        authorName: adminSession.displayName || adminSession.email || 'Admin',
        authorRole: adminSession.role === 'super_admin' ? 'super_admin' : 'recruitment_admin',
        text: newNoteText.trim(),
      });
      setNotesList((prev) => [created, ...prev]);
      setNewNoteText('');
      onNotify('success', 'Private Note Added', 'Saved to /applications/{id}/internal_notes (hidden from candidates).');
    } catch (err: any) {
      onNotify('error', 'Failed to Save Note', err?.message || 'Firestore rejected the note.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleStageChange = async (app: Application, nextStatus: ApplicationStatus) => {
    try {
      const nextTimeline = [
        ...(app.timeline || []),
        { status: nextStatus, date: new Date().toISOString() },
      ];
      await updateApplicationStatusInFirestore({
        applicationId: app.id,
        status: nextStatus,
        timeline: nextTimeline,
        interviewId: app.interviewId,
      });
      onNotify('success', 'Application Updated', `${app.candidateName} moved to ${nextStatus}.`);
      await onRefresh();
    } catch (err: any) {
      onNotify('error', 'Stage Update Failed', err?.message || 'Firestore rejected stage update.');
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    const app = applications.find((a) => a.id === intAppId);
    if (!app || !intDate || !adminSession.uid) {
      onNotify('warning', 'Missing Details', 'Select an application and interview date.');
      return;
    }
    const matchingJob = jobs.find((j) => j.id === app.jobId);
    const matchingEmp = employers.find((em) => em.id === matchingJob?.employerId);
    setSavingInterview(true);
    try {
      await scheduleInterviewInFirestore({
        interview: {
          applicationId: app.id,
          jobId: app.jobId,
          jobTitle: app.jobTitle,
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          employerId: matchingJob?.employerId || '',
          companyName: app.companyName,
          date: intDate,
          time: intTime,
          type: intType,
          meetingLink: intLink.trim() || undefined,
          status: 'Scheduled',
        },
        employerOwnerUid: matchingEmp?.userId || adminSession.uid,
        createdByUid: adminSession.uid,
      });
      onNotify('success', 'Interview Scheduled', `Scheduled interview for ${app.candidateName}.`);
      setShowInterviewForm(false);
      setIntAppId('');
      setIntDate('');
      setIntLink('');
      await onRefresh();
    } catch (err: any) {
      onNotify('error', 'Interview Failed', err?.message || 'Firestore rejected interview scheduling.');
    } finally {
      setSavingInterview(false);
    }
  };

  // Saved Jobs Module (Honest Privacy Boundary)
  if (activeModule === 'recruitment-saved-jobs') {
    const topJobsByViews = [...jobs].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#102B4E] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-[#081D36]">
              Candidate Saved Jobs Privacy Boundary Enforced by Firestore Rules
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Per <code className="font-mono text-xs">/users/&#123;uid&#125;/saved_jobs</code> in{' '}
              <code className="font-mono text-xs">firestore.rules</code>, personal saved-job bookmarks are strictly owner-only (<code className="font-mono text-xs">allow list: if isOwner(userId)</code>). Administrators cannot read private individual candidate bookmark lists. Aggregate job interest below shows real job applicant &amp; view counts from <code className="font-mono text-xs">/jobs</code>.
            </p>
          </div>
        </div>

        <AdminDataTable<Job>
          key="table-recruitment-saved-jobs"
          rows={topJobsByViews}
          rowKey={(j) => j.id}
          loading={loading}
          csvExportFilename="saved-jobs-interest"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search job title or company..."
          searchText={(j) => `${j.title} ${j.companyName} ${j.location}`}
          columns={[
            {
              key: 'title',
              header: 'Job Listing',
              csvColumns: [
                { header: 'Job Title', value: (j) => j.title },
                { header: 'Company', value: (j) => j.companyName },
                { header: 'Location', value: (j) => j.location },
              ],
              render: (j) => (
                <div>
                  <div className="font-semibold text-[#081D36]">{j.title}</div>
                  <div className="text-[11px] text-slate-500">{j.companyName} · {j.location}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              csvValue: (j) => j.status,
              render: (j) => <span className="text-xs capitalize text-slate-700">{j.status}</span>,
            },
            {
              key: 'views',
              header: 'Views',
              align: 'right',
              sortValue: (j) => j.viewsCount,
              csvValue: (j) => j.viewsCount,
              render: (j) => <span className="font-mono tabular-nums">{j.viewsCount}</span>,
            },
            {
              key: 'applicants',
              header: 'Applications',
              align: 'right',
              sortValue: (j) => j.applicantsCount,
              csvValue: (j) => j.applicantsCount,
              render: (j) => <span className="font-mono tabular-nums font-semibold">{j.applicantsCount}</span>,
            },
          ]}
          emptyTitle="No jobs found"
          emptyDescription="Published jobs in Firestore /jobs will display aggregate interest metrics here."
        />
      </div>
    );
  }

  // Companies Module
  if (activeModule === 'recruitment-companies') {
    return (
      <AdminDataTable<EmployerProfile>
        key="table-recruitment-companies"
        rows={employers}
        rowKey={(e) => e.id}
        loading={loading}
        csvExportFilename="companies"
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search company name, industry, or location..."
        searchText={(e) => `${e.companyName} ${e.industry} ${e.location}`}
        columns={[
          {
            key: 'company',
            header: 'Company',
            sortValue: (e) => e.companyName,
            csvColumns: [
              { header: 'Company', value: (e) => e.companyName },
              { header: 'Website', value: (e) => e.website || '' },
            ],
            render: (e) => (
              <div>
                <div className="font-semibold text-[#081D36]">{e.companyName}</div>
                <div className="text-[11px] text-slate-500">{e.website || 'No website'}</div>
              </div>
            ),
          },
          {
            key: 'industry',
            header: 'Industry & Size',
            csvColumns: [
              { header: 'Industry', value: (e) => e.industry || '' },
              { header: 'Company Size', value: (e) => e.companySize || '' },
            ],
            render: (e) => (
              <span className="text-xs text-slate-700">
                {e.industry} · {e.companySize}
              </span>
            ),
          },
          {
            key: 'location',
            header: 'Location',
            csvValue: (e) => e.location || '',
            render: (e) => <span className="text-xs text-slate-600">{e.location}</span>,
          },
          {
            key: 'verification',
            header: 'Verification',
            sortValue: (e) => e.verificationStatus,
            csvValue: (e) => e.verificationStatus,
            render: (e) => (
              <span
                className={`text-xs font-semibold capitalize ${
                  e.verificationStatus === 'verified'
                    ? 'text-emerald-700'
                    : e.verificationStatus === 'pending'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {e.verificationStatus}
              </span>
            ),
          },
          {
            key: 'activeJobs',
            header: 'Active Jobs',
            align: 'right',
            sortValue: (e) => e.activeJobsCount,
            csvValue: (e) => e.activeJobsCount,
            render: (e) => <span className="font-mono tabular-nums">{e.activeJobsCount}</span>,
          },
        ]}
        onRowClick={(e) =>
          onInspectRecord(e.companyName, `Company · ${e.industry}`, e as unknown as Record<string, unknown>)
        }
        emptyTitle="No companies registered yet"
        emptyDescription="Company profiles stored in /employers will appear here."
      />
    );
  }

  // Hiring Enquiries Module
  if (activeModule === 'recruitment-enquiries') {
    const filteredEnquiries =
      enquiryFilter === 'all'
        ? hiringEnquiries
        : hiringEnquiries.filter((e) => e.status === enquiryFilter);

    return (
      <AdminDataTable<HiringEnquiry>
        key="table-recruitment-enquiries"
        rows={filteredEnquiries}
        rowKey={(e) => e.id}
        loading={loading}
        csvExportFilename="hiring-enquiries"
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search company, contact person, or job title..."
        searchText={(e) => `${e.companyName} ${e.contactPerson} ${e.businessEmail} ${e.jobTitle}`}
        filterLabel="Status"
        filterValue={enquiryFilter}
        onFilterChange={setEnquiryFilter}
        filterOptions={[
          { value: 'all', label: 'All Enquiries' },
          { value: 'New', label: 'New' },
          { value: 'Contacted', label: 'Contacted' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Closed', label: 'Closed' },
        ]}
        columns={[
          {
            key: 'company',
            header: 'Company & Role',
            csvColumns: [
              { header: 'Company', value: (e) => e.companyName },
              { header: 'Job Title', value: (e) => e.jobTitle },
              { header: 'Vacancies', value: (e) => e.vacancies },
              { header: 'Location', value: (e) => e.jobLocation },
            ],
            render: (e) => (
              <div>
                <div className="font-semibold text-[#081D36]">{e.companyName}</div>
                <div className="text-[11px] text-slate-500">
                  {e.jobTitle} ({e.vacancies} {e.vacancies === 1 ? 'vacancy' : 'vacancies'}) · {e.jobLocation}
                </div>
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Contact',
            csvColumns: [
              { header: 'Contact Person', value: (e) => e.contactPerson },
              { header: 'Business Email', value: (e) => e.businessEmail },
              { header: 'Phone', value: (e) => e.phoneNumber || '' },
            ],
            render: (e) => (
              <div className="text-xs">
                <div className="text-slate-800">{e.contactPerson}</div>
                <div className="text-[11px] text-slate-500">{e.businessEmail} · {e.phoneNumber}</div>
              </div>
            ),
          },
          {
            key: 'created',
            header: 'Received',
            sortValue: (e) => e.createdAt || '',
            csvValue: (e) => (e.createdAt || '').slice(0, 10),
            render: (e) => (
              <span className="font-mono text-xs text-slate-500">
                {(e.createdAt || '').slice(0, 10) || '—'}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Workflow Status',
            align: 'right',
            csvValue: (e) => e.status,
            render: (e) =>
              canManageEnquiries ? (
                <select
                  value={e.status}
                  onClick={(ev) => ev.stopPropagation()}
                  onChange={async (ev) => {
                    const nextStatus = ev.target.value as HiringEnquiry['status'];
                    try {
                      await updateHiringEnquiryAdminInFirestore(e.id, { status: nextStatus });
                      onNotify('success', 'Enquiry Updated', `${e.companyName} set to ${nextStatus}.`);
                      await onRefresh();
                    } catch (err: any) {
                      onNotify('error', 'Update Failed', err?.message || 'Could not update enquiry.');
                    }
                  }}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#081D36]"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              ) : (
                <span className="text-xs font-semibold text-slate-700">{e.status}</span>
              ),
          },
        ]}
        onRowClick={(e) =>
          onInspectRecord(e.companyName, `Hiring Enquiry · ${e.jobTitle}`, e as unknown as Record<string, unknown>)
        }
        emptyTitle="No hiring enquiries yet"
        emptyDescription="Inbound corporate hiring enquiries submitted to /hiring_enquiries will appear here."
      />
    );
  }

  // Interviews Module
  if (activeModule === 'recruitment-interviews') {
    return (
      <div className="space-y-4">
        {showInterviewForm && (
          <form
            onSubmit={handleScheduleInterview}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#081D36]">Schedule Interview (/interviews)</h3>
              <button
                type="button"
                onClick={() => setShowInterviewForm(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                required
                value={intAppId}
                onChange={(e) => setIntAppId(e.target.value)}
                className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
              >
                <option value="">Select Active Application...</option>
                {applications
                  .filter((a) => !['Withdrawn', 'Rejected', 'Not Selected'].includes(a.status))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.candidateName} — {a.jobTitle}
                    </option>
                  ))}
              </select>
              <input
                type="date"
                required
                value={intDate}
                onChange={(e) => setIntDate(e.target.value)}
                className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              />
              <input
                type="text"
                required
                value={intTime}
                onChange={(e) => setIntTime(e.target.value)}
                placeholder="e.g. 11:00 AM IST"
                className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              />
              <select
                value={intType}
                onChange={(e) => setIntType(e.target.value as Interview['type'])}
                className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
              >
                <option value="Video">Video</option>
                <option value="Phone">Phone</option>
                <option value="In-person">In-person</option>
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={intLink}
                onChange={(e) => setIntLink(e.target.value)}
                placeholder="Optional https:// meeting link"
                className="flex-1 min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              />
              <button
                type="submit"
                disabled={savingInterview}
                className="min-h-[42px] px-5 py-2 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                {savingInterview && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save Interview</span>
              </button>
            </div>
          </form>
        )}

        <AdminDataTable<Interview>
          key="table-recruitment-interviews"
          rows={interviews}
          rowKey={(i) => i.id}
          loading={loading}
          csvExportFilename="interviews"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search candidate, job title, or company..."
          searchText={(i) => `${i.candidateName} ${i.jobTitle} ${i.companyName} ${i.type}`}
          headerActions={
            canManageApps ? (
              <button
                type="button"
                onClick={() => setShowInterviewForm((v) => !v)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Schedule Interview</span>
              </button>
            ) : undefined
          }
          columns={[
            {
              key: 'candidate',
              header: 'Candidate & Role',
              csvColumns: [
                { header: 'Candidate', value: (i) => i.candidateName },
                { header: 'Job Title', value: (i) => i.jobTitle },
                { header: 'Company', value: (i) => i.companyName },
              ],
              render: (i) => (
                <div>
                  <div className="font-semibold text-[#081D36]">{i.candidateName}</div>
                  <div className="text-[11px] text-slate-500">{i.jobTitle} · {i.companyName}</div>
                </div>
              ),
            },
            {
              key: 'schedule',
              header: 'Date & Time',
              sortValue: (i) => `${i.date} ${i.time}`,
              csvColumns: [
                { header: 'Date', value: (i) => i.date },
                { header: 'Time', value: (i) => i.time },
              ],
              render: (i) => (
                <span className="font-mono text-xs text-slate-700">
                  {i.date} · {i.time}
                </span>
              ),
            },
            {
              key: 'type',
              header: 'Format',
              csvValue: (i) => i.type,
              render: (i) => <span className="text-xs text-slate-700">{i.type}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              csvValue: (i) => i.status,
              render: (i) => <span className="text-xs font-semibold text-[#102B4E]">{i.status}</span>,
            },
          ]}
          onRowClick={(i) =>
            onInspectRecord(`${i.candidateName} Interview`, `${i.jobTitle} · ${i.date}`, i as unknown as Record<string, unknown>)
          }
          emptyTitle="No interviews scheduled yet"
          emptyDescription="Interviews created in /interviews will appear here."
        />
      </div>
    );
  }

  // Applications Module (with isolated private internal notes)
  if (activeModule === 'recruitment-applications') {
    const filteredApps =
      appStatusFilter === 'all'
        ? applications
        : applications.filter((a) => a.status === appStatusFilter);

    return (
      <div className="space-y-4">
        <AdminDataTable<Application>
          key="table-recruitment-applications"
          rows={filteredApps}
          rowKey={(a) => a.id}
          loading={loading}
          csvExportFilename="applications"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search candidate, Candidate ID, job title, company, or email..."
          searchText={(a) =>
            `${resolveAppCandidateCode(a) || ''} ${a.candidateName} ${a.candidateEmail} ${a.jobTitle} ${a.companyName}`
          }
          filterLabel="Stage"
          filterValue={appStatusFilter}
          onFilterChange={setAppStatusFilter}
          filterOptions={[
            { value: 'all', label: 'All Stages' },
            ...APPLICATION_STAGES.map((st) => ({ value: st, label: st })),
          ]}
          columns={[
            {
              key: 'candidateCode',
              header: 'Candidate ID',
              sortValue: (a) => Number(resolveAppCandidateCode(a) || 0),
              csvColumns: [
                {
                  header: CANDIDATE_ID_LABEL,
                  value: (a) => resolveAppCandidateCode(a) || 'Unassigned',
                },
              ],
              render: (a) => {
                const code = resolveAppCandidateCode(a);
                return (
                  <span
                    className={`font-mono tabular-nums text-xs font-bold px-2 py-1 rounded-md border ${
                      code
                        ? 'bg-[#F1F5FA] border-[#D4DCE6] text-[#102B4E]'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {code || '—'}
                  </span>
                );
              },
            },
            {
              key: 'candidate',
              header: 'Candidate',
              sortValue: (a) => a.candidateName,
              csvColumns: [
                { header: 'Candidate Name', value: (a) => a.candidateName },
                { header: 'Candidate Email', value: (a) => a.candidateEmail },
              ],
              render: (a) => (
                <div>
                  <div className="font-semibold text-[#081D36]">{a.candidateName}</div>
                  <div className="text-[11px] text-slate-500">{a.candidateEmail}</div>
                </div>
              ),
            },
            {
              key: 'job',
              header: 'Job & Company',
              csvColumns: [
                { header: 'Job Title', value: (a) => a.jobTitle },
                { header: 'Company', value: (a) => a.companyName },
              ],
              render: (a) => (
                <div>
                  <div className="text-xs font-semibold text-slate-800">{a.jobTitle}</div>
                  <div className="text-[11px] text-slate-500">{a.companyName}</div>
                </div>
              ),
            },
            {
              key: 'applied',
              header: 'Applied',
              sortValue: (a) => a.appliedAt || a.appliedDate,
              csvValue: (a) => (a.appliedAt || a.appliedDate || '').slice(0, 10),
              render: (a) => (
                <span className="font-mono text-xs text-slate-500">
                  {(a.appliedAt || a.appliedDate || '').slice(0, 10) || '—'}
                </span>
              ),
            },
            {
              key: 'stage',
              header: 'Stage',
              csvValue: (a) => a.status,
              render: (a) =>
                canManageApps ? (
                  <select
                    value={a.status}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={(ev) => handleStageChange(a, ev.target.value as ApplicationStatus)}
                    className="min-h-[34px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#081D36]"
                  >
                    {APPLICATION_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                    {a.status === 'Withdrawn' && <option value="Withdrawn">Withdrawn</option>}
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-[#102B4E]">{a.status}</span>
                ),
            },
            {
              key: 'notes',
              header: 'Internal Notes',
              align: 'right',
              excludeFromCsv: true,
              render: (a) => (
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    openInternalNotes(a);
                  }}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-[#102B4E] inline-flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Private Notes</span>
                </button>
              ),
            },
          ]}
          onRowClick={(a) =>
            onInspectRecord(`${a.candidateName} — ${a.jobTitle}`, `Application · ${a.status}`, a as unknown as Record<string, unknown>)
          }
          emptyTitle="No job applications found"
          emptyDescription="Applications submitted to /applications will appear here."
        />

        {/* Isolated Private Internal Notes Modal */}
        {notesApp && (
          <div className="fixed inset-0 z-50 bg-[#081D36]/55 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-[min(520px,calc(100vw-2rem))] overflow-hidden">
              <div className="px-5 py-4 bg-[#081D36] text-white flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">
                    Private Internal Notes — {notesApp.candidateName}
                  </h3>
                  <p className="text-[11px] text-slate-300 truncate">
                    Stored in /applications/{notesApp.id}/internal_notes (candidates denied by rules)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotesApp(null)}
                  className="min-w-[36px] min-h-[36px] rounded-lg text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                {canManageApps && (
                  <form onSubmit={handleAddInternalNote} className="space-y-2">
                    <textarea
                      rows={3}
                      required
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add private recruiter/admin evaluation note..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#102B4E]"
                    />
                    <button
                      type="submit"
                      disabled={savingNote}
                      className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                    >
                      {savingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Add Private Note</span>
                    </button>
                  </form>
                )}

                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {loadingNotes ? (
                    <div className="py-6 text-center text-xs text-slate-500">Loading notes...</div>
                  ) : notesList.length > 0 ? (
                    notesList.map((n) => (
                      <div key={n.id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-[#081D36]">{n.author}</span>
                          <span className="font-mono">
                            {(n.createdAt || '').slice(0, 16).replace('T', ' ') || '—'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-wrap">{n.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No private internal notes recorded for this application yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Jobs Views: All / Pending (draft) / Published / Closed (filteredJobs computed above)

  const jobCols: AdminColumn<Job>[] = [
    {
      key: 'title',
      header: 'Job Title',
      sortValue: (j) => j.title,
      csvColumns: [
        { header: 'Job Title', value: (j) => j.title },
        { header: 'Company', value: (j) => j.companyName },
        { header: 'Location', value: (j) => j.location },
        { header: 'Employment Type', value: (j) => j.employmentType },
      ],
      render: (j) => (
        <div>
          <div className="font-semibold text-[#081D36]">{j.title}</div>
          <div className="text-[11px] text-slate-500">
            {j.companyName} · {j.location} · {j.employmentType}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (j) => j.status,
      csvValue: (j) => j.status,
      render: (j) => (
        <span
          className={`text-xs font-semibold capitalize ${
            j.status === 'published'
              ? 'text-emerald-700'
              : j.status === 'draft'
              ? 'text-amber-700'
              : 'text-slate-500'
          }`}
        >
          {j.status}
        </span>
      ),
    },
    {
      key: 'apps',
      header: 'Applicants',
      align: 'right',
      sortValue: (j) => j.applicantsCount,
      csvValue: (j) => j.applicantsCount,
      render: (j) => <span className="font-mono tabular-nums">{j.applicantsCount}</span>,
    },
    {
      key: 'posted',
      header: 'Posted',
      sortValue: (j) => j.postedDate,
      csvValue: (j) => (j.postedDate ? j.postedDate.slice(0, 10) : ''),
      render: (j) => (
        <span className="font-mono text-xs text-slate-500">
          {j.postedDate ? j.postedDate.slice(0, 10) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Moderation',
      align: 'right',
      excludeFromCsv: true,
      render: (j) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(ev) => ev.stopPropagation()}>
          {canManageJobs && j.status !== 'published' && (
            <button
              type="button"
              onClick={() => handleChangeJobStatus(j, 'published')}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          )}
          {canManageJobs && j.status === 'published' && (
            <button
              type="button"
              onClick={() => handleChangeJobStatus(j, 'closed')}
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-800 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          )}
          {canManageJobs && (
            <button
              type="button"
              onClick={() => handleDeleteJob(j)}
              aria-label={`Delete ${j.title}`}
              className="min-h-[34px] px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const jobsCsvSlug =
    activeModule === 'recruitment-jobs-pending'
      ? 'jobs-pending'
      : activeModule === 'recruitment-jobs-published'
      ? 'jobs-published'
      : activeModule === 'recruitment-jobs-closed'
      ? 'jobs-closed'
      : 'jobs';

  return (
    <div className="space-y-4">
      {showJobForm && (
        <form
          onSubmit={handleCreateJob}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#081D36]">Create Job Listing (/jobs)</h3>
            <button
              type="button"
              onClick={() => setShowJobForm(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Job Title *"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
            />
            <select
              value={jobEmployerId || employers[0]?.id || ''}
              onChange={(e) => setJobEmployerId(e.target.value)}
              className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
            >
              {employers.map((em) => (
                <option key={em.id} value={em.id}>
                  {em.companyName} ({em.verificationStatus})
                </option>
              ))}
              {employers.length === 0 && <option value="">No employers in Firestore yet</option>}
            </select>
            <input
              type="text"
              required
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
              placeholder="Location *"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
            />
            <input
              type="text"
              value={jobDepartment}
              onChange={(e) => setJobDepartment(e.target.value)}
              placeholder="Department"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
            />
            <input
              type="text"
              value={jobIndustry}
              onChange={(e) => setJobIndustry(e.target.value)}
              placeholder="Industry"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
            />
            <select
              value={jobStatus}
              onChange={(e) => setJobStatus(e.target.value as Job['status'])}
              className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
            >
              <option value="published">Published</option>
              <option value="draft">Draft (Pending)</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <textarea
            rows={3}
            required
            value={jobOverview}
            onChange={(e) => setJobOverview(e.target.value)}
            placeholder="Role overview & summary *"
            className="w-full p-3 rounded-lg border border-slate-200 text-xs sm:text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowJobForm(false)}
              className="min-h-[40px] px-4 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingJob}
              className="min-h-[40px] px-5 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              {savingJob && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Job to Firestore</span>
            </button>
          </div>
        </form>
      )}

      <AdminDataTable<Job>
        key={`table-${activeModule}`}
        rows={filteredJobs}
        columns={jobCols}
        rowKey={(j) => j.id}
        loading={loading}
        csvExportFilename={jobsCsvSlug}
        canExportCsv={canExportCsv}
        onCsvExported={handleCsvExported}
        searchPlaceholder="Search job title, company, or location..."
        searchText={(j) => `${j.title} ${j.companyName} ${j.location} ${j.department} ${j.industry}`}
        headerActions={
          canManageJobs ? (
            <button
              type="button"
              onClick={() => setShowJobForm((v) => !v)}
              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Job</span>
            </button>
          ) : undefined
        }
        onRowClick={(j) =>
          onInspectRecord(j.title, `${j.companyName} · ${j.status}`, j as unknown as Record<string, unknown>)
        }
        emptyTitle="No matching job listings"
        emptyDescription="Jobs stored in Firestore /jobs matching this status filter will appear here."
      />
    </div>
  );
};
