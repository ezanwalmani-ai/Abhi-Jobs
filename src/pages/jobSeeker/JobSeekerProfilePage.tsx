import React, { useMemo, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  ArrowLeft,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Pencil,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { CandidateProfile } from '../../types';
import {
  extractTextFromResumeFile,
  parseStructuredResumeText,
} from '../../services/resumeParserService';
import { uploadCandidateDocument } from '../../services/candidateDocumentService';
import {
  calculateProfileCompletion,
  mapParsedResumeToCandidateDraft,
  mergeParsedDraftIntoProfile,
  type ParsedCandidateDraft,
  type ParsedMergeSectionKey,
  type ProfileSectionId,
} from '../../utils/profileCompletion';
import { ProfileSidebar } from '../../components/profile/ProfileSidebar';
import { ProfileSections } from '../../components/profile/ProfileSections';
import { ResumeParseReviewModal } from '../../components/profile/ResumeParseReviewModal';

interface JobSeekerProfilePageProps {
  navigate: (route: string) => void;
}

export const JobSeekerProfilePage: React.FC<JobSeekerProfilePageProps> = ({ navigate }) => {
  const { currentCandidate, currentUser, updateCandidateProfile, showToast } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingSection, setEditingSection] = useState<ProfileSectionId | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<ProfileSectionId | null>('personal');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedDraft, setParsedDraft] = useState<ParsedCandidateDraft | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [uploadedResumeDocId, setUploadedResumeDocId] = useState<string | null>(null);

  // Build unified active profile view from existing candidate record or authenticated user
  const profile: CandidateProfile = useMemo(() => {
    if (currentCandidate) {
      return {
        ...currentCandidate,
        candidateCode: currentCandidate.candidateCode || currentUser?.candidateCode,
      };
    }
    return {
      id: currentUser?.id || 'candidate_session',
      userId: currentUser?.id || 'candidate_session',
      candidateCode: currentUser?.candidateCode,
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: '',
      location: 'India',
      headline: '',
      about: '',
      currentRole: '',
      desiredRole: '',
      experienceLevel: 'Fresher',
      experienceType: 'fresher',
      workStatus: 'Looking for a job',
      yearsOfExperience: 0,
      preferredLocation: '',
      workPreference: 'Hybrid',
      availability: 'Immediate',
      profileVisibility: 'employers_only',
      availableForOpportunities: true,
      skills: [],
      detailedSkills: [],
      education: [],
      experiences: [],
      certifications: [],
      projects: [],
      languages: [],
      otherLinks: [],
      completionPercentage: 0,
      recommendations: [],
      avatar: currentUser?.avatar,
    };
  }, [currentCandidate, currentUser]);

  const completionReport = useMemo(() => calculateProfileCompletion(profile), [profile]);

  const initials = useMemo(() => {
    const parts = (profile.name || profile.email || 'C').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'C').slice(0, 2).toUpperCase();
  }, [profile.name, profile.email]);

  const handleJumpToSection = (sectionId: ProfileSectionId, openEditor = false) => {
    setActiveSectionId(sectionId);
    if (openEditor) {
      setEditingSection(sectionId);
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(`profile-section-${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleTriggerResumeUpload = () => {
    setParseError(null);
    fileInputRef.current?.click();
  };

  const handleResumeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so selecting the same file again still triggers onChange
    e.target.value = '';
    if (!file) return;

    setIsParsingResume(true);
    setParseError(null);

    try {
      // 1. Securely upload the original binary resume file to private backend storage + Firestore version history
      let savedDocId: string | undefined;
      if (currentUser?.id) {
        try {
          const uploadedDoc = await uploadCandidateDocument({
            uid: currentUser.id,
            file,
            category: 'resume',
          });
          savedDocId = uploadedDoc.id;
          setUploadedResumeDocId(uploadedDoc.id);
          // Immediately persist latest resume file link & metadata so Admin Portal can view/download right away
          const sizeKb = Math.max(1, Math.round(file.size / 1024));
          const sizeLabel =
            sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
          updateCandidateProfile({
            resumeDocId: uploadedDoc.id,
            resumeName: uploadedDoc.originalFilename,
            resumeSize: sizeLabel,
            resumeUpdated: uploadedDoc.uploadedAt,
          });
        } catch (uploadErr: any) {
          console.warn('Secure resume storage notice:', uploadErr);
        }
      }

      // 2. Parse resume text for review & one-click profile auto-fill
      const rawText = await extractTextFromResumeFile(file);
      const parsed = parseStructuredResumeText(rawText);
      const draft = mapParsedResumeToCandidateDraft(parsed, file.name, file.size);
      if (savedDocId) {
        setUploadedResumeDocId(savedDocId);
      }
      setParsedDraft(draft);
      setIsReviewModalOpen(true);
    } catch (err: any) {
      const msg =
        err?.message || 'We could not read this resume file. Please try a text-based PDF, DOC, or DOCX.';
      setParseError(msg);
      showToast('error', 'Resume Scanning Failed', msg);
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleConfirmParsedResume = (
    editedDraft: ParsedCandidateDraft,
    selectedSections: Record<ParsedMergeSectionKey, boolean>,
    overwriteExisting: boolean
  ) => {
    const updates = mergeParsedDraftIntoProfile(
      profile,
      editedDraft,
      selectedSections,
      overwriteExisting
    );
    if (uploadedResumeDocId) {
      updates.resumeDocId = uploadedResumeDocId;
    }
    updateCandidateProfile(updates);
    setIsReviewModalOpen(false);
    setParsedDraft(null);
  };

  const handleUpdateVisibility = (visibility: 'employers_only' | 'private') => {
    if (profile.profileVisibility === visibility) return;
    updateCandidateProfile({ profileVisibility: visibility });
  };

  const handleToggleOpportunities = (open: boolean) => {
    updateCandidateProfile({ availableForOpportunities: open });
  };

  const progressBarColor =
    completionReport.percentage >= 80
      ? 'bg-emerald-600'
      : completionReport.percentage >= 50
      ? 'bg-[#F47A24]'
      : 'bg-[#102B4E]';

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-6 sm:py-8">
      {/* Hidden Resume Upload Input (PDF, DOC, DOCX) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleResumeFileSelected}
        className="hidden"
        aria-label="Upload resume file"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Breadcrumb / Utility Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-1.5 font-medium text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Candidate Dashboard</span>
            </button>
            <span>/</span>
            <span className="font-semibold text-[#334155]">Candidate Profile</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/resume')}
            className="text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] transition-colors cursor-pointer"
          >
            Open Resume Builder
          </button>
        </div>

        {/* ================================================================= */}
        {/* CANDIDATE PROFILE HEADER CARD                                     */}
        {/* ================================================================= */}
        <header className="bg-white rounded-xl border border-[#E5EAF0] p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Candidate Identity */}
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#102B4E] text-white flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0 overflow-hidden border border-[#E5EAF0]">
                {profile.avatar && !profile.avatar.startsWith('data:') ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name || 'Candidate'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#102B4E] tracking-tight truncate">
                    {profile.name || 'Complete Your Name'}
                  </h1>
                  {profile.candidateCode && (
                    <span
                      data-testid="profile-candidate-id"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#F1F5FA] border border-[#D4DCE6] text-[11px] font-semibold text-[#102B4E] shrink-0"
                    >
                      <span className="text-[#64748B]">ABHI JOBS Candidate ID:</span>
                      <span className="font-mono font-bold tracking-wider tabular-nums text-[#102B4E]">
                        {profile.candidateCode}
                      </span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleJumpToSection('personal', true)}
                    aria-label="Edit personal details"
                    className="p-1.5 rounded-md text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm sm:text-[15px] text-[#334155] font-medium mt-0.5">
                  {profile.headline && profile.headline !== 'Job Seeker'
                    ? profile.headline
                    : 'Add a professional headline to stand out to recruiters'}
                </p>

                {/* Unboxed Metadata Row */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span>
                      {profile.location && profile.location !== 'India'
                        ? profile.location
                        : 'Location not set'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Briefcase className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span>
                      {profile.experienceLevel}
                      {profile.yearsOfExperience > 0 ? ` (${profile.yearsOfExperience} yrs)` : ''}
                    </span>
                  </span>
                  {profile.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span className="break-all">{profile.email}</span>
                    </span>
                  )}
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span>{profile.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Quick Summary: Completion + Resume Action */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#EEF2F6] shrink-0 lg:min-w-[230px]">
              <div className="w-full sm:max-w-[220px] lg:max-w-none">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-[#64748B]">Profile Strength</span>
                  <span className="font-bold text-[#102B4E] tabular-nums">
                    {completionReport.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EEF2F6] rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                    style={{ width: `${completionReport.percentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isParsingResume}
                  onClick={handleTriggerResumeUpload}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isParsingResume ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isParsingResume
                      ? 'Parsing Resume...'
                      : profile.resumeName
                      ? 'Update Resume'
                      : 'Upload Resume'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* RESUME-FIRST PROFILE CREATION BANNER                              */}
        {/* ================================================================= */}
        <section
          aria-labelledby="resume-first-heading"
          className="bg-white rounded-xl border border-[#D4DCE6] p-5 sm:p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-lg bg-[#FFF4EC] border border-[#F47A24]/25 text-[#DE6816] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="resume-first-heading"
                  className="text-base sm:text-lg font-bold text-[#102B4E] tracking-tight"
                >
                  Build your profile faster
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed max-w-2xl">
                  Upload your resume to automatically extract your professional details, experience, education and skills.
                </p>
                <p className="text-xs text-[#64748B] mt-2 flex items-center gap-1.5 flex-wrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Supports PDF, DOC, and DOCX (up to 10 MB) · Review and confirm extracted details before saving
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isParsingResume}
                onClick={handleTriggerResumeUpload}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {isParsingResume ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isParsingResume ? 'Extracting Details...' : 'Upload Resume'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleJumpToSection('personal', true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-[#D4DCE6] bg-white hover:bg-[#F6F8FB] hover:border-[#102B4E]/40 text-[#102B4E] text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Enter Details Manually</span>
              </button>
            </div>
          </div>

          {parseError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* MAIN TWO-COLUMN JOB PORTAL WORKSPACE                              */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Area: All 11 Profile Sections */}
          <div className="lg:col-span-8 min-w-0">
            <ProfileSections
              profile={profile}
              editingSection={editingSection}
              onStartEdit={(sec) => {
                setActiveSectionId(sec);
                setEditingSection(sec);
              }}
              onStopEdit={() => setEditingSection(null)}
              onSaveSection={(updates) => updateCandidateProfile(updates)}
              onTriggerResumeUpload={handleTriggerResumeUpload}
              isParsingResume={isParsingResume}
              navigate={navigate}
            />
          </div>

          {/* Right Side Panel: Completion Checklist, Missing Info, Visibility & Actions */}
          <div className="lg:col-span-4 min-w-0">
            <ProfileSidebar
              profile={profile}
              report={completionReport}
              activeSectionId={activeSectionId}
              onJumpToSection={handleJumpToSection}
              onUpdateVisibility={handleUpdateVisibility}
              onToggleOpportunities={handleToggleOpportunities}
            />
          </div>
        </div>
      </div>

      {/* Editable Resume Review & Confirmation Modal */}
      <ResumeParseReviewModal
        isOpen={isReviewModalOpen}
        existingProfile={profile}
        initialDraft={parsedDraft}
        onClose={() => {
          setIsReviewModalOpen(false);
          setParsedDraft(null);
        }}
        onConfirmSave={handleConfirmParsedResume}
      />
    </div>
  );
};
