import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  PlayCircle,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { LessonVideoItem, VideoProgressRecord } from '../../types/learning';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: string | HTMLElement,
        options: {
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo?: () => void;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  getPlayerState?: () => number;
  destroy?: () => void;
}

const COMPLETION_THRESHOLD_PERCENT = 90;

let ytApiPromise: Promise<boolean> | null = null;

function loadYouTubeIframeApi(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.YT && typeof window.YT.Player === 'function') {
    return Promise.resolve(true);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true;
        resolve(ok);
      }
    };

    const timeout = window.setTimeout(() => {
      finish(Boolean(window.YT && typeof window.YT.Player === 'function'));
    }, 8000);

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      if (typeof prevReady === 'function') {
        try {
          prevReady();
        } catch {
          // Ignore prior handler errors
        }
      }
      finish(true);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeout);
        finish(false);
      };
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

export interface VideoProgressUpdatePayload {
  videoId: string;
  youtubeVideoId: string;
  durationSeconds: number;
  watchedSeconds: number;
  maxPercentWatched: number;
  lastPositionSeconds: number;
  hasPlayed: boolean;
  completedViaPlayer: boolean;
  manualCompleted: boolean;
}

interface YouTubeTrackedPlayerProps {
  video: LessonVideoItem;
  savedProgress?: VideoProgressRecord;
  isSaving?: boolean;
  onSaveProgress: (payload: VideoProgressUpdatePayload, triggerLessonUnlock?: boolean) => Promise<void> | void;
}

