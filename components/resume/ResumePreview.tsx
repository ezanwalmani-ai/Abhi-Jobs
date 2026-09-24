import React, { useState } from 'react';
import { ResumeData, ResumeTemplateStyle } from '../../types/resume';
import { ZoomIn, ZoomOut, RotateCcw, ExternalLink, Mail, Phone, MapPin, Globe, Linkedin, Check } from 'lucide-react';

interface ResumePreviewProps {
  resume: ResumeData;
  onTemplateChange?: (template: ResumeTemplateStyle) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
  resume,
  onTemplateChange,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(130, prev + 10));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(70, prev - 10));
  const handleResetZoom = () => setZoomLevel(100);

  // Template styling helpers
  const getHeaderColor = () => {
    switch (resume.template) {
      case 'modern':
        return 'text-[#004D40]';
      case 'minimal':
        return 'text-black';
      case 'professional':
      default:
        return 'text-slate-900';
    }
  };

  const getSectionBorderColor = () => {
    switch (resume.template) {
      case 'modern':
        return 'border-[#004D40]';
      case 'minimal':
        return 'border-black';
      case 'professional':
      default:
        return 'border-slate-300';
    }
  };

  const hasContactInfo =
    resume.email ||
    resume.phone ||
    resume.city ||
    resume.state ||
    resume.linkedIn ||
    resume.portfolio;

  const locationStr = [resume.city.trim(), resume.state.trim()].filter(Boolean).join(', ');

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Preview toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Style:</span>
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            {(['professional', 'modern', 'minimal'] as ResumeTemplateStyle[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTemplateChange && onTemplateChange(t)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                  resume.template === t
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-auto">
          <span className="text-[11px] font-semibold mr-1">{zoomLevel}%</span>
          <button
            type="button"
            title="Zoom Out"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Reset Zoom"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Zoom In"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="flex-1 overflow-auto rounded-2xl border border-slate-300 bg-slate-200/80 p-3 sm:p-6 flex justify-center shadow-inner min-h-[600px]">
        <div
          id="resume-a4-preview"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            width: '100%',
            maxWidth: '210mm',
            minHeight: '297mm',
          }}
          className="bg-white text-slate-900 shadow-xl rounded-sm p-8 sm:p-12 font-sans transition-transform duration-150 relative space-y-5"
        >
          {/* Header Area */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="space-y-1.5 flex-1 min-w-0">
              <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${getHeaderColor()}`}>
                {resume.fullName || 'Your Full Name'}
              </h1>

              {resume.professionalTitle && (
                <p className="text-sm font-semibold text-slate-700">
                  {resume.professionalTitle}
                </p>
              )}

              {/* Contact Information Row */}
              {hasContactInfo && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-1">
                  {resume.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {resume.email}
                    </span>
                  )}
                  {resume.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {resume.phone}
                    </span>
                  )}
                  {locationStr && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {locationStr}
                    </span>
                  )}
                  {resume.linkedIn && (
                    <a
                      href={resume.linkedIn.startsWith('http') ? resume.linkedIn : `https://${resume.linkedIn}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-teal-800 hover:underline"
                    >
                      <Linkedin className="w-3 h-3" />
                      LinkedIn
                    </a>
                  )}
                  {resume.portfolio && (
                    <a
                      href={resume.portfolio.startsWith('http') ? resume.portfolio : `https://${resume.portfolio}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-teal-800 hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      Portfolio
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Optional Photo */}
            {resume.showPhoto && resume.photoUrl && (
              <img
                src={resume.photoUrl}
                alt={resume.fullName || 'Candidate'}
                className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            )}
          </div>

          {/* 1. Professional Summary (Only if filled) */}
          {resume.summary?.trim() && (
            <div className="space-y-1.5">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Professional Summary
              </h2>
              <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                {resume.summary}
              </p>
            </div>
          )}

          {/* 2. Work Experience (Only if filled) */}
          {resume.experiences && resume.experiences.length > 0 && (
            <div className="space-y-3">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Work Experience
              </h2>

              <div className="space-y-3.5">
                {resume.experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {exp.jobTitle || 'Position'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {exp.startMonth} {exp.startYear} &ndash;{' '}
                        {exp.currentlyWorking ? 'Present' : `${exp.endMonth} ${exp.endYear}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                      <span>{exp.companyName || 'Company'}</span>
                      {exp.employmentType && <span>&bull; {exp.employmentType}</span>}
                      {exp.location && <span>&bull; {exp.location}</span>}
                    </div>

                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-0.5 text-xs text-slate-700 pt-0.5">
                        {exp.responsibilities.map((bullet, idx) =>
                          bullet.trim() ? <li key={idx}>{bullet}</li> : null
                        )}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Education (Only if filled) */}
          {resume.education && resume.education.length > 0 && (
            <div className="space-y-3">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Education
              </h2>

              <div className="space-y-2.5">
                {resume.education.map((edu) => (
                  <div key={edu.id} className="space-y-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {edu.degree || 'Degree'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {[edu.startDate, edu.endDate].filter(Boolean).join(' - ') || 'Graduated'}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-slate-600">
                      {edu.institution || 'Institution'}
                      {edu.location ? ` &bull; ${edu.location}` : ''}
                    </div>

                    {edu.description && (
                      <p className="text-xs text-slate-700 pt-0.5">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Skills (Only if filled) */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="space-y-1.5">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Skills
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-800 pt-0.5">
                {resume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 bg-slate-100 rounded-md text-slate-800 text-[11px] font-medium border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 5. Projects (Only if filled) */}
          {resume.projects && resume.projects.length > 0 && (
            <div className="space-y-3">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Projects
              </h2>

              <div className="space-y-2.5">
                {resume.projects.map((proj) => (
                  <div key={proj.id} className="space-y-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">
                        {proj.name || 'Project Name'}
                      </span>
                      {proj.role && (
                        <span className="text-[11px] font-medium text-slate-500">
                          {proj.role}
                        </span>
                      )}
                    </div>

                    {proj.technologies && (
                      <p className="text-[11px] italic text-slate-600">
                        Technologies: {proj.technologies}
                      </p>
                    )}

                    {proj.description && (
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    {proj.url && (
                      <a
                        href={proj.url.startsWith('http') ? proj.url : `https://${proj.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-teal-800 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{proj.url}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Certifications (Only if filled) */}
          {resume.certifications && resume.certifications.length > 0 && (
            <div className="space-y-2.5">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Certifications
              </h2>

              <div className="space-y-1.5">
                {resume.certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between items-baseline gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {cert.name || 'Certification'}
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        {cert.issuer} {cert.credentialId ? `&bull; ID: ${cert.credentialId}` : ''}
                      </span>
                    </div>
                    {cert.issueDate && (
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {cert.issueDate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Languages (Only if filled) */}
          {resume.languages && resume.languages.length > 0 && (
            <div className="space-y-1.5">
              <h2
                className={`text-xs font-bold tracking-wider uppercase border-b pb-1 ${getHeaderColor()} ${getSectionBorderColor()}`}
              >
                Languages
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-800 pt-0.5">
                {resume.languages.map((l) => (
                  <span key={l.id}>
                    <strong className="font-semibold text-slate-900">{l.language}</strong>{' '}
                    <span className="text-slate-500">({l.proficiency})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subtle footer */}
          <div className="pt-6 mt-8 border-t border-slate-200 text-center text-[10px] text-slate-400">
            ABHI JOBS Verified Resume
          </div>
        </div>
      </div>
    </div>
  );
};
