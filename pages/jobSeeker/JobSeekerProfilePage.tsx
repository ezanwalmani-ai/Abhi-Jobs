import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Save,
  Check,
  Plus,
  X,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  AlertCircle,
  Clock,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface JobSeekerProfilePageProps {
  navigate: (route: string) => void;
}

export const JobSeekerProfilePage: React.FC<JobSeekerProfilePageProps> = ({ navigate }) => {
  const { currentCandidate, currentUser, updateCandidateProfile, showToast } = useApp();

  const [formData, setFormData] = useState({
    name: currentCandidate?.name || currentUser?.name || '',
    headline: currentCandidate?.headline || '',
    email: currentCandidate?.email || currentUser?.email || '',
    phone: currentCandidate?.phone || '',
    location: currentCandidate?.location || '',
    experienceLevel: currentCandidate?.experienceLevel || 'Experienced',
    about: currentCandidate?.about || '',
    skills: currentCandidate?.skills || ['Problem Solving', 'Communication'],
    resumeUrl: currentCandidate?.resumeUrl || '',
    linkedinUrl: (currentCandidate as any)?.linkedinUrl || '',
    portfolioUrl: (currentCandidate as any)?.portfolioUrl || '',
    degree: (currentCandidate as any)?.education?.[0]?.degree || 'Bachelor of Technology / Computer Science',
    institution: (currentCandidate as any)?.education?.[0]?.institution || 'VTU Karnataka',
    currentRole: (currentCandidate as any)?.experience?.[0]?.role || '',
    currentCompany: (currentCandidate as any)?.experience?.[0]?.company || '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate profile strength percentage
  const calculateStrength = () => {
    let score = 20; // Base score for having an account
    if (formData.name.trim().length > 2) score += 15;
    if (formData.headline.trim().length > 3) score += 15;
    if (formData.phone.trim().length >= 10) score += 15;
    if (formData.location.trim().length > 2) score += 10;
    if (formData.about.trim().length > 15) score += 10;
    if (formData.skills.length >= 3) score += 15;
    return Math.min(score, 100);
  };

  const strength = calculateStrength();

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed],
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    updateCandidateProfile({
      name: formData.name,
      headline: formData.headline,
      phone: formData.phone,
      location: formData.location,
      experienceLevel: formData.experienceLevel,
      about: formData.about,
      skills: formData.skills,
      resumeUrl: formData.resumeUrl,
      profileCompleteness: strength,
    });

    setTimeout(() => {
      setIsSaving(false);
      showToast('success', 'Profile Updated', 'Your profile details have been saved successfully.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-[#004D40] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#004D40]" />
              <span>Job Seeker Journey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your personal information, verified skills, and resume visible to employers.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Profile Strength Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Profile Strength: {strength}%</h2>
                {strength === 100 ? (
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 text-[#004D40] text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> All Fields Complete
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold">
                    {100 - strength}% to reach maximum visibility
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Completed profiles receive up to 4x more direct interview invitations from verified recruiters.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#004D40] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#004D40]" />
              <span>Basic &amp; Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Senior Frontend Developer | React & TypeScript"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location (City, State)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bangalore, Karnataka"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40] cursor-pointer"
                >
                  <option value="Fresher">Fresher (0 years)</option>
                  <option value="1-3 Years">Entry / Junior (1-3 years)</option>
                  <option value="Experienced">Mid-Level (3-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">About / Bio</label>
              <textarea
                rows={3}
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                placeholder="Briefly describe your career background, core competencies, and career goals..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
              />
            </div>
          </div>

          {/* Section 2: Key Skills & Badges */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#004D40]" />
                <span>Verified Skills &amp; Competencies</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {formData.skills.length} skills listed
              </span>
            </h3>

            <div className="flex gap-2">
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
                placeholder="Type a skill (e.g. TypeScript, Logistics, Financial Modeling) and press Add..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] text-xs font-semibold"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#004D40] hover:text-[#061226] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Professional Experience & Education */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#004D40]" />
              <span>Education &amp; Background</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highest Degree</label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. B.Tech / B.Sc / MBA"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. Delhi University"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio or GitHub URL</label>
                <input
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  placeholder="https://github.com/yourhandle"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#004D40]"
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
