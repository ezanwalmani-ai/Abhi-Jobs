import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  ResumeData,
  DEFAULT_DESIGN_SETTINGS,
  getResumeDesign,
} from '../../types/resume';
import {
  listUserResumes,
  saveUserResume,
  duplicateUserResume,
  deleteUserResume,
  saveResumeDraft,
  loadResumeDraft,
  clearResumeDraft,
  buildResumeFromProfile,
} from '../../services/resumeService';
import {
  ResumeTemplateSpec,
  getTemplateSectionOrder,
} from '../../components/resume/templates/templateCatalog';
import { ResumeLandingView } from '../../components/resume/studio/ResumeLandingView';
import { ResumeStartSelector } from '../../components/resume/studio/ResumeStartSelector';
import { ChatGptResumeWorkflow } from '../../components/resume/studio/ChatGptResumeWorkflow';
import { UploadResumeWorkflow } from '../../components/resume/studio/UploadResumeWorkflow';
import { ResumeGuidedWizard } from '../../components/resume/studio/ResumeGuidedWizard';
import {
  ResumeStudioEditor,
  StudioSaveStatus,
} from '../../components/resume/studio/ResumeStudioEditor';
import { TemplateGallery } from '../../components/resume/studio/TemplateGallery';
import { ResumePdfPreviewModal } from '../../components/resume/studio/ResumePdfPreviewModal';
import { EASE_PREMIUM } from '../../lib/motion';
import { ArrowLeft, RotateCcw, X, Loader2 } from 'lucide-react';

interface JobSeekerResumePageProps {
  navigate: (route: string) => void;
}

type StudioView =
  | 'landing'
  | 'templates-browse'
  | 'start'
  | 'chatgpt'
  | 'upload'
  | 'wizard'
  | 'editor';

