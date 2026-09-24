import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CandidateProfile, ExperienceItem, EducationItem, CertificationItem } from '../../types';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  User,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Award,
  ArrowLeft,
  Compass,
  FileText,
  Camera,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface CandidateProfilePageProps {
  navigate: (route: string) => void;
}

export const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ navigate }) => {
  const { currentCandidate, currentUser, updateCandidateProfile, showToast } = useApp();

  const [formData, setFormData] = useState<CandidateProfile>(
    currentCandidate || {
      id: currentUser?.id || 'cand-user',
      userId: currentUser?.id || 'user-cand',
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: '',
      headline: '',
      location: '',
      yearsOfExperience: 0,
      experienceLevel: 'Fresher',
      currentRole: '',
      desiredRole: '',
      preferredLocation: '',
      workPreference: 'Remote',
      availability: 'Immediate',
      profileVisibility: 'employers_only',
      availableForOpportunities: true,
      skills: [],
      about: '',
      experiences: [],
      education: [],
      certifications: [],
      resumeName: '',
      completionPercentage: 0,
      recommendations: [],
    }
  );

  React.useEffect(() => {
    if (currentCandidate) {
      setFormData(currentCandidate);
    }
  }, [currentCandidate]);

  const [newSkill, setNewSkill] = useState('');

  // Calculate profile completion percentage dynamically
  const calculateCompletion = (profile: CandidateProfile): number => {
    let score = 40;
    if (profile.name && profile.name.trim().length > 2) score += 10;
    if (profile.headline && profile.headline.trim().length > 3) score += 10;
    if (profile.about && profile.about.trim().length > 20) score += 10;
    if (profile.skills && profile.skills.length >= 3) score += 10;
    if (profile.experiences && profile.experiences.length > 0) score += 5;
    if (profile.education && profile.education.length > 0) score += 5;
    if (profile.certifications && profile.certifications.length > 0) score += 5;
    if (profile.resumeName) score += 5;
    return Math.min(100, score);
  };

  const completionRate = calculateCompletion(formData);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...formData,
      completionPercentage: completionRate,
    };
    updateCandidateProfile(updated);
    showToast('success', 'Profile Saved', 'Your profile information has been updated successfully.');
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (formData.skills.includes(newSkill.trim())) return;
    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill.trim()],
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  // Work Experience Handlers
  const handleAddExperience = () => {
    const newExp: ExperienceItem = {
      id: 'exp-' + Date.now(),
      jobTitle: '',
      company: '',
      startDate: new Date().getFullYear().toString(),
      endDate: '',
      current: true,
      description: '',
    };
    setFormData({
      ...formData,
      experiences: [newExp, ...formData.experiences],
    });
  };

  const handleRemoveExperience = (id: string) => {
    setFormData({
      ...formData,
      experiences: formData.experiences.filter((e) => e.id !== id),
    });
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newEdu: EducationItem = {
      id: 'edu-' + Date.now(),
      qualification: '',
      institution: '',
      fieldOfStudy: '',
      startYear: '',
      endYear: '',
    };
    setFormData({
      ...formData,
      education: [newEdu, ...formData.education],
    });
  };

  const handleRemoveEducation = (id: string) => {
    setFormData({
      ...formData,
      education: formData.education.filter((e) => e.id !== id),
    });
  };

  // Certification Handlers
  const handleAddCertification = () => {
    const newCert: CertificationItem = {
      id: 'cert-' + Date.now(),
      title: '',
      issuer: '',
      issueDate: new Date().getFullYear().toString(),
      credentialUrl: '',
    };
    setFormData({
      ...formData,
      certifications: [newCert, ...formData.certifications],
    });
  };

  const handleRemoveCertification = (id: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/candidate/dashboard')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Dashboard</span>
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save My Profile</span>
          </button>
        </div>

        {/* Profile Completion Indicator */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#004D40] border border-teal-200 flex items-center justify-center font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#004D40]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Your Profile is {completionRate}% Complete
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete your profile to help employers better understand your skills and experience.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#004D40] self-end sm:self-auto bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {completionRate}% Completed
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#004D40] h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Profile Form Card */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-8">
          {/* Header Title */}
          <div className="border-b border-slate-100 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  My Profile
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage your personal information, skills, experience, education, and career preferences.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200">
                <ShieldCheck className="w-4 h-4 text-[#004D40]" />
                Verified Status Active
              </span>
            </div>
          </div>

          {/* Section 1: Personal Information & Profile Photo */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>1. My Information</span>
            </h2>

            {/* Profile Photo Row */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-teal-200 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-teal-50 text-[#004D40] border border-teal-200 flex items-center justify-center font-bold text-2xl border-2 border-teal-200">
                    {formData.name ? formData.name.charAt(0) : 'A'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#004D40] text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-3 h-3" />
                </div>
              </div>

              <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Profile Photo URL</label>
                  <p className="text-[11px] text-slate-400">Add an image URL to represent you across applications.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={formData.avatar || ''}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:border-[#061226] focus:outline-hidden"
                  />
                  {formData.avatar && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: '' })}
                      className="text-xs text-slate-500 hover:text-red-600 px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full legal or professional name"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Professional Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Senior Full Stack Engineer | React & Cloud Systems"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bangalore, India"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Level</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceLevel: e.target.value as CandidateProfile['experienceLevel'],
                      })
                    }
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="Junior">Junior (1-3 yrs)</option>
                    <option value="Mid">Mid (3-5 yrs)</option>
                    <option value="Senior">Senior (5-8 yrs)</option>
                    <option value="Lead">Lead / Staff (8+ yrs)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700">About Me (Bio &amp; Summary)</label>
              <textarea
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden leading-relaxed bg-white"
                placeholder="Share your technical background, accomplishments, engineering philosophies, and career aspirations..."
              />
            </div>
          </div>

          {/* Section 2: Skills */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2. My Skills</span>
            </h2>
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
                placeholder="Type a skill and press Enter (e.g. React, TypeScript, Python, Docker)..."
                className="text-xs p-3 rounded-xl border border-slate-200 flex-1 focus:border-[#061226] focus:outline-hidden bg-white"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer shrink-0"
              >
                Add Skill
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[#004D40] text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#004D40]" />
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#004D40] hover:text-red-600 ml-1 text-xs cursor-pointer"
                    title="Remove skill"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Work Experience */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>3. My Experience</span>
              </h2>
              <button
                type="button"
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#004D40] hover:text-[#061226] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {formData.experiences.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                <p>No work experience positions added yet.</p>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="mt-2 text-xs font-bold text-[#004D40] underline"
                >
                  Add your first position
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.experiences.map((exp, idx) => (
                  <div key={exp.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Position #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(exp.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Remove position"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={exp.jobTitle}
                        onChange={(e) => {
                          const updated = [...formData.experiences];
                          updated[idx].jobTitle = e.target.value;
                          setFormData({ ...formData, experiences: updated });
                        }}
                        placeholder="Job Title (e.g. Senior Frontend Engineer)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...formData.experiences];
                          updated[idx].company = e.target.value;
                          setFormData({ ...formData, experiences: updated });
                        }}
                        placeholder="Company Name (e.g. Acme Corp)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => {
                          const updated = [...formData.experiences];
                          updated[idx].startDate = e.target.value;
                          setFormData({ ...formData, experiences: updated });
                        }}
                        placeholder="Start Date / Year (e.g. 2021)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => {
                          const updated = [...formData.experiences];
                          updated[idx].endDate = e.target.value;
                          setFormData({ ...formData, experiences: updated });
                        }}
                        placeholder="End Date / Year (or Present)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const updated = [...formData.experiences];
                        updated[idx].description = e.target.value;
                        setFormData({ ...formData, experiences: updated });
                      }}
                      placeholder="Key contributions, technologies leveraged, and engineering milestones..."
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Education */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>4. My Education</span>
              </h2>
              <button
                type="button"
                onClick={handleAddEducation}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#004D40] hover:text-[#061226] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education</span>
              </button>
            </div>

            {formData.education.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                <p>No educational credentials added yet.</p>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="mt-2 text-xs font-bold text-[#004D40] underline"
                >
                  Add education
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.education.map((edu, idx) => (
                  <div key={edu.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Education #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(edu.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Remove education"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={edu.qualification}
                        onChange={(e) => {
                          const updated = [...formData.education];
                          updated[idx].qualification = e.target.value;
                          setFormData({ ...formData, education: updated });
                        }}
                        placeholder="Degree / Qualification (e.g. B.Tech, M.S.)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const updated = [...formData.education];
                          updated[idx].institution = e.target.value;
                          setFormData({ ...formData, education: updated });
                        }}
                        placeholder="Institution / University Name"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => {
                          const updated = [...formData.education];
                          updated[idx].fieldOfStudy = e.target.value;
                          setFormData({ ...formData, education: updated });
                        }}
                        placeholder="Field of Study (e.g. Computer Science)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.startYear}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].startYear = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Start Year"
                          className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                        <input
                          type="text"
                          value={edu.endYear}
                          onChange={(e) => {
                            const updated = [...formData.education];
                            updated[idx].endYear = e.target.value;
                            setFormData({ ...formData, education: updated });
                          }}
                          placeholder="Grad Year"
                          className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Certifications */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>5. My Certifications</span>
              </h2>
              <button
                type="button"
                onClick={handleAddCertification}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#004D40] hover:text-[#061226] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Certification</span>
              </button>
            </div>

            {formData.certifications.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl text-xs text-slate-500">
                <p>No certifications or licenses added yet.</p>
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="mt-2 text-xs font-bold text-[#004D40] underline"
                >
                  Add certification
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.certifications.map((cert, idx) => (
                  <div key={cert.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Certification #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Remove certification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={cert.title}
                        onChange={(e) => {
                          const updated = [...formData.certifications];
                          updated[idx].title = e.target.value;
                          setFormData({ ...formData, certifications: updated });
                        }}
                        placeholder="Certificate Title (e.g. AWS Solutions Architect)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const updated = [...formData.certifications];
                          updated[idx].issuer = e.target.value;
                          setFormData({ ...formData, certifications: updated });
                        }}
                        placeholder="Issuing Organization (e.g. AWS, Google)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        value={cert.issueDate}
                        onChange={(e) => {
                          const updated = [...formData.certifications];
                          updated[idx].issueDate = e.target.value;
                          setFormData({ ...formData, certifications: updated });
                        }}
                        placeholder="Issue Date / Year (e.g. 2023)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <input
                        type="url"
                        value={cert.credentialUrl || ''}
                        onChange={(e) => {
                          const updated = [...formData.certifications];
                          updated[idx].credentialUrl = e.target.value;
                          setFormData({ ...formData, certifications: updated });
                        }}
                        placeholder="Verification Link / Credential URL (optional)"
                        className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Career Preferences & Interests */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>6. My Career Preferences</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Preferred Job Roles</label>
                <input
                  type="text"
                  value={formData.desiredRole}
                  onChange={(e) => setFormData({ ...formData, desiredRole: e.target.value })}
                  placeholder="e.g. Staff Software Engineer, Tech Lead"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Preferred Locations</label>
                <input
                  type="text"
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                  placeholder="e.g. Bangalore, Hyderabad, Remote"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Work Mode Preference</label>
                <select
                  value={formData.workPreference}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workPreference: e.target.value as CandidateProfile['workPreference'],
                    })
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white cursor-pointer"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Availability to Join</label>
                <select
                  value={formData.availability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availability: e.target.value as CandidateProfile['availability'],
                    })
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 mt-1 focus:border-[#061226] focus:outline-hidden bg-white cursor-pointer"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="15 Days">15 Days</option>
                  <option value="30 Days">30 Days</option>
                  <option value="Exploring">Exploring Opportunities</option>
                </select>
              </div>
            </div>

            {/* Availability Checkbox */}
            <div className="pt-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="availableForOpportunities"
                checked={formData.availableForOpportunities}
                onChange={(e) => setFormData({ ...formData, availableForOpportunities: e.target.checked })}
                className="w-4 h-4 rounded text-[#004D40] focus:ring-[#004D40] border-slate-300 cursor-pointer"
              />
              <label htmlFor="availableForOpportunities" className="text-xs text-slate-700 cursor-pointer font-medium">
                Open to interview invitations and direct recruiter outreach on ABHI JOBS
              </label>
            </div>
          </div>

          {/* Section 7: Resume */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>7. My Resume</span>
            </h2>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{formData.resumeName || 'No resume uploaded yet'}</div>
                <div className="text-[11px] text-slate-500">Supported file formats: PDF, DOCX (Max 10MB)</div>
              </div>

              <label className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                <Upload className="w-3.5 h-3.5 text-[#004D40]" />
                <span>Upload New</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({ ...formData, resumeName: e.target.files[0].name });
                      showToast('success', 'Resume Selected', e.target.files[0].name);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/candidate/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save My Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
