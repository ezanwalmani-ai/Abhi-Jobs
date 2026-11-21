import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { CourseCertificateRecord } from '../types/learning';

export function buildCertificateVerificationUrl(certificateId: string): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://abhijobs.in';
  return `${origin}/verify-certificate/${encodeURIComponent(certificateId)}`;
}

export async function generateCertificateQrDataUrl(certificateId: string): Promise<string> {
  const verifyUrl = buildCertificateVerificationUrl(certificateId);
  return QRCode.toDataURL(verifyUrl, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#102B4E',
      light: '#FFFFFF',
    },
  });
}

export function formatCertificateDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Generates a print-ready vector A4 Landscape (297mm × 210mm) PDF of the
 * ABHI JOBS Course Completion Certificate with embedded scannable QR code.
 */
export async function downloadCertificatePdf(
  certificate: CourseCertificateRecord
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 297;
  const pageH = 210;
  const centerX = pageW / 2;

  // Colors: Crisp White Canvas, Deep Corporate Navy (#102B4E), Subtle Antique Gold (#C59B43)
  const NAVY: [number, number, number] = [16, 43, 78];
  const GOLD: [number, number, number] = [197, 155, 67];
  const GOLD_SOFT: [number, number, number] = [233, 219, 185];
  const ORANGE: [number, number, number] = [244, 122, 36];
  const SLATE: [number, number, number] = [86, 100, 121];
  const MUTED: [number, number, number] = [119, 131, 151];

  // Crisp White Page Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Outer Navy Frame
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1.4);
  doc.rect(10, 10, pageW - 20, pageH - 20);

  // Inner Subtle Gold Frame
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.rect(13.5, 13.5, pageW - 27, pageH - 27);

  // Corner Navy & Gold Architectural Accents
  const cornerLen = 10;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.9);
  // Top-left
  doc.line(16.5, 16.5, 16.5 + cornerLen, 16.5);
  doc.line(16.5, 16.5, 16.5, 16.5 + cornerLen);
  // Top-right
  doc.line(pageW - 16.5, 16.5, pageW - 16.5 - cornerLen, 16.5);
  doc.line(pageW - 16.5, 16.5, pageW - 16.5, 16.5 + cornerLen);
  // Bottom-left
  doc.line(16.5, pageH - 16.5, 16.5 + cornerLen, pageH - 16.5);
  doc.line(16.5, pageH - 16.5, 16.5, pageH - 16.5 - cornerLen);
  // Bottom-right
  doc.line(pageW - 16.5, pageH - 16.5, pageW - 16.5 - cornerLen, pageH - 16.5);
  doc.line(pageW - 16.5, pageH - 16.5, pageW - 16.5, pageH - 16.5 - cornerLen);

  // Top Brand Header: ABHI JOBS Wordmark + Learn with ABHI Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const abhiWidth = doc.getTextWidth('abhi');
  const jobsWidth = doc.getTextWidth('Jobs');
  const totalBrandW = abhiWidth + jobsWidth + 0.8;
  const brandStartX = centerX - totalBrandW / 2;

  doc.setTextColor(...NAVY);
  doc.text('abhi', brandStartX, 31);
  doc.setTextColor(...ORANGE);
  doc.text('Jobs', brandStartX + abhiWidth + 0.8, 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('LEARN WITH ABHI  •  CAREER DEVELOPMENT ACADEMY', centerX, 37.5, {
    align: 'center',
  });

  // Subtle Gold Hairline Divider
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.45);
  doc.line(centerX - 36, 42.5, centerX + 36, 42.5);

  // Formal Certificate Title
  doc.setFont('times', 'bold');
  doc.setFontSize(31);
  doc.setTextColor(...NAVY);
  doc.text('Certificate of Completion', centerX, 57, { align: 'center' });

  // Presentation Lead-in
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...SLATE);
  doc.text('This is to certify that', centerX, 68.5, { align: 'center' });

  // Candidate Full Name (Prominent Serif Display)
  doc.setFont('times', 'bold');
  const nameFontSize = certificate.candidateName.length > 28 ? 24 : 30;
  doc.setFontSize(nameFontSize);
  doc.setTextColor(...NAVY);
  doc.text(certificate.candidateName, centerX, 83, { align: 'center' });

  // Elegant Gold Underline under Candidate Name
  const nameRuleHalf = Math.min(82, Math.max(46, doc.getTextWidth(certificate.candidateName) / 2 + 12));
  doc.setDrawColor(...GOLD_SOFT);
  doc.setLineWidth(0.5);
  doc.line(centerX - nameRuleHalf, 87.5, centerX + nameRuleHalf, 87.5);

  // Achievement Statement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...SLATE);
  doc.text('has successfully completed all required lessons, module quizzes, and final assessment for', centerX, 97, {
    align: 'center',
  });

  // Course Title
  doc.setFont('helvetica', 'bold');
  const courseFontSize = certificate.courseTitle.length > 42 ? 17 : 20;
  doc.setFontSize(courseFontSize);
  doc.setTextColor(...NAVY);
  doc.text(certificate.courseTitle, centerX, 110, {
    align: 'center',
    maxWidth: 225,
  });

  // Structured Metrics Strip (Completion Date · Final Assessment Score · Certificate ID)
  const metaY = 126;
  const formattedDate = formatCertificateDate(certificate.completionDate);

  doc.setDrawColor(229, 234, 240);
  doc.setLineWidth(0.35);
  doc.line(38, metaY - 6, pageW - 38, metaY - 6);
  doc.line(38, metaY + 11, pageW - 38, metaY + 11);

  const col1X = 72;
  const col2X = centerX;
  const col3X = pageW - 72;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('COMPLETION DATE', col1X, metaY, { align: 'center' });
  doc.text('FINAL ASSESSMENT SCORE', col2X, metaY, { align: 'center' });
  doc.text('CERTIFICATE ID', col3X, metaY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(formattedDate, col1X, metaY + 6.5, { align: 'center' });
  doc.text(`${certificate.finalAssessmentScore}% (Passed)`, col2X, metaY + 6.5, {
    align: 'center',
  });
  doc.text(certificate.certificateId, col3X, metaY + 6.5, { align: 'center' });

  // Bottom Row: Left = Authorized Signature | Center = Official Seal | Right = QR Code Verification
  const bottomBaseY = 175;

  // Left: Stylized Signature Stroke + Authorized Signatory
  doc.setFont('times', 'italic');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text('Abhishek Sharma', 66, bottomBaseY - 6, { align: 'center' });

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.4);
  doc.line(34, bottomBaseY - 1, 98, bottomBaseY - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('Authorized Signatory', 66, bottomBaseY + 4.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Director of Career Development, ABHI JOBS', 66, bottomBaseY + 9, {
    align: 'center',
  });

  // Center: Subtle Gold & Navy Institutional Crest
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.circle(centerX, bottomBaseY - 4, 13, 'S');
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.35);
  doc.circle(centerX, bottomBaseY - 4, 10.6, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text('VERIFIED', centerX, bottomBaseY - 5.2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...GOLD);
  doc.text('ABHI JOBS', centerX, bottomBaseY - 1.2, { align: 'center' });

  // Right: Real Scannable QR Code for Verification
  try {
    const qrDataUrl = await generateCertificateQrDataUrl(certificate.certificateId);
    const qrSize = 26;
    const qrX = pageW - 58;
    const qrY = bottomBaseY - 21;
    doc.setDrawColor(229, 234, 240);
    doc.setLineWidth(0.35);
    doc.rect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3);
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...NAVY);
    doc.text('Scan to Verify', qrX + qrSize / 2, qrY + qrSize + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    doc.text(certificate.certificateId, qrX + qrSize / 2, qrY + qrSize + 9.2, {
      align: 'center',
    });
  } catch {
    // Graceful fallback if canvas QR generation unavailable
  }

  const safeFileCourse = certificate.courseSlug || 'course';
  doc.save(`ABHI-JOBS-Certificate-${safeFileCourse}-${certificate.certificateId}.pdf`);
}
