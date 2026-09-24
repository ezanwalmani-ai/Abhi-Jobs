import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import { useApp } from '../context/AppContext';
import { EASE_PREMIUM } from '../lib/motion';
import {
  X,
  CheckCircle2,
  FileText,
  Upload,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Check,
} from 'lucide-react';

interface ApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  navigate?: (route: string) => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({ job, isOpen, onClose, navigate }) => {
  const { currentCandidate, currentRole, currentUser, logout, applyToJob, applications } = useApp();
  const lastJobRef = useRef<Job | null>(job);
  if (job) lastJobRef.current = job;
  const activeJob = job || lastJobRef.current;

  const [coverNote, setCoverNote] = useState('');
  const [selectedResume, setSelectedResume] = useState(
    currentCandidate?.resumeName || 'Resume_Portfolio.pdf'
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEmployer = currentUser && currentRole === 'employer';
  const candidate = currentCandidate;

  // Duplicate application detection
  const alreadyApplied = Boolean(
    candidate &&
      activeJob &&
      applications.some((a) => a.jobId === activeJob.id && a.candidateId === candidate.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || alreadyApplied || !activeJob) return;
    setSubmitting(true);
    const success = await applyToJob(activeJob.id, coverNote, selectedResume);
    setSubmitting(false);
    if (success) {
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setCoverNote('');
    setAgreedToTerms(false);
    onClose();
  };

  const handleOpenLegal = (route: string) => {
    handleClose();
    if (navigate) {
      navigate(route);
    }
  };

  const handleSignOutAndLogin = () => {
    handleClose();
    logout();
    if (navigate) {
      navigate('/login');
    }
  };

  const handleNavigateTo = (route: string) => {
    handleClose();
    if (navigate) {
      navigate(route);
    }
  };

  const candidateName = candidate?.name || currentUser?.name || 'Job Seeker';
  const candidateHeadline = candidate?.headline || 'Verified ABHI JOBS Member';
  const candidateSkills = Array.isArray(candidate?.skills) ? candidate.skills : [];

  return (
    <AnimatePresence>
      {isOpen && activeJob && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between bg-[#F7F8FA]">
              <div className="flex items-center gap-3">
                {activeJob.companyLogo ? (
                  <img
                    src={activeJob.companyLogo}
                    alt={activeJob.companyName}
                    className="w-10 h-10 rounded-xl object-cover border border-[#E4E7EC] shrink-0"
                  />
                ) : null}
                <div>
                  <div className="text-xs font-semibold text-[#667085]">Apply to {activeJob.companyName}</div>
                  <h3 className="font-bold text-[#101828] text-base leading-tight">{activeJob.title}</h3>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#101828] hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-[#101828]">Application Submitted!</h4>
              <p className="text-sm text-[#667085] max-w-md mx-auto mt-1 leading-relaxed">
                Your verified ABHI JOBS profile and credentials have been forwarded to {job.companyName}’s talent acquisition team.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E4E7EC] text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-[#667085]">Position:</span>
                <span className="font-semibold text-[#101828]">{job.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Resume Attached:</span>
                <span className="font-semibold text-[#101828]">{selectedResume}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Status:</span>
                <span className="font-semibold text-[#004D40]">Applied &bull; Under Review</span>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-center gap-2">
              <button
                onClick={() => handleNavigateTo('/applications')}
                className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] text-white text-xs font-bold hover:bg-[#e02213] transition-colors cursor-pointer shadow-xs"
              >
                View My Applications
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-[#E4E7EC] text-[#101828] text-xs font-semibold hover:bg-[#F7F8FA] transition-colors cursor-pointer"
              >
                Return to Jobs
              </button>
            </div>
          </div>
        ) : alreadyApplied ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 text-[#004D40] border border-teal-200 mx-auto flex items-center justify-center">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#101828]">Application Already Submitted</h4>
              <p className="text-xs text-[#667085] max-w-md mx-auto mt-1.5 leading-relaxed">
                You have already applied for this opening. Duplicate submissions are prevented to ensure fair recruiter evaluation. You can track your interview and screening updates in your applications portal.
              </p>
            </div>
            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => handleNavigateTo('/applications')}
                className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] text-white text-xs font-bold hover:bg-[#e02213] transition-colors cursor-pointer shadow-xs"
              >
                Go to My Applications
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-[#E4E7EC] text-[#101828] text-xs font-semibold hover:bg-[#F7F8FA] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Role & Auth Check */}
            {isEmployer ? (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-3">
                <div className="font-bold text-sm text-amber-950">Employer Account Detected</div>
                <p className="leading-relaxed">
                  You are currently logged in with an <strong>Employer</strong> account. Submitting job applications is reserved for Job Seekers. To apply for this role, please sign out and sign in with your Job Seeker account.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSignOutAndLogin}
                    className="px-4 py-2 rounded-xl bg-[#061226] hover:bg-[#0d1e3d] text-white font-bold cursor-pointer transition-colors"
                  >
                    Sign In with Job Seeker Account
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-semibold cursor-pointer hover:bg-amber-100/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : !currentUser ? (
              <div className="p-5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] text-xs text-[#101828] space-y-3">
                <div className="font-bold text-sm text-[#101828]">Sign In to Apply</div>
                <p className="leading-relaxed text-[#667085]">
                  You must be registered as a Job Seeker to apply for this opening with your verified credentials and resume.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavigateTo('/login')}
                    className="px-4 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white font-bold cursor-pointer transition-colors shadow-xs"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateTo('/register/job-seeker')}
                    className="px-4 py-2 rounded-xl bg-white border border-[#E4E7EC] text-[#101828] font-bold hover:bg-[#F7F8FA] cursor-pointer"
                  >
                    Register as Job Seeker
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Pre-filled Profile Card */}
                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/70 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-[#004D40] flex items-center justify-center font-bold text-sm shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#101828]">{candidateName}</span>
                      <span className="text-[11px] font-semibold text-[#004D40] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" /> Verified Profile
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] truncate mt-0.5">{candidateHeadline}</p>
                    {candidateSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {candidateSkills.slice(0, 5).map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-white border border-teal-200 text-[10px] text-[#004D40] font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Resume Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#101828]">Resume Selection</label>
                  <div className="p-3 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-[#004D40] shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#101828] truncate">{selectedResume}</div>
                        <div className="text-[10px] text-[#667085]">ABHI JOBS Profile Resume &bull; Ready to submit</div>
                      </div>
                    </div>
                    <label className="text-xs font-semibold text-[#004D40] hover:underline cursor-pointer flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setSelectedResume(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Step 3: Optional Cover Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#101828] flex items-center justify-between">
                    <span>Quick Cover Message (Optional)</span>
                    <span className="text-[11px] text-[#667085] font-normal">Max 250 characters</span>
                  </label>
                  <textarea
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Briefly state why you are an ideal fit for this role and your availability..."
                    rows={3}
                    maxLength={250}
                    className="w-full text-xs p-3 rounded-xl border border-[#D0D5DD] bg-white focus:outline-hidden focus:border-[#061226]"
                  />
                </div>

                {/* Step 4: Terms & Conditions and Privacy Policy Consent */}
                <div className="pt-1 pb-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#667085] select-none">
                    <input
                      type="checkbox"
                      id="apply-consent-checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      required
                      className="mt-0.5 w-4 h-4 rounded border-[#D0D5DD] text-[#FF2B1A] focus:ring-[#FF2B1A] cursor-pointer accent-[#FF2B1A] shrink-0"
                    />
                    <span className="leading-snug">
                      I agree to ABHI JOBS&apos;s{' '}
                      <button
                        type="button"
                        onClick={() => handleOpenLegal('/terms-and-conditions')}
                        className="text-[#FF2B1A] font-semibold underline hover:text-[#e02213] cursor-pointer inline"
                      >
                        Terms &amp; Conditions
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => handleOpenLegal('/privacy')}
                        className="text-[#FF2B1A] font-semibold underline hover:text-[#e02213] cursor-pointer inline"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl text-[#667085] hover:bg-[#F7F8FA] text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !agreedToTerms}
                    className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit 1-Click Application</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

