import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const INTRO_SESSION_KEY = 'abhijobs_cinematic_intro_seen';

const TOTAL_DURATION_MS = 13800;

// Scene boundaries in milliseconds
const SCENE_1_END = 2800; // "Your Future. Your Opportunity."
const SCENE_2_END = 5600; // "Meet ABHI JOBS."
const SCENE_3_END = 8400; // "Connecting Talent with Opportunity."
const SCENE_4_END = 10900; // "Discover. Apply. Grow." (Light scene)
// Scene 5: 10900 -> 13800: Approved abhi Jobs Logo Reveal

const EASE_CINEMA: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface CinematicBrandIntroProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
  warm: boolean;
}

interface LightStreak {
  x: number;
  y: number;
  len: number;
  width: number;
  angle: number;
  speed: number;
  alpha: number;
  offset: number;
}

const getSceneIndex = (ms: number): 1 | 2 | 3 | 4 | 5 => {
  if (ms < SCENE_1_END) return 1;
  if (ms < SCENE_2_END) return 2;
  if (ms < SCENE_3_END) return 3;
  if (ms < SCENE_4_END) return 4;
  return 5;
};

/**
 * Animated Stroke-Draw Reveal of the EXACT approved "abhi Jobs" SVG wordmark.
 */
const AnimatedAbhiJobsReveal: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const uid = useId().replace(/:/g, '');
  const gradId = `intro-abhi-fire-${uid}`;
  const glowId = `intro-abhi-glow-${uid}`;

  const strokeTransition = (delay: number, duration = 0.72) =>
    reducedMotion
      ? { duration: 0.25 }
      : {
          pathLength: { duration, delay, ease: EASE_CINEMA },
          opacity: { duration: 0.25, delay },
        };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 5 632 136"
      role="img"
      aria-label="abhi Jobs"
      className="w-[min(80vw,460px)] h-auto overflow-visible select-none"
    >
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1="330"
          y1="140"
          x2="620"
          y2="10"
        >
          <stop offset="0" stopColor="#FF4D00" />
          <stop offset="0.55" stopColor="#F47A24" />
          <stop offset="1" stopColor="#FFB400" />
        </linearGradient>
        <filter id={glowId} x="-15%" y="-25%" width="130%" height="150%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Subtle warm ambient glow behind Jobs */}
      <g
        fill="none"
        strokeWidth="21"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* "abhi" in crisp luminous white */}
        <g stroke="#FFFFFF">
          <motion.circle
            cx="40"
            cy="90"
            r="30"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.18, 0.7)}
          />
          <motion.path
            d="M70 60V120"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.28, 0.5)}
          />
          <motion.path
            d="M105 20V120"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.32, 0.58)}
          />
          <motion.circle
            cx="135"
            cy="90"
            r="30"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.4, 0.68)}
          />
          <motion.path
            d="M185 20V120"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.46, 0.56)}
          />
          <motion.path
            d="M185 88C185 50 245 50 245 88V120"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.54, 0.65)}
          />
          <motion.path
            d="M285 60V120"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.62, 0.48)}
          />
        </g>

        {/* "Jobs" in glowing fire orange-amber gradient */}
        <g stroke={`url(#${gradId})`} filter={`url(#${glowId})`}>
          <motion.path
            d="M380 20V88C380 118 345 126 332 104"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.7, 0.72)}
          />
          <motion.circle
            cx="440"
            cy="90"
            r="30"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.8, 0.68)}
          />
          <motion.path
            d="M480 20V120"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.88, 0.55)}
          />
          <motion.circle
            cx="510"
            cy="90"
            r="30"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(0.95, 0.66)}
          />
          <motion.path
            d="M612 74C602 52 568 56 568 76C568 96 615 86 615 108C615 130 575 130 564 108"
            initial={reducedMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={strokeTransition(1.04, 0.78)}
          />
        </g>
      </g>

      {/* Dot of "i" pops in with warm flash */}
      <motion.circle
        cx="285"
        cy="26"
        r="13"
        fill="#FFFFFF"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.4,
          delay: reducedMotion ? 0.1 : 0.76,
          ease: EASE_CINEMA,
        }}
        style={{ transformOrigin: '285px 26px' }}
      />
    </svg>
  );
};

