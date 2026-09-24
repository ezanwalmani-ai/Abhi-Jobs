import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CandidateProfile } from '../types';
import { EASE_PREMIUM } from '../lib/motion';
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Download,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CandidateProfileModalProps {
  candidate: CandidateProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onInvite?: (candidateId: string) => void;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onInvite,
}) => {
  const lastCandidateRef = useRef<CandidateProfile | null>(candidate);
  if (candidate) lastCandidateRef.current = candidate;
  const activeCandidate = candidate || lastCandidateRef.current;

  return (
    <AnimatePresence>
      {isOpen && activeCandidate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: EASE_PREMIUM }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
          >
        {/* Modal Top Banner */}
        <div className="relative h-28 bg-[#061226] p-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Header */}
        <div className="px-6 pb-4 pt-0 relative border-b border-[#E4E7EC] flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
          <div className="flex items-end gap-4">
            <div className="relative">
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-100 text-[#061226] flex items-center justify-center font-bold text-2xl border-4 border-white shadow-md">
                  {candidate.name.charAt(0)}
                </div>
              )}
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                  candidate.availableForOpportunities ? 'bg-[#004D40]' : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="pt-2 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-[#101828]">{candidate.name}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] text-xs font-bold border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#004D40]" />
                  ABHI JOBS Verified Talent
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#667085] font-medium mt-0.5">{candidate.headline}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {candidate.location}
                </span>
                <span>&bull;</span>
                <span>{candidate.yearsOfExperience} years experience</span>
                <span>&bull;</span>
                <span className="text-[#004D40] font-semibold">Available: {candidate.availability}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {candidate.resumeName && (
              <a
                href={candidate.resumeUrl || '#'}
                download={candidate.resumeName}
                className="px-3.5 py-2 rounded-xl border border-[#E4E7EC] hover:bg-[#F7F8FA] text-[#101828] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Resume</span>
              </a>
            )}
            {onInvite && (
              <button
                onClick={() => {
                  onInvite(candidate.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Invite to Job</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* About */}
          {candidate.about && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2">Professional Summary</h3>
              <p className="text-xs sm:text-sm text-[#101828] leading-relaxed bg-[#F7F8FA] p-4 rounded-xl border border-[#E4E7EC]">
                {candidate.about}
              </p>
            </div>
          )}

          {/* Core Skills */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2.5">Validated Skills</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-lg bg-teal-50 text-[#004D40] border border-teal-200/70 text-xs font-medium flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#004D40]" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#101828]" />
              <span>Work Experience</span>
            </h3>
            {candidate.experiences.length === 0 ? (
              <div className="text-xs text-[#667085] italic">No previous employment listed (Fresher graduate).</div>
            ) : (
              <div className="space-y-4">
                {candidate.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-xl border border-[#E4E7EC] bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#101828]">{exp.jobTitle}</h4>
                        <div className="text-xs font-semibold text-[#004D40] mt-0.5">{exp.company}</div>
                      </div>
                      <span className="text-[11px] text-[#667085] bg-[#F7F8FA] px-2 py-0.5 rounded-md border border-[#E4E7EC]">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-[#667085] mt-2 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#101828]" />
              <span>Education</span>
            </h3>
            <div className="space-y-3">
              {candidate.education.map((edu) => (
                <div key={edu.id} className="p-4 rounded-xl border border-[#E4E7EC] bg-white flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#101828]">{edu.qualification}</h4>
                    <div className="text-xs text-[#667085] mt-0.5">{edu.fieldOfStudy} &bull; {edu.institution}</div>
                  </div>
                  <span className="text-[11px] text-[#667085] bg-[#F7F8FA] px-2 py-0.5 rounded-md border border-[#E4E7EC]">
                    {edu.startYear} - {edu.endYear}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {candidate.certifications.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#101828]" />
                <span>Certifications &amp; Accreditations</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidate.certifications.map((cert) => (
                  <div key={cert.id} className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/40 flex items-start gap-3">
                    <Award className="w-5 h-5 text-[#004D40] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#101828]">{cert.title}</h4>
                      <div className="text-[11px] text-[#667085]">{cert.issuer} &bull; {cert.issueDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F7F8FA] border-t border-[#E4E7EC] flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-[#667085]">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {candidate.email}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {candidate.phone}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#E4E7EC] bg-white hover:bg-slate-100 text-[#101828] text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
