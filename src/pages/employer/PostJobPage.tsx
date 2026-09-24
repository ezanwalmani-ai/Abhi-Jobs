import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Job } from '../../types';
import {
  Briefcase,
  Building2,
  DollarSign,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface PostJobPageProps {
  navigate: (route: string) => void;
}

export const PostJobPage: React.FC<PostJobPageProps> = ({ navigate }) => {
  const { createJob, currentEmployer, currentUser, showToast } = useApp();

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState(currentEmployer?.companyName || currentEmployer?.name || '');
  const [department, setDepartment] = useState('Engineering');
  const [industry, setIndustry] = useState(currentEmployer?.industry || 'Technology & Software');
  const [location, setLocation] = useState(currentEmployer?.location || 'Remote');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site'>('Hybrid');
  const [employmentType, setEmploymentType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Internship'>('Full-time');
  const [experienceLevel, setExperienceLevel] = useState<'Fresher' | 'Junior' | 'Mid' | 'Senior'>('Mid');
  const [minExpYears, setMinExpYears] = useState(2);
  const [salaryMin, setSalaryMin] = useState(600000);
  const [salaryMax, setSalaryMax] = useState(1200000);
  const [salaryCurrency, setSalaryCurrency] = useState<'INR' | 'USD'>('INR');
  const [overview, setOverview] = useState('');
  const [deadline, setDeadline] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Dynamic responsibilities
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Design and implement scalable production features and backend services.',
    'Collaborate closely with product management and UX design teams.',
  ]);
  const [newResp, setNewResp] = useState('');

  // Dynamic requirements
  const [requirements, setRequirements] = useState<string[]>([
    'Strong analytical problem-solving and software architecture capabilities.',
    'Proven track record in high-velocity agile delivery environments.',
  ]);
  const [newReq, setNewReq] = useState('');

  // Skills
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js', 'PostgreSQL']);
  const [newSkill, setNewSkill] = useState('');

  const handleAddResp = () => {
    if (!newResp.trim()) return;
    setResponsibilities([...responsibilities, newResp.trim()]);
    setNewResp('');
  };

  const handleAddReq = () => {
    if (!newReq.trim()) return;
    setRequirements([...requirements, newReq.trim()]);
    setNewReq('');
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !overview.trim()) {
      showToast('error', 'Validation Error', 'Please complete the title and overview.');
      return;
    }
    const finalCompanyName = companyName.trim() || currentEmployer?.companyName || currentEmployer?.name || 'ABHI JOBS Partner Company';
    if (!agreedToTerms) {
      showToast('error', 'Terms Required', 'Please accept the Terms & Conditions and Privacy Policy.');
      return;
    }

    const newJob = {
      title: title.trim(),
      employerId: currentEmployer?.id || currentUser?.id || 'emp-user',
      companyName: finalCompanyName,
      companyLogo: currentEmployer?.logo || '',
      department,
      industry,
      location,
      workMode,
      employmentType,
      experienceLevel,
      minExperienceYears: minExpYears,
      salary: {
        min: salaryMin,
        max: salaryMax,
        currency: salaryCurrency,
        period: 'yearly' as const,
      },
      overview,
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Fulfill core responsibilities as assigned.'],
      requirements: requirements.length > 0 ? requirements : ['Relevant qualifications and experience.'],
      preferredSkills: skills,
      benefits: ['Competitive Compensation', 'Skill Development', 'Career Growth'],
      deadline: deadline || undefined,
      featured: false,
      status: 'published' as const,
    };

    createJob(newJob);
    navigate('/jobs');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <button
          onClick={() => navigate('/employer/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employer Hub</span>
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Post a Job Opening</h1>
            <p className="text-xs text-slate-500 mt-1">
              Publish a verified opening to attract skill-accredited talent on the ABHI JOBS platform.
            </p>
          </div>

          {/* Basic info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lead Frontend Architect, DevOps Engineer..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Hiring Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Your Organization Name"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Work Mode</label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white cursor-pointer"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white cursor-pointer"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Compensation */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Min Salary (Annual)</label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Max Salary (Annual)</label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Currency</label>
                <select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 mt-1 bg-white cursor-pointer"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Role Overview / Summary</label>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={3}
                placeholder="Describe the mission, impact, and core charter of this position..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700">Required Skills &amp; Competencies</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. Next.js, Redux, Docker)..."
                className="text-xs p-2.5 rounded-xl border border-slate-200 flex-1"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#004D40] border border-teal-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((sk) => sk !== s))}
                    className="hover:text-red-600 text-slate-400 text-xs"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                id="post-job-consent-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#004D40] focus:ring-[#004D40] cursor-pointer accent-[#004D40] shrink-0"
              />
              <span className="leading-snug">
                I agree to ABHI JOBS&apos;s{' '}
                <button
                  type="button"
                  onClick={() => navigate('/terms-and-conditions')}
                  className="text-[#004D40] font-semibold underline hover:text-[#061226] cursor-pointer inline"
                >
                  Terms &amp; Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="text-[#004D40] font-semibold underline hover:text-[#061226] cursor-pointer inline"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/employer/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Verified Opening</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
