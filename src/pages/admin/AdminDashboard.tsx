import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AnimatedStatusBadge } from '../../lib/motion';
import {
  Shield,
  Briefcase,
  Users,
  FileText,
  Building2,
  BookOpen,
  LayoutDashboard,
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Download,
  MessageSquare,
  Send,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import {
  Job,
  Course,
  Application,
  ApplicationStatus,
  HiringEnquiry,
} from '../../types';
import { AbhiJobsLogo } from '../../components/AbhiJobsLogo';
import { AdminCourseContentManager } from '../../components/learning/AdminCourseContentManager';

interface AdminDashboardProps {
  navigate: (route: string) => void;
}

type AdminTab =
  | 'overview'
  | 'jobs'
  | 'applications'
  | 'candidates'
  | 'enquiries'
  | 'courses';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Not Selected',
];

const ENQUIRY_STATUSES: HiringEnquiry['status'][] = [
  'New',
  'Contacted',
  'In Progress',
  'Fulfilled',
  'Closed',
];

const statusBadgeClasses = (status: string): string => {
  switch (status) {
    case 'published':
    case 'Selected':
    case 'Fulfilled':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Shortlisted':
    case 'Interview':
    case 'Interview Scheduled':
    case 'In Progress':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Applied':
    case 'New':
    case 'Under Review':
    case 'Contacted':
      return 'bg-blue-50 text-[#102B4E] border-blue-200';
    case 'Rejected':
    case 'Not Selected':
    case 'closed':
    case 'Closed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-[#778397] border-[#E5EAF0]';
  }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const {
    currentUser,
    currentRole,
    loginAs,
    jobs,
    courses,
    candidates,
    applications,
    hiringEnquiries,
    courseEnquiries,
    createJob,
    updateJob,
    updateJobStatus,
    deleteJob,
    createCourse,
    updateCourse,
    updateCourseStatus,
    deleteCourse,
    updateApplicationStatus,
    addApplicationNote,
    scheduleInterview,
    updateHiringEnquiry,
    exportCsvReport,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Search & Filter State
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [enquiryStatusFilter, setEnquiryStatusFilter] = useState<string>('all');

  // Selected Application Detail & Notes
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  // Schedule Interview Modal
  const [interviewTargetApp, setInterviewTargetApp] = useState<Application | null>(null);
  const [intDate, setIntDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [intTime, setIntTime] = useState('11:00 AM IST');
  const [intType, setIntType] = useState<'Video' | 'Phone' | 'In-person'>('Video');
  const [intLink, setIntLink] = useState('https://meet.google.com/abhi-jobs-interview');
  const [intNotes, setIntNotes] = useState('Initial technical & competency evaluation with ABHI JOBS consultancy panel.');

  // Hiring Enquiry Edit Drafts
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);
  const [enqRecruiterDraft, setEnqRecruiterDraft] = useState('');
  const [enqNotesDraft, setEnqNotesDraft] = useState('');

  // Job Create / Edit Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDepartment, setJobDepartment] = useState('Engineering');
  const [jobIndustry, setJobIndustry] = useState('Information Technology');
  const [jobLocation, setJobLocation] = useState('Bengaluru, Karnataka');
  const [jobWorkMode, setJobWorkMode] = useState<Job['workMode']>('Hybrid');
  const [jobType, setJobType] = useState<Job['employmentType']>('Full-time');
  const [jobLevel, setJobLevel] = useState<Job['experienceLevel']>('Mid');
  const [jobMinExp, setJobMinExp] = useState(2);
  const [jobSalaryMin, setJobSalaryMin] = useState(800000);
  const [jobSalaryMax, setJobSalaryMax] = useState(1600000);
  const [jobDeadline, setJobDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [jobOverview, setJobOverview] = useState('');
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobSkills, setJobSkills] = useState('React, TypeScript, Node.js');
  const [jobBenefits, setJobBenefits] = useState('Health Insurance, Hybrid Flexibility, Annual Bonus');
  const [jobStatus, setJobStatus] = useState<Job['status']>('published');

  // Course Create / Edit Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseProvider, setCourseProvider] = useState('ABHI Career Academy');
  const [courseCategory, setCourseCategory] = useState('Technology & Engineering');
  const [courseLevel, setCourseLevel] = useState<Course['level']>('Intermediate');
  const [courseMode, setCourseMode] = useState<NonNullable<Course['learningMode']>>('Live Online');
  const [courseDuration, setCourseDuration] = useState('6 Weeks');
  const [courseModules, setCourseModules] = useState(8);
  const [courseFees, setCourseFees] = useState('₹14,999');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseSkills, setCourseSkills] = useState('SQL, Python, Data Visualization');
  const [courseOutcomes, setCourseOutcomes] = useState('');
  const [courseCurriculum, setCourseCurriculum] = useState('');
  const [courseStatus, setCourseStatus] = useState<Course['status']>('published');

  // Metrics
  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status === 'published').length;
    const newApps = applications.filter((a) => a.status === 'Applied').length;
    const shortlisted = applications.filter((a) => a.status === 'Shortlisted').length;
    const interviewed = applications.filter(
      (a) => a.status === 'Interview' || a.status === 'Interview Scheduled'
    ).length;
    const newEnquiries = hiringEnquiries.filter((e) => e.status === 'New').length;
    return {
      totalCandidates: candidates.length,
      activeJobs,
      totalJobs: jobs.length,
      totalApplications: applications.length,
      newApps,
      shortlisted,
      interviewed,
      totalEnquiries: hiringEnquiries.length,
      newEnquiries,
    };
  }, [candidates, jobs, applications, hiringEnquiries]);

  // Filtered lists
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = jobSearch.trim().toLowerCase();
      const matchesQ =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q);
      const matchesStatus = jobStatusFilter === 'all' || j.status === jobStatusFilter;
      return matchesQ && matchesStatus;
    });
  }, [jobs, jobSearch, jobStatusFilter]);

  const filteredApplications = useMemo(() => {
    return applications.filter((a) => {
      const q = appSearch.trim().toLowerCase();
      const matchesQ =
        !q ||
        a.candidateName.toLowerCase().includes(q) ||
        a.candidateEmail.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q);
      const matchesStatus =
        appStatusFilter === 'all' ||
        a.status === appStatusFilter ||
        (appStatusFilter === 'Interview Scheduled' && a.status === 'Interview') ||
        (appStatusFilter === 'Not Selected' && a.status === 'Rejected');
      return matchesQ && matchesStatus;
    });
  }, [applications, appSearch, appStatusFilter]);

  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
    );
  }, [candidates, candidateSearch]);

  const filteredEnquiries = useMemo(() => {
    if (enquiryStatusFilter === 'all') return hiringEnquiries;
    return hiringEnquiries.filter((e) => e.status === enquiryStatusFilter);
  }, [hiringEnquiries, enquiryStatusFilter]);

  const selectedApplication = useMemo(
    () => applications.find((a) => a.id === selectedAppId) || null,
    [applications, selectedAppId]
  );

  // Access Gate: Internal Recruiter / Admin Only
  if (!currentUser || currentRole !== 'admin') {
    return (
      <div className="min-h-[75vh] bg-[#F6F8FB] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5EAF0] shadow-sm p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#102B4E]/10 text-[#102B4E] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-[#102B4E]">
              Internal Recruitment Console
            </h1>
            <p className="text-sm text-[#778397] leading-relaxed">
              This workspace is restricted to ABHI JOBS internal recruiters and administrators.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                loginAs('admin');
                showToast('success', 'Recruiter Console Active', 'Signed in to internal admin workspace.');
              }}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Enter as Recruiter Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#253449] text-sm font-semibold transition-colors cursor-pointer"
            >
              Back Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Open Job Modal (Create or Edit)
  const openCreateJobModal = () => {
    setEditingJobId(null);
    setJobTitle('');
    setJobCompany('');
    setJobDepartment('Engineering');
    setJobIndustry('Information Technology');
    setJobLocation('Bengaluru, Karnataka');
    setJobWorkMode('Hybrid');
    setJobType('Full-time');
    setJobLevel('Mid');
    setJobMinExp(2);
    setJobSalaryMin(800000);
    setJobSalaryMax(1600000);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setJobDeadline(d.toISOString().split('T')[0]);
    setJobOverview('');
    setJobResponsibilities('Lead end-to-end delivery of core projects\nCollaborate with cross-functional teams\nMaintain high quality and performance standards');
    setJobRequirements('Proven industry experience in a similar role\nStrong communication and problem-solving skills\nBachelor degree or equivalent practical experience');
    setJobSkills('React, TypeScript, Node.js');
    setJobBenefits('Health Insurance, Hybrid Flexibility, Performance Bonus');
    setJobStatus('published');
    setShowJobModal(true);
  };

  const openEditJobModal = (job: Job) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobCompany(job.companyName);
    setJobDepartment(job.department);
    setJobIndustry(job.industry);
    setJobLocation(job.location);
    setJobWorkMode(job.workMode);
    setJobType(job.employmentType);
    setJobLevel(job.experienceLevel);
    setJobMinExp(job.minExperienceYears);
    setJobSalaryMin(job.salary.min);
    setJobSalaryMax(job.salary.max);
    setJobDeadline(job.deadline);
    setJobOverview(job.overview);
    setJobResponsibilities(job.responsibilities.join('\n'));
    setJobRequirements(job.requirements.join('\n'));
    setJobSkills(job.preferredSkills.join(', '));
    setJobBenefits(job.benefits.join(', '));
    setJobStatus(job.status);
    setShowJobModal(true);
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobCompany.trim() || !jobOverview.trim()) {
      showToast('error', 'Missing Required Fields', 'Please provide job title, client company, and job overview.');
      return;
    }

    const responsibilitiesList = jobResponsibilities
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const requirementsList = jobRequirements
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const skillsList = jobSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const benefitsList = jobBenefits
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      employerId: 'abhi-consultancy',
      companyName: jobCompany.trim(),
      companyLogo: jobCompany.trim().substring(0, 2).toUpperCase(),
      title: jobTitle.trim(),
      department: jobDepartment.trim() || 'Operations',
      industry: jobIndustry.trim() || 'Corporate',
      location: jobLocation.trim() || 'Remote',
      employmentType: jobType,
      workMode: jobWorkMode,
      experienceLevel: jobLevel,
      minExperienceYears: Number(jobMinExp) || 0,
      salary: {
        min: Number(jobSalaryMin) || 0,
        max: Number(jobSalaryMax) || 0,
        currency: 'INR',
        period: 'yearly' as const,
      },
      overview: jobOverview.trim(),
      responsibilities: responsibilitiesList.length ? responsibilitiesList : ['Deliver core role objectives as outlined by the hiring client.'],
      requirements: requirementsList.length ? requirementsList : ['Relevant experience and strong role alignment.'],
      preferredSkills: skillsList.length ? skillsList : ['Communication'],
      benefits: benefitsList.length ? benefitsList : ['Competitive Compensation'],
      deadline: jobDeadline || new Date().toISOString().split('T')[0],
      status: jobStatus,
    };

    if (editingJobId) {
      updateJob(editingJobId, payload);
    } else {
      createJob(payload);
    }
    setShowJobModal(false);
  };

  // Open Course Modal (Create or Edit)
  const openCreateCourseModal = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCourseProvider('ABHI Career Academy');
    setCourseCategory('Technology & Engineering');
    setCourseLevel('Intermediate');
    setCourseMode('Live Online');
    setCourseDuration('6 Weeks');
    setCourseModules(8);
    setCourseFees('₹14,999');
    setCourseDescription('');
    setCourseSkills('SQL, Python, Analytics');
    setCourseOutcomes('Master practical job-ready workflows\nBuild portfolio case studies\nPrepare for technical interviews');
    setCourseCurriculum('Week 1-2: Core Foundations\nWeek 3-4: Applied Projects\nWeek 5-6: Capstone & Placement Prep');
    setCourseStatus('published');
    setShowCourseModal(true);
  };

  const openEditCourseModal = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseTitle(course.title);
    setCourseProvider(course.provider || 'ABHI Career Academy');
    setCourseCategory(course.category);
    setCourseLevel(course.level);
    setCourseMode(course.learningMode || 'Live Online');
    setCourseDuration(course.duration);
    setCourseModules(course.modules);
    setCourseFees(course.fees || 'Contact for Fees');
    setCourseDescription(course.description);
    setCourseSkills(course.skillsCovered.join(', '));
    setCourseOutcomes((course.outcomes || []).join('\n'));
    setCourseCurriculum((course.curriculum || []).join('\n'));
    setCourseStatus(course.status);
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseDescription.trim()) {
      showToast('error', 'Missing Information', 'Please enter course title and description.');
      return;
    }

    const payload = {
      title: courseTitle.trim(),
      provider: courseProvider.trim() || 'ABHI Career Academy',
      category: courseCategory.trim() || 'Career Skills',
      level: courseLevel,
      learningMode: courseMode,
      duration: courseDuration.trim() || '4 Weeks',
      modules: Number(courseModules) || 6,
      fees: courseFees.trim() || 'Contact for Fees',
      description: courseDescription.trim(),
      skillsCovered: courseSkills.split(',').map((s) => s.trim()).filter(Boolean),
      outcomes: courseOutcomes.split('\n').map((s) => s.trim()).filter(Boolean),
      curriculum: courseCurriculum.split('\n').map((s) => s.trim()).filter(Boolean),
      status: courseStatus,
    };

    if (editingCourseId) {
      updateCourse(editingCourseId, payload);
    } else {
      createCourse(payload);
    }
    setShowCourseModal(false);
  };

  // Schedule Interview submit
  const handleConfirmInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewTargetApp) return;

    scheduleInterview({
      applicationId: interviewTargetApp.id,
      jobId: interviewTargetApp.jobId,
      jobTitle: interviewTargetApp.jobTitle,
      candidateId: interviewTargetApp.candidateId,
      candidateName: interviewTargetApp.candidateName,
      employerId: 'abhi-consultancy',
      companyName: interviewTargetApp.companyName,
      date: intDate,
      time: intTime,
      type: intType,
      meetingLink: intLink,
      notes: intNotes,
      status: 'Scheduled',
    });

    updateApplicationStatus(
      interviewTargetApp.id,
      'Interview Scheduled',
      `${intType} interview scheduled for ${intDate} at ${intTime}`
    );
    setInterviewTargetApp(null);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication || !noteInput.trim()) return;
    addApplicationNote(selectedApplication.id, noteInput.trim());
    setNoteInput('');
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="w-4 h-4" />, count: jobs.length },
    { id: 'applications', label: 'Applications', icon: <FileText className="w-4 h-4" />, count: applications.length },
    { id: 'candidates', label: 'Candidates', icon: <Users className="w-4 h-4" />, count: candidates.length },
    { id: 'enquiries', label: 'Hiring Enquiries', icon: <Building2 className="w-4 h-4" />, count: hiringEnquiries.length },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" />, count: courses.length },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      {/* Top Admin Header Banner */}
      <div className="bg-[#081D36] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <AbhiJobsLogo variant="horizontal" theme="white" size="sm" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-white/90 border border-white/15">
                  <Shield className="w-3.5 h-3.5 text-[#F47A24]" />
                  Internal Recruiter &amp; Admin Console
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Recruitment Consultancy Operations
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Manage active job openings, screen candidate applications, coordinate employer hiring requirements, and curate partner learning programs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={openCreateJobModal}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Job</span>
              </button>
              <button
                type="button"
                onClick={openCreateCourseModal}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Add Course</span>
              </button>
              <button
                type="button"
                onClick={() => exportCsvReport('applications')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-200 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#102B4E] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                        active
                          ? 'bg-[#102B4E]/10 text-[#102B4E]'
                          : 'bg-white/10 text-slate-200'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Candidates',
                  value: stats.totalCandidates,
                  sub: 'Registered talent profiles',
                  icon: <Users className="w-5 h-5 text-[#102B4E]" />,
                  action: () => setActiveTab('candidates'),
                },
                {
                  label: 'Active Jobs',
                  value: stats.activeJobs,
                  sub: `${stats.totalJobs} total mandates managed`,
                  icon: <Briefcase className="w-5 h-5 text-[#F47A24]" />,
                  action: () => setActiveTab('jobs'),
                },
                {
                  label: 'Total Applications',
                  value: stats.totalApplications,
                  sub: `${stats.newApps} new awaiting review`,
                  icon: <FileText className="w-5 h-5 text-[#102B4E]" />,
                  action: () => setActiveTab('applications'),
                },
                {
                  label: 'Hiring Enquiries',
                  value: stats.totalEnquiries,
                  sub: `${stats.newEnquiries} new company requests`,
                  icon: <Building2 className="w-5 h-5 text-[#F47A24]" />,
                  action: () => setActiveTab('enquiries'),
                },
              ].map((card) => (
                <button
                  key={card.label}
                  type="button"
                  onClick={card.action}
                  className="bg-white rounded-2xl border border-[#E5EAF0] p-5 text-left hover:border-[#102B4E]/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      {card.label}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-[#102B4E]">{card.value}</div>
                  <div className="text-xs text-[#778397] mt-1">{card.sub}</div>
                </button>
              ))}
            </div>

            {/* Secondary Pipeline Counters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                    New Applications
                  </p>
                  <p className="text-2xl font-bold text-[#102B4E] mt-1">{stats.newApps}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#102B4E] text-xs font-semibold border border-blue-200">
                  Needs Screening
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                    Shortlisted Candidates
                  </p>
                  <p className="text-2xl font-bold text-[#102B4E] mt-1">{stats.shortlisted}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                  Client Review
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#778397]">
                    Interview Scheduled
                  </p>
                  <p className="text-2xl font-bold text-[#102B4E] mt-1">{stats.interviewed}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  Active Stage
                </span>
              </div>
            </div>

            {/* Two-Column Overview Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Applications */}
              <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#102B4E]">Recent Applications</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('applications')}
                    className="text-xs font-semibold text-[#F47A24] hover:underline cursor-pointer"
                  >
                    Manage All
                  </button>
                </div>
                <div className="divide-y divide-[#E5EAF0]">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#253449] truncate">
                          {app.candidateName}
                        </p>
                        <p className="text-xs text-[#778397] truncate">
                          {app.jobTitle} &middot; {app.companyName}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border shrink-0 ${statusBadgeClasses(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                  {applications.length === 0 && (
                    <div className="p-8 text-center text-sm text-[#778397]">
                      No candidate applications recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Employer Hiring Enquiries */}
              <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#102B4E]">Recent Hiring Enquiries</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('enquiries')}
                    className="text-xs font-semibold text-[#F47A24] hover:underline cursor-pointer"
                  >
                    Review All
                  </button>
                </div>
                <div className="divide-y divide-[#E5EAF0]">
                  {hiringEnquiries.slice(0, 5).map((enq) => (
                    <div key={enq.id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#253449] truncate">
                          {enq.companyName} — {enq.jobTitle}
                        </p>
                        <p className="text-xs text-[#778397] truncate">
                          {enq.contactPerson} &middot; {enq.vacancies} vacanc{enq.vacancies === 1 ? 'y' : 'ies'} &middot; {enq.jobLocation}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border shrink-0 ${statusBadgeClasses(
                          enq.status
                        )}`}
                      >
                        {enq.status}
                      </span>
                    </div>
                  ))}
                  {hiringEnquiries.length === 0 && (
                    <div className="p-8 text-center text-sm text-[#778397]">
                      No hiring enquiries submitted yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JOBS MANAGEMENT */}
        {activeTab === 'jobs' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    placeholder="Search jobs by title, client, or location..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] bg-white focus:outline-none focus:border-[#102B4E]"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button
                type="button"
                onClick={openCreateJobModal}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Job</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6F8FB] border-b border-[#E5EAF0] text-xs font-semibold uppercase tracking-wider text-[#778397]">
                      <th className="px-5 py-3.5">Role &amp; Client</th>
                      <th className="px-5 py-3.5">Location &amp; Mode</th>
                      <th className="px-5 py-3.5">Experience</th>
                      <th className="px-5 py-3.5">Applicants</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAF0] text-sm">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-[#F6F8FB]/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#102B4E]">{job.title}</div>
                          <div className="text-xs text-[#778397] mt-0.5">
                            {job.companyName} &middot; {job.department}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#253449]">
                          <div>{job.location}</div>
                          <div className="text-xs text-[#778397]">
                            {job.workMode} &middot; {job.employmentType}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#253449]">
                          <div>{job.experienceLevel}</div>
                          <div className="text-xs text-[#778397]">
                            {job.minExperienceYears}+ yrs
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#102B4E]">
                          {applications.filter((a) => a.jobId === job.id).length}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${statusBadgeClasses(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditJobModal(job)}
                              title="Edit job"
                              className="p-2 rounded-lg text-[#253449] hover:bg-[#F6F8FB] border border-transparent hover:border-[#E5EAF0] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateJobStatus(
                                  job.id,
                                  job.status === 'published' ? 'closed' : 'published'
                                )
                              }
                              title={job.status === 'published' ? 'Close job' : 'Publish job'}
                              className="p-2 rounded-lg text-[#102B4E] hover:bg-[#F6F8FB] border border-transparent hover:border-[#E5EAF0] cursor-pointer"
                            >
                              {job.status === 'published' ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteJob(job.id)}
                              title="Delete job"
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredJobs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#778397]">
                          No jobs match your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: APPLICATIONS MANAGEMENT */}
        {activeTab === 'applications' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search candidate, email, or job title..."
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] bg-white focus:outline-none focus:border-[#102B4E]"
                >
                  <option value="all">All Stages</option>
                  {APPLICATION_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => exportCsvReport('applications')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#102B4E] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Applications</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Applications List */}
              <div className="lg:col-span-2 space-y-3">
                {filteredApplications.map((app) => {
                  const isSelected = selectedAppId === app.id;
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#102B4E] ring-1 ring-[#102B4E]'
                          : 'border-[#E5EAF0] hover:border-[#102B4E]/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-[#102B4E]">
                              {app.candidateName}
                            </h3>
                            <AnimatedStatusBadge
                              status={app.status}
                              className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusBadgeClasses(
                                app.status
                              )}`}
                            />
                          </div>
                          <p className="text-sm text-[#253449] font-medium mt-0.5">
                            {app.jobTitle} <span className="text-[#778397]">at {app.companyName}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#778397] mt-2">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {app.candidateEmail}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {app.candidateLocation}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Applied {app.appliedDate}
                            </span>
                          </div>
                        </div>

                        <div
                          className="flex flex-wrap items-center gap-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={app.status}
                            onChange={(e) =>
                              updateApplicationStatus(
                                app.id,
                                e.target.value as ApplicationStatus
                              )
                            }
                            aria-label="Update application status"
                            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#E5EAF0] text-xs font-semibold text-[#102B4E] bg-[#F6F8FB] focus:outline-none focus:border-[#102B4E] cursor-pointer"
                          >
                            {APPLICATION_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                            {app.status === 'Withdrawn' && (
                              <option value="Withdrawn">Withdrawn</option>
                            )}
                          </select>

                          <button
                            type="button"
                            onClick={() => setInterviewTargetApp(app)}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Interview</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredApplications.length === 0 && (
                  <div className="bg-white rounded-2xl border border-[#E5EAF0] p-12 text-center text-sm text-[#778397]">
                    No applications found matching the selected filters.
                  </div>
                )}
              </div>

              {/* Candidate Detail & Internal Recruiter Notes Panel */}
              <div className="bg-white rounded-2xl border border-[#E5EAF0] p-5 h-fit sticky top-24">
                {selectedApplication ? (
                  <div className="space-y-5">
                    <div className="border-b border-[#E5EAF0] pb-4">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F47A24]">
                        Application File
                      </span>
                      <h3 className="text-lg font-bold text-[#102B4E] mt-1">
                        {selectedApplication.candidateName}
                      </h3>
                      <p className="text-xs text-[#778397] mt-0.5">
                        {selectedApplication.candidateHeadline}
                      </p>
                      <div className="mt-3 space-y-1.5 text-xs text-[#253449]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#778397]" />
                          <span>{selectedApplication.candidateEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#778397]" />
                          <span>{selectedApplication.candidatePhone || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#F47A24]" />
                          <span className="font-medium">
                            Resume: {selectedApplication.resumeName || 'Profile Resume'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedApplication.candidateSkills.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#778397] mb-2">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApplication.candidateSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2.5 py-1 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-xs font-medium text-[#253449]"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedApplication.coverNote && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#778397] mb-1.5">
                          Candidate Note
                        </h4>
                        <p className="text-xs text-[#253449] bg-[#F6F8FB] p-3 rounded-xl border border-[#E5EAF0] leading-relaxed">
                          {selectedApplication.coverNote}
                        </p>
                      </div>
                    )}

                    {/* Internal Recruiter Notes */}
                    <div className="border-t border-[#E5EAF0] pt-4 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#102B4E] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#F47A24]" />
                        <span>Internal Recruiter Notes</span>
                      </h4>

                      <form onSubmit={handleAddNote} className="space-y-2">
                        <textarea
                          rows={2}
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add screening remarks, salary expectations, or interview feedback..."
                          className="w-full p-2.5 rounded-xl border border-[#E5EAF0] text-xs text-[#253449] focus:outline-none focus:border-[#102B4E]"
                        />
                        <button
                          type="submit"
                          className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Save Internal Note</span>
                        </button>
                      </form>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(selectedApplication.internalNotes || []).map((note) => (
                          <div
                            key={note.id}
                            className="p-3 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-[#778397]">
                              <span className="font-semibold text-[#102B4E]">{note.author}</span>
                              <span>{note.createdAt}</span>
                            </div>
                            <p className="text-[#253449] leading-relaxed">{note.text}</p>
                          </div>
                        ))}
                        {(!selectedApplication.internalNotes ||
                          selectedApplication.internalNotes.length === 0) && (
                          <p className="text-xs text-[#778397] italic">
                            No internal notes added yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <FileText className="w-8 h-8 text-[#778397]/50 mx-auto" />
                    <p className="text-sm font-semibold text-[#102B4E]">
                      Select an application
                    </p>
                    <p className="text-xs text-[#778397]">
                      Click any candidate row to review their resume details and add internal screening notes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CANDIDATES MANAGEMENT */}
        {activeTab === 'candidates' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search candidates by name, skill, or city..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:border-[#102B4E]"
                />
              </div>
              <button
                type="button"
                onClick={() => exportCsvReport('candidates')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#E5EAF0] hover:bg-[#F6F8FB] text-[#102B4E] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Candidate Pool</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map((cand) => (
                <div
                  key={cand.id}
                  className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[#102B4E] truncate">
                          {cand.name}
                        </h3>
                        <p className="text-xs text-[#778397] truncate">{cand.headline}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[11px] font-semibold text-[#102B4E] shrink-0">
                        {cand.experienceLevel}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#253449]">
                      <div className="flex items-center gap-1.5 text-[#778397]">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{cand.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#778397]">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{cand.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#778397]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {cand.yearsOfExperience} yrs exp &middot; {cand.availability}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cand.skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-[#F6F8FB] border border-[#E5EAF0] text-[11px] font-medium text-[#253449]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between text-xs">
                    <span className="text-[#778397]">
                      Profile {cand.completionPercentage}% complete
                    </span>
                    <span className="font-semibold text-[#102B4E]">
                      {cand.resumeName ? 'Resume on file' : 'No resume'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: HIRING ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#102B4E]">
                  Company Hiring Requirements
                </h2>
                <p className="text-xs text-[#778397]">
                  Enquiries submitted through the Hire Talent consultancy page.
                </p>
              </div>
              <select
                value={enquiryStatusFilter}
                onChange={(e) => setEnquiryStatusFilter(e.target.value)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm text-[#253449] bg-white focus:outline-none focus:border-[#102B4E]"
              >
                <option value="all">All Statuses</option>
                {ENQUIRY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              {filteredEnquiries.map((enq) => {
                const isEditing = editingEnquiryId === enq.id;
                return (
                  <div
                    key={enq.id}
                    className="bg-white rounded-2xl border border-[#E5EAF0] p-6 space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg font-bold text-[#102B4E]">
                            {enq.companyName}
                          </h3>
                          <AnimatedStatusBadge
                            status={enq.status}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusBadgeClasses(
                              enq.status
                            )}`}
                          />
                        </div>
                        <p className="text-sm font-semibold text-[#F47A24]">
                          {enq.jobTitle} &middot; {enq.vacancies}{' '}
                          {enq.vacancies === 1 ? 'Vacancy' : 'Vacancies'} &middot;{' '}
                          {enq.jobLocation}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#778397] pt-1">
                          <span>Contact: {enq.contactPerson}</span>
                          <span>Email: {enq.businessEmail}</span>
                          <span>Phone: {enq.phoneNumber}</span>
                          <span>Submitted: {enq.createdAt}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={enq.status}
                          onChange={(e) =>
                            updateHiringEnquiry(enq.id, {
                              status: e.target.value as HiringEnquiry['status'],
                            })
                          }
                          aria-label="Update enquiry status"
                          className="min-h-[40px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs font-semibold text-[#102B4E] bg-[#F6F8FB] focus:outline-none focus:border-[#102B4E] cursor-pointer"
                        >
                          {ENQUIRY_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>

                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEnquiryId(enq.id);
                              setEnqRecruiterDraft(enq.assignedRecruiter || '');
                              setEnqNotesDraft(enq.internalNotes || '');
                            }}
                            className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] hover:bg-[#F6F8FB] text-xs font-semibold text-[#102B4E] cursor-pointer"
                          >
                            Assign / Notes
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] text-xs text-[#253449] leading-relaxed">
                      <span className="font-semibold text-[#102B4E]">
                        Requirement Brief:{' '}
                      </span>
                      {enq.additionalRequirements || 'No additional notes provided.'}
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E5EAF0]">
                        <div>
                          <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                            Assigned Recruiter
                          </label>
                          <input
                            type="text"
                            value={enqRecruiterDraft}
                            onChange={(e) => setEnqRecruiterDraft(e.target.value)}
                            placeholder="e.g. Priya Sharma (Senior Consultant)"
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#253449] focus:outline-none focus:border-[#102B4E]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                            Internal Consultancy Notes
                          </label>
                          <input
                            type="text"
                            value={enqNotesDraft}
                            onChange={(e) => setEnqNotesDraft(e.target.value)}
                            placeholder="Sourcing progress, SLA, or client feedback..."
                            className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-xs text-[#253449] focus:outline-none focus:border-[#102B4E]"
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingEnquiryId(null)}
                            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#E5EAF0] text-xs font-semibold text-[#778397] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateHiringEnquiry(enq.id, {
                                assignedRecruiter: enqRecruiterDraft.trim(),
                                internalNotes: enqNotesDraft.trim(),
                              });
                              setEditingEnquiryId(null);
                            }}
                            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-semibold cursor-pointer"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      (enq.assignedRecruiter || enq.internalNotes) && (
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#778397] pt-1">
                          {enq.assignedRecruiter && (
                            <span>
                              <strong className="text-[#102B4E]">Assigned:</strong>{' '}
                              {enq.assignedRecruiter}
                            </span>
                          )}
                          {enq.internalNotes && (
                            <span>
                              <strong className="text-[#102B4E]">Notes:</strong>{' '}
                              {enq.internalNotes}
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })}

              {filteredEnquiries.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#E5EAF0] p-12 text-center text-sm text-[#778397]">
                  No hiring enquiries in this status.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: COURSES MANAGEMENT */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* Learn with ABHI Structured Lesson & Content Manager */}
            <AdminCourseContentManager
              adminUserId={currentUser?.id || 'admin'}
              onNotify={showToast}
              onPreviewCourse={(slug) => navigate(`/learning/courses/${slug}/learn`)}
            />

            <div className="bg-white rounded-2xl border border-[#E5EAF0] p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#102B4E]">
                  Partner Upskilling Programmes
                </h2>
                <p className="text-xs text-[#778397]">
                  Publish and manage partner upskilling programs shown to candidates.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateCourseModal}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Course</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-[#E5EAF0] p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#F47A24]">
                        {course.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize ${statusBadgeClasses(
                          course.status
                        )}`}
                      >
                        {course.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#102B4E]">{course.title}</h3>
                    <p className="text-xs text-[#778397] line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#253449] pt-1">
                      <span>{course.provider || 'ABHI Partner'}</span>
                      <span>&middot;</span>
                      <span>{course.learningMode || 'Online'}</span>
                      <span>&middot;</span>
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#102B4E]">
                      {course.fees || 'Enquire for Fees'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCourseModal(course)}
                        className="p-2 rounded-lg text-[#253449] hover:bg-[#F6F8FB] cursor-pointer"
                        title="Edit course"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateCourseStatus(
                            course.id,
                            course.status === 'published' ? 'draft' : 'published'
                          )
                        }
                        className="p-2 rounded-lg text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer"
                        title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                      >
                        {course.status === 'published' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCourse(course.id)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Course Enquiries Table */}
            <div className="bg-white rounded-2xl border border-[#E5EAF0] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#F47A24]" />
                  <h3 className="text-sm font-bold text-[#102B4E]">
                    Recent Course Enquiries ({courseEnquiries.length})
                  </h3>
                </div>
              </div>
              {courseEnquiries.length > 0 ? (
                <div className="divide-y divide-[#E5EAF0]">
                  {courseEnquiries.map((ce) => (
                    <div
                      key={ce.id}
                      className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#102B4E]">{ce.name}</span>{' '}
                        <span className="text-[#778397]">enquired about</span>{' '}
                        <span className="font-semibold text-[#F47A24]">
                          {ce.courseTitle}
                        </span>
                        <div className="text-[#778397] mt-0.5">
                          {ce.email} &middot; {ce.phone}
                          {ce.message ? ` — "${ce.message}"` : ''}
                        </div>
                      </div>
                      <span className="text-[#778397] shrink-0">{ce.createdAt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#778397]">
                  Candidate course enquiries submitted on Learn with ABHI will appear here.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT JOB MODAL */}
      {showJobModal && (
        <div
          onClick={() => setShowJobModal(false)}
          className="fixed inset-0 z-50 bg-[#081D36]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#E5EAF0] shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F6F8FB]">
              <h2 className="text-base font-bold text-[#102B4E]">
                {editingJobId ? 'Edit Job Listing' : 'Create New Job Listing'}
              </h2>
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-[#778397] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Financial Analyst"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Hiring Client / Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="e.g. FinEdge Advisory (Client)"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={jobDepartment}
                    onChange={(e) => setJobDepartment(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={jobIndustry}
                    onChange={(e) => setJobIndustry(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Work Mode
                  </label>
                  <select
                    value={jobWorkMode}
                    onChange={(e) => setJobWorkMode(e.target.value as Job['workMode'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Employment Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as Job['employmentType'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Experience Level
                  </label>
                  <select
                    value={jobLevel}
                    onChange={(e) => setJobLevel(e.target.value as Job['experienceLevel'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Salary Min (INR/yr)
                  </label>
                  <input
                    type="number"
                    value={jobSalaryMin}
                    onChange={(e) => setJobSalaryMin(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Salary Max (INR/yr)
                  </label>
                  <input
                    type="number"
                    value={jobSalaryMax}
                    onChange={(e) => setJobSalaryMax(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Min Experience (Years)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={jobMinExp}
                    onChange={(e) => setJobMinExp(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={jobDeadline}
                    onChange={(e) => setJobDeadline(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                  Role Overview *
                </label>
                <textarea
                  rows={3}
                  required
                  value={jobOverview}
                  onChange={(e) => setJobOverview(e.target.value)}
                  placeholder="Clear summary of the role and business impact..."
                  className="w-full p-3 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Responsibilities (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={jobResponsibilities}
                    onChange={(e) => setJobResponsibilities(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Requirements (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Status
                  </label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value as Job['status'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="published">Published (Live)</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E5EAF0] text-sm font-semibold text-[#778397] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold cursor-pointer"
                >
                  {editingJobId ? 'Update Job' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      {showCourseModal && (
        <div
          onClick={() => setShowCourseModal(false)}
          className="fixed inset-0 z-50 bg-[#081D36]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#E5EAF0] shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F6F8FB]">
              <h2 className="text-base font-bold text-[#102B4E]">
                {editingCourseId ? 'Edit Course' : 'Add Partner Course'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="w-9 h-9 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-[#778397] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Data Analytics & Business Intelligence"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Training Provider
                  </label>
                  <input
                    type="text"
                    value={courseProvider}
                    onChange={(e) => setCourseProvider(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Learning Mode
                  </label>
                  <select
                    value={courseMode}
                    onChange={(e) =>
                      setCourseMode(e.target.value as NonNullable<Course['learningMode']>)
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="Live Online">Live Online</option>
                    <option value="Online">Online</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Self-Paced">Self-Paced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Level
                  </label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value as Course['level'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="Foundational">Foundational</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Fees
                  </label>
                  <input
                    type="text"
                    value={courseFees}
                    onChange={(e) => setCourseFees(e.target.value)}
                    placeholder="e.g. ₹14,999 or Free"
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                  Course Overview *
                </label>
                <textarea
                  rows={3}
                  required
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={courseOutcomes}
                    onChange={(e) => setCourseOutcomes(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Curriculum Modules (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={courseCurriculum}
                    onChange={(e) => setCourseCurriculum(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E5EAF0] text-xs focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Skills Covered (comma separated)
                  </label>
                  <input
                    type="text"
                    value={courseSkills}
                    onChange={(e) => setCourseSkills(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Status
                  </label>
                  <select
                    value={courseStatus}
                    onChange={(e) => setCourseStatus(e.target.value as Course['status'])}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm bg-white focus:outline-none focus:border-[#102B4E]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E5EAF0] text-sm font-semibold text-[#778397] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold cursor-pointer"
                >
                  {editingCourseId ? 'Save Course' : 'Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {interviewTargetApp && (
        <div
          onClick={() => setInterviewTargetApp(null)}
          className="fixed inset-0 z-50 bg-[#081D36]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#E5EAF0] shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-lg overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F6F8FB]">
              <div>
                <h2 className="text-base font-bold text-[#102B4E]">Schedule Interview</h2>
                <p className="text-xs text-[#778397]">
                  {interviewTargetApp.candidateName} &middot; {interviewTargetApp.jobTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInterviewTargetApp(null)}
                className="w-9 h-9 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-[#778397] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmInterview} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={intDate}
                    onChange={(e) => setIntDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    required
                    value={intTime}
                    onChange={(e) => setIntTime(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                  Interview Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Video', 'Phone', 'In-person'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setIntType(mode)}
                      className={`min-h-[40px] rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        intType === mode
                          ? 'bg-[#102B4E] text-white border-[#102B4E]'
                          : 'bg-white text-[#253449] border-[#E5EAF0] hover:bg-[#F6F8FB]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                  Meeting Link / Venue
                </label>
                <input
                  type="text"
                  value={intLink}
                  onChange={(e) => setIntLink(e.target.value)}
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                  Candidate Instructions
                </label>
                <textarea
                  rows={2}
                  value={intNotes}
                  onChange={(e) => setIntNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#E5EAF0] text-sm focus:outline-none focus:border-[#102B4E]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInterviewTargetApp(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E5EAF0] text-sm font-semibold text-[#778397] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Notify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