export const CinematicBrandIntro: React.FC<CinematicBrandIntroProps> = ({
  isOpen,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scene = getSceneIndex(elapsedMs);
  const isLightScene = scene === 4;
  const progressPct = Math.min(100, (elapsedMs / TOTAL_DURATION_MS) * 100);

  // Detect prefers-reduced-motion
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      return undefined;
    }
  }, []);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, 'true');
    } catch {}
    onComplete();
  }, [onComplete]);

  // Reset timeline whenever opened
  useEffect(() => {
    if (isOpen) {
      completedRef.current = false;
      startTimeRef.current = null;
      setElapsedMs(0);
    }
  }, [isOpen]);

  // Lock body scroll while intro overlay is open & listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, finishIntro]);

  // Master 60fps Animation Clock & Atmospheric Canvas Engine
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Responsive particle count (lightweight on mobile, lush on desktop)
    const particleCount = width < 640 ? 28 : 48;
    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.24 - 0.08,
      radius: 0.9 + (i % 4) * 0.65,
      alpha: 0.2 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0012 + Math.random() * 0.0022,
      warm: i % 3 !== 0,
    }));

    // Sweeping light trails for the radiant Scene 4 light canvas
    const lightStreaks: LightStreak[] = Array.from({ length: 7 }, (_, i) => ({
      x: width * (0.12 + i * 0.14),
      y: height * (0.1 + (i % 3) * 0.28),
      len: Math.max(width, height) * (0.55 + (i % 3) * 0.18),
      width: 22 + (i % 4) * 26,
      angle: -Math.PI * 0.34,
      speed: 0.045 + (i % 3) * 0.02,
      alpha: 0.08 + (i % 3) * 0.045,
      offset: i * 180,
    }));

    let lastReactSync = 0;

    const drawFrame = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;

      // Sync React state at ~30fps to keep progress bar & scene transitions silky without excess re-renders
      if (timestamp - lastReactSync > 32 || elapsed >= TOTAL_DURATION_MS) {
        setElapsedMs(Math.min(elapsed, TOTAL_DURATION_MS));
        lastReactSync = timestamp;
      }

      if (ctx && canvas) {
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.5;
        const minDim = Math.min(width, height);
        const currentScene = getSceneIndex(elapsed);

        if (currentScene === 1) {
          // Scene 1: Deep obsidian canvas with warm amber horizon flares (top & bottom blooms like reference)
          const p = Math.min(1, elapsed / SCENE_1_END);
          const flareStrength = Math.sin(Math.min(1, p * 1.15) * Math.PI);

          // Center warm glow
          const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.62);
          centerGrad.addColorStop(0, `rgba(244, 122, 36, ${0.22 * flareStrength})`);
          centerGrad.addColorStop(0.45, `rgba(180, 82, 16, ${0.12 * flareStrength})`);
          centerGrad.addColorStop(1, 'rgba(7, 5, 4, 0)');
          ctx.fillStyle = centerGrad;
          ctx.fillRect(0, 0, width, height);

          // Symmetrical top & bottom amber light horizons
          const horizonOffset = Math.max(88, height * 0.16);
          [horizonOffset, height - horizonOffset].forEach((hy) => {
            const hGrad = ctx.createRadialGradient(cx, hy, 2, cx, hy, minDim * 0.34);
            hGrad.addColorStop(0, `rgba(255, 224, 150, ${0.42 * flareStrength})`);
            hGrad.addColorStop(0.35, `rgba(244, 122, 36, ${0.24 * flareStrength})`);
            hGrad.addColorStop(1, 'rgba(244, 122, 36, 0)');
            ctx.fillStyle = hGrad;
            ctx.beginPath();
            ctx.ellipse(cx, hy, minDim * 0.34, minDim * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
          });
        } else if (currentScene === 2) {
          // Scene 2: Glowing amber orbital corona & luminous infinity ribbon trail
          const p = (elapsed - SCENE_1_END) / (SCENE_2_END - SCENE_1_END);
          const haloGrad = ctx.createRadialGradient(cx, cy, minDim * 0.12, cx, cy, minDim * 0.46);
          haloGrad.addColorStop(0, 'rgba(255, 130, 30, 0.03)');
          haloGrad.addColorStop(0.58, 'rgba(244, 122, 36, 0.2)');
          haloGrad.addColorStop(0.75, 'rgba(255, 180, 0, 0.09)');
          haloGrad.addColorStop(1, 'rgba(7, 10, 18, 0)');
          ctx.fillStyle = haloGrad;
          ctx.fillRect(0, 0, width, height);

          // Orbiting fiery light trail along a figure-8 / infinity curve when p > 0.35
          if (!reducedMotion) {
            const infScaleX = Math.min(width * 0.34, 240);
            const infScaleY = Math.min(height * 0.16, 105);
            const trailSteps = 44;
            const headAngle = p * Math.PI * 3.4;

            for (let s = 0; s < trailSteps; s++) {
              const t = headAngle - s * 0.065;
              const denom = 1 + Math.sin(t) * Math.sin(t);
              const ix = cx + (infScaleX * Math.cos(t)) / denom;
              const iy = cy + (infScaleY * Math.sin(t) * Math.cos(t)) / denom;
              const fade = 1 - s / trailSteps;

              ctx.beginPath();
              ctx.arc(ix, iy, 1.8 + fade * 3.6, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, ${Math.round(115 + fade * 105)}, ${Math.round(
                20 + fade * 90
              )}, ${fade * 0.55})`;
              ctx.fill();
            }
          }
        } else if (currentScene === 3) {
          // Scene 3: Warm amber radial aura + solar iris transition into Scene 4
          const p = (elapsed - SCENE_2_END) / (SCENE_3_END - SCENE_2_END);
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.55);
          glow.addColorStop(0, `rgba(255, 155, 45, ${0.14 + p * 0.14})`);
          glow.addColorStop(1, 'rgba(7, 10, 18, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, width, height);

          // Golden-white solar iris bloom in final 18% of Scene 3
          if (p > 0.8) {
            const irisP = (p - 0.8) / 0.2;
            const eased = irisP * irisP * (3 - 2 * irisP);
            const maxRadius = Math.hypot(width, height) * 0.72;
            const r = Math.max(12, maxRadius * eased);

            const irisGrad = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r * 1.15);
            irisGrad.addColorStop(0, `rgba(255, 253, 248, ${0.98 * eased})`);
            irisGrad.addColorStop(0.75, `rgba(255, 198, 72, ${0.9 * eased})`);
            irisGrad.addColorStop(1, 'rgba(244, 122, 36, 0)');
            ctx.fillStyle = irisGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (currentScene === 4) {
          // Scene 4: Luminous Light Scene — Diagonal sweeping golden-amber silk light ribbons
          const p = (elapsed - SCENE_3_END) / (SCENE_4_END - SCENE_3_END);

          lightStreaks.forEach((streak) => {
            ctx.save();
            const drift = reducedMotion ? 0 : (elapsed * streak.speed) % (width + 300);
            ctx.translate(
              ((streak.x + drift) % (width + 260)) - 130,
              streak.y
            );
            ctx.rotate(streak.angle);

            const sg = ctx.createLinearGradient(0, -streak.len / 2, 0, streak.len / 2);
            sg.addColorStop(0, 'rgba(255, 180, 0, 0)');
            sg.addColorStop(0.45, `rgba(255, 165, 36, ${streak.alpha})`);
            sg.addColorStop(0.55, `rgba(244, 122, 36, ${streak.alpha * 1.25})`);
            sg.addColorStop(1, 'rgba(255, 180, 0, 0)');

            ctx.fillStyle = sg;
            ctx.fillRect(-streak.width / 2, -streak.len / 2, streak.width, streak.len);
            ctx.restore();
          });

          // Smooth dark luminous sweep transitioning into Scene 5 in last 16% of Scene 4
          if (p > 0.84) {
            const sweepP = (p - 0.84) / 0.16;
            const eased = sweepP * sweepP * (3 - 2 * sweepP);
            ctx.fillStyle = `rgba(8, 20, 38, ${eased})`;
            ctx.fillRect(0, 0, width, height);
          }
        } else {
          // Scene 5: Deep Corporate Navy-Obsidian with converging golden-amber bokeh light orbs
          const p = (elapsed - SCENE_4_END) / (TOTAL_DURATION_MS - SCENE_4_END);
          const orbConvergence = Math.max(0, 1 - p * 1.7);

          // Converging golden bokeh orbs (inspired by frames 00:25-00:29)
          const orbConfigs = [
            { angle: 0.4, dist: minDim * 0.24 * orbConvergence, r: minDim * 0.11, color: 'rgba(255, 180, 0, 0.34)' },
            { angle: 2.5, dist: minDim * 0.22 * orbConvergence, r: minDim * 0.13, color: 'rgba(244, 122, 36, 0.32)' },
            { angle: 4.6, dist: minDim * 0.2 * orbConvergence, r: minDim * 0.1, color: 'rgba(255, 110, 20, 0.28)' },
          ];

          orbConfigs.forEach((orb, idx) => {
            const a = orb.angle + (reducedMotion ? 0 : p * (1.8 + idx * 0.4));
            const ox = cx + Math.cos(a) * orb.dist;
            const oy = cy + Math.sin(a) * orb.dist * 0.55;
            const og = ctx.createRadialGradient(ox, oy, 2, ox, oy, orb.r);
            og.addColorStop(0, orb.color);
            og.addColorStop(1, 'rgba(244, 122, 36, 0)');
            ctx.fillStyle = og;
            ctx.beginPath();
            ctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
            ctx.fill();
          });

          // Soft wide royal-navy & amber stage halo behind revealed logo
          const stageGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, minDim * 0.52);
          stageGrad.addColorStop(0, 'rgba(244, 122, 36, 0.16)');
          stageGrad.addColorStop(0.5, 'rgba(16, 43, 78, 0.22)');
          stageGrad.addColorStop(1, 'rgba(6, 17, 32, 0)');
          ctx.fillStyle = stageGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw floating illuminated particles across all scenes
        particles.forEach((pt) => {
          if (!reducedMotion) {
            pt.x += pt.vx;
            pt.y += pt.vy;
            if (pt.x < -10) pt.x = width + 10;
            if (pt.x > width + 10) pt.x = -10;
            if (pt.y < -10) pt.y = height + 10;
            if (pt.y > height + 10) pt.y = -10;
          }

          const pulse = 0.55 + 0.45 * Math.sin(timestamp * pt.speed + pt.phase);
          const a = pt.alpha * pulse * (currentScene === 4 ? 0.55 : 0.9);

          const fillRgb =
            currentScene === 4
              ? pt.warm
                ? '244, 122, 36'
                : '217, 130, 20'
              : pt.warm
                ? '255, 176, 66'
                : '255, 248, 235';

          // Soft halo around brighter particles
          if (pt.radius > 1.8) {
            const pg = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.radius * 4.5);
            pg.addColorStop(0, `rgba(${fillRgb}, ${a * 0.55})`);
            pg.addColorStop(1, `rgba(${fillRgb}, 0)`);
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius * 4.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${fillRgb}, ${a})`;
          ctx.fill();
        });

        ctx.restore();
      }

      if (elapsed >= TOTAL_DURATION_MS) {
        finishIntro();
        return;
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isOpen, reducedMotion, finishIntro]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="ABHI JOBS Brand Introduction"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.65, ease: EASE_CINEMA }}
          className={`fixed inset-0 z-[100] overflow-hidden select-none transition-colors duration-500 ${
            isLightScene
              ? 'bg-[#FFFDF9] text-[#102B4E]'
              : scene === 5
                ? 'bg-[#061120] text-white'
                : 'bg-[#070606] text-white'
          }`}
        >
          {/* High-DPI Atmospheric Canvas Layer */}
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Top Bar: Minimal Brand Mark (left) + Accessible Skip Intro (right) */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6">
            <div
              className={`text-xs font-medium tracking-[0.22em] uppercase transition-colors duration-300 ${
                isLightScene ? 'text-[#102B4E]/60' : 'text-white/45'
              }`}
            >
              ABHI JOBS
            </div>

            <button
              type="button"
              onClick={finishIntro}
              className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F47A24] ${
                isLightScene
                  ? 'bg-[#102B4E]/8 hover:bg-[#102B4E]/14 text-[#102B4E] border border-[#102B4E]/15'
                  : 'bg-white/8 hover:bg-white/15 text-white/90 border border-white/15 backdrop-blur-sm'
              }`}
            >
              Skip Intro
            </button>
          </div>

          {/* Center Stage Choreography */}
          <div className="relative z-10 w-full h-full flex items-center justify-center px-5 sm:px-10">
            <AnimatePresence mode="wait">
              {/* ACT 1: "Your Future. Your Opportunity." */}
              {scene === 1 && (
                <motion.div
                  key="scene-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: EASE_CINEMA }}
                  className="relative w-full h-full flex flex-col items-center justify-center text-center"
                >
                  {/* Symmetrical Top & Bottom Vertical Hairlines + Curved Light Arcs (Reference 00:00-00:01) */}
                  <svg
                    viewBox="0 0 400 720"
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full max-w-[520px] mx-auto pointer-events-none opacity-85"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="s1-line" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
                        <stop offset="0.6" stopColor="#FFB400" stopOpacity="0.9" />
                        <stop offset="1" stopColor="#FF5500" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    {/* Top vertical axis & sweeping arc */}
                    <motion.path
                      d="M200 0 V245"
                      stroke="url(#s1-line)"
                      strokeWidth="1.2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.05, ease: EASE_CINEMA }}
                    />
                    <motion.path
                      d="M200 18 C275 45 275 155 208 218"
                      stroke="rgba(255,235,205,0.65)"
                      strokeWidth="1.1"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.25, delay: 0.15, ease: EASE_CINEMA }}
                    />
                    <motion.circle
                      cx="200"
                      cy="245"
                      r="5.5"
                      fill="#FFFFFF"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.65 }}
                    />
                    <motion.circle
                      cx="214"
                      cy="245"
                      r="3"
                      fill="#FFB400"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.85 }}
                    />

                    {/* Bottom mirrored vertical axis & sweeping arc */}
                    <motion.path
                      d="M200 720 V475"
                      stroke="url(#s1-line)"
                      strokeWidth="1.2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.05, ease: EASE_CINEMA }}
                    />
                    <motion.path
                      d="M200 702 C125 675 125 565 192 502"
                      stroke="rgba(255,235,205,0.65)"
                      strokeWidth="1.1"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.25, delay: 0.15, ease: EASE_CINEMA }}
                    />
                    <motion.circle
                      cx="200"
                      cy="475"
                      r="5.5"
                      fill="#FFFFFF"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.65 }}
                    />
                    <motion.circle
                      cx="186"
                      cy="475"
                      r="3"
                      fill="#FFB400"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.85 }}
                    />
                  </svg>

                  {/* Scene 1 Typography */}
                  <div className="relative z-10 max-w-3xl px-4">
                    <motion.h1
                      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.9, delay: 0.35, ease: EASE_CINEMA }}
                      className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white text-balance leading-[1.15]"
                      style={{ textShadow: '0 0 42px rgba(244, 122, 36, 0.35)' }}
                    >
                      Your Future.{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF1D6] via-[#FFB400] to-[#F47A24]">
                        Your Opportunity.
                      </span>
                    </motion.h1>
                  </div>
                </motion.div>
              )}

              {/* ACT 2: "Meet ABHI JOBS." — Glowing Orbital Ring & Infinity Geometry */}
              {scene === 2 && (
                <motion.div
                  key="scene-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.48, ease: EASE_CINEMA }}
                  className="relative flex flex-col items-center justify-center text-center w-full max-w-3xl"
                >
                  {/* Luminous Orbital Ring & Infinity Ribbon SVG */}
                  <svg
                    viewBox="0 0 560 360"
                    aria-hidden="true"
                    className="w-[min(92vw,540px)] h-auto overflow-visible pointer-events-none"
                  >
                    <defs>
                      <linearGradient id="s2-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF5500" />
                        <stop offset="50%" stopColor="#F47A24" />
                        <stop offset="100%" stopColor="#FFB400" />
                      </linearGradient>
                      <filter id="s2-glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Circular glowing eclipse halo */}
                    <motion.circle
                      cx="280"
                      cy="180"
                      r="138"
                      fill="rgba(7,6,6,0.72)"
                      stroke="url(#s2-amber)"
                      strokeWidth="2.5"
                      filter="url(#s2-glow)"
                      initial={{ scale: 0.65, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 0.92, rotate: 0 }}
                      transition={{ duration: 1.05, ease: EASE_CINEMA }}
                      style={{ transformOrigin: '280px 180px' }}
                    />

                    {/* Subtle Infinity Loop traced across the orbital field */}
                    <motion.path
                      d="M 280 180 C 335 110, 445 110, 445 180 C 445 250, 335 250, 280 180 C 225 110, 115 110, 115 180 C 115 250, 225 250, 280 180 Z"
                      fill="none"
                      stroke="url(#s2-amber)"
                      strokeWidth="2"
                      strokeOpacity="0.65"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.78 }}
                      transition={{ duration: 1.65, delay: 0.4, ease: EASE_CINEMA }}
                    />

                    {/* Four Orbital Light Sparks around the ring */}
                    {[0, 90, 180, 270].map((deg, idx) => {
                      const rad = (deg * Math.PI) / 180;
                      const x = 280 + Math.cos(rad) * 138;
                      const y = 180 + Math.sin(rad) * 138;
                      return (
                        <motion.circle
                          key={deg}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#FFB400"
                          filter="url(#s2-glow)"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: [0, 1.35, 1], opacity: [0, 1, 0.9] }}
                          transition={{ duration: 0.6, delay: 0.25 + idx * 0.1 }}
                        />
                      );
                    })}
                  </svg>

                  {/* Centered Statement inside the orbital eclipse */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
                    <motion.h2
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.28, ease: EASE_CINEMA }}
                      className="text-3xl sm:text-5xl md:text-[3.5rem] font-semibold tracking-tight text-white"
                      style={{ textShadow: '0 2px 32px rgba(244, 122, 36, 0.3)' }}
                    >
                      Meet{' '}
                      <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#FFD27D] to-[#F47A24]">
                        ABHI JOBS.
                      </span>
                    </motion.h2>
                  </div>
                </motion.div>
              )}

              {/* ACT 3: "Connecting Talent with Opportunity." — 5 Nodes, Arc Leaps & Rising Stems (Reference 00:09-00:13) */}
              {scene === 3 && (
                <motion.div
                  key="scene-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="relative flex flex-col items-center justify-center w-full max-w-3xl text-center space-y-10"
                >
                  {/* 5 Illuminated Nodes + Vaulting Orange Arc + Rising Career Trajectory Stems */}
                  <svg
                    viewBox="0 0 520 190"
                    aria-hidden="true"
                    className="w-[min(90vw,480px)] h-auto overflow-visible pointer-events-none"
                  >
                    <defs>
                      <linearGradient id="s3-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF4D00" />
                        <stop offset="100%" stopColor="#FFB400" />
                      </linearGradient>
                      <filter id="s3-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Vaulting Orange Arcs connecting Talent -> Opportunity */}
                    {[60, 160, 260, 360].map((startX, i) => (
                      <motion.path
                        key={startX}
                        d={`M ${startX} 125 A 50 48 0 0 1 ${startX + 100} 125`}
                        fill="none"
                        stroke="url(#s3-arc)"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        filter="url(#s3-glow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: [0, 1, 1],
                          opacity: [0, 1, 0.25],
                        }}
                        transition={{
                          duration: 0.52,
                          delay: 0.2 + i * 0.28,
                          ease: EASE_CINEMA,
                        }}
                      />
                    ))}

                    {/* 5 Nodes with Rising Trajectory Stems */}
                    {[60, 160, 260, 360, 460].map((nx, idx) => {
                      const targetY = 125 - idx * 20;
                      return (
                        <g key={nx}>
                          {/* Rising hairline stem */}
                          <motion.line
                            x1={nx}
                            y1={175}
                            x2={nx}
                            y2={targetY}
                            stroke="rgba(255, 210, 140, 0.5)"
                            strokeWidth="1.2"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.85 }}
                            transition={{
                              duration: 0.65,
                              delay: 1.25 + idx * 0.08,
                              ease: EASE_CINEMA,
                            }}
                          />
                          {/* Warm glow aura on node */}
                          <motion.circle
                            cx={nx}
                            cy={125}
                            r="14"
                            fill="rgba(244, 122, 36, 0.35)"
                            filter="url(#s3-glow)"
                            initial={{ scale: 0, opacity: 0, y: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 0.9,
                              y: reducedMotion ? 0 : targetY - 125,
                            }}
                            transition={{
                              scale: { duration: 0.35, delay: 0.15 + idx * 0.25 },
                              opacity: { duration: 0.35, delay: 0.15 + idx * 0.25 },
                              y: { duration: 0.75, delay: 1.25 + idx * 0.08, ease: EASE_CINEMA },
                            }}
                          />
                          {/* Crisp pearl-white core dot */}
                          <motion.circle
                            cx={nx}
                            cy={125}
                            r="5.5"
                            fill="#FFFFFF"
                            initial={{ scale: 0, opacity: 0, y: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              y: reducedMotion ? 0 : targetY - 125,
                            }}
                            transition={{
                              scale: { duration: 0.3, delay: 0.05 + idx * 0.08 },
                              opacity: { duration: 0.3, delay: 0.05 + idx * 0.08 },
                              y: { duration: 0.75, delay: 1.25 + idx * 0.08, ease: EASE_CINEMA },
                            }}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Scene 3 Statement */}
                  <motion.h2
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: EASE_CINEMA }}
                    className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white/95 text-balance px-2"
                  >
                    Connecting Talent with{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB400] to-[#F47A24]">
                      Opportunity.
                    </span>
                  </motion.h2>
                </motion.div>
              )}

              {/* ACT 4: "Discover. Apply. Grow." — Radiant Light Scene with Flowing Amber Threads (Reference 00:15-00:21) */}
              {scene === 4 && (
                <motion.div
                  key="scene-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="relative flex flex-col items-center justify-center text-center w-full max-w-4xl py-10"
                >
                  {/* Delicate orbital thread curves with orange tracer nodes */}
                  <svg
                    viewBox="0 0 640 280"
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <motion.path
                      d="M 40 245 C 145 140, 210 35, 340 48 C 460 60, 520 185, 600 62"
                      fill="none"
                      stroke="#F47A24"
                      strokeWidth="1.25"
                      strokeOpacity="0.55"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: EASE_CINEMA }}
                    />
                    <motion.path
                      d="M 60 52 C 180 210, 390 250, 575 190"
                      fill="none"
                      stroke="#102B4E"
                      strokeWidth="1"
                      strokeOpacity="0.22"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, delay: 0.2, ease: EASE_CINEMA }}
                    />
                    <motion.circle
                      cx="340"
                      cy="48"
                      r="5"
                      fill="#F47A24"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.65 }}
                    />
                    <motion.circle
                      cx="575"
                      cy="190"
                      r="4"
                      fill="#102B4E"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.95 }}
                    />
                  </svg>

                  {/* Three-Beat Staggered Editorial Reveal */}
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-7">
                    {[
                      { word: 'Discover.', color: 'text-[#102B4E]', delay: 0.15 },
                      { word: 'Apply.', color: 'text-[#102B4E]', delay: 0.62 },
                      { word: 'Grow.', color: 'text-[#F47A24]', delay: 1.08 },
                    ].map((item) => (
                      <motion.span
                        key={item.word}
                        initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{
                          duration: 0.65,
                          delay: reducedMotion ? 0.1 : item.delay,
                          ease: EASE_CINEMA,
                        }}
                        className={`text-4xl sm:text-6xl md:text-[4.25rem] font-bold tracking-tight ${item.color}`}
                      >
                        {item.word}
                      </motion.span>
                    ))}
                  </div>

                  {/* Subtle Luminous Horizon Underline */}
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.9, delay: 1.25, ease: EASE_CINEMA }}
                    className="mt-6 h-[2px] w-36 sm:w-52 rounded-full bg-gradient-to-r from-transparent via-[#F47A24] to-transparent"
                  />
                </motion.div>
              )}

              {/* ACT 5: Official Approved ABHI JOBS Logo Reveal */}
              {scene === 5 && (
                <motion.div
                  key="scene-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE_CINEMA }}
                  className="relative flex flex-col items-center justify-center text-center space-y-6 px-4"
                >
                  {/* Exact Approved abhi Jobs SVG with Cinematic Path-Draw Reveal */}
                  <motion.div
                    initial={{ scale: 0.94 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.4, ease: EASE_CINEMA }}
                  >
                    <AnimatedAbhiJobsReveal reducedMotion={reducedMotion} />
                  </motion.div>

                  {/* Tagline beneath the revealed logo */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.75,
                      delay: reducedMotion ? 0.15 : 1.15,
                      ease: EASE_CINEMA,
                    }}
                    className="text-sm sm:text-base md:text-lg font-medium tracking-[0.26em] text-slate-300/90 uppercase"
                  >
                    Discover. Apply. Grow.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Cinematic Progress Bar & Quiet Scene Counter */}
          <div className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-8 pb-5 sm:pb-6 flex items-center justify-between pointer-events-none">
            <span
              className={`font-mono tabular-nums text-[11px] tracking-widest transition-colors duration-300 ${
                isLightScene ? 'text-[#102B4E]/50' : 'text-white/40'
              }`}
            >
              0{scene} / 05
            </span>

            <span
              className={`text-[11px] tracking-wide transition-colors duration-300 ${
                isLightScene ? 'text-[#102B4E]/45' : 'text-white/35'
              }`}
            >
              Press Esc to skip
            </span>
          </div>

          {/* Razor-thin 2px Bottom Progress Hairline */}
          <div
            className={`absolute bottom-0 inset-x-0 h-[2px] z-20 ${
              isLightScene ? 'bg-[#102B4E]/10' : 'bg-white/10'
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-[#FF4D00] via-[#F47A24] to-[#FFB400] transition-[width] duration-75 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicBrandIntro;
