import React, { useState } from 'react';
import { CandidateProfile } from '../../types';
import { X, UserCheck, AlertCircle, ArrowDownToLine } from 'lucide-react';

interface ImportProfileModalProps {
  candidate: CandidateProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedKeys: {
    personalInfo: boolean;
    title: boolean;
    summary: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
    certifications: boolean;
  }) => void;
}

export const ImportProfileModal: React.FC<ImportProfileModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onImport,
}) => {
  const [selected, setSelected] = useState({
    personalInfo: true,
    title: true,
    summary: true,
    skills: true,
    experience: true,
    education: true,
    certifications: true,
  });

  if (!isOpen) return null;

  const toggleKey = (key: keyof typeof selected) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleConfirm = () => {
    onImport(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#004D40] flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#004D40]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Import from Profile</h3>
              <p className="text-xs text-slate-500">
                Choose which verified details to import from your ABHI JOBS profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Importing selected sections will populate your resume editor with your profile data. You will still be able to edit and customize every detail.
          </p>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Select Information to Import:
          </p>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.personalInfo}
                onChange={() => toggleKey('personalInfo')}
                className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
              />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Name & Contact Details</span>
                <p className="text-[11px] text-slate-500">{candidate?.name || 'Your name'}, {candidate?.email || 'Email'}, {candidate?.phone || 'Phone'}</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.title}
                onChange={() => toggleKey('title')}
                className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
              />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Professional Title</span>
                <p className="text-[11px] text-slate-500">{candidate?.headline || candidate?.currentRole || 'Profile Headline'}</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.summary}
                onChange={() => toggleKey('summary')}
                className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
              />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Professional Summary</span>
                <p className="text-[11px] text-slate-500">Bio from profile ({candidate?.about?.length || 0} characters)</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.skills}
                onChange={() => toggleKey('skills')}
                className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
              />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Skills</span>
                <p className="text-[11px] text-slate-500">{candidate?.skills?.length || 0} skills listed in profile</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.experience}
                onChange={() => toggleKey('experience')}
                className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
              />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Work Experience</span>
                <p className="text-[11px] text-slate-500">{candidate?.experiences?.length || 0} experiences in profile</p>
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected.education}
                onChange={() => toggleKey('education')}
                className="w-4 h-4 text-[#004D40] rounded-sm border-slate-300 focus:ring-[#004D40]"
              />
              <div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900">Education</span>
                <p className="text-[11px] text-slate-500">{candidate?.education?.length || 0} education degrees in profile</p>
              </div>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004D40] hover:bg-[#00382e] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Import Selected</span>
          </button>
        </div>
      </div>
    </div>
  );
};
