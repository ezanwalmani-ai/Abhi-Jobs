import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Sliders,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Check,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EducationItem, ExperienceItem } from '../../types';
import confetti from 'canvas-confetti';

interface JobSeekerOnboardingPageProps {
  navigate: (route: string) => void;
}

export const JobSeekerOnboardingPage: React.FC<JobSeekerOnboardingPageProps> = ({ navigate }) => {
  const { currentCandidate, updateCandidateProfile, showToast } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State initialized from candidate profile (which holds registration data)
  const [headline, setHeadline] = useState(
    currentCandidate?.headline ||
      (currentCandidate?.experienceType === 'fresher' ? 'Fresher | Open to Opportunities' : 'Full Stack Developer')
  );
  const [about, setAbout] = useState(
    currentCandidate?.about ||
      'Dedicated professional focused on delivering high impact work, continuous learning, and scalable solutions.'
  );
  const [location, setLocation] = useState(currentCandidate?.location || 'Bangalore, Karnataka');
  const [gender, setGender] = useState(currentCandidate?.gender || '');
  const [dob, setDob] = useState(currentCandidate?.dob || '');
  const [avatar, setAvatar] = useState(
    currentCandidate?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentCandidate?.name || 'AbhiJobsUser')}`
  );

  // Step 2: Education
  const [educationList, setEducationList] = useState<EducationItem[]>(
    currentCandidate?.education && currentCandidate.education.length > 0
      ? currentCandidate.education
      : [
          {
            id: 'edu-1',
            qualification: "Bachelor's Degree",
            institution: 'National Institute of Technology',
            fieldOfStudy: 'Computer Science & Engineering',
            startYear: '2020',
            endYear: '2024',
          },
        ]
  );
  const [cgpa, setCgpa] = useState('8.4 / 10');

  // Step 3: Work Experience
  const isFresher = currentCandidate?.experienceType === 'fresher' || currentCandidate?.experienceLevel === 'Fresher';
  const [experiences, setExperiences] = useState<ExperienceItem[]>(
    currentCandidate?.experiences && currentCandidate.experiences.length > 0
      ? currentCandidate.experiences
      : isFresher
      ? []
      : [
          {
            id: 'exp-1',
            jobTitle: 'Software Engineer',
            company: 'Innovate Tech Solutions',
            startDate: '2022-06',
            endDate: 'Present',
            current: true,
            description: 'Developed and maintained responsive web applications, APIs, and cloud services.',
          },
        ]
  );

  // Step 4: Skills
  const [skillsList, setSkillsList] = useState<Array<{ name: string; level: string; years: number }>>(
    currentCandidate?.skills && currentCandidate.skills.length > 0
      ? currentCandidate.skills.map((s) => ({ name: s, level: 'Intermediate', years: 2 }))
      : [
          { name: 'React', level: 'Intermediate', years: 2 },
          { name: 'TypeScript', level: 'Intermediate', years: 2 },
          { name: 'JavaScript', level: 'Intermediate', years: 3 },
          { name: 'Tailwind CSS', level: 'Expert', years: 3 },
          { name: 'Problem Solving', level: 'Expert', years: 4 },
        ]
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  // Step 5: Career Preferences
  const [desiredRole, setDesiredRole] = useState(currentCandidate?.desiredRole || 'Frontend / Full Stack Developer');
  const [preferredIndustry, setPreferredIndustry] = useState(currentCandidate?.preferredIndustry || 'Information Technology / Software');
  const [preferredLocation, setPreferredLocation] = useState(currentCandidate?.preferredLocation || 'Bangalore / Hybrid');
  const [workPreference, setWorkPreference] = useState<'Remote' | 'Hybrid' | 'On-site' | 'Flexible'>(
    currentCandidate?.workPreference || 'Hybrid'
  );
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [expectedSalary, setExpectedSalary] = useState('₹12 - ₹16 Lakhs P.A.');
  const [availability, setAvailability] = useState<'Immediate' | '15 Days' | '30 Days' | 'Exploring'>(
    currentCandidate?.availability || 'Immediate'
  );
  const [willingToRelocate, setWillingToRelocate] = useState(true);

  // Step 6: Resume
  const [resumeName, setResumeName] = useState(currentCandidate?.resumeName || 'Resume_2025.pdf');
  const [resumeSize, setResumeSize] = useState(currentCandidate?.resumeSize || '1.8 MB');

  // Step progress calculation
  const progressPercent = Math.min(100, Math.round(20 + (currentStep - 1) * 13));

  const steps = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Education', icon: GraduationCap },
    { num: 3, label: 'Experience', icon: Briefcase },
    { num: 4, label: 'Skills', icon: Wrench },
    { num: 5, label: 'Preferences', icon: Sliders },
    { num: 6, label: 'Resume', icon: FileText },
    { num: 7, label: 'Review', icon: CheckCircle2 },
  ];

  const handleAddSkill = (skillToAdd: string) => {
    const clean = skillToAdd.trim();
    if (!clean) return;
    if (!skillsList.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setSkillsList((prev) => [...prev, { name: clean, level: 'Intermediate', years: 1 }]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkillsList((prev) => prev.filter((s) => s.name !== skillName));
  };

  const handleAddExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        id: 'exp-' + Date.now(),
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      },
    ]);
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFinalSubmit = () => {
    // Save to context
    updateCandidateProfile({
      headline,
      about,
      location,
      gender,
      dob,
      avatar,
      education: educationList,
      experiences: isFresher ? [] : experiences,
      skills: skillsList.map((s) => s.name),
      desiredRole,
      preferredIndustry,
      preferredLocation,
      workPreference,
      availability,
      willingToRelocate,
      resumeName,
      resumeSize,
      resumeUpdated: 'Today',
      completionPercentage: 95,
    });

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    showToast('success', 'Profile Completed!', 'Your personalized job recommendations are ready.');
    navigate('/job-seeker/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#004D40] uppercase tracking-widest">
                ABHI JOBS Onboarding
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                Build Your Professional Profile
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Takes 2 minutes. Information here powers your personalized job recommendations.
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Profile Completion
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#061226]">
                {progressPercent}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#061226] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          {/* Steps Breadcrumb */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2">
            {steps.map((s) => {
              const IconComponent = s?.icon || User;
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-[#061226] font-bold border border-teal-200'
                      : isPast
                      ? 'text-slate-700 hover:bg-slate-50'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      isActive
                        ? 'bg-[#061226] text-white'
                        : isPast
                        ? 'bg-teal-100 text-[#004D40]'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? <Check className="w-3.5 h-3.5" /> : <IconComponent className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] truncate max-w-full hidden sm:block">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* STEP 1: PERSONAL PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 1 — Personal Profile</h2>
                <p className="text-xs text-slate-500">Provide your headline and public identity for employers</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-20 h-20 rounded-full border-2 border-[#004D40] object-cover shadow-sm"
                />
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="text-sm font-bold text-slate-900">{currentCandidate?.name || 'Job Seeker'}</div>
                  <div className="text-xs text-slate-500">{currentCandidate?.email}</div>
                  <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() =>
                        setAvatar(
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}&backgroundColor=062e22`
                        )
                      }
                      className="px-3 py-1 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                    >
                      Generate New Avatar
                    </button>
                  </div>
                </div>
              </div>

              {/* Professional Headline */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Professional Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer | React, Node.js & Cloud"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#061226]"
                />
                <p className="text-[11px] text-slate-400">
                  This headline appears directly under your name when recruiters review candidate cards.
                </p>
              </div>

              {/* About Me */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  About Me / Career Summary
                </label>
                <textarea
                  rows={4}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Briefly describe your career focus, core skills, and accomplishments..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#061226]"
                />
              </div>

              {/* Location, DOB, Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#061226]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#061226]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Gender (Optional)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#061226] cursor-pointer"
                  >
                    <option value="">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EDUCATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 2 — Education &amp; Academics</h2>
                <p className="text-xs text-slate-500">Provide details about your degree, institution, and graduation year</p>
              </div>

              {educationList.map((edu, idx) => (
                <div key={edu.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Academic Degree #{idx + 1}
                    </span>
                    {educationList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEducationList((prev) => prev.filter((e) => e.id !== edu.id))}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Qualification / Degree</label>
                      <input
                        type="text"
                        value={edu.qualification}
                        onChange={(e) =>
                          setEducationList((prev) =>
                            prev.map((item) => (item.id === edu.id ? { ...item, qualification: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. B.Tech / B.E. / MBA / MCA"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Specialization / Branch</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) =>
                          setEducationList((prev) =>
                            prev.map((item) => (item.id === edu.id ? { ...item, fieldOfStudy: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. Computer Science / Electronics / Finance"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">Institution / University</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) =>
                          setEducationList((prev) =>
                            prev.map((item) => (item.id === edu.id ? { ...item, institution: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. Indian Institute of Technology / Delhi University"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Start Year</label>
                      <input
                        type="text"
                        value={edu.startYear}
                        onChange={(e) =>
                          setEducationList((prev) =>
                            prev.map((item) => (item.id === edu.id ? { ...item, startYear: e.target.value } : item))
                          )
                        }
                        placeholder="2020"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">End Year / Expected</label>
                      <input
                        type="text"
                        value={edu.endYear}
                        onChange={(e) =>
                          setEducationList((prev) =>
                            prev.map((item) => (item.id === edu.id ? { ...item, endYear: e.target.value } : item))
                          )
                        }
                        placeholder="2024"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEducationList((prev) => [
                      ...prev,
                      {
                        id: 'edu-' + Date.now(),
                        qualification: "Master's Degree",
                        institution: '',
                        fieldOfStudy: '',
                        startYear: '',
                        endYear: '',
                      },
                    ])
                  }
                  className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:text-[#FF2B1A] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Degree</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">CGPA / Percentage:</span>
                  <input
                    type="text"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="w-28 px-2 py-1 rounded-lg border border-slate-300 text-xs bg-white"
                    placeholder="8.5 / 10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: WORK EXPERIENCE */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 3 — Work Experience</h2>
                <p className="text-xs text-slate-500">Document your employment history or academic projects</p>
              </div>

              {/* Fresher specific banner */}
              {isFresher ? (
                <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#061226] text-white flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#061226]">You selected Fresher</h3>
                      <p className="text-xs text-[#004D40] leading-relaxed mt-1">
                        No prior full-time corporate work experience is required. ABHI JOBS matches freshers based on your education, academic projects, certifications, and technical skills.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-teal-200 text-xs text-slate-600">
                    <div className="font-semibold text-slate-800">Optional: Added internships or project work?</div>
                    <p className="text-slate-500 mt-0.5">
                      You may optionally add internships or college capstone projects below, or skip straight to Skills!
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Experience list */}
              {experiences.map((exp, idx) => (
                <div key={exp.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Position #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Job Title</label>
                      <input
                        type="text"
                        value={exp.jobTitle}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((item) => (item.id === exp.id ? { ...item, jobTitle: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. Frontend Developer"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Company Name</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((item) => (item.id === exp.id ? { ...item, company: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. Infosys / Tech Mahindra / Startup"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((item) => (item.id === exp.id ? { ...item, startDate: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. 2022-01"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">End Date</label>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((item) => (item.id === exp.id ? { ...item, endDate: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. Present"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Key Responsibilities &amp; Achievements
                      </label>
                      <textarea
                        rows={3}
                        value={exp.description}
                        onChange={(e) =>
                          setExperiences((prev) =>
                            prev.map((item) => (item.id === exp.id ? { ...item, description: e.target.value } : item))
                          )
                        }
                        placeholder="Built customer-facing portals, increased conversion by 15%, led team of 3..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddExperience}
                className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:text-[#FF2B1A] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFresher ? 'Add Internship / Project (Optional)' : 'Add Another Experience'}</span>
              </button>
            </div>
          )}

          {/* STEP 4: SKILLS */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 4 — Skills &amp; Competencies</h2>
                <p className="text-xs text-slate-500">
                  Skills are the core of ABHI JOBS's matching algorithm. Add technical, professional, and industry skills.
                </p>
              </div>

              {/* Add skill input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillInput);
                    }
                  }}
                  placeholder="Type a skill (e.g. React, Python, UI Design, SQL, Docker) and hit Enter"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#061226]"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(newSkillInput)}
                  className="px-5 py-2.5 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-[#0b3b2c] transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Selected skills list with proficiency */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Your Selected Skills ({skillsList.length})
                </label>
                <div className="space-y-2">
                  {skillsList.map((sk) => (
                    <div
                      key={sk.name}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{sk.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span>Level:</span>
                          <select
                            value={sk.level}
                            onChange={(e) =>
                              setSkillsList((prev) =>
                                prev.map((s) => (s.name === sk.name ? { ...s, level: e.target.value } : s))
                              )
                            }
                            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(sk.name)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-700">Recommended Skills to Add:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'JavaScript',
                    'TypeScript',
                    'React',
                    'Node.js',
                    'Python',
                    'Next.js',
                    'SQL',
                    'PostgreSQL',
                    'Docker',
                    'Tailwind CSS',
                    'Git',
                    'REST APIs',
                    'Agile Methodology',
                    'Communication',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAddSkill(s)}
                      disabled={skillsList.some((x) => x.name.toLowerCase() === s.toLowerCase())}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-slate-200 hover:border-slate-400 hover:text-[#061226] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CAREER PREFERENCES */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 5 — Career Preferences</h2>
                <p className="text-xs text-slate-500">Specify what kind of opportunities you want ABHI JOBS to prioritize</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Desired Job Title</label>
                  <input
                    type="text"
                    value={desiredRole}
                    onChange={(e) => setDesiredRole(e.target.value)}
                    placeholder="e.g. Lead Frontend Engineer / Full Stack Developer"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Preferred Industry</label>
                  <select
                    value={preferredIndustry}
                    onChange={(e) => setPreferredIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Information Technology / Software">Information Technology / Software</option>
                    <option value="Finance & Banking">Finance &amp; Banking</option>
                    <option value="EdTech">EdTech</option>
                    <option value="Healthcare & Life Sciences">Healthcare &amp; Life Sciences</option>
                    <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Work Mode</label>
                  <select
                    value={workPreference}
                    onChange={(e) => setWorkPreference(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Flexible">Flexible</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Expected Salary</label>
                  <input
                    type="text"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="e.g. ₹10 - ₹15 Lakhs P.A."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Availability to Join</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="Exploring">Exploring</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={willingToRelocate}
                    onChange={(e) => setWillingToRelocate(e.target.checked)}
                    className="h-4 w-4 rounded text-[#061226] focus:ring-[#061226]"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    I am open and willing to relocate for the right job opportunity.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 6: RESUME */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Step 6 — Resume &amp; Documents</h2>
                <p className="text-xs text-slate-500">Upload your CV in PDF, DOC, or DOCX format</p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-slate-400 transition-colors bg-slate-50/50 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-teal-100 text-[#061226] flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7 text-[#061226]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload your Resume file</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Supported formats: PDF, DOC, DOCX (Max 10 MB)</p>
                </div>
                <div className="pt-2">
                  <label className="inline-block px-5 py-2.5 rounded-xl bg-[#061226] text-white text-xs font-bold hover:bg-[#0b3b2c] transition-colors cursor-pointer shadow-sm">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeName(e.target.files[0].name);
                          setResumeSize((e.target.files[0].size / (1024 * 1024)).toFixed(1) + ' MB');
                          showToast('success', 'Resume Attached', e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {resumeName && (
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-teal-300 flex items-center justify-center text-[#004D40]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{resumeName}</div>
                      <div className="text-[11px] text-slate-500">{resumeSize} &bull; Ready to submit</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-200/60 text-[#004D40] text-[11px] font-bold">
                    Attached
                  </span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Don't have a formatted CV handy?</div>
                  <p className="text-[11px] text-slate-500">Generate an ATS-friendly resume from your ABHI JOBS profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResumeName('ABHI JOBS_Generated_Resume.pdf');
                    setResumeSize('1.2 MB');
                    showToast('success', 'Resume Generated', 'ABHI JOBS ATS resume prepared.');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Build Resume with ABHI JOBS
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: PROFILE REVIEW */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Step 7 — Profile Review</h2>
                  <p className="text-xs text-slate-500">Review your information before completing your profile</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-100 text-[#004D40] text-xs font-bold">
                  95% Complete
                </span>
              </div>

              {/* Review summary cards */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
                  <img src={avatar} alt="Profile" className="w-14 h-14 rounded-full border border-slate-200" />
                  <div className="flex-1 space-y-1">
                    <div className="text-base font-bold text-slate-900">{currentCandidate?.name}</div>
                    <div className="text-xs text-[#004D40] font-semibold">{headline}</div>
                    <div className="text-xs text-slate-500">{location} &bull; {currentCandidate?.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase">Education</div>
                    {educationList.map((e) => (
                      <div key={e.id} className="text-xs text-slate-800">
                        <div className="font-semibold">{e.qualification} in {e.fieldOfStudy}</div>
                        <div className="text-slate-500">{e.institution} ({e.startYear}-{e.endYear})</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-xs font-bold text-slate-700 uppercase">Experience Status</div>
                    <div className="text-xs text-slate-800">
                      {isFresher ? (
                        <span className="font-semibold text-[#004D40]">Registered as Fresher (Entry-Level)</span>
                      ) : (
                        <span>
                          {experiences.length > 0 ? `${experiences[0].jobTitle} at ${experiences[0].company}` : 'Experienced Candidate'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Skills ({skillsList.length})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((sk) => (
                      <span
                        key={sk.name}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800 font-medium"
                      >
                        {sk.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Preferences</div>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span><strong>Role:</strong> {desiredRole}</span>
                    <span><strong>Mode:</strong> {workPreference}</span>
                    <span><strong>Salary:</strong> {expectedSalary}</span>
                    <span><strong>Notice:</strong> {availability}</span>
                  </div>
                </div>
              </div>

              {/* Complete Profile CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="w-full py-4 px-6 rounded-2xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-teal-200" />
                  <span>Complete Profile &amp; Discover Opportunities</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Save &amp; Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
