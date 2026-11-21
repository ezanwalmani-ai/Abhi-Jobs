import {
  ResumeTemplateId,
  ResumeFontFamily,
  ResumeSectionKey,
  DEFAULT_SECTION_ORDER,
} from '../../../types/resume';

export type TemplateCategory =
  | 'All'
  | 'Professional'
  | 'Modern'
  | 'Minimal'
  | 'Executive'
  | 'Creative'
  | 'Technology'
  | 'Graduate'
  | 'Academic';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'All',
  'Professional',
  'Modern',
  'Minimal',
  'Executive',
  'Creative',
  'Technology',
  'Graduate',
  'Academic',
];

export type TemplateLayoutType =
  | 'single-column'
  | 'two-column-left'
  | 'two-column-right'
  | 'banner-single'
  | 'split-header';

export interface ResumeTemplateSpec {
  id: ResumeTemplateId;
  name: string;
  categories: Exclude<TemplateCategory, 'All'>[];
  layoutLabel: string;
  layoutType: TemplateLayoutType;
  description: string;
  atsGuidance: string;
  atsTier: 'high' | 'moderate' | 'visual';
  defaultAccent: string;
  defaultFont: ResumeFontFamily;
  recommendedSectionOrder?: ResumeSectionKey[];
}

export const RESUME_TEMPLATES: ResumeTemplateSpec[] = [
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    categories: ['Professional'],
    layoutLabel: 'Single-Column Corporate',
    layoutType: 'single-column',
    description:
      'Timeless single-column corporate layout with crisp section rules and balanced visual hierarchy.',
    atsGuidance:
      'Single-column structure with standard headings — well suited for automated screening systems.',
    atsTier: 'high',
    defaultAccent: '#102B4E',
    defaultFont: 'inter',
  },
  {
    id: 'modern-corporate',
    name: 'Modern Corporate',
    categories: ['Modern', 'Professional'],
    layoutLabel: 'Navy Header Banner',
    layoutType: 'banner-single',
    description:
      'Structured navy top masthead paired with clean single-column body flow and orange section markers.',
    atsGuidance:
      'Linear reading order beneath a clean header — easy for both recruiters and parsing tools to scan.',
    atsTier: 'high',
    defaultAccent: '#102B4E',
    defaultFont: 'manrope',
  },
  {
    id: 'minimal-elegant',
    name: 'Minimal Elegant',
    categories: ['Minimal', 'Professional'],
    layoutLabel: 'Editorial Single-Column',
    layoutType: 'single-column',
    description:
      'Generous whitespace, centered refined masthead, thin hairline dividers, and understated typography.',
    atsGuidance:
      'Clean single-column flow without visual clutter — straightforward for text extraction.',
    atsTier: 'high',
    defaultAccent: '#334155',
    defaultFont: 'georgia',
  },
  {
    id: 'executive',
    name: 'Executive',
    categories: ['Executive', 'Professional'],
    layoutLabel: 'Leadership Masthead',
    layoutType: 'split-header',
    description:
      'Authoritative leadership header with double-rule framing, prominent executive summary, and board-ready structure.',
    atsGuidance:
      'Structured single-column body with distinct headings — clear for senior recruiter and executive reviews.',
    atsTier: 'high',
    defaultAccent: '#081D36',
    defaultFont: 'merriweather',
  },
  {
    id: 'technology',
    name: 'Technology',
    categories: ['Technology', 'Modern'],
    layoutLabel: 'Technical Stack Matrix',
    layoutType: 'single-column',
    description:
      'Precision monospace-accented headings, categorized skills matrix, and prominent project & engineering showcase.',
    atsGuidance:
      'Single-column layout with clear skill groupings — strong readability for technical hiring teams.',
    atsTier: 'high',
    defaultAccent: '#0F766E',
    defaultFont: 'inter',
    recommendedSectionOrder: [
      'summary',
      'skills',
      'experiences',
      'projects',
      'education',
      'certifications',
      'achievements',
      'languages',
      'awards',
      'training',
      'volunteer',
      'publications',
      'memberships',
      'customSections',
    ],
  },
  {
    id: 'creative',
    name: 'Creative',
    categories: ['Creative', 'Modern'],
    layoutLabel: 'Accent Stripe & Split',
    layoutType: 'split-header',
    description:
      'Expressive vertical accent bar, asymmetrical header block, and modern visual rhythm for design and brand roles.',
    atsGuidance:
      'Visually expressive layout best for portfolio applications, direct emails, and creative studios.',
    atsTier: 'visual',
    defaultAccent: '#F47A24',
    defaultFont: 'manrope',
  },
  {
    id: 'modern-two-column',
    name: 'Modern Two-Column',
    categories: ['Modern', 'Professional'],
    layoutLabel: 'Left Sidebar Two-Column',
    layoutType: 'two-column-left',
    description:
      'Dedicated left sidebar for contact info, categorized skills, certifications, and languages beside an expansive career column.',
    atsGuidance:
      'Two-column structure optimized for human scanning; consider a single-column template for strict legacy portals.',
    atsTier: 'moderate',
    defaultAccent: '#102B4E',
    defaultFont: 'inter',
  },
  {
    id: 'finance-accounting',
    name: 'Finance & Accounting',
    categories: ['Professional', 'Executive'],
    layoutLabel: 'Traditional Serif Ledger',
    layoutType: 'single-column',
    description:
      'Crisp traditional serif typography with high-density alignment tailored for banking, audit, and corporate finance.',
    atsGuidance:
      'Conservative single-column formatting with clear chronological headings for institutional screening.',
    atsTier: 'high',
    defaultAccent: '#1E293B',
    defaultFont: 'georgia',
  },
  {
    id: 'graduate-fresher',
    name: 'Graduate / Fresher',
    categories: ['Graduate', 'Minimal'],
    layoutLabel: 'Education & Projects First',
    layoutType: 'single-column',
    description:
      'Highlights academic credentials, projects, internships, and core skills upfront for early-career candidates.',
    atsGuidance:
      'Clean single-column flow putting education and skills front and center for campus and entry-level recruiters.',
    atsTier: 'high',
    defaultAccent: '#102B4E',
    defaultFont: 'manrope',
    recommendedSectionOrder: [
      'summary',
      'education',
      'skills',
      'projects',
      'experiences',
      'certifications',
      'training',
      'achievements',
      'awards',
      'volunteer',
      'languages',
      'publications',
      'memberships',
      'customSections',
    ],
  },
  {
    id: 'sales-marketing',
    name: 'Sales & Marketing',
    categories: ['Creative', 'Modern'],
    layoutLabel: 'Impact Highlight Header',
    layoutType: 'banner-single',
    description:
      'Energetic split accent banner with dedicated achievement callouts designed to spotlight revenue and growth wins.',
    atsGuidance:
      'Clear single-column body with structured impact highlights — balances visual punch with easy parsing.',
    atsTier: 'moderate',
    defaultAccent: '#F47A24',
    defaultFont: 'manrope',
    recommendedSectionOrder: [
      'summary',
      'achievements',
      'experiences',
      'skills',
      'education',
      'certifications',
      'awards',
      'projects',
      'languages',
      'training',
      'volunteer',
      'publications',
      'memberships',
      'customSections',
    ],
  },
  {
    id: 'academic-cv',
    name: 'Academic CV',
    categories: ['Academic', 'Minimal'],
    layoutLabel: 'Scholarly Curriculum Vitae',
    layoutType: 'single-column',
    description:
      'Formal academic layout emphasizing degrees, publications, research projects, honors, and professional memberships.',
    atsGuidance:
      'Traditional single-column academic standard tailored for universities, fellowships, and research institutes.',
    atsTier: 'high',
    defaultAccent: '#081D36',
    defaultFont: 'merriweather',
    recommendedSectionOrder: [
      'education',
      'summary',
      'publications',
      'projects',
      'experiences',
      'awards',
      'memberships',
      'certifications',
      'skills',
      'languages',
      'volunteer',
      'training',
      'achievements',
      'customSections',
    ],
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    categories: ['Modern', 'Minimal'],
    layoutLabel: 'Right Sidebar Studio',
    layoutType: 'two-column-right',
    description:
      'Clean top header strip paired with a spacious main experience column and a subtle right sidebar for skills and credentials.',
    atsGuidance:
      'Balanced two-column editorial design best for direct recruiter sharing and PDF portfolio reviews.',
    atsTier: 'moderate',
    defaultAccent: '#102B4E',
    defaultFont: 'inter',
  },
];

export const ACCENT_COLOR_PRESETS = [
  { name: 'ABHI Navy', hex: '#102B4E' },
  { name: 'Deep Navy', hex: '#081D36' },
  { name: 'ABHI Orange', hex: '#F47A24' },
  { name: 'Executive Slate', hex: '#334155' },
  { name: 'Tech Teal', hex: '#0F766E' },
  { name: 'Royal Indigo', hex: '#3730A3' },
  { name: 'Classic Burgundy', hex: '#7F1D1D' },
];

export function getTemplateSpec(id: ResumeTemplateId): ResumeTemplateSpec {
  return RESUME_TEMPLATES.find((t) => t.id === id) || RESUME_TEMPLATES[0];
}

export function getTemplateSectionOrder(id: ResumeTemplateId): ResumeSectionKey[] {
  const spec = getTemplateSpec(id);
  return spec.recommendedSectionOrder ? [...spec.recommendedSectionOrder] : [...DEFAULT_SECTION_ORDER];
}