export const YouTubeTrackedPlayer: React.FC<YouTubeTrackedPlayerProps> = ({
  video,
  savedProgress,
  isSaving = false,
  onSaveProgress,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const lastSavedAtRef = useRef<number>(0);
  const onSaveProgressRef = useRef(onSaveProgress);
  onSaveProgressRef.current = onSaveProgress;

  const [maxPercent, setMaxPercent] = useState<number>(savedProgress?.maxPercentWatched || 0);
  const [hasPlayed, setHasPlayed] = useState<boolean>(Boolean(savedProgress?.hasPlayed));
  const [completedViaPlayer, setCompletedViaPlayer] = useState<boolean>(
    Boolean(savedProgress?.completedViaPlayer)
  );
  const [manualCompleted, setManualCompleted] = useState<boolean>(
    Boolean(savedProgress?.manualCompleted)
  );
  const [trackingState, setTrackingState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const metricsRef = useRef({
    durationSeconds: savedProgress?.durationSeconds || video.durationSeconds || 0,
    watchedSeconds: savedProgress?.watchedSeconds || 0,
    maxPercentWatched: savedProgress?.maxPercentWatched || 0,
    lastPositionSeconds: savedProgress?.lastPositionSeconds || 0,
    hasPlayed: Boolean(savedProgress?.hasPlayed),
    completedViaPlayer: Boolean(savedProgress?.completedViaPlayer),
    manualCompleted: Boolean(savedProgress?.manualCompleted),
  });

  // Sync incoming saved progress (e.g., loaded from Firestore after mount or login)
  useEffect(() => {
    if (!savedProgress) return;
    const nextMax = Math.max(metricsRef.current.maxPercentWatched, savedProgress.maxPercentWatched);
    const nextHasPlayed = metricsRef.current.hasPlayed || savedProgress.hasPlayed;
    const nextCompletedPlayer =
      metricsRef.current.completedViaPlayer ||
      (savedProgress.completedViaPlayer && savedProgress.maxPercentWatched >= COMPLETION_THRESHOLD_PERCENT);
    const nextManual = metricsRef.current.manualCompleted || savedProgress.manualCompleted;

    metricsRef.current = {
      ...metricsRef.current,
      durationSeconds: savedProgress.durationSeconds || metricsRef.current.durationSeconds,
      watchedSeconds: Math.max(metricsRef.current.watchedSeconds, savedProgress.watchedSeconds),
      maxPercentWatched: nextMax,
      lastPositionSeconds: Math.max(
        metricsRef.current.lastPositionSeconds,
        savedProgress.lastPositionSeconds
      ),
      hasPlayed: nextHasPlayed,
      completedViaPlayer: nextCompletedPlayer,
      manualCompleted: nextManual,
    };

    setMaxPercent(nextMax);
    setHasPlayed(nextHasPlayed);
    setCompletedViaPlayer(nextCompletedPlayer);
    setManualCompleted(nextManual);
  }, [savedProgress]);

  const baseEmbedUrl =
    video.embedUrl && video.embedUrl.startsWith('https://www.youtube.com/embed/')
      ? video.embedUrl
      : `https://www.youtube.com/embed/${video.youtubeVideoId}`;

  const originParam =
    typeof window !== 'undefined' && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';

  const iframeSrc = `${baseEmbedUrl}?enablejsapi=1&rel=0&modestbranding=1&controls=1&playsinline=1${originParam}`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeVideoId}`;

  const emitProgress = (force = false, triggerUnlock = false) => {
    const now = Date.now();
    if (!force && now - lastSavedAtRef.current < 15000) return;
    lastSavedAtRef.current = now;
    const m = metricsRef.current;
    void onSaveProgressRef.current(
      {
        videoId: video.id,
        youtubeVideoId: video.youtubeVideoId,
        durationSeconds: Math.round(m.durationSeconds),
        watchedSeconds: Math.round(m.watchedSeconds),
        maxPercentWatched: Math.min(100, Math.round(m.maxPercentWatched)),
        lastPositionSeconds: Math.round(m.lastPositionSeconds),
        hasPlayed: m.hasPlayed,
        completedViaPlayer: m.completedViaPlayer,
        manualCompleted: m.manualCompleted,
      },
      triggerUnlock
    );
  };

  useEffect(() => {
    let cancelled = false;
    let readyTimeout: number | null = null;

    const stopPolling = () => {
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const startPolling = (player: YTPlayerInstance) => {
      stopPolling();
      pollIntervalRef.current = window.setInterval(() => {
        try {
          const duration = player.getDuration?.() || 0;
          const current = player.getCurrentTime?.() || 0;
          if (duration > 0 && current >= 0) {
            const pct = Math.min(100, Math.round((current / duration) * 100));
            const prevCompleted = metricsRef.current.completedViaPlayer;
            metricsRef.current.durationSeconds = duration;
            metricsRef.current.lastPositionSeconds = current;
            metricsRef.current.watchedSeconds = Math.max(
              metricsRef.current.watchedSeconds,
              current
            );
            if (pct > metricsRef.current.maxPercentWatched) {
              metricsRef.current.maxPercentWatched = pct;
              setMaxPercent(pct);
            }

            if (
              metricsRef.current.hasPlayed &&
              metricsRef.current.maxPercentWatched >= COMPLETION_THRESHOLD_PERCENT
            ) {
              metricsRef.current.completedViaPlayer = true;
              setCompletedViaPlayer(true);
              if (!prevCompleted) {
                emitProgress(true, true);
                return;
              }
            }
            emitProgress(false, false);
          }
        } catch {
          // Ignore transient iframe polling read errors
        }
      }, 1000);
    };

    loadYouTubeIframeApi().then((loaded) => {
      if (cancelled) return;
      if (!loaded || !window.YT || !iframeRef.current) {
        setTrackingState('unavailable');
        return;
      }

      // If player onReady does not fire within 8 seconds, expose tracking-failure fallback
      readyTimeout = window.setTimeout(() => {
        if (!cancelled) {
          setTrackingState((curr) => (curr === 'loading' ? 'unavailable' : curr));
        }
      }, 8000);

      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              if (cancelled) return;
              if (readyTimeout !== null) {
                window.clearTimeout(readyTimeout);
                readyTimeout = null;
              }
              setTrackingState('ready');
              // Attempt autoplay only if browser permissions permit; manual play always works
              try {
                event.target.playVideo?.();
              } catch {
                // Browser blocked autoplay — manual Play remains available
              }
            },
            onStateChange: (event) => {
              if (cancelled) return;
              const states = window.YT?.PlayerState;
              const playingCode = states?.PLAYING ?? 1;
              const pausedCode = states?.PAUSED ?? 2;
              const endedCode = states?.ENDED ?? 0;

              if (event.data === playingCode) {
                setIsPlaying(true);
                metricsRef.current.hasPlayed = true;
                setHasPlayed(true);
                startPolling(event.target);
              } else if (event.data === pausedCode) {
                setIsPlaying(false);
                stopPolling();
                if (metricsRef.current.hasPlayed) {
                  emitProgress(true, false);
                }
              } else if (event.data === endedCode) {
                setIsPlaying(false);
                stopPolling();
                const duration = event.target.getDuration?.() || metricsRef.current.durationSeconds;
                if (metricsRef.current.hasPlayed) {
                  metricsRef.current.durationSeconds = duration;
                  metricsRef.current.watchedSeconds = Math.max(
                    metricsRef.current.watchedSeconds,
                    duration
                  );
                  metricsRef.current.lastPositionSeconds = duration;
                  metricsRef.current.maxPercentWatched = 100;
                  metricsRef.current.completedViaPlayer = true;
                  setMaxPercent(100);
                  setCompletedViaPlayer(true);
                  emitProgress(true, true);
                }
              }
            },
            onError: () => {
              if (cancelled) return;
              if (readyTimeout !== null) {
                window.clearTimeout(readyTimeout);
                readyTimeout = null;
              }
              stopPolling();
              setIsPlaying(false);
              setTrackingState('unavailable');
            },
          },
        });
      } catch {
        if (readyTimeout !== null) {
          window.clearTimeout(readyTimeout);
          readyTimeout = null;
        }
        setTrackingState('unavailable');
      }
    });

    return () => {
      cancelled = true;
      if (readyTimeout !== null) window.clearTimeout(readyTimeout);
      stopPolling();
      try {
        playerRef.current?.destroy?.();
      } catch {
        // Ignore teardown issues
      }
      playerRef.current = null;
    };
  }, [video.id, video.youtubeVideoId]);

  const handleManualFallbackConfirm = () => {
    // Strictly records manual fallback without falsely setting completedViaPlayer = true
    metricsRef.current.manualCompleted = true;
    setManualCompleted(true);
    void onSaveProgressRef.current(
      {
        videoId: video.id,
        youtubeVideoId: video.youtubeVideoId,
        durationSeconds: Math.round(metricsRef.current.durationSeconds),
        watchedSeconds: Math.round(metricsRef.current.watchedSeconds),
        maxPercentWatched: Math.min(100, Math.round(metricsRef.current.maxPercentWatched)),
        lastPositionSeconds: Math.round(metricsRef.current.lastPositionSeconds),
        hasPlayed: metricsRef.current.hasPlayed,
        completedViaPlayer: false,
        manualCompleted: true,
      },
      true
    );
  };

  const isVideoSatisfied = completedViaPlayer || manualCompleted;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Video Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-teal-700 mb-1">
            <span className="inline-flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 shrink-0" />
              Video Lesson
            </span>
            {video.publisher && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600">Publisher: {video.publisher}</span>
              </>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#102B4E] break-words">
            {video.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {completedViaPlayer ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Watched ({Math.max(COMPLETION_THRESHOLD_PERCENT, maxPercent)}%)
            </span>
          ) : manualCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Manual Fallback Recorded
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
              <PlayCircle className="w-4 h-4 shrink-0 text-[#102B4E]" />
              {maxPercent}% watched (90% required)
            </span>
          )}
        </div>
      </div>

      {/* Embedded YouTube Player — Immediately Visible */}
      <div className="relative w-full aspect-video bg-slate-950">
        <iframe
          ref={iframeRef}
          id={`yt-player-${video.id}`}
          src={iframeSrc}
          title={`${video.title}${video.publisher ? ` — ${video.publisher}` : ''}`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Playback Progress & Tracking Status Footer */}
      <div className="px-4 sm:px-6 py-4 bg-slate-50/70 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium min-w-0">
            {completedViaPlayer ? (
              <span className="text-emerald-700 font-semibold">
                Video completion verified ({Math.max(COMPLETION_THRESHOLD_PERCENT, maxPercent)}% watched). The Module 01 Quiz is now unlocked below.
              </span>
            ) : manualCompleted ? (
              <span className="text-amber-800 font-semibold">
                Manual completion fallback recorded because automatic playback tracking was unavailable. The Module 01 Quiz is unlocked below.
              </span>
            ) : isPlaying ? (
              <span>
                Playback tracking active — watch to at least <strong>90%</strong> to unlock the Module 01 Quiz.
              </span>
            ) : hasPlayed ? (
              <span>
                Progress saved at <strong>{maxPercent}%</strong>. Continue watching to reach <strong>90%</strong> and unlock the quiz.
              </span>
            ) : (
              <span>
                Press Play above to watch the lesson. Watching at least <strong>90%</strong> automatically unlocks the Module 01 Quiz.
              </span>
            )}
          </div>

          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-[#102B4E] font-medium shrink-0 self-start sm:self-auto"
          >
            <span>YouTube source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Visual Watch Progress Bar */}
        <div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                completedViaPlayer
                  ? 'bg-emerald-500'
                  : manualCompleted
                  ? 'bg-amber-500'
                  : 'bg-teal-600'
              }`}
              style={{
                width: `${completedViaPlayer ? Math.max(90, maxPercent) : maxPercent}%`,
              }}
            />
            {/* 90% threshold marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#102B4E]/50"
              style={{ left: '90%' }}
              title="90% completion threshold"
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {completedViaPlayer
                ? 'Verified playback progress'
                : manualCompleted
                ? 'Manual fallback (untracked playback)'
                : `Watched: ${maxPercent}%`}
            </span>
            <span>Required: 90%</span>
          </div>
        </div>

        {/* Manual Completion Fallback — Shown ONLY if YouTube IFrame API tracking fails */}
        {trackingState === 'unavailable' && !isVideoSatisfied && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-bold">Automatic playback tracking is unavailable</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Your browser or network prevented YouTube playback tracking. After finishing the video above, use this manual fallback to unlock the Module 01 Quiz. Your record will accurately note manual fallback rather than automated playback tracking.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleManualFallbackConfirm}
              disabled={isSaving}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white text-xs font-bold transition-colors shrink-0"
            >
              {isSaving ? 'Saving...' : 'Mark Video Done (Manual Fallback)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
