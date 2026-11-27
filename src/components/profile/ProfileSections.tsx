import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Award,
  FolderKanban,
  Languages as LanguagesIcon,
  FileText,
  Upload,
  ExternalLink,
  Pencil,
  Trash2,
  Plus,
  Check,
  Star,
  Globe,
  Linkedin,
  Github,
  Link2,
  Loader2,
} from 'lucide-react';
import type {
  CandidateLanguageItem,
  CandidateLinkItem,
  CandidateProfile,
  CandidateProjectItem,
  CandidateSkillItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  LanguageProficiency,
} from '../../types';
import {
  formatDisplayDate,
  getNormalizedDetailedSkills,
  ProfileSectionId,
  sanitizeExternalUrl,
  sortEducationReverseChronological,
  sortExperiencesReverseChronological,
} from '../../utils/profileCompletion';
import { ProfileSectionShell } from './ProfileSectionShell';
import { SkillSelectorEditor } from './SkillSelectorEditor';

interface ProfileSectionsProps {
  profile: CandidateProfile;
  editingSection: ProfileSectionId | null;
  onStartEdit: (section: ProfileSectionId) => void;
  onStopEdit: () => void;
  onSaveSection: (updates: Partial<CandidateProfile>) => void;
  onTriggerResumeUpload: () => void;
  isParsingResume: boolean;
  navigate: (route: string) => void;
}

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white rounded-lg border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#102B4E] focus:ring-2 focus:ring-[#102B4E]/10';
const LABEL_CLASS = 'block text-xs font-semibold text-[#334155] mb-1.5';

const SUMMARY_MAX_CHARS = 2000;
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const LANGUAGE_PROFICIENCIES: LanguageProficiency[] = [
  'Native',
  'Fluent',
  'Professional',
  'Conversational',
  'Basic',
];