export const JobSeekerResumePage: React.FC<JobSeekerResumePageProps> = ({ navigate: _navigate }) => {
  const { currentUser, currentCandidate, showToast, updateCandidateProfile } = useApp();
  const userId = currentUser?.id || 'guest_user';

  const [view, setView] = useState<StudioView>('landing');
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeData | null>(null);
  const [wizardInitialStep, setWizardInitialStep] = useState<number>(1);
  const [pendingTemplate, setPendingTemplate] = useState<ResumeTemplateSpec | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<StudioSaveStatus>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Draft recovery banner
  const [recoverableDraft, setRecoverableDraft] = useState<{
    savedAt: string;
    resume: ResumeData;
  } | null>(null);

  // PDF Preview modal
  const [pdfModalResume, setPdfModalResume] = useState<ResumeData | null>(null);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHydratedRef = useRef<boolean>(false);

  // 1. Load all resumes strictly scoped to authenticated user
  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const list = await listUserResumes(userId);
        if (!mounted) return;
        setResumes(list);

        // Check if any saved resume has a newer local draft for recovery
        for (const item of list) {
          const draft = loadResumeDraft(userId, item.id);
          if (draft && new Date(draft.savedAt).getTime() > new Date(item.updatedAt).getTime()) {
            setRecoverableDraft(draft);
            break;
          }
        }
      } catch (err) {
        console.error('Failed to load resumes:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
          isHydratedRef.current = true;
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // 2. Unsaved browser close warning
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved resume changes.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  // 3. Persist helper (updates state, localStorage/Supabase, and candidate profile metadata)
  const persistResume = useCallback(
    async (target: ResumeData, notifyToast = false) => {
      setSaveStatus('saving');
      const res = await saveUserResume(userId, target);
      if (res.success && res.resume) {
        const saved = res.resume;
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        setResumes((prev) => {
          const exists = prev.some((r) => r.id === saved.id);
          const next = exists
            ? prev.map((r) => (r.id === saved.id ? saved : r))
            : [saved, ...prev];
          return next.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });

        if (currentCandidate && saved.fullName.trim()) {
          updateCandidateProfile({
            resumeName: `${saved.fullName.trim().replace(/\s+/g, '_')}_Resume.pdf`,
            resumeUpdated: new Date().toISOString().split('T')[0],
          });
        }

        if (notifyToast) {
          showToast('Resume saved successfully', 'success');
        }
      } else {
        setSaveStatus('unsaved');
        if (notifyToast) {
          showToast(res.error || 'Could not save resume', 'error');
        }
      }
    },
    [userId, currentCandidate, updateCandidateProfile, showToast]
  );

  // 4. Debounced autosave + instant local draft snapshot while editing
  useEffect(() => {
    if (!isHydratedRef.current || !activeResume || !hasUnsavedChanges) return;

    saveResumeDraft(userId, activeResume);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistResume(activeResume, false);
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeResume, hasUnsavedChanges, userId, persistResume]);

  // Content & design change handler
  const handleResumeChange = (updates: Partial<ResumeData>) => {
    setActiveResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    });
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  // Apply an optional pre-selected template spec onto a freshly created resume
  const applyPendingTemplate = (base: ResumeData, spec?: ResumeTemplateSpec | null): ResumeData => {
    const targetSpec = spec || pendingTemplate;
    if (!targetSpec) return base;
    const baseDesign = getResumeDesign(base);
    return {
      ...base,
      template: targetSpec.id,
      design: {
        ...DEFAULT_DESIGN_SETTINGS,
        ...baseDesign,
        templateId: targetSpec.id,
        accentColor: targetSpec.defaultAccent,
        fontFamily: targetSpec.defaultFont,
        sectionOrder: getTemplateSectionOrder(targetSpec.id),
      },
    };
  };

  // --- Workflow Transitions ---
  const handleStartStepByStep = (prefillFromProfile: boolean) => {
    const fresh = applyPendingTemplate(
      buildResumeFromProfile(userId, prefillFromProfile ? currentCandidate : null)
    );
    setPendingTemplate(null);
    setActiveResume(fresh);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
    setWizardInitialStep(1);
    setView('wizard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmImportedContent = (
    imported: Partial<ResumeData>,
    goTo: 'wizard' | 'templates'
  ) => {
    const base = buildResumeFromProfile(userId, null);
    const merged: ResumeData = applyPendingTemplate({
      ...base,
      ...imported,
      id: base.id,
      userId,
      title:
        imported.title ||
        (imported.professionalTitle
          ? `${imported.professionalTitle} Resume`
          : imported.fullName
          ? `${imported.fullName} Resume`
          : 'Imported Resume'),
      updatedAt: new Date().toISOString(),
    });
    setPendingTemplate(null);
    setActiveResume(merged);
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
    persistResume(merged, false);

    if (goTo === 'templates') {
      setWizardInitialStep(8);
      setView('wizard');
    } else {
      setWizardInitialStep(1);
      setView('wizard');
    }
    showToast('Resume content organized into editable sections', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinishWizardToStudio = (selectedSpec?: ResumeTemplateSpec) => {
    if (!activeResume) return;
    let nextResume = activeResume;
    if (selectedSpec) {
      nextResume = applyPendingTemplate(activeResume, selectedSpec);
      setActiveResume(nextResume);
    }
    persistResume(nextResume, false);
    setView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSavedResume = (resume: ResumeData) => {
    setActiveResume(resume);
    setHasUnsavedChanges(false);
    setSaveStatus('saved');
    setView('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateSavedResume = async (resumeId: string) => {
    const result = await duplicateUserResume(userId, resumeId);
    if (result.success && result.resume) {
      setResumes((prev) => [result.resume!, ...prev]);
      showToast('Resume duplicated — ready to customize for a new role', 'success');
    } else {
      showToast(result.error || 'Could not duplicate resume', 'error');
    }
  };

  const handleDeleteSavedResume = async (resumeId: string) => {
    const result = await deleteUserResume(userId, resumeId);
    if (result.success) {
      setResumes((prev) => prev.filter((r) => r.id !== resumeId));
      if (activeResume?.id === resumeId) {
        setActiveResume(null);
      }
      showToast('Resume deleted', 'success');
    }
  };

  const handleBrowseTemplateSelect = (spec: ResumeTemplateSpec) => {
    if (activeResume) {
      const updated = applyPendingTemplate(activeResume, spec);
      setActiveResume(updated);
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      setView('editor');
      showToast(`Applied "${spec.name}" template`, 'success');
    } else {
      setPendingTemplate(spec);
      setView('start');
      showToast(`Selected "${spec.name}" — choose how to build your resume`, 'success');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToLanding = async () => {
    if (activeResume && hasUnsavedChanges) {
      await persistResume(activeResume, false);
    }
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasProfileData = Boolean(
    currentCandidate &&
      (currentCandidate.name ||
        currentCandidate.email ||
        currentCandidate.about ||
        (currentCandidate.experiences && currentCandidate.experiences.length > 0) ||
        (currentCandidate.skills && currentCandidate.skills.length > 0))
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F6F8FB] p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#F47A24] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#102B4E]">
            Loading ABHI JOBS Resume Studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-5 sm:py-7 px-3 sm:px-6 lg:px-8 overflow-x-clip">
      <div className="max-w-[1200px] mx-auto space-y-5">
        {/* Draft Recovery Banner */}
        <AnimatePresence>
          {recoverableDraft && view === 'landing' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: EASE_PREMIUM }}
              className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-900">
                <RotateCcw className="w-4 h-4 text-[#F47A24] shrink-0" />
                <span>
                  Unsaved draft found for{' '}
                  <strong>{recoverableDraft.resume.title || 'your resume'}</strong>. Would you like
                  to recover it?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveResume(recoverableDraft.resume);
                    setHasUnsavedChanges(true);
                    setSaveStatus('unsaved');
                    setRecoverableDraft(null);
                    setView('editor');
                    showToast('Draft restored', 'success');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#102B4E] text-white text-xs font-bold cursor-pointer"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearResumeDraft(userId, recoverableDraft.resume.id);
                    setRecoverableDraft(null);
                  }}
                  className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 cursor-pointer"
                  aria-label="Dismiss draft notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW 1: RESUME STUDIO LANDING PAGE */}
        {view === 'landing' && (
          <ResumeLandingView
            resumes={resumes}
            onCreateMyResume={() => {
              setPendingTemplate(null);
              setView('start');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreTemplates={() => {
              setView('templates-browse');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditResume={handleEditSavedResume}
            onDuplicateResume={handleDuplicateSavedResume}
            onDownloadResumePdf={(resume) => setPdfModalResume(resume)}
            onDeleteResume={handleDeleteSavedResume}
          />
        )}

        {/* VIEW 2: EXPLORE ALL 12 TEMPLATES GALLERY */}
        {view === 'templates-browse' && (
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => setView('landing')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#778397] hover:text-[#102B4E] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Resume Studio</span>
            </button>

            <TemplateGallery
              resume={resumes[0] || null}
              onSelectTemplate={handleBrowseTemplateSelect}
              title="Explore 12 Professional Resume Templates"
              subtitle="Every template features a distinct layout architecture. Pick a design to begin — you can switch anytime without losing content."
            />
          </div>
        )}

        {/* VIEW 3: THREE WAYS TO START */}
        {view === 'start' && (
          <ResumeStartSelector
            hasProfileData={hasProfileData}
            onStartStepByStep={handleStartStepByStep}
            onStartChatGpt={() => {
              setView('chatgpt');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartUpload={() => {
              setView('upload');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={() => setView('landing')}
          />
        )}

        {/* VIEW 4: CREATE WITH CHATGPT WORKFLOW */}
        {view === 'chatgpt' && (
          <ChatGptResumeWorkflow
            candidate={currentCandidate}
            onBack={() => setView('start')}
            onConfirmImport={handleConfirmImportedContent}
          />
        )}

        {/* VIEW 5: UPLOAD EXISTING RESUME (PDF / DOCX) */}
        {view === 'upload' && (
          <UploadResumeWorkflow
            onBack={() => setView('start')}
            onConfirmImport={handleConfirmImportedContent}
          />
        )}

        {/* VIEW 6: GUIDED 8-STEP CREATION WIZARD */}
        {view === 'wizard' && activeResume && (
          <ResumeGuidedWizard
            resume={activeResume}
            initialStep={wizardInitialStep}
            onChange={handleResumeChange}
            onSaveAndContinueLater={async () => {
              await persistResume(activeResume, true);
              setView('landing');
            }}
            onFinishToStudio={handleFinishWizardToStudio}
            onBackToStart={() => setView('start')}
          />
        )}

        {/* VIEW 7: MODERN 3-PANE RESUME STUDIO EDITOR */}
        {view === 'editor' && activeResume && (
          <ResumeStudioEditor
            resume={activeResume}
            saveStatus={saveStatus}
            onChange={handleResumeChange}
            onManualSave={() => persistResume(activeResume, true)}
            onOpenPdfPreview={() => setPdfModalResume(activeResume)}
            onOpenWizard={(step = 1) => {
              setWizardInitialStep(step);
              setView('wizard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToLanding={handleReturnToLanding}
          />
        )}
      </div>

      {/* Final Pre-Download PDF Preview Modal */}
      <ResumePdfPreviewModal
        resume={pdfModalResume}
        isOpen={Boolean(pdfModalResume)}
        onClose={() => setPdfModalResume(null)}
        onDownloaded={() => showToast('Resume PDF ready', 'success')}
      />
    </div>
  );
};

export default JobSeekerResumePage;
