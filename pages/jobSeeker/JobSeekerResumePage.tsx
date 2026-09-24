import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ResumeData,
  ResumeTemplateStyle,
  calculateResumeCompletion,
} from '../../types/resume';
import {
  loadUserResume,
  saveUserResume,
  buildResumeFromProfile,
} from '../../services/resumeService';
import { generateResumePdf, validateResumeForPdf } from '../../services/resumePdfService';
import { ResumeCompletionBar } from '../../components/resume/ResumeCompletionBar';
import { ResumeHeaderActions, SaveStatus } from '../../components/resume/ResumeHeaderActions';
import { ResumeEmptyState } from '../../components/resume/ResumeEmptyState';
import { PersonalInfoForm } from '../../components/resume/PersonalInfoForm';
import { SummaryForm } from '../../components/resume/SummaryForm';
import { ExperienceForm } from '../../components/resume/ExperienceForm';
import { EducationForm } from '../../components/resume/EducationForm';
import { SkillsForm } from '../../components/resume/SkillsForm';
import { ProjectsForm } from '../../components/resume/ProjectsForm';
import { CertificationsForm } from '../../components/resume/CertificationsForm';
import { LanguagesForm } from '../../components/resume/LanguagesForm';
import { ResumePreview } from '../../components/resume/ResumePreview';
import { ImportProfileModal } from '../../components/resume/ImportProfileModal';
import { Edit3, Eye, AlertTriangle, ArrowLeft } from 'lucide-react';

interface JobSeekerResumePageProps {
  navigate: (route: string) => void;
}

