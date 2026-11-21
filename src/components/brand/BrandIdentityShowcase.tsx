import React, { useState } from 'react';
import {
  BRAND_ICONS,
  BrandIconKey,
  BrandColorMode,
} from './BrandIcons';
import { BrandPattern, PatternType, PatternTheme } from './BrandPattern';
import { BrandPlaceholder } from './BrandPlaceholder';
import { Check, Copy } from 'lucide-react';

export const BrandIdentityShowcase: React.FC<{
  className?: string;
  onClose?: () => void;
}> = ({ className = '', onClose }) => {
  const [selectedTheme, setSelectedTheme] = useState<PatternTheme>('dark-navy');
  const [selectedIconMode, setSelectedIconMode] = useState<BrandColorMode>('palette');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const iconList: { key: BrandIconKey; name: string; role: string }[] = [
    { key: 'beacon', name: 'Falcon Beacon', role: 'Vigilance, talent scouting & opportunity detection' },
    { key: 'verified', name: 'Verified Skill', role: 'Human verification & authentic talent capabilities' },
    { key: 'apex', name: 'Career Apex', role: 'Promotion ladder & upward career trajectory' },
    { key: 'nexus', name: 'Talent Nexus', role: 'Direct matching between candidates & enterprises' },
    { key: 'radar', name: 'Opportunity Radar', role: 'Zero ghost-postings & active marketplace radar' },
    { key: 'enterprise', name: 'Enterprise Monolith', role: 'Vetted employers & corporate partners' },
    { key: 'dossier', name: 'Verified Dossier', role: 'Portfolio, structured credentials & resumes' },
    { key: 'compass', name: 'Compass Target', role: 'Objective career direction & milestone alignment' },
  ];

  const patterns: { type: PatternType; name: string; desc: string }[] = [
    { type: 'faceted-grid', name: 'Faceted Grid', desc: 'Isometric diamond planes & falcon angular vertices' },
    { type: 'radar-constellation', name: 'Radar Constellation', desc: 'Concentric talent ripples, orbital lines & data blips' },
    { type: 'career-ascent', name: 'Career Ascent', desc: 'Rhythmic upward chevrons & stepped promotion paths' },
    { type: 'stencil-grit', name: 'Stencil Grit', desc: 'Stippled vector ink-spray & micro-splatter textures' },
  ];

  const colorPalette = [
    { name: 'Midnight Navy', hex: '#061226', role: 'Primary foundation & dark theme surface' },
    { name: 'Deep Slate Navy', hex: '#0B192C', role: 'Secondary dark surface & card background' },
    { name: 'Charcoal Obsidian', hex: '#101828', role: 'Text headings & high-contrast elements' },
    { name: 'Signature Red', hex: '#FF2B1A', role: 'Primary brand accent, CTAs & beacon eye' },
    { name: 'Deep Crimson', hex: '#E02213', role: 'Hover states & active interactive vectors' },
    { name: 'Electric Coral', hex: '#FF4D3D', role: 'Dark mode highlights & high-visibility alerts' },
    { name: 'Enterprise Teal', hex: '#004D40', role: 'Verified company badges & skill indicators' },
    { name: 'Vibrant Teal', hex: '#0D9488', role: 'Secondary verification accents & nodal lines' },
    { name: 'Cyber Cyan', hex: '#14B8A6', role: 'Dark mode telemetry & active radar rays' },
  ];

  return (
    <div className={`space-y-12 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF2B1A] animate-pulse" />
            <span>Official Design System • ABHI JOBS ®</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] font-sora">
            Brand Icons &amp; Visual Identity Patterns
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl font-inter">
            Minimal brand icons, geometric background textures, and reusable placeholder imagery calibrated to the ABHI JOBS color palette (Navy, Brand Red, Teal).
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="self-start sm:self-center px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* 1. Official Color Palette */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#101828] font-sora flex items-center gap-2">
          <span>01. Core Color Palette</span>
          <span className="text-xs font-normal text-slate-500 font-inter">(Navy • Brand Red • Teal)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {colorPalette.map((c) => (
            <div
              key={c.hex}
              onClick={() => copyToClipboard(c.hex, c.hex)}
              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl shrink-0 shadow-inner border border-black/10 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: c.hex }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#101828] truncate">{c.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400 group-hover:text-[#FF2B1A] flex items-center gap-1">
                      {copiedKey === c.hex ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {c.hex}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{c.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Minimal Brand Icons */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#101828] font-sora flex items-center gap-2">
            <span>02. Minimal Brand Icons</span>
            <span className="text-xs font-normal text-slate-500 font-inter">(8 Custom SVG Vectors)</span>
          </h3>

          {/* Color Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs self-start">
            {(['palette', 'navy', 'teal', 'red', 'white'] as BrandColorMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedIconMode(mode)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  selectedIconMode === mode
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {iconList.map((item) => {
            const Icon = BRAND_ICONS[item.key];
            const isWhiteMode = selectedIconMode === 'white';
            return (
              <div
                key={item.key}
                className={`p-5 rounded-2xl border transition-all ${
                  isWhiteMode
                    ? 'bg-[#061226] border-slate-800 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${isWhiteMode ? 'bg-white/10' : 'bg-slate-50'}`}>
                    <Icon size="lg" colorMode={selectedIconMode} />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase opacity-50">
                    &lt;{item.key}/&gt;
                  </span>
                </div>
                <h4 className="text-sm font-bold font-sora">{item.name}</h4>
                <p className="text-xs opacity-70 mt-1 leading-relaxed">{item.role}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Cohesive Visual Identity Patterns */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#101828] font-sora flex items-center gap-2">
            <span>03. Visual Identity Patterns &amp; Textures</span>
            <span className="text-xs font-normal text-slate-500 font-inter">(Background System)</span>
          </h3>

          {/* Theme switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs self-start">
            {(['dark-navy', 'midnight-teal', 'light-slate', 'pure-white'] as PatternTheme[]).map((thm) => (
              <button
                key={thm}
                onClick={() => setSelectedTheme(thm)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedTheme === thm
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {thm.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patterns.map((p) => {
            const isDark = selectedTheme === 'dark-navy' || selectedTheme === 'midnight-teal';
            const bgClass =
              selectedTheme === 'midnight-teal'
                ? 'bg-[#00382F]'
                : selectedTheme === 'dark-navy'
                ? 'bg-[#061226]'
                : selectedTheme === 'light-slate'
                ? 'bg-slate-100'
                : 'bg-white';

            return (
              <div
                key={p.type}
                className="relative h-48 rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs flex flex-col justify-between p-5"
              >
                {/* Background base */}
                <div className={`absolute inset-0 ${bgClass}`} />
                {/* Brand Pattern */}
                <BrandPattern pattern={p.type} theme={selectedTheme} opacity={0.9} />

                {/* Content Overlay */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-2xs'}`}>
                    Pattern: {p.type}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-70">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF2B1A]" />
                    <span className={`text-[10px] font-mono tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      SVG TILE
                    </span>
                  </div>
                </div>

                <div className="relative z-10">
                  <h4 className={`text-base font-bold font-sora ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {p.name}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Production Placeholder Imagery Previews */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-[#101828] font-sora flex items-center gap-2">
          <span>04. Production Placeholder Imagery</span>
          <span className="text-xs font-normal text-slate-500 font-inter">(Ready-to-use in UI)</span>
        </h3>

        <div className="space-y-6">
          {/* Panoramic Company Banner */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Variant: Company Cover Banner (16:9 / Panoramic)
            </div>
            <BrandPlaceholder
              variant="company-banner"
              pattern="faceted-grid"
              theme="dark-navy"
              icon="enterprise"
              badgeText="Featured Employer"
              title="Apex Global Technologies"
              subtitle="Enterprise Cloud Systems & Distributed Architecture • Bengaluru, KA"
            />
          </div>

          {/* Dual Row: Job Card Cover & Empty State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Variant: Job Card Thumbnail (Radar Constellation • Teal)
              </div>
              <BrandPlaceholder
                variant="job-cover"
                pattern="radar-constellation"
                theme="midnight-teal"
                icon="radar"
                badgeText="Direct Recruiter Opening"
                title="Lead DevOps & Kubernetes Specialist"
                subtitle="High-Growth Fintech Ecosystem • Full-time"
              />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Variant: Empty State Illustration (Career Ascent • Navy)
              </div>
              <BrandPlaceholder
                variant="empty-state"
                pattern="career-ascent"
                theme="dark-navy"
                icon="falcon"
                badgeText="Talent Scout Active"
                title="No Pending Applications Found"
                subtitle="Your verified profile is currently visible to approved recruiters. Explore new openings to expand your reach."
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrandIdentityShowcase;