export const ProfileSections: React.FC<ProfileSectionsProps> = ({
  profile,
  editingSection,
  onStartEdit,
  onStopEdit,
  onSaveSection,
  onTriggerResumeUpload,
  isParsingResume,
  navigate,
}) => {
  // 1. Personal Details draft
  const [personalForm, setPersonalForm] = useState({
    name: profile.name || '',
    headline: profile.headline || '',
    phone: profile.phone || '',
    city: profile.city || '',
    state: profile.state || '',
    location: profile.location || '',
    experienceLevel: profile.experienceLevel || 'Fresher',
    yearsOfExperience: profile.yearsOfExperience || 0,
    workStatus: profile.workStatus || 'Looking for a job',
    gender: profile.gender || '',
    dob: profile.dob || '',
  });

  // 2. Profile Summary draft
  const [summaryDraft, setSummaryDraft] = useState(profile.about || '');

  // 3. Employment Details item editor
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expForm, setExpForm] = useState<ExperienceItem>({
    id: '',
    company: '',
    jobTitle: '',
    employmentType: 'Full-time',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
    achievements: [],
  });
  const [expAchievementInput, setExpAchievementInput] = useState('');

  // 4. Skills draft
  const [skillsDraft, setSkillsDraft] = useState<CandidateSkillItem[]>([]);

  // 5. Education item editor
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduForm, setEduForm] = useState<EducationItem>({
    id: '',
    qualification: '',
    fieldOfStudy: '',
    institution: '',
    startYear: '',
    endYear: '',
    grade: '',
  });

  // 7. Certifications item editor
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certForm, setCertForm] = useState<CertificationItem>({
    id: '',
    title: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
  });

  // 8. Projects item editor
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<CandidateProjectItem>({
    id: '',
    title: '',
    role: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    description: '',
    technologies: [],
    url: '',
  });
  const [projectTechInput, setProjectTechInput] = useState('');

  // 9. Languages item editor
  const [editingLangId, setEditingLangId] = useState<string | null>(null);
  const [langForm, setLangForm] = useState<CandidateLanguageItem>({
    id: '',
    language: '',
    proficiency: 'Professional',
    canRead: true,
    canWrite: true,
    canSpeak: true,
  });

  // 10. Career Preferences draft
  const [prefForm, setPrefForm] = useState({
    desiredRole: profile.desiredRole || '',
    preferredLocation: profile.preferredLocation || '',
    workPreference: profile.workPreference || 'Hybrid',
    preferredIndustry: profile.preferredIndustry || '',
    availability: profile.availability || 'Immediate',
    salaryMin: profile.expectedSalary?.min ? String(profile.expectedSalary.min) : '',
    salaryMax: profile.expectedSalary?.max ? String(profile.expectedSalary.max) : '',
    willingToRelocate: Boolean(profile.willingToRelocate),
    availableForOpportunities: Boolean(profile.availableForOpportunities),
  });

  // 11. Professional Links draft
  const [linksForm, setLinksForm] = useState({
    linkedinUrl: profile.linkedinUrl || '',
    githubUrl: profile.githubUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    otherLinks: (profile.otherLinks || []) as CandidateLinkItem[],
  });
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const sortedExperiences = useMemo(
    () => sortExperiencesReverseChronological(profile.experiences || []),
    [profile.experiences]
  );

  const sortedEducation = useMemo(
    () => sortEducationReverseChronological(profile.education || []),
    [profile.education]
  );

  const normalizedSkills = useMemo(() => getNormalizedDetailedSkills(profile), [profile]);
  const primarySkills = useMemo(
    () => normalizedSkills.filter((s) => s.isPrimary),
    [normalizedSkills]
  );
  const secondarySkills = useMemo(
    () => normalizedSkills.filter((s) => !s.isPrimary),
    [normalizedSkills]
  );

  // Open handlers that hydrate fresh state from current saved profile
  const openPersonalEdit = () => {
    setPersonalForm({
      name: profile.name || '',
      headline: profile.headline || '',
      phone: profile.phone || '',
      city: profile.city || '',
      state: profile.state || '',
      location: profile.location || '',
      experienceLevel: profile.experienceLevel || 'Fresher',
      yearsOfExperience: profile.yearsOfExperience || 0,
      workStatus: profile.workStatus || 'Looking for a job',
      gender: profile.gender || '',
      dob: profile.dob || '',
    });
    onStartEdit('personal');
  };

  const openSummaryEdit = () => {
    setSummaryDraft(profile.about || '');
    onStartEdit('summary');
  };

  const openAddExperience = () => {
    setEditingExpId('new');
    setExpForm({
      id: `exp_${Date.now()}`,
      company: '',
      jobTitle: '',
      employmentType: 'Full-time',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
    });
    setExpAchievementInput('');
    onStartEdit('employment');
  };

  const openEditExperience = (item: ExperienceItem) => {
    setEditingExpId(item.id);
    setExpForm({
      ...item,
      employmentType: item.employmentType || 'Full-time',
      achievements: item.achievements ? [...item.achievements] : [],
    });
    setExpAchievementInput('');
    onStartEdit('employment');
  };

  const openSkillsEdit = () => {
    setSkillsDraft(normalizedSkills.map((s) => ({ ...s })));
    onStartEdit('skills');
  };

  const openAddEducation = () => {
    setEditingEduId('new');
    setEduForm({
      id: `edu_${Date.now()}`,
      qualification: '',
      fieldOfStudy: '',
      institution: '',
      startYear: '',
      endYear: '',
      grade: '',
    });
    onStartEdit('education');
  };

  const openEditEducation = (item: EducationItem) => {
    setEditingEduId(item.id);
    setEduForm({ ...item });
    onStartEdit('education');
  };

  const openAddCertification = () => {
    setEditingCertId('new');
    setCertForm({
      id: `cert_${Date.now()}`,
      title: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    });
    onStartEdit('certifications');
  };

  const openEditCertification = (item: CertificationItem) => {
    setEditingCertId(item.id);
    setCertForm({ ...item });
    onStartEdit('certifications');
  };

  const openAddProject = () => {
    setEditingProjectId('new');
    setProjectForm({
      id: `proj_${Date.now()}`,
      title: '',
      role: '',
      startDate: '',
      endDate: '',
      ongoing: false,
      description: '',
      technologies: [],
      url: '',
    });
    setProjectTechInput('');
    onStartEdit('projects');
  };

  const openEditProject = (item: CandidateProjectItem) => {
    setEditingProjectId(item.id);
    setProjectForm({ ...item, technologies: [...(item.technologies || [])] });
    setProjectTechInput((item.technologies || []).join(', '));
    onStartEdit('projects');
  };

  const openAddLanguage = () => {
    setEditingLangId('new');
    setLangForm({
      id: `lang_${Date.now()}`,
      language: '',
      proficiency: 'Professional',
      canRead: true,
      canWrite: true,
      canSpeak: true,
    });
    onStartEdit('languages');
  };

  const openEditLanguage = (item: CandidateLanguageItem) => {
    setEditingLangId(item.id);
    setLangForm({ ...item });
    onStartEdit('languages');
  };

  const openPreferencesEdit = () => {
    setPrefForm({
      desiredRole: profile.desiredRole || '',
      preferredLocation: profile.preferredLocation || '',
      workPreference: profile.workPreference || 'Hybrid',
      preferredIndustry: profile.preferredIndustry || '',
      availability: profile.availability || 'Immediate',
      salaryMin: profile.expectedSalary?.min ? String(profile.expectedSalary.min) : '',
      salaryMax: profile.expectedSalary?.max ? String(profile.expectedSalary.max) : '',
      willingToRelocate: Boolean(profile.willingToRelocate),
      availableForOpportunities: Boolean(profile.availableForOpportunities),
    });
    onStartEdit('preferences');
  };

  const openLinksEdit = () => {
    setLinksForm({
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      otherLinks: [...(profile.otherLinks || [])],
    });
    setNewLinkLabel('');
    setNewLinkUrl('');
    onStartEdit('links');
  };

  // Sync external editingSection requests (e.g. from sidebar jump or "Enter Details Manually")
  React.useEffect(() => {
    if (editingSection === 'personal') {
      setPersonalForm({
        name: profile.name || '',
        headline: profile.headline || '',
        phone: profile.phone || '',
        city: profile.city || '',
        state: profile.state || '',
        location: profile.location || '',
        experienceLevel: profile.experienceLevel || 'Fresher',
        yearsOfExperience: profile.yearsOfExperience || 0,
        workStatus: profile.workStatus || 'Looking for a job',
        gender: profile.gender || '',
        dob: profile.dob || '',
      });
    } else if (editingSection === 'summary') {
      setSummaryDraft(profile.about || '');
    } else if (editingSection === 'skills') {
      setSkillsDraft(getNormalizedDetailedSkills(profile));
    } else if (editingSection === 'employment' && !editingExpId) {
      setEditingExpId('new');
      setExpForm({
        id: `exp_${Date.now()}`,
        company: '',
        jobTitle: '',
        employmentType: 'Full-time',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        achievements: [],
      });
    } else if (editingSection === 'education' && !editingEduId) {
      setEditingEduId('new');
      setEduForm({
        id: `edu_${Date.now()}`,
        qualification: '',
        fieldOfStudy: '',
        institution: '',
        startYear: '',
        endYear: '',
        grade: '',
      });
    } else if (editingSection === 'certifications' && !editingCertId) {
      setEditingCertId('new');
      setCertForm({
        id: `cert_${Date.now()}`,
        title: '',
        issuer: '',
        issueDate: '',
        credentialUrl: '',
      });
    } else if (editingSection === 'projects' && !editingProjectId) {
      setEditingProjectId('new');
      setProjectForm({
        id: `proj_${Date.now()}`,
        title: '',
        role: '',
        startDate: '',
        endDate: '',
        ongoing: false,
        description: '',
        technologies: [],
        url: '',
      });
      setProjectTechInput('');
    } else if (editingSection === 'languages' && !editingLangId) {
      setEditingLangId('new');
      setLangForm({
        id: `lang_${Date.now()}`,
        language: '',
        proficiency: 'Professional',
        canRead: true,
        canWrite: true,
        canSpeak: true,
      });
    } else if (editingSection === 'preferences') {
      setPrefForm({
        desiredRole: profile.desiredRole || '',
        preferredLocation: profile.preferredLocation || '',
        workPreference: profile.workPreference || 'Hybrid',
        preferredIndustry: profile.preferredIndustry || '',
        availability: profile.availability || 'Immediate',
        salaryMin: profile.expectedSalary?.min ? String(profile.expectedSalary.min) : '',
        salaryMax: profile.expectedSalary?.max ? String(profile.expectedSalary.max) : '',
        willingToRelocate: Boolean(profile.willingToRelocate),
        availableForOpportunities: Boolean(profile.availableForOpportunities),
      });
    } else if (editingSection === 'links') {
      setLinksForm({
        linkedinUrl: profile.linkedinUrl || '',
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        otherLinks: [...(profile.otherLinks || [])],
      });
    } else if (editingSection === null) {
      setEditingExpId(null);
      setEditingEduId(null);
      setEditingCertId(null);
      setEditingProjectId(null);
      setEditingLangId(null);
    }
  }, [editingSection]);

  const closeEditor = () => {
    setEditingExpId(null);
    setEditingEduId(null);
    setEditingCertId(null);
    setEditingProjectId(null);
    setEditingLangId(null);
    onStopEdit();
  };

  // Save Handlers
  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedLocation =
      personalForm.location.trim() ||
      [personalForm.city.trim(), personalForm.state.trim()].filter(Boolean).join(', ') ||
      'India';
    const years = Math.max(0, Math.min(60, Number(personalForm.yearsOfExperience) || 0));
    onSaveSection({
      name: personalForm.name.trim() || profile.name,
      headline: personalForm.headline.trim(),
      phone: personalForm.phone.trim(),
      city: personalForm.city.trim() || undefined,
      state: personalForm.state.trim() || undefined,
      location: combinedLocation,
      experienceLevel: personalForm.experienceLevel as CandidateProfile['experienceLevel'],
      experienceType: years > 0 || personalForm.experienceLevel !== 'Fresher' ? 'experienced' : 'fresher',
      yearsOfExperience: years,
      workStatus: personalForm.workStatus.trim() || undefined,
      gender: personalForm.gender.trim() || undefined,
      dob: personalForm.dob.trim() || undefined,
    });
    closeEditor();
  };

  const handleSaveSummary = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSection({ about: summaryDraft.trim().slice(0, SUMMARY_MAX_CHARS) });
    closeEditor();
  };

  const handleSaveExperience = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.company.trim() || !expForm.jobTitle.trim()) return;

    const cleanedAchievements = (expForm.achievements || []).map((a) => a.trim()).filter(Boolean);
    if (expAchievementInput.trim()) {
      cleanedAchievements.push(expAchievementInput.trim());
    }

    const finalItem: ExperienceItem = {
      ...expForm,
      id: expForm.id || `exp_${Date.now()}`,
      company: expForm.company.trim(),
      jobTitle: expForm.jobTitle.trim(),
      employmentType: expForm.employmentType || 'Full-time',
      location: expForm.location?.trim() || undefined,
      startDate: expForm.startDate.trim(),
      endDate: expForm.current ? '' : expForm.endDate.trim(),
      current: Boolean(expForm.current),
      description: expForm.description.trim(),
      achievements: cleanedAchievements,
    };

    const existingList = profile.experiences || [];
    const nextList =
      editingExpId === 'new'
        ? [...existingList, finalItem]
        : existingList.map((item) => (item.id === editingExpId ? finalItem : item));

    const sorted = sortExperiencesReverseChronological(nextList);
    onSaveSection({
      experiences: sorted,
      currentRole: sorted[0]?.jobTitle || profile.currentRole,
      experienceType: 'experienced',
    });
    closeEditor();
  };

  const handleDeleteExperience = (id: string) => {
    const next = (profile.experiences || []).filter((e) => e.id !== id);
    onSaveSection({ experiences: sortExperiencesReverseChronological(next) });
  };

  const handleSaveSkills = () => {
    onSaveSection({
      detailedSkills: skillsDraft,
      skills: skillsDraft.map((s) => s.name),
    });
    closeEditor();
  };

  const handleSaveEducation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduForm.qualification.trim() || !eduForm.institution.trim()) return;
    const finalItem: EducationItem = {
      ...eduForm,
      id: eduForm.id || `edu_${Date.now()}`,
      qualification: eduForm.qualification.trim(),
      fieldOfStudy: eduForm.fieldOfStudy.trim(),
      institution: eduForm.institution.trim(),
      startYear: eduForm.startYear.trim(),
      endYear: eduForm.endYear.trim(),
      grade: eduForm.grade?.trim() || undefined,
    };

    const existingList = profile.education || [];
    const nextList =
      editingEduId === 'new'
        ? [...existingList, finalItem]
        : existingList.map((item) => (item.id === editingEduId ? finalItem : item));
    onSaveSection({ education: sortEducationReverseChronological(nextList) });
    closeEditor();
  };

  const handleDeleteEducation = (id: string) => {
    onSaveSection({
      education: (profile.education || []).filter((e) => e.id !== id),
    });
  };

  const handleSaveCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title.trim()) return;
    const finalItem: CertificationItem = {
      ...certForm,
      id: certForm.id || `cert_${Date.now()}`,
      title: certForm.title.trim(),
      issuer: certForm.issuer.trim(),
      issueDate: certForm.issueDate.trim(),
      credentialUrl: certForm.credentialUrl ? sanitizeExternalUrl(certForm.credentialUrl) : undefined,
    };

    const existingList = profile.certifications || [];
    const nextList =
      editingCertId === 'new'
        ? [...existingList, finalItem]
        : existingList.map((item) => (item.id === editingCertId ? finalItem : item));
    onSaveSection({ certifications: nextList });
    closeEditor();
  };

  const handleDeleteCertification = (id: string) => {
    onSaveSection({
      certifications: (profile.certifications || []).filter((c) => c.id !== id),
    });
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    const technologies = projectTechInput
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const finalItem: CandidateProjectItem = {
      ...projectForm,
      id: projectForm.id || `proj_${Date.now()}`,
      title: projectForm.title.trim(),
      role: projectForm.role?.trim() || undefined,
      startDate: projectForm.startDate?.trim() || undefined,
      endDate: projectForm.ongoing ? '' : projectForm.endDate?.trim() || undefined,
      ongoing: Boolean(projectForm.ongoing),
      description: projectForm.description.trim(),
      technologies,
      url: projectForm.url ? sanitizeExternalUrl(projectForm.url) : undefined,
    };

    const existingList = profile.projects || [];
    const nextList =
      editingProjectId === 'new'
        ? [...existingList, finalItem]
        : existingList.map((item) => (item.id === editingProjectId ? finalItem : item));
    onSaveSection({ projects: nextList });
    closeEditor();
  };

  const handleDeleteProject = (id: string) => {
    onSaveSection({
      projects: (profile.projects || []).filter((p) => p.id !== id),
    });
  };

  const handleSaveLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!langForm.language.trim()) return;
    const finalItem: CandidateLanguageItem = {
      ...langForm,
      id: langForm.id || `lang_${Date.now()}`,
      language: langForm.language.trim(),
    };
    const existingList = profile.languages || [];
    const nextList =
      editingLangId === 'new'
        ? [...existingList, finalItem]
        : existingList.map((item) => (item.id === editingLangId ? finalItem : item));
    onSaveSection({ languages: nextList });
    closeEditor();
  };

  const handleDeleteLanguage = (id: string) => {
    onSaveSection({
      languages: (profile.languages || []).filter((l) => l.id !== id),
    });
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = prefForm.salaryMin ? Number(prefForm.salaryMin) : undefined;
    const maxVal = prefForm.salaryMax ? Number(prefForm.salaryMax) : undefined;
    onSaveSection({
      desiredRole: prefForm.desiredRole.trim(),
      preferredLocation: prefForm.preferredLocation.trim(),
      workPreference: prefForm.workPreference as CandidateProfile['workPreference'],
      preferredIndustry: prefForm.preferredIndustry.trim() || undefined,
      availability: prefForm.availability as CandidateProfile['availability'],
      expectedSalary:
        minVal || maxVal
          ? { min: minVal || 0, max: maxVal || 0, currency: 'INR' }
          : undefined,
      willingToRelocate: prefForm.willingToRelocate,
      availableForOpportunities: prefForm.availableForOpportunities,
    });
    closeEditor();
  };

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedOther = [...linksForm.otherLinks];
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      const safe = sanitizeExternalUrl(newLinkUrl);
      if (safe) {
        cleanedOther.push({
          id: `link_${Date.now()}`,
          label: newLinkLabel.trim(),
          url: safe,
        });
      }
    }
    onSaveSection({
      linkedinUrl: sanitizeExternalUrl(linksForm.linkedinUrl) || undefined,
      githubUrl: sanitizeExternalUrl(linksForm.githubUrl) || undefined,
      portfolioUrl: sanitizeExternalUrl(linksForm.portfolioUrl) || undefined,
      otherLinks: cleanedOther,
    });
    closeEditor();
  };

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* 1. PERSONAL DETAILS                                                   */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="personal"
        title="Personal Details"
        description="Contact information, headline, current location, and experience overview visible to recruiters."
        isEditing={editingSection === 'personal'}
        canEdit
        onEdit={openPersonalEdit}
      >
        {editingSection === 'personal' ? (
          <form onSubmit={handleSavePersonal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Professional Headline *</label>
                <input
                  type="text"
                  value={personalForm.headline}
                  onChange={(e) => setPersonalForm({ ...personalForm, headline: e.target.value })}
                  placeholder="e.g. Operations Analyst | Advanced Excel & MIS Reporting"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Email Address (Account Verified)</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#F1F5F9] text-[#64748B] rounded-lg border border-[#E2E8F0] cursor-not-allowed"
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Mobile Number</label>
                <input
                  type="tel"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Current Location (City, State)</label>
                <input
                  type="text"
                  value={personalForm.location}
                  onChange={(e) => setPersonalForm({ ...personalForm, location: e.target.value })}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Current Work Status</label>
                <select
                  value={personalForm.workStatus}
                  onChange={(e) => setPersonalForm({ ...personalForm, workStatus: e.target.value })}
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="Looking for a job">Actively looking for a job</option>
                  <option value="Working">Currently employed</option>
                  <option value="Currently not working">Serving notice / Between roles</option>
                  <option value="Student">Student / Final-year graduate</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Experience Level</label>
                <select
                  value={personalForm.experienceLevel}
                  onChange={(e) =>
                    setPersonalForm({
                      ...personalForm,
                      experienceLevel: e.target.value as CandidateProfile['experienceLevel'],
                    })
                  }
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="Fresher">Fresher (0 years)</option>
                  <option value="Junior">Junior (1–3 years)</option>
                  <option value="Mid">Mid-Level (3–6 years)</option>
                  <option value="Senior">Senior (6–10 years)</option>
                  <option value="Lead">Lead / Management (10+ years)</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Total Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={personalForm.yearsOfExperience}
                  onChange={(e) =>
                    setPersonalForm({
                      ...personalForm,
                      yearsOfExperience: Number(e.target.value) || 0,
                    })
                  }
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Gender (Optional)</label>
                <select
                  value={personalForm.gender}
                  onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="">Prefer not to specify</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Date of Birth (Optional)</label>
                <input
                  type="date"
                  value={personalForm.dob}
                  onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Details</span>
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Full Name</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">{profile.name || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Email Address</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5 break-all">{profile.email || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Mobile Number</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5 tabular-nums">
                {profile.phone || <span className="text-[#94A3B8] font-normal">Add phone number</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Current Location</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">
                {profile.location && profile.location !== 'India' ? (
                  profile.location
                ) : (
                  <span className="text-[#94A3B8] font-normal">Add city &amp; state</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Experience</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5 tabular-nums">
                {profile.experienceLevel}
                {profile.yearsOfExperience > 0 ? ` · ${profile.yearsOfExperience} yrs` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Work Status</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">
                {profile.workStatus || 'Looking for a job'}
              </dd>
            </div>
            {profile.gender && (
              <div>
                <dt className="text-xs font-medium text-[#64748B]">Gender</dt>
                <dd className="text-[#0F172A] font-medium mt-0.5">{profile.gender}</dd>
              </div>
            )}
            {profile.dob && (
              <div>
                <dt className="text-xs font-medium text-[#64748B]">Date of Birth</dt>
                <dd className="text-[#0F172A] font-medium mt-0.5 tabular-nums">{profile.dob}</dd>
              </div>
            )}
          </dl>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 2. PROFILE SUMMARY                                                    */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="summary"
        title="Profile Summary"
        description="A concise professional introduction covering your experience, expertise, key skills, industry background, strengths, and career goals."
        isEditing={editingSection === 'summary'}
        canEdit
        editLabel={profile.about?.trim() ? 'Edit' : 'Add Summary'}
        onEdit={openSummaryEdit}
      >
        {editingSection === 'summary' ? (
          <form onSubmit={handleSaveSummary} className="space-y-3.5">
            <div className="rounded-lg bg-[#FAFBFD] border border-[#E5EAF0] px-3.5 py-2.5 text-xs text-[#475569] leading-relaxed">
              <span className="font-semibold text-[#102B4E]">What recruiters look for:</span>{' '}
              Years of experience, domain expertise, top technical or functional skills, industry background, measurable strengths, and your next target role.
            </div>
            <div>
              <textarea
                rows={5}
                maxLength={SUMMARY_MAX_CHARS}
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                placeholder="Example: Detail-oriented Operations & MIS Analyst with 4+ years of experience in supply chain reporting, Excel automation, and vendor coordination across logistics and e-commerce. Proven strength in reducing reporting turnaround times by 35% and collaborating with cross-functional teams. Seeking a Senior Business Analyst role in a growth-stage enterprise."
                className="w-full px-3.5 py-3 text-sm bg-white rounded-lg border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-hidden focus:border-[#102B4E] focus:ring-2 focus:ring-[#102B4E]/10 leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-[#64748B]">
                  {summaryDraft.trim().length < 40
                    ? 'Aim for at least 40–150 characters for a strong recruiter snapshot.'
                    : 'Clear, informative summary length.'}
                </span>
                <span
                  className={`font-medium tabular-nums ${
                    summaryDraft.length > SUMMARY_MAX_CHARS - 100
                      ? 'text-[#DE6816]'
                      : 'text-[#64748B]'
                  }`}
                >
                  {summaryDraft.length} / {SUMMARY_MAX_CHARS}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Summary</span>
              </button>
            </div>
          </form>
        ) : profile.about?.trim() ? (
          <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-line">
            {profile.about}
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <p className="text-sm text-[#64748B]">
              Add a short professional summary to introduce your background, core strengths, and career goals to hiring teams.
            </p>
            <button
              type="button"
              onClick={openSummaryEdit}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Write Profile Summary
            </button>
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 3. EMPLOYMENT DETAILS                                                 */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="employment"
        title="Employment Details"
        description="Your current and previous work history listed in reverse chronological order."
        countLabel={sortedExperiences.length > 0 ? `${sortedExperiences.length} role${sortedExperiences.length === 1 ? '' : 's'}` : undefined}
        isEditing={editingSection === 'employment'}
        canAdd
        addLabel="Add Employment"
        onAdd={openAddExperience}
      >
        {editingSection === 'employment' ? (
          <form onSubmit={handleSaveExperience} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F6]">
              <h3 className="text-sm font-semibold text-[#102B4E]">
                {editingExpId === 'new' ? 'Add Employment Entry' : 'Edit Employment Entry'}
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#102B4E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={expForm.current}
                  onChange={(e) =>
                    setExpForm({
                      ...expForm,
                      current: e.target.checked,
                      endDate: e.target.checked ? '' : expForm.endDate,
                    })
                  }
                  className="w-4 h-4 rounded accent-[#102B4E]"
                />
                <span>This is my current employment</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Designation / Job Title *</label>
                <input
                  type="text"
                  required
                  value={expForm.jobTitle}
                  onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Company Name *</label>
                <input
                  type="text"
                  required
                  value={expForm.company}
                  onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                  placeholder="e.g. Infosys Ltd."
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Employment Type</label>
                <select
                  value={expForm.employmentType || 'Full-time'}
                  onChange={(e) => setExpForm({ ...expForm, employmentType: e.target.value })}
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Location (Optional)</label>
                <input
                  type="text"
                  value={expForm.location || ''}
                  onChange={(e) => setExpForm({ ...expForm, location: e.target.value })}
                  placeholder="e.g. Hyderabad, Telangana"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Joining Date *</label>
                <input
                  type="month"
                  required
                  value={/^\d{4}-\d{2}$/.test(expForm.startDate) ? expForm.startDate : ''}
                  onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                  className={INPUT_CLASS}
                />
                {expForm.startDate && !/^\d{4}-\d{2}$/.test(expForm.startDate) && (
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Parsed value: {expForm.startDate} (select a month above to standardize)
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  {expForm.current ? 'Last Working Date (Current Role)' : 'Last Working Date'}
                </label>
                <input
                  type="month"
                  disabled={expForm.current}
                  value={
                    !expForm.current && /^\d{4}-\d{2}$/.test(expForm.endDate) ? expForm.endDate : ''
                  }
                  onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                  className={`${INPUT_CLASS} disabled:bg-[#F1F5F9] disabled:text-[#94A3B8]`}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Job Description &amp; Responsibilities</label>
              <textarea
                rows={4}
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                placeholder="Outline your core responsibilities, daily deliverables, and team scope..."
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
              />
            </div>

            {/* Key Achievements */}
            <div className="space-y-2">
              <label className={LABEL_CLASS}>Key Achievements (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={expAchievementInput}
                  onChange={(e) => setExpAchievementInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (expAchievementInput.trim()) {
                        setExpForm({
                          ...expForm,
                          achievements: [...(expForm.achievements || []), expAchievementInput.trim()],
                        });
                        setExpAchievementInput('');
                      }
                    }
                  }}
                  placeholder="e.g. Automated monthly reconciliation, saving 12 hours/week"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!expAchievementInput.trim()) return;
                    setExpForm({
                      ...expForm,
                      achievements: [...(expForm.achievements || []), expAchievementInput.trim()],
                    });
                    setExpAchievementInput('');
                  }}
                  className="px-4 py-2 min-h-[44px] rounded-lg bg-[#102B4E] text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Add
                </button>
              </div>
              {(expForm.achievements || []).length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {(expForm.achievements || []).map((ach, idx) => (
                    <li
                      key={`${ach}-${idx}`}
                      className="flex items-start justify-between gap-2 text-xs text-[#334155] bg-[#FAFBFD] border border-[#E5EAF0] rounded-lg px-3 py-2"
                    >
                      <span>• {ach}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpForm({
                            ...expForm,
                            achievements: (expForm.achievements || []).filter((_, i) => i !== idx),
                          })
                        }
                        className="text-[#94A3B8] hover:text-red-600 cursor-pointer shrink-0"
                        aria-label="Remove achievement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Employment</span>
              </button>
            </div>
          </form>
        ) : sortedExperiences.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-[#94A3B8] mt-0.5 shrink-0" />
              <p className="text-sm text-[#64748B]">
                No employment history added yet. Add your full-time roles, contracts, or internships in reverse chronological order.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddExperience}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Employment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2F6]">
            {sortedExperiences.map((exp) => (
              <article key={exp.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-[15px] font-semibold text-[#0F172A]">
                        {exp.jobTitle}
                      </h3>
                      {exp.current && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          · Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-[#334155] mt-0.5">
                      {exp.company}
                      {exp.employmentType ? ` · ${exp.employmentType}` : ''}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1 tabular-nums">
                      {formatDisplayDate(exp.startDate) || 'Start date not set'} —{' '}
                      {exp.current ? 'Present' : formatDisplayDate(exp.endDate) || 'End date not set'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditExperience(exp)}
                      aria-label={`Edit ${exp.jobTitle}`}
                      className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(exp.id)}
                      aria-label={`Delete ${exp.jobTitle}`}
                      className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {exp.description && (
                  <p className="text-xs sm:text-sm text-[#475569] mt-2.5 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>
                )}

                {exp.achievements && exp.achievements.length > 0 && (
                  <div className="mt-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">
                      Key Achievements
                    </p>
                    <ul className="space-y-1 text-xs sm:text-sm text-[#334155]">
                      {exp.achievements.map((ach, idx) => (
                        <li key={idx} className="leading-relaxed">
                          • {ach}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 4. KEY SKILLS                                                         */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="skills"
        title="Key Skills"
        description="Highlight your primary competencies and proficiency levels so recruiters can match you accurately."
        countLabel={normalizedSkills.length > 0 ? `${normalizedSkills.length} listed` : undefined}
        isEditing={editingSection === 'skills'}
        canEdit
        editLabel={normalizedSkills.length > 0 ? 'Edit Skills' : 'Add Skills'}
        onEdit={openSkillsEdit}
      >
        {editingSection === 'skills' ? (
          <SkillSelectorEditor
            skills={skillsDraft}
            onChange={setSkillsDraft}
            onSave={handleSaveSkills}
            onCancel={closeEditor}
          />
        ) : normalizedSkills.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <p className="text-sm text-[#64748B]">
              Add at least 3 key skills and mark your primary skills to improve job recommendations.
            </p>
            <button
              type="button"
              onClick={openSkillsEdit}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Key Skills
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {primarySkills.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                  Primary Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {primarySkills.map((skill) => (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5FA] border border-[#CBD5E1] text-xs font-semibold text-[#102B4E]"
                    >
                      <Star className="w-3 h-3 text-[#F47A24] fill-[#F47A24] shrink-0" />
                      <span>{skill.name}</span>
                      <span className="text-[#64748B] font-normal">· {skill.proficiency}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {secondarySkills.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                  Additional Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {secondarySkills.map((skill) => (
                    <span
                      key={skill.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAFBFD] border border-[#E5EAF0] text-xs font-medium text-[#334155]"
                    >
                      <span>{skill.name}</span>
                      <span className="text-[#64748B] font-normal">· {skill.proficiency}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 5. EDUCATION                                                          */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="education"
        title="Education"
        description="Academic degrees, diplomas, and university qualifications."
        countLabel={sortedEducation.length > 0 ? `${sortedEducation.length} added` : undefined}
        isEditing={editingSection === 'education'}
        canAdd
        addLabel="Add Education"
        onAdd={openAddEducation}
      >
        {editingSection === 'education' ? (
          <form onSubmit={handleSaveEducation} className="space-y-4">
            <h3 className="text-sm font-semibold text-[#102B4E]">
              {editingEduId === 'new' ? 'Add Education' : 'Edit Education'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Degree / Qualification *</label>
                <input
                  type="text"
                  required
                  value={eduForm.qualification}
                  onChange={(e) => setEduForm({ ...eduForm, qualification: e.target.value })}
                  placeholder="e.g. B.Tech, MBA, B.Com"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Field of Study / Specialization</label>
                <input
                  type="text"
                  value={eduForm.fieldOfStudy}
                  onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                  placeholder="e.g. Computer Science, Finance"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>College / University *</label>
                <input
                  type="text"
                  required
                  value={eduForm.institution}
                  onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                  placeholder="e.g. Visvesvaraya Technological University"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Start Year</label>
                <input
                  type="text"
                  value={eduForm.startYear}
                  onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })}
                  placeholder="e.g. 2019"
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Passing / End Year</label>
                <input
                  type="text"
                  value={eduForm.endYear}
                  onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })}
                  placeholder="e.g. 2023 or Present"
                  className={`${INPUT_CLASS} tabular-nums`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Grade / CGPA / Percentage (Optional)</label>
                <input
                  type="text"
                  value={eduForm.grade || ''}
                  onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                  placeholder="e.g. 8.4 CGPA or 78%"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Education</span>
              </button>
            </div>
          </form>
        ) : sortedEducation.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-[#94A3B8] mt-0.5 shrink-0" />
              <p className="text-sm text-[#64748B]">
                Add your highest degree, institution, and graduation year.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddEducation}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Education
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2F6]">
            {sortedEducation.map((edu) => (
              <div key={edu.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-[15px] font-semibold text-[#0F172A]">
                    {edu.qualification}
                    {edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ''}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#334155] mt-0.5">{edu.institution}</p>
                  <p className="text-xs text-[#64748B] mt-1 tabular-nums">
                    {[edu.startYear, edu.endYear].filter(Boolean).join(' – ') || 'Year not specified'}
                    {edu.grade ? ` · ${edu.grade}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditEducation(edu)}
                    aria-label={`Edit ${edu.qualification}`}
                    className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEducation(edu.id)}
                    aria-label={`Delete ${edu.qualification}`}
                    className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 6. RESUME                                                             */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="resume"
        title="Resume"
        description="Upload or update your resume in PDF, DOC, or DOCX format. You can also extract fields into your profile."
      >
        <div className="space-y-4">
          {profile.resumeName ? (
            <div className="rounded-lg border border-[#E5EAF0] bg-[#FAFBFD] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#102B4E]/8 text-[#102B4E] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">
                    {profile.resumeName}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                    {profile.resumeSize ? `${profile.resumeSize} · ` : ''}
                    {profile.resumeUpdated
                      ? `Updated ${new Date(profile.resumeUpdated).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : 'Attached to profile'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  disabled={isParsingResume}
                  onClick={onTriggerResumeUpload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isParsingResume ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isParsingResume ? 'Parsing...' : 'Update Resume'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/resume')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Resume Builder</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#CBD5E1] bg-[#FAFBFD] p-5 text-center space-y-3">
              <p className="text-sm font-semibold text-[#102B4E]">No resume uploaded yet</p>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Upload a PDF, DOC, or DOCX file (up to 10 MB). We will extract your details so you can review and confirm before saving.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isParsingResume}
                  onClick={onTriggerResumeUpload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isParsingResume ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isParsingResume ? 'Extracting Resume...' : 'Upload Resume'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/resume')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#102B4E] text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <span>Build with ABHI Resume Builder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 7. CERTIFICATIONS                                                     */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="certifications"
        title="Certifications"
        description="Industry credentials, licenses, and completed professional courses."
        countLabel={
          (profile.certifications || []).length > 0
            ? `${(profile.certifications || []).length} added`
            : undefined
        }
        isEditing={editingSection === 'certifications'}
        canAdd
        addLabel="Add Certification"
        onAdd={openAddCertification}
      >
        {editingSection === 'certifications' ? (
          <form onSubmit={handleSaveCertification} className="space-y-4">
            <h3 className="text-sm font-semibold text-[#102B4E]">
              {editingCertId === 'new' ? 'Add Certification' : 'Edit Certification'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Certification Name *</label>
                <input
                  type="text"
                  required
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  placeholder="e.g. Microsoft Excel Specialist / AWS Cloud Practitioner"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Issuing Organization</label>
                <input
                  type="text"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  placeholder="e.g. Learn with ABHI / Coursera / AWS"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Issue Date / Year</label>
                <input
                  type="text"
                  value={certForm.issueDate}
                  onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                  placeholder="e.g. Mar 2025"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Credential URL (Optional)</label>
                <input
                  type="url"
                  value={certForm.credentialUrl || ''}
                  onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                  placeholder="https://..."
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Certification</span>
              </button>
            </div>
          </form>
        ) : (profile.certifications || []).length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-[#94A3B8] mt-0.5 shrink-0" />
              <p className="text-sm text-[#64748B]">
                Add certifications or professional training credentials to validate your skills.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddCertification}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Certification
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2F6]">
            {(profile.certifications || []).map((cert) => (
              <div key={cert.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[#0F172A]">{cert.title}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {[cert.issuer, cert.issueDate].filter(Boolean).join(' · ') || 'Credential details'}
                  </p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] mt-1.5"
                    >
                      <span>View Credential</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditCertification(cert)}
                    aria-label={`Edit ${cert.title}`}
                    className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCertification(cert.id)}
                    aria-label={`Delete ${cert.title}`}
                    className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 8. PROJECTS                                                           */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="projects"
        title="Projects"
        description="Highlight hands-on work, client deliverables, capstone projects, or portfolio builds."
        countLabel={
          (profile.projects || []).length > 0
            ? `${(profile.projects || []).length} added`
            : undefined
        }
        isEditing={editingSection === 'projects'}
        canAdd
        addLabel="Add Project"
        onAdd={openAddProject}
      >
        {editingSection === 'projects' ? (
          <form onSubmit={handleSaveProject} className="space-y-4">
            <h3 className="text-sm font-semibold text-[#102B4E]">
              {editingProjectId === 'new' ? 'Add Project' : 'Edit Project'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Sales KPI Automation Dashboard"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Your Role</label>
                <input
                  type="text"
                  value={projectForm.role || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                  placeholder="e.g. Lead Analyst / Frontend Developer"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Start Date</label>
                <input
                  type="month"
                  value={projectForm.startDate || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>End Date</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="month"
                    disabled={projectForm.ongoing}
                    value={projectForm.ongoing ? '' : projectForm.endDate || ''}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className={`${INPUT_CLASS} disabled:bg-[#F1F5F9]`}
                  />
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[#334155] shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(projectForm.ongoing)}
                      onChange={(e) =>
                        setProjectForm({ ...projectForm, ongoing: e.target.checked, endDate: '' })
                      }
                      className="accent-[#102B4E]"
                    />
                    <span>Ongoing</span>
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Technologies / Tools Used (comma-separated)</label>
                <input
                  type="text"
                  value={projectTechInput}
                  onChange={(e) => setProjectTechInput(e.target.value)}
                  placeholder="e.g. Power BI, SQL, Excel Macros"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Project Summary &amp; Outcomes</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Describe the objective, your contribution, and measurable impact..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#102B4E]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Project URL (Optional)</label>
                <input
                  type="url"
                  value={projectForm.url || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, url: e.target.value })}
                  placeholder="https://github.com/... or live demo link"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Project</span>
              </button>
            </div>
          </form>
        ) : (profile.projects || []).length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div className="flex items-start gap-3">
              <FolderKanban className="w-5 h-5 text-[#94A3B8] mt-0.5 shrink-0" />
              <p className="text-sm text-[#64748B]">
                Showcase relevant work, academic, or freelance projects to demonstrate applied skills.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddProject}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#EEF2F6]">
            {(profile.projects || []).map((proj) => (
              <article key={proj.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-[15px] font-semibold text-[#0F172A]">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5 tabular-nums">
                      {[
                        proj.role,
                        proj.startDate
                          ? `${formatDisplayDate(proj.startDate)} – ${
                              proj.ongoing ? 'Present' : formatDisplayDate(proj.endDate) || 'Completed'
                            }`
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditProject(proj)}
                      aria-label={`Edit ${proj.title}`}
                      className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      aria-label={`Delete ${proj.title}`}
                      className="p-2 min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#64748B] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {proj.description && (
                  <p className="text-xs sm:text-sm text-[#475569] mt-2 leading-relaxed">
                    {proj.description}
                  </p>
                )}
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-xs text-[#64748B] mt-2">
                    <span className="font-semibold text-[#334155]">Skills / Tools:</span>{' '}
                    {proj.technologies.join(' · ')}
                  </p>
                )}
                {proj.url && (
                  <a
                    href={proj.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] mt-2"
                  >
                    <span>View Project</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 9. LANGUAGES                                                          */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="languages"
        title="Languages"
        description="Languages you can communicate in for workplace and client roles."
        countLabel={
          (profile.languages || []).length > 0
            ? `${(profile.languages || []).length} added`
            : undefined
        }
        isEditing={editingSection === 'languages'}
        canAdd
        addLabel="Add Language"
        onAdd={openAddLanguage}
      >
        {editingSection === 'languages' ? (
          <form onSubmit={handleSaveLanguage} className="space-y-4">
            <h3 className="text-sm font-semibold text-[#102B4E]">
              {editingLangId === 'new' ? 'Add Language' : 'Edit Language'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Language *</label>
                <input
                  type="text"
                  required
                  value={langForm.language}
                  onChange={(e) => setLangForm({ ...langForm, language: e.target.value })}
                  placeholder="e.g. English, Hindi, Kannada, Tamil"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Proficiency</label>
                <select
                  value={langForm.proficiency}
                  onChange={(e) =>
                    setLangForm({ ...langForm, proficiency: e.target.value as LanguageProficiency })
                  }
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  {LANGUAGE_PROFICIENCIES.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={langForm.canRead}
                  onChange={(e) => setLangForm({ ...langForm, canRead: e.target.checked })}
                  className="w-4 h-4 accent-[#102B4E]"
                />
                <span>Read</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={langForm.canWrite}
                  onChange={(e) => setLangForm({ ...langForm, canWrite: e.target.checked })}
                  className="w-4 h-4 accent-[#102B4E]"
                />
                <span>Write</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={langForm.canSpeak}
                  onChange={(e) => setLangForm({ ...langForm, canSpeak: e.target.checked })}
                  className="w-4 h-4 accent-[#102B4E]"
                />
                <span>Speak</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Language</span>
              </button>
            </div>
          </form>
        ) : (profile.languages || []).length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div className="flex items-start gap-3">
              <LanguagesIcon className="w-5 h-5 text-[#94A3B8] mt-0.5 shrink-0" />
              <p className="text-sm text-[#64748B]">
                Add languages you read, write, and speak (e.g. English, Hindi, regional languages).
              </p>
            </div>
            <button
              type="button"
              onClick={openAddLanguage}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Language
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#EEF2F6] text-[11px] uppercase tracking-wider text-[#64748B]">
                  <th className="py-2 pr-4 font-semibold">Language</th>
                  <th className="py-2 px-3 font-semibold">Proficiency</th>
                  <th className="py-2 px-3 font-semibold">Capabilities</th>
                  <th className="py-2 pl-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {(profile.languages || []).map((lang) => {
                  const caps = [
                    lang.canRead ? 'Read' : '',
                    lang.canWrite ? 'Write' : '',
                    lang.canSpeak ? 'Speak' : '',
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={lang.id}>
                      <td className="py-3 pr-4 font-semibold text-[#0F172A]">{lang.language}</td>
                      <td className="py-3 px-3 text-[#334155]">{lang.proficiency}</td>
                      <td className="py-3 px-3 text-[#64748B]">{caps || '—'}</td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditLanguage(lang)}
                          aria-label={`Edit ${lang.language}`}
                          className="p-1.5 rounded-md text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLanguage(lang.id)}
                          aria-label={`Delete ${lang.language}`}
                          className="p-1.5 ml-1 rounded-md text-[#64748B] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 10. CAREER PREFERENCES                                                */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="preferences"
        title="Career Preferences"
        description="Target role, preferred location, work mode, notice period, and expected compensation."
        isEditing={editingSection === 'preferences'}
        canEdit
        onEdit={openPreferencesEdit}
      >
        {editingSection === 'preferences' ? (
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Desired Role / Target Job Title</label>
                <input
                  type="text"
                  value={prefForm.desiredRole}
                  onChange={(e) => setPrefForm({ ...prefForm, desiredRole: e.target.value })}
                  placeholder="e.g. Financial Analyst / React Developer"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Preferred Work Location</label>
                <input
                  type="text"
                  value={prefForm.preferredLocation}
                  onChange={(e) =>
                    setPrefForm({ ...prefForm, preferredLocation: e.target.value })
                  }
                  placeholder="e.g. Bengaluru, Mumbai, Remote"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Work Mode Preference</label>
                <select
                  value={prefForm.workPreference}
                  onChange={(e) =>
                    setPrefForm({
                      ...prefForm,
                      workPreference: e.target.value as CandidateProfile['workPreference'],
                    })
                  }
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Preferred Industry</label>
                <input
                  type="text"
                  value={prefForm.preferredIndustry}
                  onChange={(e) =>
                    setPrefForm({ ...prefForm, preferredIndustry: e.target.value })
                  }
                  placeholder="e.g. IT Services, Finance, Logistics"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Notice Period / Availability</label>
                <select
                  value={prefForm.availability}
                  onChange={(e) =>
                    setPrefForm({
                      ...prefForm,
                      availability: e.target.value as CandidateProfile['availability'],
                    })
                  }
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="Immediate">Immediate Joiner</option>
                  <option value="15 Days">15 Days Notice</option>
                  <option value="30 Days">30 Days Notice</option>
                  <option value="Exploring">Exploring Opportunities</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={LABEL_CLASS}>Expected Min (INR/yr)</label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={prefForm.salaryMin}
                    onChange={(e) => setPrefForm({ ...prefForm, salaryMin: e.target.value })}
                    placeholder="e.g. 600000"
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Expected Max (INR/yr)</label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={prefForm.salaryMax}
                    onChange={(e) => setPrefForm({ ...prefForm, salaryMax: e.target.value })}
                    placeholder="e.g. 900000"
                    className={`${INPUT_CLASS} tabular-nums`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefForm.willingToRelocate}
                  onChange={(e) =>
                    setPrefForm({ ...prefForm, willingToRelocate: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#102B4E]"
                />
                <span>Open to relocation</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefForm.availableForOpportunities}
                  onChange={(e) =>
                    setPrefForm({ ...prefForm, availableForOpportunities: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#102B4E]"
                />
                <span>Actively open to recruiter outreach</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Desired Role</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">
                {profile.desiredRole || <span className="text-[#94A3B8] font-normal">Not specified</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Preferred Location</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">
                {profile.preferredLocation || <span className="text-[#94A3B8] font-normal">Not specified</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Work Preference</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">{profile.workPreference || 'Hybrid'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Availability / Notice</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">{profile.availability || 'Immediate'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Preferred Industry</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5">
                {profile.preferredIndustry || <span className="text-[#94A3B8] font-normal">Any industry</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#64748B]">Expected Salary</dt>
              <dd className="text-[#0F172A] font-medium mt-0.5 tabular-nums">
                {profile.expectedSalary?.min || profile.expectedSalary?.max ? (
                  `₹${Number(profile.expectedSalary?.min || 0).toLocaleString('en-IN')} – ₹${Number(
                    profile.expectedSalary?.max || 0
                  ).toLocaleString('en-IN')} / yr`
                ) : (
                  <span className="text-[#94A3B8] font-normal">Not specified</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </ProfileSectionShell>

      {/* ===================================================================== */}
      {/* 11. PROFESSIONAL LINKS                                                */}
      {/* ===================================================================== */}
      <ProfileSectionShell
        id="links"
        title="Professional Links"
        description="Connect your LinkedIn, GitHub, personal website, or portfolio links."
        isEditing={editingSection === 'links'}
        canEdit
        onEdit={openLinksEdit}
      >
        {editingSection === 'links' ? (
          <form onSubmit={handleSaveLinks} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linksForm.linkedinUrl}
                  onChange={(e) => setLinksForm({ ...linksForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/your-profile"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>GitHub Profile URL</label>
                <input
                  type="url"
                  value={linksForm.githubUrl}
                  onChange={(e) => setLinksForm({ ...linksForm, githubUrl: e.target.value })}
                  placeholder="https://github.com/your-handle"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Portfolio / Personal Website</label>
                <input
                  type="url"
                  value={linksForm.portfolioUrl}
                  onChange={(e) => setLinksForm({ ...linksForm, portfolioUrl: e.target.value })}
                  placeholder="https://yourportfolio.com"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Additional custom links */}
            <div className="pt-2 border-t border-[#EEF2F6] space-y-2.5">
              <label className={LABEL_CLASS}>Additional Links (Behance, Kaggle, Medium, etc.)</label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="Label (e.g. Kaggle)"
                  className="sm:col-span-4 px-3 py-2.5 min-h-[44px] text-sm bg-white rounded-lg border border-[#CBD5E1]"
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="sm:col-span-6 px-3 py-2.5 min-h-[44px] text-sm bg-white rounded-lg border border-[#CBD5E1]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const safe = sanitizeExternalUrl(newLinkUrl);
                    if (!newLinkLabel.trim() || !safe) return;
                    setLinksForm({
                      ...linksForm,
                      otherLinks: [
                        ...linksForm.otherLinks,
                        { id: `link_${Date.now()}`, label: newLinkLabel.trim(), url: safe },
                      ],
                    });
                    setNewLinkLabel('');
                    setNewLinkUrl('');
                  }}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2.5 min-h-[44px] rounded-lg bg-[#102B4E] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {linksForm.otherLinks.length > 0 && (
                <ul className="space-y-1.5">
                  {linksForm.otherLinks.map((lnk) => (
                    <li
                      key={lnk.id}
                      className="flex items-center justify-between gap-2 text-xs bg-[#FAFBFD] border border-[#E5EAF0] rounded-lg px-3 py-2"
                    >
                      <span className="truncate">
                        <strong className="text-[#0F172A]">{lnk.label}:</strong>{' '}
                        <span className="text-[#475569]">{lnk.url}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLinksForm({
                            ...linksForm,
                            otherLinks: linksForm.otherLinks.filter((l) => l.id !== lnk.id),
                          })
                        }
                        className="text-[#94A3B8] hover:text-red-600 cursor-pointer shrink-0"
                        aria-label={`Remove ${lnk.label}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 min-h-[42px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] text-[#334155] text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 min-h-[42px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Links</span>
              </button>
            </div>
          </form>
        ) : profile.linkedinUrl ||
          profile.githubUrl ||
          profile.portfolioUrl ||
          (profile.otherLinks && profile.otherLinks.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border border-[#E5EAF0] hover:border-[#102B4E]/40 hover:bg-[#FAFBFD] transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Linkedin className="w-4 h-4 text-[#102B4E] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0F172A]">LinkedIn</span>
                    <span className="block text-xs text-[#64748B] truncate">
                      {profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/i, '')}
                    </span>
                  </span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              </a>
            )}
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border border-[#E5EAF0] hover:border-[#102B4E]/40 hover:bg-[#FAFBFD] transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Github className="w-4 h-4 text-[#102B4E] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0F172A]">GitHub</span>
                    <span className="block text-xs text-[#64748B] truncate">
                      {profile.githubUrl.replace(/^https?:\/\/(www\.)?/i, '')}
                    </span>
                  </span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              </a>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border border-[#E5EAF0] hover:border-[#102B4E]/40 hover:bg-[#FAFBFD] transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Globe className="w-4 h-4 text-[#102B4E] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0F172A]">Portfolio / Website</span>
                    <span className="block text-xs text-[#64748B] truncate">
                      {profile.portfolioUrl.replace(/^https?:\/\/(www\.)?/i, '')}
                    </span>
                  </span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              </a>
            )}
            {(profile.otherLinks || []).map((lnk) => (
              <a
                key={lnk.id}
                href={lnk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border border-[#E5EAF0] hover:border-[#102B4E]/40 hover:bg-[#FAFBFD] transition-colors"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Link2 className="w-4 h-4 text-[#102B4E] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[#0F172A]">{lnk.label}</span>
                    <span className="block text-xs text-[#64748B] truncate">
                      {lnk.url.replace(/^https?:\/\/(www\.)?/i, '')}
                    </span>
                  </span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <p className="text-sm text-[#64748B]">
              Add your LinkedIn, GitHub, or portfolio link so hiring managers can explore your work.
            </p>
            <button
              type="button"
              onClick={openLinksEdit}
              className="text-xs font-semibold text-[#DE6816] hover:text-[#102B4E] shrink-0 self-start sm:self-auto cursor-pointer"
            >
              + Add Professional Links
            </button>
          </div>
        )}
      </ProfileSectionShell>
    </div>
  );
};
