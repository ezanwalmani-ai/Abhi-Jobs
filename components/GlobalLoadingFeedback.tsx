import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EASE_PREMIUM } from '../lib/motion';

export interface GlobalLoadingFeedbackProps {
  /**
   * Whether route navigation is in progress
   */
  isNavigating?: boolean;
  /**
   * Whether an asynchronous API or backend operation is active
   */
  isLoading?: boolean;
  /**
   * Optional contextual message for the async operation (e.g. "Signing in...", "Applying for job...")
   */
  loadingMessage?: string | null;
}

/**
 * ABHI JOBS Global Visual Feedback System
 * Provides:
 * 1. A sleek, high-precision top progress bar with brand red (#FF2B1A) to deep teal (#004D40) gradient glow
 * 2. A refined, responsive loading overlay with smooth spring physics for asynchronous actions
 */
export const GlobalLoadingFeedback: React.FC<GlobalLoadingFeedbackProps> = ({
  isNavigating = false,
  isLoading = false,
  loadingMessage,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isBarVisible, setIsBarVisible] = useState<boolean>(false);

  const active = isNavigating || isLoading;

  // Top progress bar state machine
  useEffect(() => {
    let t1: any;
    let t2: any;
    let t3: any;

    if (active) {
      setIsBarVisible(true);
      setProgress(15);

      // Fast jump to 45%
      t1 = setTimeout(() => {
        setProgress(45);
      }, 100);

      // Steady progression towards 80% while pending
      t2 = setTimeout(() => {
        setProgress(78);
      }, 280);
    } else if (isBarVisible) {
      // Completed - rush to 100% then fade away
      setProgress(100);
      t3 = setTimeout(() => {
        setIsBarVisible(false);
        setProgress(0);
      }, 350);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, isBarVisible]);

  return (
    <>
      {/* 1. Global Top Progress Bar */}
      <AnimatePresence>
        {isBarVisible && (
          <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none overflow-hidden select-none"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            {/* Base Bar Track */}
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF2B1A] via-[#FF6B4A] to-[#004D40] relative"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 12px rgba(255, 43, 26, 0.7), 0 0 6px rgba(255, 43, 26, 0.4)',
              }}
              initial={{ width: '0%', opacity: 0 }}
              animate={{
                width: `${progress}%`,
                opacity: 1,
              }}
              exit={{ opacity: 0 }}
              transition={{
                width: { duration: progress === 100 ? 0.2 : 0.45, ease: EASE_PREMIUM },
                opacity: { duration: 0.25 },
              }}
            >
              {/* Shimmer pulse effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />

              {/* Glowing leading head particle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FF2B1A] rounded-full blur-xs opacity-90 shadow-[0_0_8px_#FF2B1A]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Global Asynchronous Operation Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_PREMIUM }}
            className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 6 }}
              transition={{ duration: 0.24, ease: EASE_PREMIUM }}
              className="w-full max-w-[calc(100vw-2rem)] sm:max-w-xs bg-white/95 rounded-2xl shadow-2xl border border-slate-200/90 p-5 sm:p-6 text-center space-y-4 backdrop-blur-md"
            >
              {/* Concentric Dual-Ring Branded Spinner */}
              <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                {/* Outer Red Ring */}
                <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#FF2B1A] border-r-[#FF2B1A]/40 animate-spin" />
                {/* Inner Teal Ring */}
                <div
                  className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-[#004D40] border-l-[#004D40]/50 animate-spin"
                  style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
                />
                {/* Center Core Dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF2B1A] shadow-xs animate-pulse" />
              </div>

              {/* Status Message */}
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {loadingMessage || 'Processing...'}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  ABHI JOBS &bull; Discover. Apply. Grow.
                </p>
              </div>

              {/* Mini Indeterminate Loading Track */}
              <div className="w-24 mx-auto h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FF2B1A] to-[#004D40] rounded-full animate-pulse" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