export const JobSeekerResumePage: React.FC<JobSeekerResumePageProps> = ({ navigate }) => {
  const { currentUser, currentCandidate, showToast, updateCandidateProfile } = useApp();

  const userId = currentUser?.id || 'guest_user';

  // State
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'preview'>('editor');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showExitWarning, setShowExitWarning] = useState<boolean>(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef<boolean>(false);

  // 1. Initial Load from Supabase / localStorage
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const loaded = await loadUserResume(userId);
        if (isMounted) {
          if (loaded) {
            setResume(loaded);
          } else {
            setResume(null); // Shows empty state
          }
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          initialLoadDoneRef.current = true;
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 2. Unsaved changes browser warning (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 3. Debounced Auto-save (1.5s after user stops typing)
  useEffect(() => {
    if (!initialLoadDoneRef.current || !resume || !hasUnsavedChanges) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const result = await saveUserResume(userId, resume);
      if (result.success) {
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
      } else {
        setSaveStatus('unsaved');
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [resume, hasUnsavedChanges, userId]);

  // Handle Updates
  const handleUpdateResume = (updates: Partial<ResumeData>) => {
    if (!resume) return;
    setResume((prev) => (prev ? { ...prev, ...updates } : prev));
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  // Manual Save Action
  const handleManualSave = async () => {
    if (!resume) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    setSaveStatus('saving');
    const result = await saveUserResume(userId, resume);
    if (result.success) {
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      showToast('success', 'Resume saved successfully', 'Your resume progress has been saved.');

      // Also update candidate profile resume status
      if (currentCandidate) {
        const sanitizedName = resume.fullName.trim().replace(/\s+/g, '_');
        updateCandidateProfile({
          resumeName: `${sanitizedName || 'ABHI_JOBS'}_Resume.pdf`,
          resumeUpdated: 'Just now',
        });
      }
    } else {
      setSaveStatus('unsaved');
      showToast(
        'error',
        "Couldn't save your resume",
        'Please check your connection and try again.'
      );
    }
  };

  // Download PDF Action
  const handleDownloadPdf = async () => {
    if (!resume) return;

    // Validate
    const validation = validateResumeForPdf(resume);
    if (!validation.valid) {
      const errorMap: Record<string, string> = {};
      if (!resume.fullName.trim()) errorMap.fullName = 'Full Name is required';
      if (!resume.email.trim() || !resume.email.includes('@'))
        errorMap.email = 'Valid Email is required';
      setFormErrors(errorMap);

      showToast(
        'warning',
        'Incomplete Resume',
        validation.errors[0] || 'Please complete required fields before downloading.'
      );
      return;
    }

    setFormErrors({});
    setIsDownloading(true);

    try {
      // If user is on mobile and currently on editor tab, ensure preview DOM is mounted
      if (activeMobileTab === 'editor' && typeof window !== 'undefined' && window.innerWidth < 1024) {
        setActiveMobileTab('preview');
        await new Promise((r) => setTimeout(r, 100));
      }

      // If there are unsaved changes, save first
      if (hasUnsavedChanges) {
        await saveUserResume(userId, resume);
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
      }

      await generateResumePdf(resume);
      showToast('success', 'Your resume is ready.', 'Downloaded professional A4 PDF.');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast(
        'error',
        'PDF Generation Failed',
        err.message || 'Please check your information and try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Start Building Handlers for Empty State
  const handleStartBlank = () => {
    const blank = buildResumeFromProfile(userId, null);
    setResume(blank);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleStartWithProfile = () => {
    const fromProfile = buildResumeFromProfile(userId, currentCandidate);
    setResume(fromProfile);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
    showToast('info', 'Profile data imported', 'Review and customize your information below.');
  };

  // Selective Import from Profile Modal Handler
  const handleSelectiveImport = (selected: {
    personalInfo: boolean;
    title: boolean;
    summary: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
  }) => {
    if (!currentCandidate || !resume) return;

    const updates: Partial<ResumeData> = {};

    if (selected.personalInfo) {
      if (currentCandidate.name) updates.fullName = currentCandidate.name;
      if (currentCandidate.email) updates.email = currentCandidate.email;
      if (currentCandidate.phone) updates.phone = currentCandidate.phone;
      if (currentCandidate.city) updates.city = currentCandidate.city;
      if (currentCandidate.state) updates.state = currentCandidate.state;
    }

    if (selected.title && (currentCandidate.headline || currentCandidate.currentRole)) {
      updates.professionalTitle = currentCandidate.headline || currentCandidate.currentRole;
    }

    if (selected.summary && currentCandidate.about) {
      updates.summary = currentCandidate.about;
    }

    if (selected.skills && currentCandidate.skills?.length > 0) {
      // Merge unique skills
      const combined = Array.from(new Set([...resume.skills, ...currentCandidate.skills]));
      updates.skills = combined;
    }

    if (selected.experience && currentCandidate.experiences?.length > 0) {
      const newExps = currentCandidate.experiences.map((exp, idx) => ({
        id: exp.id || `exp_${Date.now()}_${idx}`,
        jobTitle: exp.jobTitle || '',
        companyName: exp.company || '',
        employmentType: 'Full-time' as const,
        location: '',
        startMonth: '',
        startYear: exp.startDate || '',
        endMonth: '',
        endYear: exp.endDate || '',
        currentlyWorking: !!exp.current,
        responsibilities: exp.description ? [exp.description] : [],
      }));
      updates.experiences = [...resume.experiences, ...newExps];
    }

    if (selected.education && currentCandidate.education?.length > 0) {
      const newEdus = currentCandidate.education.map((edu, idx) => ({
        id: edu.id || `edu_${Date.now()}_${idx}`,
        degree: edu.qualification || edu.fieldOfStudy || '',
        institution: edu.institution || '',
        location: '',
        startDate: edu.startYear || '',
        endDate: edu.endYear || '',
        description: edu.fieldOfStudy ? `Field: ${edu.fieldOfStudy}` : '',
      }));
      updates.education = [...resume.education, ...newEdus];
    }

    handleUpdateResume(updates);
    showToast('success', 'Information imported', 'Selected profile details have been merged.');
  };

  // Safe internal navigation helper
  const handleSafeNavigate = (route: string) => {
    if (hasUnsavedChanges) {
      setPendingRoute(route);
      setShowExitWarning(true);
      return;
    }
    navigate(route);
  };

  // Completion stats
  const completion = useMemo(() => {
    if (!resume) {
      return {
        personalInfo: 0,
        summary: 0,
        experience: 0,
        education: 0,
        skills: 0,
        additional: 0,
        total: 0,
        missingTips: [],
        sections: {
          personalInfo: false,
          summary: false,
          experience: false,
          education: false,
          skills: false,
          additional: false,
        },
        encouragementMessage: 'Start building your resume to see your real-time progress.',
      };
    }
    return calculateResumeCompletion(resume);
  }, [resume]);

  const handleSectionJump = (sectionKey: string) => {
    // If on mobile and in preview tab, switch to editor
    if (activeMobileTab === 'preview') {
      setActiveMobileTab('editor');
    }
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#004D40] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading your resume...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumb / Exit Warning */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSafeNavigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* If user has no resume yet: show Empty State */}
        {!resume ? (
          <ResumeEmptyState
            onStartBlank={handleStartBlank}
            onStartWithProfile={handleStartWithProfile}
            hasProfileData={!!currentCandidate}
          />
        ) : (
          <div className="space-y-5">
            {/* Top Page Header */}
            <ResumeHeaderActions
              saveStatus={saveStatus}
              isDownloading={isDownloading}
              onSave={handleManualSave}
              onDownloadPdf={handleDownloadPdf}
              onOpenImportModal={() => setShowImportModal(true)}
            />

            {/* Resume Completion Indicator */}
            <ResumeCompletionBar
              completion={completion}
              onSectionClick={handleSectionJump}
            />

            {/* Mobile View Toggle Bar (Hidden on desktop lg+) */}
            <div className="lg:hidden flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveMobileTab('editor')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMobileTab === 'editor'
                    ? 'bg-[#004D40] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Resume Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileTab('preview')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMobileTab === 'preview'
                    ? 'bg-[#004D40] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview (A4)</span>
              </button>
            </div>

            {/* Two-Panel Layout (Desktop: 46% Editor | 54% Preview) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT PANEL: Resume Editor */}
              <div
                className={`lg:col-span-6 xl:col-span-5 space-y-5 ${
                  activeMobileTab === 'preview' ? 'hidden lg:block' : 'block'
                }`}
              >
                <div id="section-personalInfo">
                  <PersonalInfoForm
                    resume={resume}
                    onChange={handleUpdateResume}
                    errors={formErrors}
                  />
                </div>

                <div id="section-summary">
                  <SummaryForm
                    summary={resume.summary}
                    onChange={(summary) => handleUpdateResume({ summary })}
                  />
                </div>

                <div id="section-experience">
                  <ExperienceForm
                    experiences={resume.experiences}
                    onChange={(experiences) => handleUpdateResume({ experiences })}
                  />
                </div>

                <div id="section-education">
                  <EducationForm
                    education={resume.education}
                    onChange={(education) => handleUpdateResume({ education })}
                  />
                </div>

                <div id="section-skills">
                  <SkillsForm
                    skills={resume.skills}
                    onChange={(skills) => handleUpdateResume({ skills })}
                    profileSkills={currentCandidate?.skills || []}
                  />
                </div>

                <div id="section-additional" className="space-y-5">
                  <ProjectsForm
                    projects={resume.projects}
                    onChange={(projects) => handleUpdateResume({ projects })}
                  />

                  <CertificationsForm
                    certifications={resume.certifications}
                    onChange={(certifications) => handleUpdateResume({ certifications })}
                  />

                  <LanguagesForm
                    languages={resume.languages}
                    onChange={(languages) => handleUpdateResume({ languages })}
                  />
                </div>

                {/* Bottom Actions for Mobile */}
                <div className="lg:hidden p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveMobileTab('preview')}
                    className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#004D40]" />
                    <span>View Live Resume Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    className="w-full py-3 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* RIGHT PANEL: Live Resume Preview (Sticky on desktop) */}
              <div
                className={`lg:col-span-6 xl:col-span-7 lg:sticky lg:top-6 ${
                  activeMobileTab === 'editor' ? 'hidden lg:block' : 'block'
                }`}
              >
                <ResumePreview
                  resume={resume}
                  onTemplateChange={(template: ResumeTemplateStyle) =>
                    handleUpdateResume({ template })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import from Profile Modal */}
      <ImportProfileModal
        candidate={currentCandidate}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleSelectiveImport}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                You have unsaved changes
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Are you sure you want to leave? Any changes you made that haven&apos;t finished saving may be lost.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitWarning(false);
                  setPendingRoute(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Stay on Page
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitWarning(false);
                  if (pendingRoute) {
                    navigate(pendingRoute);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              >
                Discard &amp; Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
