import jsPDF from 'jspdf';
import {
  ResumeData,
  DEFAULT_SECTION_TITLES,
  getResumeDesign,
  flattenSkillCategories,
  ResumeSectionKey,
} from '../types/resume';

interface PdfValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateResumeForPdf(resume: ResumeData): PdfValidationResult {
  const errors: string[] = [];
  if (!resume.fullName || resume.fullName.trim().length === 0) {
    errors.push('Full Name is required to generate a PDF.');
  }
  if (!resume.email || !resume.email.includes('@')) {
    errors.push('A valid Email address is required.');
  }
  const hasSkills = flattenSkillCategories(resume.skillCategories, resume.skills).length > 0;
  if (
    resume.experiences.length === 0 &&
    resume.education.length === 0 &&
    !hasSkills &&
    !resume.summary.trim()
  ) {
    errors.push(
      'Please add at least one section (Summary, Experience, Education, or Skills) before exporting.'
    );
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = (hex || '#102B4E').replace('#', '');
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const num = parseInt(full, 16);
  if (isNaN(num)) return [16, 43, 78];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function getResumePdfFilename(resume: ResumeData): string {
  const sanitized = (resume.fullName || resume.title || 'Resume')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_');
  return `${sanitized || 'ABHI_JOBS'}_Resume.pdf`;
}

/**
 * Print-grade vector PDF export using an isolated A4 print iframe.
 * Produces 100% selectable text, exact visual match to all 12 templates,
 * crisp fonts, and clean print page breaks.
 */
export function printExactTemplatePdf(elementId: string, resume: ResumeData): boolean {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return false;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    return false;
  }

  // Copy active stylesheets so Tailwind & Google fonts render identically
  const styleNodes = Array.from(
    document.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((node) => node.outerHTML)
    .join('\n');

  const safeTitle = getResumePdfFilename(resume).replace(/\.pdf$/i, '');

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    ${styleNodes}
    <style>
      @page {
        size: A4 portrait;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #${elementId} {
        width: 210mm !important;
        min-height: 297mm !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    </style>
  </head>
  <body>
    ${sourceEl.outerHTML}
  </body>
</html>`);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }
  }, 350);

  return true;
}

/**
 * Generates a direct-download A4 PDF with 100% selectable vector text,
 * proper page breaks, consistent margins, and full support for all custom
 * design settings, section order, custom headings, and additional sections.
 */
export async function generateResumePdf(resume: ResumeData): Promise<void> {
  const validation = validateResumeForPdf(resume);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  const fileName = getResumePdfFilename(resume);
  const design = getResumeDesign(resume);
  const [r, g, b] = hexToRgb(design.accentColor);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = design.margins === 'narrow' ? 12 : design.margins === 'wide' ? 22 : 16;
  const marginTop = design.margins === 'narrow' ? 13 : design.margins === 'wide' ? 20 : 16;
  const marginBottom = 16;
  const contentWidth = pageWidth - marginX * 2;
  const usableBottom = pageHeight - marginBottom;

  const fontChoice =
    design.fontFamily === 'georgia' || design.fontFamily === 'merriweather'
      ? 'times'
      : design.fontFamily === 'mono'
      ? 'courier'
      : 'helvetica';

  const sizeDelta =
    design.fontSize === 'compact' ? -0.6 : design.fontSize === 'comfortable' ? 0.7 : 0;
  const lineStep =
    design.lineSpacing === 'tight' ? 4.0 : design.lineSpacing === 'relaxed' ? 5.1 : 4.5;

  let cursorY = marginTop;

  const ensureSpace = (neededMm: number): void => {
    if (cursorY + neededMm > usableBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
  };

  const isBanner =
    design.templateId === 'modern-corporate' || design.templateId === 'sales-marketing';
  const isCentered =
    design.templateId === 'minimal-elegant' || design.templateId === 'academic-cv';

  // Header
  const location = [resume.city?.trim(), resume.state?.trim()].filter(Boolean).join(', ');
  const contactParts = [
    resume.email?.trim(),
    resume.phone?.trim(),
    location,
    resume.linkedIn?.trim(),
    resume.portfolio?.trim(),
  ].filter(Boolean) as string[];

  if (isBanner) {
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, 36, 'F');
    doc.setFillColor(244, 122, 36);
    doc.rect(0, 36, pageWidth, 1.2, 'F');

    doc.setFont(fontChoice, 'bold');
    doc.setFontSize(20 + sizeDelta);
    doc.setTextColor(255, 255, 255);
    doc.text(resume.fullName.trim(), marginX, 15);

    if (resume.professionalTitle?.trim()) {
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(11 + sizeDelta);
      doc.setTextColor(244, 180, 110);
      doc.text(resume.professionalTitle.trim(), marginX, 22);
    }

    if (contactParts.length > 0) {
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(8.3);
      doc.setTextColor(235, 240, 248);
      const contactLines = doc.splitTextToSize(contactParts.join('  |  '), contentWidth);
      doc.text(contactLines, marginX, 29);
    }

    cursorY = 46;
  } else {
    doc.setFont(fontChoice, 'bold');
    doc.setFontSize(21 + sizeDelta);
    doc.setTextColor(r, g, b);
    if (isCentered) {
      doc.text(resume.fullName.trim(), pageWidth / 2, cursorY, { align: 'center' });
    } else {
      doc.text(resume.fullName.trim(), marginX, cursorY);
    }
    cursorY += 6.5;

    if (resume.professionalTitle?.trim()) {
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(11 + sizeDelta);
      doc.setTextColor(71, 85, 105);
      if (isCentered) {
        doc.text(resume.professionalTitle.trim(), pageWidth / 2, cursorY, { align: 'center' });
      } else {
        doc.text(resume.professionalTitle.trim(), marginX, cursorY);
      }
      cursorY += 5.5;
    }

    if (contactParts.length > 0) {
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(8.5 + sizeDelta * 0.4);
      doc.setTextColor(100, 116, 139);
      const contactLines = doc.splitTextToSize(contactParts.join('  •  '), contentWidth);
      if (isCentered) {
        doc.text(contactLines, pageWidth / 2, cursorY, { align: 'center' });
      } else {
        doc.text(contactLines, marginX, cursorY);
      }
      cursorY += contactLines.length * 4.2 + 2;
    }

    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
    cursorY += 7;
  }

  const getTitle = (key: ResumeSectionKey) =>
    design.sectionTitles?.[key]?.trim() || DEFAULT_SECTION_TITLES[key];

  const drawSectionHeader = (title: string, forceBreak = false) => {
    if (forceBreak && cursorY > marginTop + 5) {
      doc.addPage();
      cursorY = marginTop;
    } else {
      ensureSpace(14);
    }
    doc.setFont(fontChoice, 'bold');
    doc.setFontSize(10.5 + sizeDelta);
    doc.setTextColor(r, g, b);
    doc.text(title.toUpperCase(), marginX, cursorY);
    cursorY += 2;
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
    cursorY += 5;
  };

  const renderSection = (key: ResumeSectionKey) => {
    if (design.hiddenSections.includes(key)) return;
    const forceBreak = design.pageBreakBefore.includes(key);

    if (key === 'summary' && resume.summary?.trim()) {
      drawSectionHeader(getTitle('summary'), forceBreak);
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(9.5 + sizeDelta);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
      ensureSpace(lines.length * lineStep);
      doc.text(lines, marginX, cursorY);
      cursorY += lines.length * lineStep + 5;
      return;
    }

    if (key === 'experiences' && resume.experiences.length > 0) {
      drawSectionHeader(getTitle('experiences'), forceBreak);
      for (const exp of resume.experiences) {
        ensureSpace(18);
        doc.setFont(fontChoice, 'bold');
        doc.setFontSize(10 + sizeDelta);
        doc.setTextColor(15, 23, 42);
        doc.text(exp.jobTitle || 'Role', marginX, cursorY);

        const start = [exp.startMonth, exp.startYear].filter(Boolean).join(' ').trim();
        const end = exp.currentlyWorking
          ? 'Present'
          : [exp.endMonth, exp.endYear].filter(Boolean).join(' ').trim();
        const dateStr = start || end ? `${start || ''} – ${end || ''}`.replace(/^ – | – $/g, '') : '';
        if (dateStr) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(dateStr, marginX + contentWidth - doc.getTextWidth(dateStr), cursorY);
        }
        cursorY += 4.6;

        const meta = [exp.companyName, exp.employmentType, exp.location].filter(Boolean).join('  •  ');
        if (meta) {
          doc.setFont(fontChoice, 'italic');
          doc.setFontSize(8.8 + sizeDelta * 0.4);
          doc.setTextColor(r, g, b);
          doc.text(meta, marginX, cursorY);
          cursorY += 4.6;
        }

        const bullets = [
          ...(exp.responsibilities || []),
          ...(exp.achievements || []).map((a) => `Achievement: ${a}`),
        ].filter((b) => b.trim());

        doc.setFont(fontChoice, 'normal');
        doc.setFontSize(9.1 + sizeDelta);
        doc.setTextColor(51, 65, 85);
        for (const bullet of bullets) {
          const bLines = doc.splitTextToSize(bullet.trim(), contentWidth - 5);
          ensureSpace(bLines.length * (lineStep - 0.2) + 1.5);
          doc.text('•', marginX + 1, cursorY);
          doc.text(bLines, marginX + 5, cursorY);
          cursorY += bLines.length * (lineStep - 0.2) + 1.2;
        }
        cursorY += 3;
      }
      return;
    }

    if (key === 'education' && resume.education.length > 0) {
      drawSectionHeader(getTitle('education'), forceBreak);
      for (const edu of resume.education) {
        ensureSpace(14);
        doc.setFont(fontChoice, 'bold');
        doc.setFontSize(10 + sizeDelta);
        doc.setTextColor(15, 23, 42);
        const degreeLine = `${edu.degree || 'Degree'}${
          edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''
        }`;
        doc.text(degreeLine, marginX, cursorY);

        const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
        if (dates) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(dates, marginX + contentWidth - doc.getTextWidth(dates), cursorY);
        }
        cursorY += 4.5;

        doc.setFont(fontChoice, 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(71, 85, 105);
        const instMeta = [edu.institution, edu.location, edu.grade ? `Grade: ${edu.grade}` : '']
          .filter(Boolean)
          .join('  •  ');
        if (instMeta) {
          doc.text(instMeta, marginX, cursorY);
          cursorY += 4.4;
        }

        if (edu.description?.trim()) {
          const dLines = doc.splitTextToSize(edu.description.trim(), contentWidth);
          ensureSpace(dLines.length * 4.2);
          doc.text(dLines, marginX, cursorY);
          cursorY += dLines.length * 4.2 + 1;
        }
        cursorY += 2.5;
      }
      return;
    }

    if (key === 'skills') {
      const allSkills = flattenSkillCategories(resume.skillCategories, resume.skills);
      if (allSkills.length === 0) return;
      drawSectionHeader(getTitle('skills'), forceBreak);
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(9.2 + sizeDelta);
      doc.setTextColor(30, 41, 59);
      const cats = resume.skillCategories;
      const catPairs = cats
        ? [
            { label: 'Technical', items: cats.technical || [] },
            { label: 'Professional', items: cats.professional || [] },
            { label: 'Industry', items: cats.industry || [] },
            { label: 'Software & Tools', items: cats.tools || [] },
          ].filter((c) => c.items.length > 0)
        : [];

      if (catPairs.length > 1) {
        for (const pair of catPairs) {
          const line = `${pair.label}: ${pair.items.join(', ')}`;
          const wrapped = doc.splitTextToSize(line, contentWidth);
          ensureSpace(wrapped.length * lineStep);
          doc.text(wrapped, marginX, cursorY);
          cursorY += wrapped.length * lineStep + 1;
        }
      } else {
        const wrapped = doc.splitTextToSize(allSkills.join('  •  '), contentWidth);
        ensureSpace(wrapped.length * lineStep);
        doc.text(wrapped, marginX, cursorY);
        cursorY += wrapped.length * lineStep;
      }
      cursorY += 4;
      return;
    }

    if (key === 'projects' && resume.projects.length > 0) {
      drawSectionHeader(getTitle('projects'), forceBreak);
      for (const proj of resume.projects) {
        ensureSpace(13);
        doc.setFont(fontChoice, 'bold');
        doc.setFontSize(9.6 + sizeDelta);
        doc.setTextColor(15, 23, 42);
        doc.text(proj.name || 'Project', marginX, cursorY);
        cursorY += 4.3;

        if (proj.role || proj.technologies) {
          doc.setFont(fontChoice, 'italic');
          doc.setFontSize(8.6);
          doc.setTextColor(71, 85, 105);
          doc.text([proj.role, proj.technologies].filter(Boolean).join(' | '), marginX, cursorY);
          cursorY += 4.2;
        }

        if (proj.description?.trim()) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(9 + sizeDelta);
          doc.setTextColor(51, 65, 85);
          const pLines = doc.splitTextToSize(proj.description.trim(), contentWidth);
          ensureSpace(pLines.length * 4.2);
          doc.text(pLines, marginX, cursorY);
          cursorY += pLines.length * 4.2 + 2;
        }
      }
      return;
    }

    if (key === 'certifications' && resume.certifications.length > 0) {
      drawSectionHeader(getTitle('certifications'), forceBreak);
      for (const cert of resume.certifications) {
        ensureSpace(9);
        doc.setFont(fontChoice, 'bold');
        doc.setFontSize(9.3 + sizeDelta);
        doc.setTextColor(15, 23, 42);
        doc.text(cert.name || 'Certification', marginX, cursorY);
        if (cert.issueDate) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(cert.issueDate, marginX + contentWidth - doc.getTextWidth(cert.issueDate), cursorY);
        }
        cursorY += 4.2;
        const sub = [cert.issuer, cert.credentialId ? `ID: ${cert.credentialId}` : '']
          .filter(Boolean)
          .join(' • ');
        if (sub) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(8.6);
          doc.setTextColor(71, 85, 105);
          doc.text(sub, marginX, cursorY);
          cursorY += 4.5;
        }
      }
      return;
    }

    if (key === 'languages' && resume.languages.length > 0) {
      drawSectionHeader(getTitle('languages'), forceBreak);
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(9.2 + sizeDelta);
      doc.setTextColor(30, 41, 59);
      const langStr = resume.languages.map((l) => `${l.language} (${l.proficiency})`).join('  •  ');
      const wrapped = doc.splitTextToSize(langStr, contentWidth);
      ensureSpace(wrapped.length * lineStep);
      doc.text(wrapped, marginX, cursorY);
      cursorY += wrapped.length * lineStep + 4;
      return;
    }

    if ((key === 'achievements' || key === 'memberships') && (resume[key] || []).length > 0) {
      const items = (resume[key] || []).filter((i) => i.trim());
      if (items.length === 0) return;
      drawSectionHeader(getTitle(key), forceBreak);
      doc.setFont(fontChoice, 'normal');
      doc.setFontSize(9.1 + sizeDelta);
      doc.setTextColor(51, 65, 85);
      for (const item of items) {
        const bLines = doc.splitTextToSize(item.trim(), contentWidth - 5);
        ensureSpace(bLines.length * 4.3 + 1);
        doc.text('•', marginX + 1, cursorY);
        doc.text(bLines, marginX + 5, cursorY);
        cursorY += bLines.length * 4.3 + 1.2;
      }
      cursorY += 3;
      return;
    }

    if (
      (key === 'awards' || key === 'training' || key === 'volunteer' || key === 'publications') &&
      (resume[key] || []).length > 0
    ) {
      const entries = resume[key] || [];
      drawSectionHeader(getTitle(key), forceBreak);
      for (const entry of entries) {
        ensureSpace(12);
        doc.setFont(fontChoice, 'bold');
        doc.setFontSize(9.4 + sizeDelta);
        doc.setTextColor(15, 23, 42);
        doc.text(entry.title || 'Entry', marginX, cursorY);
        if (entry.date) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text(entry.date, marginX + contentWidth - doc.getTextWidth(entry.date), cursorY);
        }
        cursorY += 4.3;
        if (entry.organization) {
          doc.setFont(fontChoice, 'italic');
          doc.setFontSize(8.6);
          doc.setTextColor(71, 85, 105);
          doc.text(entry.organization, marginX, cursorY);
          cursorY += 4.2;
        }
        if (entry.description) {
          doc.setFont(fontChoice, 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);
          const dLines = doc.splitTextToSize(entry.description, contentWidth);
          ensureSpace(dLines.length * 4.2);
          doc.text(dLines, marginX, cursorY);
          cursorY += dLines.length * 4.2 + 2;
        }
      }
      return;
    }

    if (key === 'customSections' && (resume.customSections || []).length > 0) {
      for (const cs of resume.customSections || []) {
        const items = (cs.items || []).filter((i) => i.trim());
        if (!cs.title.trim() && items.length === 0) continue;
        drawSectionHeader(cs.title || 'Additional Information', forceBreak);
        doc.setFont(fontChoice, 'normal');
        doc.setFontSize(9.1 + sizeDelta);
        doc.setTextColor(51, 65, 85);
        for (const item of items) {
          const bLines = doc.splitTextToSize(item.trim(), contentWidth - 5);
          ensureSpace(bLines.length * 4.3 + 1);
          doc.text('•', marginX + 1, cursorY);
          doc.text(bLines, marginX + 5, cursorY);
          cursorY += bLines.length * 4.3 + 1.2;
        }
        cursorY += 3;
      }
    }
  };

  for (const key of design.sectionOrder) {
    renderSection(key);
  }

  doc.save(fileName);
}
