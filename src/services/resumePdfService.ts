import jsPDF from 'jspdf';
import html2PDF from 'jspdf-html2canvas';
import { ResumeData } from '../types/resume';

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
  if (
    resume.experiences.length === 0 &&
    resume.education.length === 0 &&
    resume.skills.length === 0 &&
    !resume.summary.trim()
  ) {
    errors.push('Please add at least one section (Experience, Education, Skills, or Summary) before exporting.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates an ATS-friendly, professional A4 PDF file using jspdf-html2canvas
 * to capture the live resume preview with full fidelity.
 */
export async function generateResumePdf(resume: ResumeData): Promise<void> {
  const validation = validateResumeForPdf(resume);
  if (!validation.valid) {
    throw new Error(validation.errors.join(' '));
  }

  // Format filename: FirstName_LastName_Resume.pdf
  const sanitizedName = resume.fullName.trim()
    ? resume.fullName
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
    : 'Resume';
  const fileName = `${sanitizedName}_Resume.pdf`;

  // Look for the live resume preview DOM element
  const previewElement = document.getElementById('resume-a4-preview');

  if (previewElement) {
    let printContainer: HTMLDivElement | null = null;
    try {
      // Create an off-screen container strictly fixed at standard A4 pixel width (794px = 210mm @ 96DPI)
      // This prevents any responsive mobile squashing or zoom scaling from affecting the PDF output.
      printContainer = document.createElement('div');
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '794px';
      printContainer.style.minHeight = '1123px';
      printContainer.style.zIndex = '-9999';
      printContainer.style.background = '#ffffff';
      printContainer.style.margin = '0';
      printContainer.style.padding = '0';
      printContainer.style.boxSizing = 'border-box';
      printContainer.style.overflow = 'visible';
      printContainer.style.pointerEvents = 'none';

      // Clone preview element to isolate styles
      const clone = previewElement.cloneNode(true) as HTMLElement;
      clone.style.transform = 'none';
      clone.style.width = '794px';
      clone.style.maxWidth = '794px';
      clone.style.minHeight = '1123px';
      clone.style.margin = '0';
      clone.style.boxShadow = 'none';
      clone.style.borderRadius = '0';
      clone.style.display = 'block';
      clone.style.boxSizing = 'border-box';

      printContainer.appendChild(clone);
      document.body.appendChild(printContainer);

      // Give browser a microtask to calculate fonts and computed dimensions
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Generate professional A4 PDF with jspdf-html2canvas
      const pdf = await html2PDF(clone, {
        jsPDF: {
          format: 'a4',
          unit: 'mm',
          orientation: 'portrait',
        },
        html2canvas: {
          scale: 2, // 2x scale for sharp typography and vector-like clarity
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
        },
        imageType: 'image/jpeg',
        imageQuality: 0.98,
        output: fileName,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
        autoResize: true,
        success: (generatedPdf: any) => {
          if (generatedPdf && typeof generatedPdf.save === 'function') {
            generatedPdf.save(fileName);
          }
        },
      });

      // Ensure save was triggered
      if (pdf && typeof pdf.save === 'function') {
        // html2PDF success hook already calls save with output filename
      }
      return;
    } catch (html2pdfError) {
      console.warn('html2PDF capture failed, falling back to direct vector PDF generator:', html2pdfError);
      // Fall through to vector generator below
    } finally {
      if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
    }
  }

  // Fallback direct vector jsPDF generator
  await generateVectorResumePdf(resume, fileName);
}

/**
 * Direct coordinate-based vector jsPDF generator (robust fallback).
 */
async function generateVectorResumePdf(resume: ResumeData, fileName: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const marginTop = 18;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginX * 2;
  const usableBottom = pageHeight - marginBottom;

  let cursorY = marginTop;

  const ensureSpace = (neededHeight: number): void => {
    if (cursorY + neededHeight > usableBottom) {
      doc.addPage();
      cursorY = marginTop;
    }
  };

  const primaryColor =
    resume.template === 'modern' ? [0, 77, 64] : [15, 23, 42];
  const secondaryColor = [71, 85, 105];
  const dividerColor = [226, 232, 240];

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(resume.fullName || 'Candidate Name', marginX, cursorY);
  cursorY += 7;

  if (resume.professionalTitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(resume.professionalTitle, marginX, cursorY);
    cursorY += 5;
  }

  // Contact line
  const contactParts: string[] = [];
  if (resume.email) contactParts.push(resume.email);
  if (resume.phone) contactParts.push(resume.phone);
  const location = [resume.city.trim(), resume.state.trim()].filter(Boolean).join(', ');
  if (location) contactParts.push(location);
  if (resume.linkedIn) contactParts.push('LinkedIn: ' + resume.linkedIn);
  if (resume.portfolio) contactParts.push('Portfolio: ' + resume.portfolio);

  if (contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const contactText = contactParts.join('  •  ');
    const contactLines = doc.splitTextToSize(contactText, contentWidth);
    doc.text(contactLines, marginX, cursorY);
    cursorY += contactLines.length * 4.5 + 2;
  }

  // Divider
  doc.setDrawColor(dividerColor[0], dividerColor[1], dividerColor[2]);
  doc.setLineWidth(0.4);
  doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
  cursorY += 7;

  const drawSectionHeader = (title: string) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title.toUpperCase(), marginX, cursorY);
    cursorY += 2;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);
    doc.line(marginX, cursorY, marginX + contentWidth, cursorY);
    cursorY += 5;
  };

  // Summary
  if (resume.summary?.trim()) {
    drawSectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(resume.summary.trim(), contentWidth);
    ensureSpace(lines.length * 4.5);
    doc.text(lines, marginX, cursorY);
    cursorY += lines.length * 4.5 + 5;
  }

  // Experience
  if (resume.experiences && resume.experiences.length > 0) {
    drawSectionHeader('Work Experience');
    for (const exp of resume.experiences) {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(exp.jobTitle || 'Position', marginX, cursorY);

      const dateStr = `${exp.startMonth || ''} ${exp.startYear || ''} - ${
        exp.currentlyWorking ? 'Present' : `${exp.endMonth || ''} ${exp.endYear || ''}`
      }`.trim();
      if (dateStr && dateStr !== '-') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const dateWidth = doc.getTextWidth(dateStr);
        doc.text(dateStr, marginX + contentWidth - dateWidth, cursorY);
      }
      cursorY += 4.5;

      const subHeaderParts = [exp.companyName, exp.employmentType, exp.location].filter(Boolean);
      if (subHeaderParts.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(subHeaderParts.join(' • '), marginX, cursorY);
        cursorY += 4.5;
      }

      if (exp.responsibilities && exp.responsibilities.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        for (const resp of exp.responsibilities) {
          if (!resp.trim()) continue;
          const bulletLines = doc.splitTextToSize(resp.trim(), contentWidth - 6);
          ensureSpace(bulletLines.length * 4.2 + 1);
          doc.text('•', marginX + 1, cursorY);
          doc.text(bulletLines, marginX + 6, cursorY);
          cursorY += bulletLines.length * 4.2 + 1;
        }
      }
      cursorY += 3;
    }
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    drawSectionHeader('Education');
    for (const edu of resume.education) {
      ensureSpace(14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(edu.degree || 'Degree', marginX, cursorY);

      const eduDates = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      if (eduDates) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const w = doc.getTextWidth(eduDates);
        doc.text(eduDates, marginX + contentWidth - w, cursorY);
      }
      cursorY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        [edu.institution, edu.location].filter(Boolean).join(' • '),
        marginX,
        cursorY
      );
      cursorY += 4.5;

      if (edu.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const descLines = doc.splitTextToSize(edu.description, contentWidth);
        ensureSpace(descLines.length * 4);
        doc.text(descLines, marginX, cursorY);
        cursorY += descLines.length * 4 + 1;
      }
      cursorY += 2;
    }
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    drawSectionHeader('Skills');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const skillsText = resume.skills.join('   •   ');
    const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
    ensureSpace(skillsLines.length * 4.5);
    doc.text(skillsLines, marginX, cursorY);
    cursorY += skillsLines.length * 4.5 + 4;
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    drawSectionHeader('Projects');
    for (const proj of resume.projects) {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.name || 'Project Name', marginX, cursorY);
      cursorY += 4;

      if (proj.role || proj.technologies) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text([proj.role, proj.technologies].filter(Boolean).join(' | '), marginX, cursorY);
        cursorY += 4;
      }

      if (proj.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const pLines = doc.splitTextToSize(proj.description, contentWidth);
        ensureSpace(pLines.length * 4);
        doc.text(pLines, marginX, cursorY);
        cursorY += pLines.length * 4 + 1;
      }
      cursorY += 2;
    }
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    drawSectionHeader('Certifications');
    for (const cert of resume.certifications) {
      ensureSpace(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(cert.name || 'Certification', marginX, cursorY);

      if (cert.issueDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const w = doc.getTextWidth(cert.issueDate);
        doc.text(cert.issueDate, marginX + contentWidth - w, cursorY);
      }
      cursorY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        [cert.issuer, cert.credentialId ? `ID: ${cert.credentialId}` : ''].filter(Boolean).join(' • '),
        marginX,
        cursorY
      );
      cursorY += 5;
    }
  }

  // Languages
  if (resume.languages && resume.languages.length > 0) {
    drawSectionHeader('Languages');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const langStr = resume.languages
      .map((l) => `${l.language} (${l.proficiency})`)
      .join('   •   ');
    const langLines = doc.splitTextToSize(langStr, contentWidth);
    ensureSpace(langLines.length * 4.5);
    doc.text(langLines, marginX, cursorY);
    cursorY += langLines.length * 4.5 + 4;
  }

  doc.save(fileName);
}
