import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { EASE_PREMIUM } from '../lib/motion';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const iconMap = {
            success: <CheckCircle2 className="w-5 h-5 text-[#004D40] shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-[#FF2B1A] shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-[#061226] shrink-0 mt-0.5" />,
          };

          const borderMap = {
            success: 'border-l-4 border-l-[#004D40] border-[#E4E7EC] bg-white text-[#101828]',
            error: 'border-l-4 border-l-[#FF2B1A] border-[#E4E7EC] bg-white text-[#101828]',
            warning: 'border-l-4 border-l-amber-500 border-[#E4E7EC] bg-white text-[#101828]',
            info: 'border-l-4 border-l-[#061226] border-[#E4E7EC] bg-white text-[#101828]',
          };

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: EASE_PREMIUM }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${borderMap[toast.type]}`}
            >
              {iconMap[toast.type]}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-[#101828] leading-tight">{toast.title}</div>
                {toast.message && (
                  <div className="text-xs text-[#667085] mt-1 leading-relaxed">{toast.message}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#667085] hover:text-[#101828] transition-colors p-1 cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
