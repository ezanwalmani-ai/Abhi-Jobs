import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, StaggerGroup, StaggerItem, EASE_PREMIUM } from '../../lib/motion';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  Building2,
  TrendingUp,
  Sparkles,
  Search,
  Award,
  Check,
  X,
  Plus,
  Trash2,
  BookOpen,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Eye,
  SlidersHorizontal,
  Database,
  RefreshCw,
  Copy,
  CheckCheck,
  Server,
  Key,
  Link2,
} from 'lucide-react';
import { Job, Course } from '../../types';
import { AbhiJobsLogo } from '../../components/AbhiJobsLogo';
import { SUPABASE_SQL_SCHEMA } from '../../lib/supabaseSchema';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../../lib/supabase';

interface AdminDashboardProps {
  navigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const {
    jobs,
    courses,
    candidates,
    companies,
    applications,
    createJob,
    updateJobStatus,
    deleteJob,
    createCourse,
    updateCourseStatus,
    deleteCourse,
    verifyEmployer,
    exportCsvReport,
    showToast,
    supabaseConnected,
    supabaseHealth,
    refreshSupabaseStatus,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'jobs' | 'courses' | 'verifications' | 'reports' | 'database'>('jobs');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const res = await refreshSupabaseStatus();
      if (res.connected) {
        showToast('success', 'Supabase Connected!', `Cloud endpoint active: ${res.url}`);
      } else {
        showToast('warning', 'Connection Check', res.message || 'Unable to connect to Supabase.');
      }
    } catch {
      showToast('error', 'Connection Failed', 'Could not reach Supabase endpoint.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    showToast('success', 'SQL Schema Copied!', 'Paste into your Supabase SQL Editor and click Run.');
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  // Job Creation Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDepartment, setJobDepartment] = useState('Engineering');
  const [jobLocation, setJobLocation] = useState('Remote');
  const [jobWorkMode, setJobWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Internship'>('Full-time');
  const [jobLevel, setJobLevel] = useState<'Fresher' | 'Junior' | 'Mid' | 'Senior'>('Mid');
  const [jobSalaryMin, setJobSalaryMin] = useState(800000);
  const [jobSalaryMax, setJobSalaryMax] = useState(1600000);
  const [jobOverview, setJobOverview] = useState('');
  const [jobSkills, setJobSkills] = useState('React, TypeScript, Node.js');
  const [jobStatus, setJobStatus] = useState<'published' | 'draft'>('published');

  // Course Creation Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Software Engineering');
  const [courseLevel, setCourseLevel] = useState<'Foundational' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [courseModules, setCourseModules] = useState(8);
  const [courseDuration, setCourseDuration] = useState('4 Weeks');
  const [courseBadge, setCourseBadge] = useState('');
  const [courseStatus, setCourseStatus] = useState<'published' | 'draft'>('published');

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobCompany.trim() || !jobOverview.trim()) {
      showToast('error', 'Missing Information', 'Please fill in Job Title, Company, and Overview.');
      return;
    }

    const skillsArray = jobSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createJob({
      title: jobTitle.trim(),
      employerId: 'admin-emp',
      companyName: jobCompany.trim(),
      companyLogo: '',
      department: jobDepartment,
      industry: 'Technology',
      location: jobLocation,
      workMode: jobWorkMode,
      employmentType: jobType,
      experienceLevel: jobLevel,
      minExperienceYears: jobLevel === 'Fresher' ? 0 : jobLevel === 'Junior' ? 1 : jobLevel === 'Mid' ? 3 : 5,
      salary: {
        min: Number(jobSalaryMin),
        max: Number(jobSalaryMax),
        currency: 'INR',
        period: 'yearly',
      },
      overview: jobOverview.trim(),
      responsibilities: [
        'Deliver core deliverables in high-standard software or business operations.',
        'Collaborate across cross-functional product and engineering teams.',
      ],
      requirements: [
        'Demonstrated skills in core competencies listed in the job specification.',
        'Relevant industry experience or verified ABHI JOBS benchmark scores.',
      ],
      preferredSkills: skillsArray.length > 0 ? skillsArray : ['Communication', 'Teamwork'],
      benefits: ['Competitive Compensation', 'Health Coverage', 'Growth Opportunities'],
      featured: false,
      status: jobStatus,
    });

    setShowJobModal(false);
    // Reset inputs
    setJobTitle('');
    setJobCompany('');
    setJobOverview('');
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      showToast('error', 'Validation Error', 'Course title is required.');
      return;
    }

    createCourse({
      title: courseTitle.trim(),
      category: courseCategory,
      level: courseLevel,
      modulesCount: Number(courseModules) || 6,
      duration: courseDuration || '4 Weeks',
      badgeName: courseBadge.trim() || `Verified ${courseCategory} Specialist`,
      status: courseStatus,
    });

    setShowCourseModal(false);
    setCourseTitle('');
    setCourseBadge('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <ScrollReveal direction="up" distance={16}>
          <div className="bg-[#061226] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <AbhiJobsLogo variant="horizontal" theme="dark" size="sm" />
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-900/80 border border-purple-500/40 text-[11px] font-bold text-purple-300">
                  <Shield className="w-3.5 h-3.5" />
                  Administrator Operations
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-2">Platform Administration &amp; Moderation Hub</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                The Admin Backend is the single source of truth for jobs, courses, accreditations, and marketplace operations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowJobModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create &amp; Publish Job</span>
              </button>
              <button
                onClick={() => setShowCourseModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Add Course Track</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Real Metrics Counter */}
        <StaggerGroup staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-full"
            >
              <div className="text-xs font-semibold text-slate-500">Live Jobs in Database</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{jobs.length}</div>
              <div className="text-[11px] text-[#004D40] font-medium">
                {jobs.filter((j) => j.status === 'published').length} published on marketplace
              </div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-full"
            >
              <div className="text-xs font-semibold text-slate-500">Curriculum Tracks</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{courses.length}</div>
              <div className="text-[11px] text-purple-700 font-medium">
                {courses.filter((c) => c.status === 'published').length} available to learners
              </div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-full"
            >
              <div className="text-xs font-semibold text-slate-500">Registered Talent</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{candidates.length}</div>
              <div className="text-[11px] text-blue-700 font-medium">Real candidate accounts</div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: EASE_PREMIUM } }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-full"
            >
              <div className="text-xs font-semibold text-slate-500">Employer Partners</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{companies.length}</div>
              <div className="text-[11px] text-amber-700 font-medium">Verified organization records</div>
            </motion.div>
          </StaggerItem>
        </StaggerGroup>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'jobs' ? 'bg-[#061226] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Manage Jobs ({jobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'courses' ? 'bg-[#061226] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manage Courses ({courses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'verifications' ? 'bg-[#061226] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Verifications &amp; KYC</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'reports' ? 'bg-[#061226] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Data Exports</span>
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'database' ? 'bg-[#061226] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Cloud</span>
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>

        {/* TAB 5: SUPABASE CLOUD DATABASE */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Supabase Connection Overview Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-slate-900">Supabase Cloud Database</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          supabaseConnected
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            supabaseConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
                          }`}
                        />
                        {supabaseConnected ? 'Connected & Active' : 'Connecting...'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Managed PostgreSQL cloud instance powering the ABHI JOBS production backend.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                  </button>

                  <a
                    href="https://supabase.com/dashboard/project/ruagizqernsqypujeutu"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Supabase Dashboard</span>
                  </a>
                </div>
              </div>

              {/* Endpoint & Key Diagnostic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Server className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cloud Endpoint</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1.5 truncate">
                    {SUPABASE_URL}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>HTTPS REST / Auth API</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Key className="w-3.5 h-3.5 text-purple-600" />
                    <span>Publishable Client Key</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1.5 truncate">
                    sb_publishable_rri7Egy...HLeC
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active in Web Client</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auth &amp; Security</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1.5">
                    Supabase Auth + RLS Policies
                  </div>
                  <div className="text-[11px] text-blue-700 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Session persistence enabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Database Tables & Schema Management Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Database Schema &amp; Tables</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Core relational tables defined for ABHI JOBS talent, job postings, and applications.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleCopySchema}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004D40] hover:bg-[#00382f] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {copiedSchema ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchema ? 'Copied!' : 'Copy SQL Schema'}</span>
                  </button>

                  <a
                    href="https://supabase.com/dashboard/project/ruagizqernsqypujeutu/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Open SQL Editor</span>
                  </a>
                </div>
              </div>

              {/* Step by Step Guide Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>How to Apply Schema to Your Supabase Instance (30 Seconds):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-amber-900/90 pl-1 font-medium">
                  <li>Click <strong>&ldquo;Copy SQL Schema&rdquo;</strong> above to copy the complete DDL script.</li>
                  <li>Click <strong>&ldquo;Open SQL Editor&rdquo;</strong> to open your Supabase SQL editor in a new tab.</li>
                  <li>Paste the script into the query editor and click <strong>&ldquo;Run&rdquo;</strong>.</li>
                  <li>All 7 tables (<code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">users</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">candidates</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">employers</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">jobs</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">applications</code>, etc.) and security policies will be established instantly!</li>
                </ol>
              </div>

              {/* Table Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {[
                  { name: 'users', desc: 'Core platform users, emails, roles, and avatar identifiers' },
                  { name: 'candidates', desc: 'Job seeker profiles, headlines, skills array, and resumes' },
                  { name: 'employers', desc: 'Hiring companies, verification status, and recruiter profiles' },
                  { name: 'jobs', desc: 'Live job openings, requirements, compensation, and counters' },
                  { name: 'applications', desc: 'Job applications, candidate submissions, and review statuses' },
                  { name: 'saved_jobs', desc: 'Candidate saved bookmarks with user-job relationship' },
                  { name: 'notifications', desc: 'System and activity notifications with read/unread markers' },
                ].map((tbl) => (
                  <div key={tbl.name} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 font-mono">public.{tbl.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tbl.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Collapsible Schema Preview */}
              <div className="pt-2">
                <details className="group border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-slate-200">
                  <summary className="px-4 py-3 text-xs font-bold flex items-center justify-between cursor-pointer hover:bg-slate-800/80 select-none">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Preview Complete PostgreSQL Schema DDL (schema.sql)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-96 text-slate-300 bg-slate-950/60 border-t border-slate-800">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'jobs' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Marketplace Job Postings</h3>
                <p className="text-xs text-slate-500">Only jobs created and published here appear on the public website.</p>
              </div>
              <button
                onClick={() => setShowJobModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#004D40] hover:bg-[#00382f] text-white text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create &amp; Publish Job</span>
              </button>
            </div>

            {jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{job.title}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            job.status === 'published'
                              ? 'bg-teal-100 text-[#004D40]'
                              : job.status === 'draft'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {job.companyName} &bull; {job.location} ({job.workMode}) &bull; {job.employmentType} &bull;{' '}
                        {job.applicantsCount} applicants
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {job.status === 'published' ? (
                        <button
                          onClick={() => updateJobStatus(job.id, 'paused')}
                          className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => updateJobStatus(job.id, 'published')}
                          className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-[#004D40] text-xs font-semibold hover:bg-teal-100 cursor-pointer"
                        >
                          Publish
                        </button>
                      )}

                      <button
                        onClick={() => deleteJob(job.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No opportunities available right now</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed mb-5">
                  Zero marketplace jobs exist in the database. When an administrator creates and publishes an opportunity, it will display on the live website.
                </p>
                <button
                  onClick={() => setShowJobModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create &amp; Publish Real Job</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE COURSES */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Accredited Learning &amp; Upskill Tracks</h3>
                <p className="text-xs text-slate-500">Manage skill certification modules visible in the Job Seeker Upskill center.</p>
              </div>
              <button
                onClick={() => setShowCourseModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Course Track</span>
              </button>
            </div>

            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md">
                          {course.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            course.status === 'published' ? 'bg-teal-100 text-[#004D40]' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{course.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {course.modulesCount} modules &bull; {course.duration} &bull; Level: {course.level}
                      </p>
                      {course.badgeName && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                          <Award className="w-3.5 h-3.5 text-[#004D40]" />
                          <span className="font-semibold">{course.badgeName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      {course.status === 'published' ? (
                        <button
                          onClick={() => updateCourseStatus(course.id, 'draft')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          onClick={() => updateCourseStatus(course.id, 'published')}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-[#004D40] hover:bg-teal-100 cursor-pointer"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteCourse(course.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No courses available right now</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed mb-5">
                  We're preparing new curriculum and tracks. You can create an accredited track using the button below.
                </p>
                <button
                  onClick={() => setShowCourseModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Course Track</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VERIFICATIONS & KYC */}
        {activeTab === 'verifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Candidate Verification Queue */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#004D40]" />
                  <span>Candidate Skill Certifications</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {candidates.length} Registered
                </span>
              </div>

              {candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                          <p className="text-xs text-slate-500">{c.headline || c.email}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] border border-teal-200 text-[10px] font-bold">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No talent profiles currently registered. When job seekers register, their records will display here.
                </div>
              )}
            </div>

            {/* Employer Verification Queue */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-700" />
                  <span>Employer Partner Accreditations</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  {companies.length} Partners
                </span>
              </div>

              {companies.length > 0 ? (
                <div className="space-y-3">
                  {companies.map((comp) => (
                    <div key={comp.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {comp.logo ? (
                            <img src={comp.logo} alt={comp.companyName || comp.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {(comp.companyName || comp.name || 'C')[0]}
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{comp.companyName || comp.name}</h4>
                            <p className="text-[11px] text-slate-500">{comp.industry}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] border border-teal-200 text-[10px] font-bold">
                          {comp.verificationStatus || 'Verified'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No employer partner accounts currently registered. When organizations register, their accreditations will appear here.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REPORTS & CSV EXPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Audit &amp; Compliance CSV Exports</h3>
              <p className="text-xs text-slate-500">Download single-source-of-truth CSV data snapshots directly from the database.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => exportCsvReport('jobs')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all text-left group cursor-pointer bg-slate-50/60"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#004D40] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Export Jobs Register</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Download all {jobs.length} published &amp; draft job postings.</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#004D40]">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </div>
              </button>

              <button
                onClick={() => exportCsvReport('candidates')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all text-left group cursor-pointer bg-slate-50/60"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Export Talent Register</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Download talent directory with skills and accreditation status.</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-700">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </div>
              </button>

              <button
                onClick={() => exportCsvReport('employers')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all text-left group cursor-pointer bg-slate-50/60"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Export Companies Register</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Download partner employers and verification status.</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-purple-700">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </div>
              </button>

              <button
                onClick={() => exportCsvReport('applications')}
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all text-left group cursor-pointer bg-slate-50/60"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Export Applications Register</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Download candidate application audit trail and timestamps.</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* MODAL: CREATE REAL JOB */}
        {showJobModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create &amp; Publish Real Job</h3>
                  <p className="text-xs text-slate-500">This opening will be immediately stored in the single source of truth database.</p>
                </div>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Job Title *</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Backend Engineer"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Hiring Organization *</label>
                    <input
                      type="text"
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      placeholder="e.g. TechCorp Solutions"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Location</label>
                    <input
                      type="text"
                      value={jobLocation}
                      onChange={(e) => setJobLocation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Work Mode</label>
                    <select
                      value={jobWorkMode}
                      onChange={(e) => setJobWorkMode(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 bg-white"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Employment Type</label>
                    <select
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 bg-white"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Experience Level</label>
                    <select
                      value={jobLevel}
                      onChange={(e) => setJobLevel(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 bg-white"
                    >
                      <option value="Fresher">Fresher</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid</option>
                      <option value="Senior">Senior</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Min Annual Salary (₹)</label>
                    <input
                      type="number"
                      value={jobSalaryMin}
                      onChange={(e) => setJobSalaryMin(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Max Annual Salary (₹)</label>
                    <input
                      type="number"
                      value={jobSalaryMax}
                      onChange={(e) => setJobSalaryMax(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Key Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    placeholder="React, TypeScript, Tailwind, Python"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Role Overview / Summary *</label>
                  <textarea
                    value={jobOverview}
                    onChange={(e) => setJobOverview(e.target.value)}
                    rows={3}
                    placeholder="Brief mission, core deliverables, and expectations for this role..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Status:</label>
                    <select
                      value={jobStatus}
                      onChange={(e) => setJobStatus(e.target.value as any)}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="published">Published (Live immediately)</option>
                      <option value="draft">Draft (Hidden)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowJobModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                      Save &amp; Publish Job
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE COURSE TRACK */}
        {showCourseModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Accredited Course Track</h3>
                  <p className="text-xs text-slate-500">Learning tracks appear in the Job Seeker Upskill center.</p>
                </div>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Course Track Title *</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Modern Full-Stack Cloud Development"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-purple-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Category</label>
                    <select
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 bg-white"
                    >
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Finance & Analytics">Finance &amp; Analytics</option>
                      <option value="Operations & Logistics">Operations &amp; Logistics</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                      <option value="Data Science & AI">Data Science &amp; AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Level</label>
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 bg-white"
                    >
                      <option value="Foundational">Foundational</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Estimated Duration</label>
                    <input
                      type="text"
                      value={courseDuration}
                      onChange={(e) => setCourseDuration(e.target.value)}
                      placeholder="e.g. 6 Weeks"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Module Count</label>
                    <input
                      type="number"
                      value={courseModules}
                      onChange={(e) => setCourseModules(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Certification Badge Name</label>
                  <input
                    type="text"
                    value={courseBadge}
                    onChange={(e) => setCourseBadge(e.target.value)}
                    placeholder="e.g. Certified Cloud Architecture Practitioner"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-700">Status:</label>
                    <select
                      value={courseStatus}
                      onChange={(e) => setCourseStatus(e.target.value as any)}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCourseModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                    >
                      Save Track
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
