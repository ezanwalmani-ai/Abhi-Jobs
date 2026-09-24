import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Application } from '../types';
import { EASE_PREMIUM } from '../lib/motion';
import {
  X,
  Calendar,
  Clock,
  Video,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react';

interface ScheduleInterviewModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  application,
  isOpen,
  onClose,
}) => {
  const { scheduleInterview, showToast } = useApp();
  const lastAppRef = useRef<Application | null>(application);
  if (application) lastAppRef.current = application;
  const activeApp = application || lastAppRef.current;

  const [date, setDate] = useState('2026-09-12');
  const [time, setTime] = useState('11:00 AM IST');
  const [type, setType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hnr-apex-tech');
  const [notes, setNotes] = useState('Round 1: Technical discussion on system architecture and live coding.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;
    scheduleInterview(activeApp.id, date, time, type, meetingLink, notes);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && activeApp && (
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
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between bg-[#F7F8FA]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#004D40] border border-teal-200 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#101828] text-sm">Schedule Candidate Interview</h3>
                  <p className="text-[11px] text-[#667085]">{activeApp.candidateName} &bull; {activeApp.jobTitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#101828] hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#101828]">Interview Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-[#D0D5DD] bg-white mt-1 focus:border-[#061226] focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#101828]">Time &amp; Timezone</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 2:00 PM IST"
                className="w-full text-xs p-2.5 rounded-xl border border-[#D0D5DD] bg-white mt-1 focus:border-[#061226] focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#101828]">Interview Type</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['video', 'phone', 'in-person'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                    type === t
                      ? 'bg-red-50 border-red-300 text-[#FF2B1A] shadow-xs'
                      : 'border-[#E4E7EC] text-[#667085] hover:bg-[#F7F8FA]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#101828]">Meeting Link / Room Details</label>
            <input
              type="text"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="e.g. https://meet.google.com/..."
              className="w-full text-xs p-2.5 rounded-xl border border-[#D0D5DD] bg-white mt-1 focus:border-[#061226] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#101828]">Instructions &amp; Agenda</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Brief agenda or instructions for the candidate..."
              className="w-full text-xs p-2.5 rounded-xl border border-[#D0D5DD] bg-white mt-1 focus:border-[#061226] focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-[#E4E7EC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#667085] hover:bg-[#F7F8FA] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Confirm &amp; Send Invitation
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
