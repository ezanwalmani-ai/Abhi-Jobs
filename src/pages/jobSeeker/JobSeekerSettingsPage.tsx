import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Shield,
  Briefcase,
  Bell,
  Lock,
  Globe,
  Database,
  ChevronRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Mail,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  Download,
  AlertCircle,
  Smartphone,
  LogOut,
  MapPin,
  Plus,
  X,
  Sliders,
  DollarSign,
  Laptop,
} from 'lucide-react';

interface JobSeekerSettingsPageProps {
  navigate: (route: string) => void;
  initialSection?: string;
}

type SettingsSection =
  | 'account'
  | 'privacy'
  | 'preferences'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'data';

export const JobSeekerSettingsPage: React.FC<JobSeekerSettingsPageProps> = ({
  navigate,
  initialSection = 'account',
}) => {
  const {
    currentUser,
    currentCandidate,
    updateCurrentUser,
    updateCandidateProfile,
    deactivateCurrentUser,
    deleteCurrentUser,
    logout,
    showToast,
  } = useApp();

  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (initialSection as SettingsSection) || 'account'
  );
  const [mobileViewSection, setMobileViewSection] = useState<SettingsSection | null>(null);

  // 1. Account Section State
  const [fullName, setFullName] = useState(currentUser?.name || currentCandidate?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Email verification modal
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Phone verification modal
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState(currentCandidate?.phone || '');
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

  // 2. Profile & Privacy State
  const [profileVisibility, setProfileVisibility] = useState<'visible' | 'hidden'>(
    currentCandidate?.profileVisibility === 'private' ? 'hidden' : 'visible'
  );
  const [resumeVisibility, setResumeVisibility] = useState<'viewable' | 'private'>(
    (currentCandidate as any)?.resumeVisibility || 'viewable'
  );
  const [allowEmployerContact, setAllowEmployerContact] = useState<boolean>(
    currentCandidate?.availableForOpportunities !== false
  );

  // 3. Job Preferences State
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_pref_jobtypes');
      return stored ? JSON.parse(stored) : ['Full-time'];
    } catch {
      return ['Full-time'];
    }
  });

  const [preferredWorkModes, setPreferredWorkModes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('abhijobs_pref_workmodes');
      return stored ? JSON.parse(stored) : [currentCandidate?.workPreference || 'Hybrid'];
    } catch {
      return ['Hybrid'];
    }
  });

  const [preferredLocations, setPreferredLocations] = useState<string[]>(() => {
    if (currentCandidate?.preferredLocation) {
      return [currentCandidate.preferredLocation];
    }
    return ['Bengaluru', 'Remote'];
  });
  const [locationInput, setLocationInput] = useState('');

  const [preferredRoles, setPreferredRoles] = useState<string[]>(() => {
    if (currentCandidate?.desiredRole) {
      return [currentCandidate.desiredRole];
    }
    return ['Software Engineer', 'Frontend Developer'];
  });
  const [roleInput, setRoleInput] = useState('');

  const [expectedSalaryMin, setExpectedSalaryMin] = useState<string>(
    String(currentCandidate?.expectedSalary?.min || '6')
  );
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<string>(
    String(currentCandidate?.expectedSalary?.max || '18')
  );

  // 4. Notifications State
  const [notifications, setNotifications] = useState({
    // Job Alerts
    newJobRecommendations: true,
    matchingPreferences: true,
    savedSearchAlerts: true,
    // Application Updates
    applicationReceived: true,
    applicationShortlisted: true,
    interviewUpdates: true,
    applicationStatusChanges: true,
    // Employer Communication
    newEmployerMessages: true,
    interviewInvitations: true,
    // Learning
    newLearningOpportunities: true,
    learningReminders: false,
    // Channels
    channelEmail: true,
    channelPush: true,
    channelSms: false,
    channelWhatsApp: true,
  });

  // 5. Language & Appearance State
  const [language, setLanguage] = useState('en');
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('abhijobs_theme') as any) || 'light';
  });

  // 6. Destructive Actions State
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Sign out all devices modal
  const [isSignOutAllModalOpen, setIsSignOutAllModalOpen] = useState(false);

  // Keep full name updated if currentUser changes
  useEffect(() => {
    if (currentUser?.name) {
      setFullName(currentUser.name);
    }
  }, [currentUser]);

  // Handle Name Save
  const handleSaveName = () => {
    if (!fullName.trim()) {
      showToast('error', 'Invalid Name', 'Full name cannot be empty.');
      return;
    }
    updateCurrentUser({ name: fullName.trim() });
    setIsEditingName(false);
  };

  // Handle Email Verification Step 1: Send OTP
  const handleSendEmailOtp = () => {
    if (!newEmail.trim() || !newEmail.includes('@') || !newEmail.includes('.')) {
      showToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedEmailOtp(code);
    setEmailOtpSent(true);
    showToast('info', 'Verification Code Sent', `A verification code was sent to ${newEmail} (Code: ${code})`);
  };

  // Handle Email Verification Step 2: Confirm OTP
  const handleVerifyEmail = () => {
    if (emailOtp.trim() !== generatedEmailOtp) {
      showToast('error', 'Invalid Code', 'The verification code does not match.');
      return;
    }
    updateCurrentUser({ email: newEmail.trim() });
    setIsEmailModalOpen(false);
    setEmailOtpSent(false);
    setEmailOtp('');
    setNewEmail('');
    showToast('success', 'Email Updated', 'Your email address has been successfully verified and changed.');
  };

  // Handle Phone Verification Step 1: Send OTP
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

  // Handle Phone Verification Step 2: Confirm OTP
  const handleVerifyPhone = () => {
    if (phoneOtp.trim() !== generatedPhoneOtp) {
      showToast('error', 'Invalid Code', 'The SMS OTP entered is incorrect.');
      return;
    }
    updateCandidateProfile({ phone: newPhone.trim() });
    setIsPhoneModalOpen(false);
    setPhoneOtpSent(false);
    setPhoneOtp('');
    showToast('success', 'Phone Updated', 'Your phone number has been verified and updated.');
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Password Required', 'Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      showToast('error', 'Weak Password', 'New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('success', 'Password Changed', 'Your password has been changed securely.');
  };

  // Handle Save Privacy Settings
  const handleSavePrivacy = () => {
    updateCandidateProfile({
      profileVisibility: profileVisibility === 'visible' ? 'employers_only' : 'private',
      availableForOpportunities: allowEmployerContact,
      ...( { resumeVisibility } as any ),
    });
    showToast('success', 'Privacy Updated', 'Your profile and resume visibility settings are saved.');
  };

  // Handle Add / Remove Preferred Locations
  const handleAddLocation = () => {
    const trimmed = locationInput.trim();
    if (!trimmed) return;
    if (!preferredLocations.includes(trimmed)) {
      setPreferredLocations([...preferredLocations, trimmed]);
    }
    setLocationInput('');
  };

  const handleRemoveLocation = (loc: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== loc));
  };

  // Handle Add / Remove Preferred Roles
  const handleAddRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed) return;
    if (!preferredRoles.includes(trimmed)) {
      setPreferredRoles([...preferredRoles, trimmed]);
    }
    setRoleInput('');
  };

  const handleRemoveRole = (role: string) => {
    setPreferredRoles(preferredRoles.filter((r) => r !== role));
  };

  // Handle Save Preferences
  const handleSavePreferences = () => {
    localStorage.setItem('abhijobs_pref_jobtypes', JSON.stringify(preferredJobTypes));
    localStorage.setItem('abhijobs_pref_workmodes', JSON.stringify(preferredWorkModes));
    updateCandidateProfile({
      preferredLocation: preferredLocations[0] || 'Flexible',
      desiredRole: preferredRoles[0] || 'Software Engineer',
      workPreference: (preferredWorkModes[0] as any) || 'Hybrid',
      expectedSalary: {
        min: Number(expectedSalaryMin) || 0,
        max: Number(expectedSalaryMax) || 0,
        currency: 'INR',
      },
    });
    showToast('success', 'Preferences Saved', 'Your job preferences will be used to improve recommendations.');
  };

  // Handle Save Notifications
  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('abhijobs_settings_jobseeker_notifs', JSON.stringify(next));
      return next;
    });
    showToast('info', 'Notification Preference Updated', 'Saved.');
  };

  // Handle Appearance Change
  const handleAppearanceChange = (mode: 'light' | 'dark' | 'system') => {
    setAppearance(mode);
    localStorage.setItem('abhijobs_theme', mode);
    showToast('info', 'Appearance Updated', `Switched theme to ${mode}.`);
  };

  // Handle Download Personal Data
  const handleDownloadData = () => {
    const data = {
      account: {
        id: currentUser?.id,
        name: currentUser?.name,
        email: currentUser?.email,
        role: currentUser?.role,
        createdAt: currentUser?.createdAt,
      },
      candidateProfile: currentCandidate,
      jobPreferences: {
        jobTypes: preferredJobTypes,
        workModes: preferredWorkModes,
        locations: preferredLocations,
        roles: preferredRoles,
        expectedSalary: { min: expectedSalaryMin, max: expectedSalaryMax },
      },
      notificationPreferences: notifications,
      exportTimestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `abhi-jobs-data-${currentUser?.name?.replace(/\s+/g, '_') || 'account'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Data Archive Downloaded', 'Your personal account data has been exported successfully.');
  };

  // Sections navigation definition
  const sections: { id: SettingsSection; label: string; icon: React.FC<{ className?: string }>; description: string }[] = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
      description: 'Personal credentials, email, phone, and password.',
    },
    {
      id: 'privacy',
      label: 'Profile & Privacy',
      icon: Shield,
      description: 'Control who can discover your profile and view your resume.',
    },
    {
      id: 'preferences',
      label: 'Job Preferences',
      icon: Briefcase,
      description: 'Preferred roles, locations, work modes, and expected salary.',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Alerts for matching jobs, application updates, and messages.',
    },
    {
      id: 'security',
      label: 'Security',
      icon: Lock,
      description: 'Password, sessions, and multi-device authentication.',
    },
    {
      id: 'appearance',
      label: 'Language & Appearance',
      icon: Globe,
      description: 'Platform display theme and language settings.',
    },
    {
      id: 'data',
      label: 'Data & Account',
      icon: Database,
      description: 'Export personal data, deactivate, or delete account.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004D40]/10 text-[#004D40] text-xs font-bold mb-2">
              <User className="w-3.5 h-3.5" />
              <span>Job Seeker Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#101828] tracking-tight">
              Settings
            </h1>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Manage your personal credentials, privacy, job preferences, and notifications.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEW (Screen < md) */}
        {/* If no section is selected, show list. If selected, show page */}
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
              {/* Back to Settings List Button */}
              <button
                onClick={() => setMobileViewSection(null)}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs hover:bg-slate-50 cursor-pointer min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 text-[#004D40]" />
                <span>Back to Settings List</span>
              </button>

              {/* Render Selected Section Content for Mobile */}
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
              Preferences
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
      {/* VERIFICATION & DESTRUCTIVE MODALS */}
      {/* ======================================================== */}

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

            <p className="text-xs text-slate-500">
              To keep your account secure, we require email verification before updating your login credentials.
            </p>

            {!emailOtpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email (e.g. user@example.com)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004D40] bg-slate-50 min-h-[44px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold transition-all min-h-[44px] cursor-pointer"
                >
                  Send Verification Code
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800">
                  Code sent to <strong>{newEmail}</strong>. (Simulated code: <strong>{generatedEmailOtp}</strong>)
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    placeholder="e.g. 482910"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center focus:outline-hidden focus:border-[#004D40] bg-slate-50 min-h-[44px]"
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
                <span>Verify Phone Number</span>
              </h3>
              <button
                onClick={() => setIsPhoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Recruiters use your phone number for critical interview schedules. A quick SMS OTP verifies your line.
            </p>

            {!phoneOtpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#004D40] bg-slate-50 min-h-[44px]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold transition-all min-h-[44px] cursor-pointer"
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
                    placeholder="e.g. 739201"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest text-center focus:outline-hidden focus:border-[#004D40] bg-slate-50 min-h-[44px]"
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
                    Verify & Save
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
              <h3 className="text-lg font-bold text-slate-900">Deactivate Your Account?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Deactivating your account will temporarily hide your profile from employers. Your active job applications and saved bookmarks will be preserved. You can reactivate your account at any time by simply logging back in.
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
              <h3 className="text-lg font-bold text-slate-900">Permanently Delete Account?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This action is <strong>irreversible</strong>. Your profile, resume files, submitted applications, interview history, and saved jobs will be permanently deleted from ABHI JOBS.
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
                You will be signed out from all active browsers, laptops, and mobile sessions. You will need to sign in again with your credentials.
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

  // Helper to render individual sections
  function renderSectionContent(sectionId: SettingsSection) {
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
                Manage your primary contact information, login email, and linked credentials.
              </p>
            </div>

            {/* Full Name */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Full Name</span>
                  <p className="text-[11px] text-slate-500">Displayed on job applications and employer reviews.</p>
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
                  {currentUser?.name || 'Not provided'}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Email Address</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Verified
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">{currentUser?.email}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Used for platform notifications, interview invites, and sign in.
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
                  <span className="text-xs font-bold text-slate-800">Phone Number</span>
                  {currentCandidate?.phone ? (
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
                  {currentCandidate?.phone ? `+91 ${currentCandidate.phone}` : 'No phone linked'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct SMS updates for urgent interview schedules and job offers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPhone(currentCandidate?.phone || '');
                  setPhoneOtpSent(false);
                  setIsPhoneModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold shadow-2xs min-h-[44px] cursor-pointer shrink-0"
              >
                {currentCandidate?.phone ? 'Change Phone' : 'Add Phone'}
              </button>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#004D40]" />
                  <span>Change Password</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Must be at least 8 characters with letters, numbers, and symbols.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Current Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 min-h-[40px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 min-h-[40px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 min-h-[40px] focus:outline-hidden focus:border-[#004D40]"
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
                <span className="text-xs font-bold text-slate-800">Google Account</span>
                <p className="text-xs text-slate-600 mt-1">
                  {isGoogleConnected ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Connected as {currentUser?.email}
                    </span>
                  ) : (
                    'Link your Google account for faster 1-click sign-in.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsGoogleConnected(!isGoogleConnected);
                  showToast(
                    'info',
                    isGoogleConnected ? 'Google Account Disconnected' : 'Google Account Connected',
                    isGoogleConnected
                      ? 'You can now sign in using standard email and password.'
                      : 'Fast Google authentication enabled.'
                  );
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold min-h-[44px] cursor-pointer shrink-0"
              >
                {isGoogleConnected ? 'Disconnect' : 'Connect Google'}
              </button>
            </div>

            {/* Delete Account Shortcut */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need to remove your account entirely?</span>
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
      // 2. PROFILE & PRIVACY
      // ========================================================
      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Profile & Privacy</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Control who can discover your candidate profile, view your resume, and contact you.
              </p>
            </div>

            {/* Profile Visibility */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Profile Visibility
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Visible to Employers */}
                <div
                  onClick={() => setProfileVisibility('visible')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    profileVisibility === 'visible'
                      ? 'border-[#004D40] bg-teal-50/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Visible to employers</span>
                    <input
                      type="radio"
                      name="profileVisibility"
                      checked={profileVisibility === 'visible'}
                      onChange={() => setProfileVisibility('visible')}
                      className="text-[#004D40] focus:ring-[#004D40]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Allow verified employers on ABHI JOBS to discover your profile in candidate searches and recommend matching roles.
                  </p>
                </div>

                {/* Hidden from Employers */}
                <div
                  onClick={() => setProfileVisibility('hidden')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    profileVisibility === 'hidden'
                      ? 'border-[#004D40] bg-teal-50/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Hidden from employers</span>
                    <input
                      type="radio"
                      name="profileVisibility"
                      checked={profileVisibility === 'hidden'}
                      onChange={() => setProfileVisibility('hidden')}
                      className="text-[#004D40] focus:ring-[#004D40]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Keep your profile private. Only companies where you submit an active application will be able to review your details.
                  </p>
                </div>
              </div>
            </div>

            {/* Resume Visibility */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-800 block">
                Resume Visibility
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setResumeVisibility('viewable')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    resumeVisibility === 'viewable'
                      ? 'border-[#004D40] bg-teal-50/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Employers can view my resume
                    </span>
                    <input
                      type="radio"
                      name="resumeVisibility"
                      checked={resumeVisibility === 'viewable'}
                      onChange={() => setResumeVisibility('viewable')}
                      className="text-[#004D40] focus:ring-[#004D40]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Verified recruiters browsing candidate profiles can preview and download your uploaded resume directly.
                  </p>
                </div>

                <div
                  onClick={() => setResumeVisibility('private')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    resumeVisibility === 'private'
                      ? 'border-[#004D40] bg-teal-50/40'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Keep my resume private
                    </span>
                    <input
                      type="radio"
                      name="resumeVisibility"
                      checked={resumeVisibility === 'private'}
                      onChange={() => setResumeVisibility('private')}
                      className="text-[#004D40] focus:ring-[#004D40]"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Your resume file is confidential and only shared with hiring managers when you explicitly click Apply on a job posting.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information Preference */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Allow employers to contact me
                </span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Permit verified companies to send you direct job offers, email queries, and interview invitations.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={allowEmployerContact}
                  onChange={(e) => setAllowEmployerContact(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004D40]"></div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePrivacy}
                className="px-6 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
              >
                Save Privacy Settings
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 3. JOB PREFERENCES
      // ========================================================
      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Job Preferences</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Set your career preferences. We use these to curate tailored job recommendations.
              </p>
            </div>

            {/* Preferred Job Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Preferred Job Type</label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Internship', 'Contract', 'Temporary'].map((type) => {
                  const isSelected = preferredJobTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setPreferredJobTypes((prev) =>
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

            {/* Preferred Work Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Preferred Work Mode</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Work from home', value: 'Remote' },
                  { label: 'Hybrid', value: 'Hybrid' },
                  { label: 'Office', value: 'On-site' },
                ].map((mode) => {
                  const isSelected = preferredWorkModes.includes(mode.value);
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        setPreferredWorkModes((prev) =>
                          isSelected ? prev.filter((m) => m !== mode.value) : [...prev, mode.value]
                        );
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] ${
                        isSelected
                          ? 'bg-[#004D40] text-white border-[#004D40] shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Preferred Locations</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                  placeholder="Type city (e.g. Pune, Hyderabad, Remote) and press Add"
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
                {preferredLocations.map((loc) => (
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

            {/* Preferred Job Roles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">Preferred Job Roles</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  placeholder="Type job title (e.g. Data Analyst, UX Designer) and press Add"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-hidden focus:border-[#004D40] min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black min-h-[44px] cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {preferredRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role)}
                      className="hover:text-red-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Expected Salary Range */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Expected Annual Salary Range (₹ LPA)
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Minimum (LPA)</span>
                  <input
                    type="number"
                    value={expectedSalaryMin}
                    onChange={(e) => setExpectedSalaryMin(e.target.value)}
                    placeholder="e.g. 6"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold min-h-[44px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Maximum (LPA)</span>
                  <input
                    type="number"
                    value={expectedSalaryMax}
                    onChange={(e) => setExpectedSalaryMax(e.target.value)}
                    placeholder="e.g. 18"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold min-h-[44px] focus:outline-hidden focus:border-[#004D40]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-6 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer min-h-[44px]"
              >
                Save Preferences
              </button>
            </div>
          </div>
        );

      // ========================================================
      // 4. NOTIFICATIONS
      // ========================================================
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Notifications</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Customize which events notify you and choose your preferred delivery channels.
              </p>
            </div>

            {/* Job Alerts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Job Alerts
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'newJobRecommendations' as const,
                    title: 'New job recommendations',
                    desc: 'Weekly digests of newly verified postings matching your profile skills.',
                  },
                  {
                    key: 'matchingPreferences' as const,
                    title: 'Jobs matching my preferences',
                    desc: 'Instant notifications when roles open in your chosen location and work mode.',
                  },
                  {
                    key: 'savedSearchAlerts' as const,
                    title: 'Saved-search/job alerts',
                    desc: 'Alerts when updates occur on your bookmarked searches.',
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

            {/* Application Updates */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Application Updates
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'applicationReceived' as const,
                    title: 'Application received',
                    desc: 'Confirmation when an employer receives and logs your application.',
                  },
                  {
                    key: 'applicationShortlisted' as const,
                    title: 'Application shortlisted',
                    desc: 'High-priority alert when your resume passes the initial employer screening.',
                  },
                  {
                    key: 'interviewUpdates' as const,
                    title: 'Interview updates',
                    desc: 'Invites, calendar time confirmations, and video meeting link updates.',
                  },
                  {
                    key: 'applicationStatusChanges' as const,
                    title: 'Application status changes',
                    desc: 'Step-by-step updates as your application advances through the hiring pipeline.',
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

            {/* Employer Communication */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Employer Communication
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'newEmployerMessages' as const,
                    title: 'New employer messages',
                    desc: 'Real-time alerts when a recruiter sends you a direct message.',
                  },
                  {
                    key: 'interviewInvitations' as const,
                    title: 'Interview invitations',
                    desc: 'Direct invitations to schedule formal interview rounds.',
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

            {/* Learning */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Learning
              </h3>
              <div className="space-y-2">
                {[
                  {
                    key: 'newLearningOpportunities' as const,
                    title: 'New learning opportunities',
                    desc: 'Notifies when new career upskilling courses and certifications are published.',
                  },
                  {
                    key: 'learningReminders' as const,
                    title: 'Learning reminders',
                    desc: 'Gentle weekly reminders to complete ongoing skill modules.',
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

            {/* Notification Channels */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Notification Channels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'channelEmail' as const, label: 'Email', status: 'Active', desc: currentUser?.email },
                  { key: 'channelPush' as const, label: 'Push Notifications', status: 'Browser', desc: 'Desktop and mobile browser alerts' },
                  { key: 'channelSms' as const, label: 'SMS', status: 'Standard', desc: currentCandidate?.phone ? `+91 ${currentCandidate.phone}` : 'Requires verified phone' },
                  { key: 'channelWhatsApp' as const, label: 'WhatsApp', status: 'Priority', desc: 'Direct interview updates via WhatsApp' },
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
      // 5. SECURITY
      // ========================================================
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Security</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Protect your account credentials, manage active logins, and configure multi-device security.
              </p>
            </div>

            {/* Change Password quick button */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#004D40]" />
                  <span>Account Password</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Last updated recently. Regular password changes prevent unauthorized account takeover.
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
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Two-Factor Authentication (2FA)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                    Coming Soon
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Hardware token and Google Authenticator-based multi-factor authentication is currently under security review and will be enabled soon for all ABHI JOBS members.
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

            {/* Active Sessions / Devices */}
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
                        <span className="text-xs font-bold text-slate-900">Chrome on Linux</span>
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

                <div className="p-4 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">Mobile Web App</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mumbai, India • Last active 2 days ago
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
      // 6. LANGUAGE & APPEARANCE
      // ========================================================
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Language & Appearance</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Personalize your display language and application color theme.
              </p>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Platform Language</label>
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
      // 7. DATA & ACCOUNT
      // ========================================================
      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#101828]">Data & Account</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Download your personal information archive, pause your account, or permanently delete your records.
              </p>
            </div>

            {/* Download My Data */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#004D40]" />
                  <span>Download My Data</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Export a comprehensive JSON copy of your profile attributes, application records, and account activity.
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
                  Temporarily pause your job search. Your profile will be hidden from employers, but your data stays safe until you return.
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
                  Permanently delete your login, resume data, and all submitted application records. This action cannot be reversed.
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
