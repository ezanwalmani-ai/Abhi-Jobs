import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Bell,
  Users,
  Lock,
  Globe,
  Database,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  AlertCircle,
  Laptop,
  Smartphone,
  LogOut,
  Plus,
  X,
  MapPin,
  Check,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface EmployerSettingsPageProps {
  navigate: (route: string) => void;
  initialSection?: string;
}

type EmployerSection =
  | 'account'
  | 'company-profile'
  | 'visibility-verification'
  | 'hiring-preferences'
  | 'notifications'
  | 'team-access'
  | 'security'
  | 'appearance'
  | 'data';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Recruiter' | 'Hiring Manager';
  status: 'Active' | 'Pending';
  joinedDate: string;
}

export const EmployerSettingsPage: React.FC<EmployerSettingsPageProps> = ({
  navigate,
  initialSection = 'account',
}) => {
  const {
    currentUser,
    currentEmployer,
    updateCurrentUser,
    updateEmployerProfile,
    deactivateCurrentUser,
    deleteCurrentUser,
    logout,
    showToast,
  } = useApp();

  const [activeSection, setActiveSection] = useState<EmployerSection>(
    (initialSection as EmployerSection) || 'account'
  );
  const [mobileViewSection, setMobileViewSection] = useState<EmployerSection | null>(null);

  // 1. Account Section State
  const [fullName, setFullName] = useState(
    currentUser?.name || currentEmployer?.recruiterName || ''
  );
  const [isEditingName, setIsEditingName] = useState(false);

  // Email verification modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Phone verification modal
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState(currentEmployer?.recruiterPhone || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google Account state
  const [isGoogleConnected, setIsGoogleConnected] = useState(
    Boolean(currentUser?.email?.includes('@gmail.com') || (currentUser as any)?.isGoogle)
  );

  // 2. Company Visibility & Verification State
  const [companyVisibility, setCompanyVisibility] = useState<'public' | 'hidden'>(() => {
    return (currentEmployer as any)?.visibility === 'hidden' ? 'hidden' : 'public';
  });
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationDocType, setVerificationDocType] = useState('gst');
  const [verificationDocNumber, setVerificationDocNumber] = useState('');

  // 3. Hiring Preferences State
  const [candidateLocations, setCandidateLocations] = useState<string[]>(() => {
    return ['Bengaluru', 'Mumbai', 'Delhi-NCR', 'Hyderabad', 'Remote'];
  });
  const [newLocationInput, setNewLocationInput] = useState('');

  const [preferredWorkModes, setPreferredWorkModes] = useState<string[]>(() => {
    return ['Remote', 'Hybrid', 'On-site'];
  });

  const [commonlyHiredJobTypes, setCommonlyHiredJobTypes] = useState<string[]>(() => {
    return ['Full-time', 'Internship', 'Contract'];
  });

  const [preferredExperienceRanges, setPreferredExperienceRanges] = useState<string[]>(() => {
    return ['Fresher (0-1 yr)', 'Mid-level (2-5 yrs)'];
  });

  const [preferredSkills, setPreferredSkills] = useState<string[]>(() => {
    return ['React', 'TypeScript', 'Node.js', 'Python', 'Product Management'];
  });
  const [newSkillInput, setNewSkillInput] = useState('');

  // 4. Notifications State
  const [notifications, setNotifications] = useState({
    // Applications
    newApplicationReceived: true,
    candidateShortlisted: true,
    interviewActivity: true,
    applicationUpdates: true,
    // Jobs
    jobApprovalStatus: true,
    jobClosingReminders: true,
    jobPostingIssues: true,
    // Candidate Communication
    newCandidateMessages: true,
    interviewResponses: true,
    // Platform
    platformAnnouncements: true,
    // Channels
    channelEmail: true,
    channelPush: true,
    channelSms: false,
    channelWhatsApp: true,
  });

  // 5. Team & Access State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_employer_team');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [
      {
        id: 'member-1',
        name: currentUser?.name || 'Recruiter Lead',
        email: currentUser?.email || 'lead@organization.com',
        role: 'Owner',
        status: 'Active',
        joinedDate: 'Jan 2026',
      },
      {
        id: 'member-2',
        name: 'Priya Sharma',
        email: 'priya.s@organization.com',
        role: 'Recruiter',
        status: 'Active',
        joinedDate: 'Feb 2026',
      },
    ];
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Owner' | 'Recruiter' | 'Hiring Manager'>('Recruiter');

  // 6. Language & Appearance State
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('abhijobs_theme') as any) || 'light';
  });

  // 7. Destructive Modals State
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSignOutAllModalOpen, setIsSignOutAllModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.name) {
      setFullName(currentUser.name);
    }
  }, [currentUser]);

  // Handle Save Name
  const handleSaveName = () => {
    if (!fullName.trim()) {
      showToast('error', 'Invalid Name', 'Name cannot be empty.');
      return;
    }
    updateCurrentUser({ name: fullName.trim() });
    setIsEditingName(false);
  };

  // Email Verification Step 1: Send OTP
  const handleSendEmailOtp = () => {
    if (!newEmail.trim() || !newEmail.includes('@') || !newEmail.includes('.')) {
      showToast('error', 'Invalid Email', 'Please enter a valid work email.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedEmailOtp(code);
    setEmailOtpSent(true);
    showToast('info', 'Verification Code Sent', `Code sent to ${newEmail} (Code: ${code})`);
  };

  // Email Verification Step 2: Confirm OTP
  const handleVerifyEmail = () => {
    if (emailOtp.trim() !== generatedEmailOtp) {
      showToast('error', 'Invalid Code', 'The verification code entered does not match.');
      return;
    }
    updateCurrentUser({ email: newEmail.trim() });
    setIsEmailModalOpen(false);
    setEmailOtpSent(false);
    setEmailOtp('');
    setNewEmail('');
    showToast('success', 'Email Updated', 'Recruiter contact email has been verified and updated.');
  };

  // Phone Verification Step 1: Send OTP
  const handleSendPhoneOtp = () => {
    if (!newPhone.trim() || newPhone.replace(/\D/g, '').length < 10) {
      showToast('error', 'Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPhoneOtp(code);
    setPhoneOtpSent(true);
    showToast('info', 'SMS OTP Sent', `SMS code sent to +91 ${newPhone} (Code: ${code})`);
  };

  // Phone Verification Step 2: Confirm OTP
  const handleVerifyPhone = () => {
    if (phoneOtp.trim() !== generatedPhoneOtp) {
      showToast('error', 'Invalid Code', 'The SMS code entered is incorrect.');
      return;
    }
    updateEmployerProfile({ recruiterPhone: newPhone.trim() });
    setIsPhoneModalOpen(false);
    setPhoneOtpSent(false);
    setPhoneOtp('');
    showToast('success', 'Phone Verified', 'Recruiter mobile number updated.');
  };

  // Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Password Required', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('error', 'Weak Password', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'Passwords do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('success', 'Password Changed', 'Employer account credentials updated securely.');
  };

  // Save Visibility
  const handleSaveVisibility = (val: 'public' | 'hidden') => {
    setCompanyVisibility(val);
    updateEmployerProfile({ ...( { visibility: val } as any ) });
    showToast('success', 'Visibility Updated', `Company profile is now ${val}.`);
  };

  // Submit Verification Request
  const handleSubmitVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationDocNumber.trim()) {
      showToast('error', 'Document Number Required', 'Please provide your registered GST or CIN number.');
      return;
    }
    updateEmployerProfile({ verificationStatus: 'pending' });
    setIsVerificationModalOpen(false);
    setVerificationDocNumber('');
    showToast('info', 'Verification Submitted', 'Your documents have been submitted to ABHI JOBS Compliance for verification.');
  };

  // Hiring Preferences: Add Location
  const handleAddLocation = () => {
    const trimmed = newLocationInput.trim();
    if (!trimmed) return;
    if (!candidateLocations.includes(trimmed)) {
      setCandidateLocations([...candidateLocations, trimmed]);
    }
    setNewLocationInput('');
  };

  const handleRemoveLocation = (loc: string) => {
    setCandidateLocations(candidateLocations.filter((l) => l !== loc));
  };

  // Hiring Preferences: Add Skill
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (!preferredSkills.includes(trimmed)) {
      setPreferredSkills([...preferredSkills, trimmed]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  // Save Hiring Preferences
  const handleSaveHiringPreferences = () => {
    showToast('success', 'Hiring Preferences Saved', 'Your hiring preferences will improve candidate recommendations.');
  };

  // Toggle Notification
  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('abhijobs_settings_employer_notifs', JSON.stringify(next));
      return next;
    });
    showToast('info', 'Notification Preference Updated', 'Saved.');
  };

  // Invite Team Member
  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast('error', 'Invalid Input', 'Please enter a valid name and company email.');
      return;
    }
    const newMember: TeamMember = {
      id: 'member-' + Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Pending',
      joinedDate: 'Just now',
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    localStorage.setItem('abhijobs_employer_team', JSON.stringify(updated));
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    showToast('success', 'Invitation Sent', `An invite has been dispatched to ${newMember.email}.`);
  };

  // Remove Team Member
  const handleRemoveMember = (id: string, name: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    localStorage.setItem('abhijobs_employer_team', JSON.stringify(updated));
    showToast('info', 'Team Member Removed', `${name} has been removed from your hiring team.`);
  };

  // Appearance
  const handleAppearanceChange = (mode: 'light' | 'dark' | 'system') => {
    setAppearance(mode);
    localStorage.setItem('abhijobs_theme', mode);
    showToast('info', 'Appearance Updated', `Switched theme to ${mode}.`);
  };

  // Download Company Data
  const handleDownloadData = () => {
    const data = {
      account: {
        id: currentUser?.id,
        name: currentUser?.name,
        email: currentUser?.email,
        role: currentUser?.role,
      },
      companyProfile: currentEmployer,
      hiringPreferences: {
        candidateLocations,
        preferredWorkModes,
        commonlyHiredJobTypes,
        preferredExperienceRanges,
        preferredSkills,
      },
      teamMembers,
      notificationPreferences: notifications,
      exportTimestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `abhi-jobs-company-data-${currentEmployer?.companyName?.replace(/\s+/g, '_') || 'company'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Data Archive Downloaded', 'Company data exported successfully.');
  };

  // Sections navigation definition (9 employer sections)
  const sections: { id: EmployerSection; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
      description: 'Recruiter credentials, login email, phone, and password.',
    },
    {
      id: 'company-profile',
      label: 'Company Profile',
      icon: Building2,
      description: 'Brand logo, industry, headquarters, and organization bio.',
    },
    {
      id: 'visibility-verification',
      label: 'Company Visibility & Verification',
      icon: ShieldCheck,
      description: 'Public listing state and official business verification badge.',
    },
    {
      id: 'hiring-preferences',
      label: 'Hiring Preferences',
      icon: Briefcase,
      description: 'Target candidate locations, work modes, and commonly hired skills.',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Application alerts, candidate replies, and job posting digests.',
    },
    {
      id: 'team-access',
      label: 'Team & Access',
      icon: Users,
      description: 'Manage recruiter accounts, hiring managers, and role permissions.',
    },
    {
      id: 'security',
      label: 'Security',
      icon: Lock,
      description: 'Password, session tokens, and active browser logins.',
    },
    {
      id: 'appearance',
      label: 'Language & Appearance',
      icon: Globe,
      description: 'Display language and interface color theme.',
    },
    {
      id: 'data',
      label: 'Data & Account',
      icon: Database,
      description: 'Export company records, deactivate recruiter portal, or delete account.',
    },
  ];

  const verificationStatus = currentEmployer?.verificationStatus || (currentEmployer?.verified ? 'verified' : 'pending');

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004D40]/10 text-[#004D40] text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Employer Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Organization preferences, verification status, hiring settings, and team access.
            </p>
          </div>

          <button
            onClick={() => navigate('/employer/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEW (Screen < md) */}
        {/* ======================================================== */}
        <div className="md:hidden">
          {mobileViewSection === null ? (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Settings Menu
                </p>
              </div>
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setMobileViewSection(section.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left cursor-pointer min-h-[56px]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#004D40] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#101828] truncate">
                          {section.label}
                        </div>
                        <div className="text-[11px] text-[#667085] truncate">
                          {section.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setMobileViewSection(null)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-50 cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 text-[#004D40]" />
                <span>Back to Settings List</span>
              </button>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                {renderSectionContent(mobileViewSection)}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DESKTOP VIEW (Screen >= md): 2-Column Split */}
        {/* ======================================================== */}
        <div className="hidden md:grid md:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-3 shadow-xs space-y-1 sticky top-24">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Employer Settings
            </div>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-[#004D40] text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Main Content Card */}
          <div className="md:col-span-8 lg:col-span-9 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {renderSectionContent(activeSection)}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* Verification Modal */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#004D40]" />
                <span>Complete Company Verification</span>
              </h3>
              <button
                onClick={() => setIsVerificationModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Verification gives your job postings a Verified Employer badge, boosting candidate application rates by 3.5×.
            </p>

            <form onSubmit={handleSubmitVerification} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={verificationDocType}
                  onChange={(e) => setVerificationDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-hidden focus:border-[#004D40] min-h-[44px]"
                >
                  <option value="gst">GST Registration Certificate</option>
                  <option value="cin">Corporate Identification Number (CIN)</option>
                  <option value="pan">Company PAN Card</option>
                  <option value="udyam">MSME / Udyam Registration</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registration / Identification Number
                </label>
                <input
                  type="text"
                  value={verificationDocNumber}
                  onChange={(e) => setVerificationDocNumber(e.target.value)}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-semibold focus:outline-hidden focus:border-[#004D40] min-h-[44px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                Our verification compliance team processes submissions within 24 business hours.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVerificationModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#004D40] text-white text-xs font-bold hover:bg-[#00382e] min-h-[44px] cursor-pointer"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Team Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#004D40]" />
                <span>Invite Team Member</span>
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-hidden min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-hidden min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-hidden min-h-[44px]"
                >
                  <option value="Recruiter">Recruiter (Can manage jobs and candidates)</option>
                  <option value="Hiring Manager">Hiring Manager (Can review candidates & schedule)</option>
                  <option value="Owner">Owner (Full company and billing control)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#004D40] text-white text-xs font-bold hover:bg-[#00382e] min-h-[44px] cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#004D40]" />
                <span>Verify Email Change</span>
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!emailOtpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Work Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 min-h-[44px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Send Verification Code
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800">
                  Verification code sent to <strong>{newEmail}</strong>. (Simulated code: <strong>{generatedEmailOtp}</strong>)
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="e.g. 581932"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center bg-slate-50 min-h-[44px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailOtpSent(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#004D40] text-white text-xs font-bold hover:bg-[#00382e] min-h-[44px] cursor-pointer"
                  >
                    Verify & Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phone Verification Modal */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#004D40]" />
                <span>Verify Recruiter Phone</span>
              </h3>
              <button
                onClick={() => setIsPhoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!phoneOtpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 min-h-[44px]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold min-h-[44px] cursor-pointer"
                >
                  Send SMS OTP
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800">
                  SMS OTP sent to <strong>+91 {newPhone}</strong>. (Simulated code: <strong>{generatedPhoneOtp}</strong>)
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit SMS OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="e.g. 842109"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center bg-slate-50 min-h-[44px]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneOtpSent(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#004D40] text-white text-xs font-bold hover:bg-[#00382e] min-h-[44px] cursor-pointer"
                  >
                    Verify & Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {isDeactivateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Deactivate Company Account?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deactivating your employer account will temporarily pause all published job listings and hide your company profile from candidate searches. Your applicants and job records remain stored safely.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeactivateModalOpen(false);
                  deactivateCurrentUser();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold min-h-[44px] cursor-pointer"
              >
                Yes, Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Permanently Delete Employer Account?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This action cannot be undone. All published jobs, applicant pipelines, interview notes, and organization records will be wiped permanently.
              </p>
            </div>
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-700">
                Type <strong>DELETE</strong> below to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50/40 text-xs font-mono font-bold text-red-900 focus:outline-hidden min-h-[44px]"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  deleteCurrentUser();
                  navigate('/');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold min-h-[44px] cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out All Devices Modal */}
      {isSignOutAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sign Out of All Devices?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                All logged-in recruiter web sessions and tokens will be revoked.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSignOutAllModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignOutAllModalOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold min-h-[44px] cursor-pointer"
              >
                Sign Out Everywhere
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render individual employer sections
  function renderSectionContent(sectionId: EmployerSection) {
    switch (sectionId) {
      // ========================================================
      // 1. ACCOUNT
      // ========================================================
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Account</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Primary recruiter profile credentials, authorized email, and authentication methods.
              </p>
            </div>

            {/* Full Name */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Recruiter Full Name</span>
                  <p className="text-[11px] text-slate-500">Visible to candidates in interview invites and job messages.</p>
                </div>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="text-xs font-bold text-[#004D40] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#004D40] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="px-4 py-2 rounded-xl bg-[#004D40] text-white text-xs font-bold min-h-[44px] hover:bg-[#00382e] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-900">
                  {currentUser?.name || currentEmployer?.recruiterName || 'Not specified'}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Work Email Address</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">{currentUser?.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Used for candidate notifications, interview confirmations, and billing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewEmail('');
                  setEmailOtpSent(false);
                  setIsEmailModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs min-h-[44px] cursor-pointer shrink-0"
              >
                Change Email
              </button>
            </div>

            {/* Phone Number */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Recruiter Phone</span>
                  {currentEmployer?.recruiterPhone ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {currentEmployer?.recruiterPhone ? `+91 ${currentEmployer.recruiterPhone}` : 'No phone linked'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Used for account alerts and critical application escalation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPhone(currentEmployer?.recruiterPhone || '');
                  setPhoneOtpSent(false);
                  setIsPhoneModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs min-h-[44px] cursor-pointer shrink-0"
              >
                {currentEmployer?.recruiterPhone ? 'Change Phone' : 'Add Phone'}
              </button>
            </div>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#004D40]" />
                  <span>Change Password</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Use at least 8 characters with numbers and special symbols.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Current Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs min-h-[40px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs min-h-[40px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs min-h-[40px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#004D40] text-white text-xs font-bold hover:bg-[#00382e] min-h-[40px] cursor-pointer transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>

            {/* Google Account */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800">Google Workspace / Account</span>
                <p className="text-xs text-slate-600 mt-1">
                  {isGoogleConnected ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Linked to {currentUser?.email}
                    </span>
                  ) : (
                    'Link your Google Workspace for quick SSO sign-in.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGoogleConnected(!isGoogleConnected);
                  showToast(
                    'info',
                    isGoogleConnected ? 'Google SSO Disconnected' : 'Google SSO Connected',
                    isGoogleConnected
                      ? 'You can now sign in using standard email and password.'
                      : 'Google Workspace single sign-on enabled.'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold min-h-[44px] cursor-pointer shrink-0"
              >
                {isGoogleConnected ? 'Disconnect' : 'Connect Google'}
              </button>
            </div>

            {/* Delete Account Shortcut */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need to remove your employer account?</span>
              <button
                type="button"
                onClick={() => setActiveSection('data')}
                className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
              >
                Manage in Data & Account →
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 2. COMPANY PROFILE
      // ========================================================
      case 'company-profile':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#101828]">Company Profile</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Overview of company brand info, website, industry, and contact details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/employer/profile')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto min-h-[44px]"
              >
                <span>Edit Company Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Company Info Card Summary */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                {currentEmployer?.logo ? (
                  <img
                    src={currentEmployer.logo}
                    alt={currentEmployer.companyName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl border border-teal-200">
                    {(currentEmployer?.companyName || 'C')[0]}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {currentEmployer?.companyName || 'Configured Organization'}
                    </h3>
                    {currentEmployer?.verified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentEmployer?.industry || 'Technology'} • {currentEmployer?.companySize || '50-200 employees'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Website
                  </span>
                  <a
                    href={currentEmployer?.website || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-800 hover:text-[#004D40] flex items-center gap-1 mt-1"
                  >
                    <span>{currentEmployer?.website || 'https://company.example.com'}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Headquarters Location
                  </span>
                  <p className="font-semibold text-slate-800 mt-1">
                    {currentEmployer?.location || 'Bengaluru, Karnataka, India'}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Company Description
                  </span>
                  <p className="text-slate-600 mt-1 leading-relaxed line-clamp-3">
                    {currentEmployer?.about ||
                      currentEmployer?.description ||
                      'Leading innovator building modern technology solutions. Verified hiring partner on ABHI JOBS.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-teal-900">
                <Sparkles className="w-4 h-4 text-[#004D40] shrink-0" />
                <span>To modify office gallery images, perks, or full bio, visit the dedicated company profile editor.</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/employer/profile')}
                className="text-xs font-bold text-[#004D40] hover:underline cursor-pointer shrink-0 ml-2"
              >
                Go to Editor →
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 3. COMPANY VISIBILITY & VERIFICATION
      // ========================================================
      case 'visibility-verification':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Company Visibility & Verification</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Manage your public employer listing and monitor official compliance verification status.
              </p>
            </div>

            {/* Profile Visibility */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Company Profile Visibility
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleSaveVisibility('public')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    companyVisibility === 'public'
                      ? 'border-[#004D40] bg-teal-50/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Public</span>
                    <input
                      type="radio"
                      name="companyVisibility"
                      checked={companyVisibility === 'public'}
                      onChange={() => handleSaveVisibility('public')}
                      className="text-[#004D40] focus:ring-[#004D40]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Company profile, active job openings, culture highlights, and recruiter contacts are publicly discoverable by candidates.
                  </p>
                </div>

                <div
                  onClick={() => handleSaveVisibility('hidden')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    companyVisibility === 'hidden'
                      ? 'border-[#004D40] bg-teal-50/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Hidden</span>
                    <input
                      type="radio"
                      name="companyVisibility"
                      checked={companyVisibility === 'hidden'}
                      onChange={() => handleSaveVisibility('hidden')}
                      className="text-[#004D40] focus:ring-[#004D40]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Unlisted from the company directory. Only candidates with direct links to your specific job postings can review your profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Status (Must come from backend/admin, cannot be manually toggled per rules) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Verification Status</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Official verification is issued by ABHI JOBS Compliance following corporate document check.
                  </p>
                </div>

                {verificationStatus === 'verified' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                )}

                {verificationStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    <FileCheck className="w-4 h-4 text-amber-600" />
                    <span>Pending Review</span>
                  </span>
                )}

                {verificationStatus === 'not_verified' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                    <span>Not verified</span>
                  </span>
                )}
              </div>

              {verificationStatus === 'verified' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  <strong>Verified Employer</strong>: Your business registration has been validated. All job postings carry the green verification badge.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600">
                    Complete verification to unlock unlimited job applications, featured listings, and candidate direct messaging.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold transition-colors cursor-pointer min-h-[44px] shrink-0"
                  >
                    Complete Verification
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      // ========================================================
      // 4. HIRING PREFERENCES
      // ========================================================
      case 'hiring-preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Hiring Preferences</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Set baseline candidate requirements to help ABHI JOBS match you with qualified applicants.
              </p>
            </div>

            {/* Candidate Locations */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Preferred Candidate Locations
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                  placeholder="Type city (e.g. Pune, Delhi-NCR, Remote) and press Add"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-hidden focus:border-[#004D40] min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black min-h-[44px] cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {candidateLocations.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold"
                  >
                    <MapPin className="w-3 h-3 text-[#004D40]" />
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc)}
                      className="hover:text-red-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Work Modes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Preferred Work Modes</label>
              <div className="flex flex-wrap gap-2">
                {['Remote', 'Hybrid', 'On-site'].map((mode) => {
                  const isSelected = preferredWorkModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPreferredWorkModes((prev) =>
                          isSelected ? prev.filter((m) => m !== mode) : [...prev, mode]
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] ${
                        isSelected
                          ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Commonly Hired Job Types */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Job Types Commonly Hired</label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Internship', 'Contract', 'Temporary'].map((type) => {
                  const isSelected = commonlyHiredJobTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setCommonlyHiredJobTypes((prev) =>
                          isSelected ? prev.filter((t) => t !== type) : [...prev, type]
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] ${
                        isSelected
                          ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Experience Ranges */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Preferred Experience Ranges</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Fresher (0-1 yr)',
                  'Junior (1-2 yrs)',
                  'Mid-level (2-5 yrs)',
                  'Senior (5-8 yrs)',
                  'Lead / Executive (8+ yrs)',
                ].map((exp) => {
                  const isSelected = preferredExperienceRanges.includes(exp);
                  return (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => {
                        setPreferredExperienceRanges((prev) =>
                          isSelected ? prev.filter((e) => e !== exp) : [...prev, exp]
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] ${
                        isSelected
                          ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {exp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Skills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Key In-Demand Skills</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Type skill (e.g. Next.js, AWS, SQL) and press Add"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-hidden focus:border-[#004D40] min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black min-h-[44px] cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {preferredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveHiringPreferences}
                className="px-6 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
              >
                Save Hiring Preferences
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 5. NOTIFICATIONS
      // ========================================================
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Notifications</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Control notifications for applications, candidate messages, and job listing updates.
              </p>
            </div>

            {/* Applications */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Applications
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'newApplicationReceived' as const,
                    title: 'New application received',
                    desc: 'Instant alert when a candidate applies to any of your active job listings.',
                  },
                  {
                    key: 'candidateShortlisted' as const,
                    title: 'Candidate shortlisted',
                    desc: 'Confirmations when hiring team members advance candidates in the pipeline.',
                  },
                  {
                    key: 'interviewActivity' as const,
                    title: 'Interview activity',
                    desc: 'Scheduled interview confirmations and candidate acceptance alerts.',
                  },
                  {
                    key: 'applicationUpdates' as const,
                    title: 'Application updates',
                    desc: 'Daily digest of applicant pipeline movements and profile updates.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => handleToggleNotification(item.key)}
                      className="rounded text-[#004D40] focus:ring-[#004D40] w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Jobs */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Jobs
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'jobApprovalStatus' as const,
                    title: 'Job approval/status updates',
                    desc: 'Notifications when job postings are approved, published, or require moderation.',
                  },
                  {
                    key: 'jobClosingReminders' as const,
                    title: 'Job closing reminders',
                    desc: 'Early reminders when an active job listing is nearing its application deadline.',
                  },
                  {
                    key: 'jobPostingIssues' as const,
                    title: 'Job posting issues',
                    desc: 'Alerts if a post contains missing details or formatting warnings.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => handleToggleNotification(item.key)}
                      className="rounded text-[#004D40] focus:ring-[#004D40] w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Candidate Communication */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Candidate Communication
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'newCandidateMessages' as const,
                    title: 'New candidate messages',
                    desc: 'Real-time alert when candidates submit questions or reply to outreach.',
                  },
                  {
                    key: 'interviewResponses' as const,
                    title: 'Interview responses',
                    desc: 'Instant notifications when candidates confirm or request rescheduling.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => handleToggleNotification(item.key)}
                      className="rounded text-[#004D40] focus:ring-[#004D40] w-4 h-4 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Platform
              </h3>
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="pr-3">
                  <span className="text-xs font-semibold text-slate-800">Important ABHI JOBS announcements</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Platform feature enhancements, compliance advisories, and system notices.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.platformAnnouncements}
                  onChange={() => handleToggleNotification('platformAnnouncements')}
                  className="rounded text-[#004D40] focus:ring-[#004D40] w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            {/* Notification Channels */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Notification Channels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'channelEmail' as const, label: 'Email', status: 'Corporate', desc: currentUser?.email },
                  { key: 'channelPush' as const, label: 'Push Notifications', status: 'Browser', desc: 'Real-time recruiter alerts' },
                  { key: 'channelSms' as const, label: 'SMS', status: 'Active', desc: 'Critical hiring notifications' },
                  { key: 'channelWhatsApp' as const, label: 'WhatsApp', status: 'Direct', desc: 'Instant candidate coordination' },
                ].map((channel) => (
                  <label
                    key={channel.key}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{channel.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-700 font-semibold">
                          {channel.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{channel.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[channel.key]}
                      onChange={() => handleToggleNotification(channel.key)}
                      className="rounded text-[#004D40] focus:ring-[#004D40] w-4 h-4 cursor-pointer ml-2"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      // ========================================================
      // 6. TEAM & ACCESS
      // ========================================================
      case 'team-access':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#101828]">Team & Access</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Manage recruiter members, assign hiring roles, and control administrative permissions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            </div>

            {/* Role Explanations */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Roles & Permissions</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-purple-700 block">Owner</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Full company and account control, verification, billing, and team administration.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-[#004D40] block">Recruiter</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Can create and manage jobs, communicate with applicants, and shortlist candidates.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-blue-700 block">Hiring Manager</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Can review shortlisted resumes, write feedback notes, and participate in interview stages.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Active Team Members ({teamMembers.length})
              </span>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center font-bold text-sm">
                        {member.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{member.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              member.role === 'Owner'
                                ? 'bg-purple-100 text-purple-800'
                                : member.role === 'Recruiter'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">Joined {member.joinedDate}</span>
                      {member.role !== 'Owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-300 text-slate-600 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ========================================================
      // 7. SECURITY
      // ========================================================
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Security</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Protect organizational credentials and monitor active recruiter sessions.
              </p>
            </div>

            {/* Change Password Quick Shortcut */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#004D40]" />
                  <span>Account Password</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Updated securely. We recommend rotating passwords every 90 days.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('account')}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-100 min-h-[44px] cursor-pointer shrink-0"
              >
                Change Password
              </button>
            </div>

            {/* Two-Factor Authentication (Properly marked as Coming Soon per prompt rules) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Two-Factor Authentication (2FA)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Enterprise SSO enforcement and mandatory 2FA for all team recruiters is currently under deployment.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold cursor-not-allowed shrink-0 min-h-[44px]"
              >
                Not Available Yet
              </button>
            </div>

            {/* Active Sessions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-800 block">Active Sessions / Devices</span>
              <div className="space-y-2">
                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Chrome on Linux (Workstation)</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          This device
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bengaluru, India • Active right now
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out of All Devices */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSignOutAllModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-red-400 text-slate-700 hover:text-red-600 text-xs font-bold shadow-2xs transition-colors cursor-pointer min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of All Devices</span>
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 8. LANGUAGE & APPEARANCE
      // ========================================================
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Language & Appearance</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Personalize your recruiter workspace display language and color theme.
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Workspace Language</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer min-h-[44px] flex items-center justify-between ${
                    language === 'en'
                      ? 'border-[#004D40] bg-teal-50 text-[#004D40]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span>English (India)</span>
                  {language === 'en' && <Check className="w-4 h-4" />}
                </button>

                {['Hindi (हिन्दी)', 'Tamil (தமிழ்)', 'Telugu (తెలుగు)'].map((lang) => (
                  <div
                    key={lang}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-400 font-medium flex items-center justify-between min-h-[44px] cursor-not-allowed"
                  >
                    <span>{lang}</span>
                    <span className="text-[9px] px-1 py-0.5 rounded-xs bg-slate-200 text-slate-500 uppercase font-bold">
                      Soon
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 block">Theme Appearance</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'light' as const, label: 'Light', desc: 'Clean white background and crisp contrast' },
                  { id: 'dark' as const, label: 'Dark', desc: 'Dimmed background for eye comfort' },
                  { id: 'system' as const, label: 'System Default', desc: 'Syncs automatically with device OS preference' },
                ].map((t) => {
                  const isSelected = appearance === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleAppearanceChange(t.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#004D40] bg-teal-50/40'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{t.label}</span>
                        <input
                          type="radio"
                          name="appearanceTheme"
                          checked={isSelected}
                          onChange={() => handleAppearanceChange(t.id)}
                          className="text-[#004D40] focus:ring-[#004D40]"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      // ========================================================
      // 9. DATA & ACCOUNT
      // ========================================================
      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Data & Account</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Export organization data archives, temporarily deactivate, or delete company account.
              </p>
            </div>

            {/* Download Company Data */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#004D40]" />
                  <span>Download Company Data</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Export complete records of company job posts, candidate application timelines, and team structure as JSON.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadData}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs transition-colors cursor-pointer min-h-[44px] shrink-0"
              >
                <Download className="w-4 h-4 text-[#004D40]" />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Deactivate Account */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Deactivate Account</span>
                </span>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  Temporarily pause active job listings and recruiter access. Data is preserved for when you return.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors cursor-pointer min-h-[44px] shrink-0"
              >
                Deactivate
              </button>
            </div>

            {/* Delete Account */}
            <div className="p-4 sm:p-5 rounded-2xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Delete Account</span>
                </span>
                <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                  Permanently delete your employer account, company profile, and applicant records. This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText('');
                  setIsDeleteModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px] shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
};
