import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Scale,
  Building,
  UserCheck,
  GraduationCap,
  ExternalLink,
  Lock,
  Search,
  CheckCircle2,
  Mail,
  Globe,
  ArrowUp,
} from 'lucide-react';

interface TermsPageProps {
  navigate: (route: string) => void;
}

const SECTIONS = [
  { id: 'section-1', number: 1, title: 'Purpose of ABHI JOBS' },
  { id: 'section-2', number: 2, title: 'No Guarantee of Employment or Placement' },
  { id: 'section-3', number: 3, title: 'Role of ABHI JOBS' },
  { id: 'section-4', number: 4, title: 'Job Seeker Responsibilities' },
  { id: 'section-5', number: 5, title: 'Employer and Recruiter Responsibilities' },
  { id: 'section-6', number: 6, title: 'Upskilling and Training Services' },
  { id: 'section-7', number: 7, title: 'User Content and Information' },
  { id: 'section-8', number: 8, title: 'Privacy and Personal Information' },
  { id: 'section-9', number: 9, title: 'Third-Party Employers and Websites' },
  { id: 'section-10', number: 10, title: 'Prohibited Activities' },
  { id: 'section-11', number: 11, title: 'Account Security' },
  { id: 'section-12', number: 12, title: 'Job Listing and User Information Accuracy' },
  { id: 'section-13', number: 13, title: 'Fees and Paid Services' },
  { id: 'section-14', number: 14, title: 'Intellectual Property' },
  { id: 'section-15', number: 15, title: 'Platform Availability' },
  { id: 'section-16', number: 16, title: 'Disclaimer' },
  { id: 'section-17', number: 17, title: 'Limitation of Liability' },
  { id: 'section-18', number: 18, title: 'Suspension or Termination' },
  { id: 'section-19', number: 19, title: 'Reporting Abuse or Fraud' },
  { id: 'section-20', number: 20, title: 'Changes to These Terms' },
  { id: 'section-21', number: 21, title: 'Governing Law' },
  { id: 'section-22', number: 22, title: 'Contact ABHI JOBS' },
];

export const TermsPage: React.FC<TermsPageProps> = ({ navigate }) => {
  const [activeSection, setActiveSection] = useState<string>('section-1');
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update SEO Title and Description
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Terms & Conditions | ABHI JOBS';

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        "Read ABHI JOBS's Terms & Conditions governing the use of our career platform, job opportunities, employer services, and upskilling programs."
      );
    }

    return () => {
      document.title = previousTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, []);

  // Scroll spy to highlight current section in Table of Contents
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const sectionEl = document.getElementById(SECTIONS[i].id);
        if (sectionEl) {
          const top = sectionEl.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(SECTIONS[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileTocOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const filteredSections = searchQuery.trim()
    ? SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.number.toString().includes(searchQuery)
      )
    : SECTIONS;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header / Hero */}
      <header className="bg-[#061226] text-white border-b border-slate-800 pt-10 pb-12 sm:pt-14 sm:pb-16 relative overflow-hidden">
        {/* Subtle geometric background motif */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back to Home Navigation */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-2 rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs group"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-3">
              <Scale className="w-3.5 h-3.5 text-[#FF2B1A]" />
              <span>Legal Agreement &amp; Platform Policies</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
              Terms &amp; Conditions
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal mb-4">
              Please read these terms carefully before using ABHI JOBS.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 font-medium">
                <Calendar className="w-4 h-4 text-[#FF2B1A]" />
                <strong>Last Updated:</strong> September 5, 2026
              </span>
              <span className="hidden sm:inline">&bull;</span>
              <span>ABHI JOBS Career &amp; Talent Platform</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        {/* Mobile Sticky / Collapsible Table of Contents */}
        <div className="lg:hidden mb-6 sticky top-16 z-30">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <button
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="w-full px-4 py-3.5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-slate-800 bg-slate-50/80 hover:bg-slate-100 transition-colors"
              aria-expanded={mobileTocOpen}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#004D40]" />
                <span>Table of Contents ({SECTIONS.length} Sections)</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#004D40] font-semibold">
                <span>{mobileTocOpen ? 'Hide' : 'View'}</span>
                {mobileTocOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {mobileTocOpen && (
              <div className="p-3 max-h-72 overflow-y-auto border-t border-slate-100 bg-white divide-y divide-slate-100">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left py-2 px-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                      activeSection === sec.id
                        ? 'bg-teal-50 text-[#004D40] font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">
                      <span className="font-semibold text-slate-400 mr-1.5">{sec.number}.</span>
                      {sec.title}
                    </span>
                    {activeSection === sec.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF2B1A] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop 2-Column Grid: TOC Sidebar + Legal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Sticky Desktop Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-20">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <FileText className="w-4 h-4 text-[#004D40]" />
                  <span>Table of Contents</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-[#004D40] border border-teal-200">
                  22 Sections
                </span>
              </div>

              {/* Quick TOC Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter sections..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:outline-hidden focus:border-[#061226] focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <nav className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 text-xs" aria-label="Table of contents">
                {filteredSections.map((sec) => {
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left py-2 px-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'bg-[#061226] text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate pr-2">
                        <span className={`mr-1.5 font-bold ${isActive ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-700'}`}>
                          {sec.number}.
                        </span>
                        {sec.title}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#FF2B1A] shrink-0 shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#004D40] font-semibold cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Back to top</span>
                </button>
                <button
                  onClick={() => navigate('/privacy')}
                  className="text-[#004D40] hover:underline font-semibold"
                >
                  Privacy Policy &rarr;
                </button>
              </div>
            </div>
          </aside>

          {/* Right Column: Centered High-Legibility Legal Document */}
          <main className="lg:col-span-8 xl:col-span-9 max-w-4xl space-y-10">
            {/* Introductory Statement Card */}
            <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-[#004D40]">
                <Shield className="w-5 h-5 text-[#004D40] shrink-0" />
                <h2 className="text-lg font-bold text-slate-900">ABHI JOBS &mdash; Terms &amp; Conditions</h2>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-slate-700">
                Welcome to <strong className="text-slate-900">ABHI JOBS</strong> (&ldquo;ABHI JOBS&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). ABHI JOBS is a career and talent platform that helps connect <strong className="text-slate-900">job seekers, candidates, employers, recruiters, and organizations</strong> and may provide career-development, upskilling, training, and other employment-related services.
              </p>

              <p className="text-sm sm:text-base leading-relaxed text-slate-700">
                By accessing, registering on, browsing, or using the ABHI JOBS website, platform, applications, services, or related products (collectively, the &ldquo;Platform&rdquo;), you agree to be bound by these Terms &amp; Conditions (&ldquo;Terms&rdquo;).
              </p>

              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-xs sm:text-sm font-semibold flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  If you do not agree with these Terms, please do not use the Platform.
                </p>
              </div>
            </article>

            {/* Section 1: PURPOSE OF ABHI JOBS */}
            <section
              id="section-1"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  1
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  1. PURPOSE OF ABHI JOBS
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS is intended to provide a platform for:
              </p>

              <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Connecting genuine job seekers with employers and recruiters.</li>
                <li>Providing access to employment opportunities and career-related information.</li>
                <li>Allowing employers and recruiters to publish or communicate genuine employment opportunities.</li>
                <li>Helping candidates discover career-development and upskilling opportunities.</li>
                <li>Providing training, learning resources, workshops, career guidance, and related services where offered.</li>
                <li>Facilitating communication between candidates and employers.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
                ABHI JOBS acts primarily as a <strong className="text-slate-950">facilitator and technology platform</strong>. ABHI JOBS does not itself become the employer of candidates merely because a candidate applies for or obtains an opportunity through the Platform.
              </div>
            </section>

            {/* Section 2: NO GUARANTEE OF EMPLOYMENT OR PLACEMENT */}
            <section
              id="section-2"
              className="bg-white rounded-2xl border-2 border-[#004D40]/30 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#E4E7EC]">
                <span className="w-8 h-8 rounded-xl bg-[#061226] text-white font-extrabold flex items-center justify-center text-sm">
                  2
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  2. NO GUARANTEE OF EMPLOYMENT OR PLACEMENT
                </h2>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-[#004D40] text-xs sm:text-sm font-bold tracking-wide uppercase leading-relaxed">
                ABHI JOBS DOES NOT GUARANTEE, PROMISE, OR WARRANT EMPLOYMENT, INTERVIEWS, SELECTION, SALARY, PROMOTION, OR PLACEMENT TO ANY USER.
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Participation in any ABHI JOBS course, training program, upskilling program, career service, application process, interview process, or other service does not guarantee that a candidate will:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Receive an interview;</li>
                <li>Receive an offer;</li>
                <li>Be selected by an employer;</li>
                <li>Obtain a particular salary or compensation;</li>
                <li>Obtain employment within a particular period; or</li>
                <li>Obtain employment at all.</li>
              </ul>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Any statements regarding career opportunities, potential outcomes, salary ranges, or employment prospects are provided for general informational purposes and should not be interpreted as a guarantee of employment.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium">
                Final hiring decisions are made solely by the relevant employer or recruiter.
              </div>
            </section>

            {/* Section 3: ROLE OF ABHI JOBS */}
            <section
              id="section-3"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  3
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  3. ROLE OF ABHI JOBS
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS may facilitate communication and information exchange between job seekers and employers.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                However:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>ABHI JOBS does not control the hiring decisions of employers.</li>
                <li>ABHI JOBS does not guarantee that job listings will remain available.</li>
                <li>ABHI JOBS does not guarantee that every employer or job seeker is genuine, suitable, qualified, or verified unless ABHI JOBS expressly states otherwise.</li>
                <li>ABHI JOBS does not guarantee the accuracy, completeness, or current status of information submitted by users.</li>
                <li>Employers are responsible for their recruitment decisions.</li>
                <li>Candidates are responsible for evaluating employment opportunities before accepting them.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
                Users should conduct their own appropriate due diligence before entering into any employment, financial, contractual, or other relationship with another user.
              </div>
            </section>

            {/* Section 4: JOB SEEKER RESPONSIBILITIES */}
            <section
              id="section-4"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  4
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  4. JOB SEEKER RESPONSIBILITIES
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                If you use ABHI JOBS as a job seeker or candidate, you agree that:
              </p>

              <ol className="space-y-3 text-sm sm:text-base text-slate-700 list-decimal list-outside pl-5 leading-relaxed">
                <li>All information provided by you must be truthful, accurate, complete, and current.</li>
                <li>Your resume, qualifications, work experience, educational information, certifications, skills, and other profile information must not be misleading or fraudulent.</li>
                <li>You will update your information when material changes occur.</li>
                <li>You will not impersonate another individual.</li>
                <li>You will not submit false documents, qualifications, certificates, experience letters, or other information.</li>
                <li>You will not apply for opportunities using another person&apos;s account or identity.</li>
                <li>You will independently evaluate an employer and employment opportunity before accepting an offer.</li>
                <li>You will not use ABHI JOBS to harass, threaten, deceive, or unlawfully contact another person.</li>
                <li>You will not use ABHI JOBS to distribute spam or unsolicited commercial communications.</li>
              </ol>
            </section>

            {/* Section 5: EMPLOYER AND RECRUITER RESPONSIBILITIES */}
            <section
              id="section-5"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  5
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  5. EMPLOYER AND RECRUITER RESPONSIBILITIES
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                Employers and recruiters using ABHI JOBS agree that:
              </p>

              <ol className="space-y-3 text-sm sm:text-base text-slate-700 list-decimal list-outside pl-5 leading-relaxed">
                <li>Job vacancies posted on the Platform must be genuine and reasonably accurate.</li>
                <li>Job descriptions, qualifications, locations, compensation information, employment conditions, and other material information should not intentionally mislead candidates.</li>
                <li>Employers must comply with applicable employment and recruitment laws.</li>
                <li>Employers must not impersonate another company or organization.</li>
                <li>Employers must not collect candidate information for unlawful purposes.</li>
                <li>Employers must not use candidate information for purposes unrelated to legitimate recruitment without appropriate authorization.</li>
                <li>Employers must not discriminate unlawfully against candidates.</li>
                <li>Employers must not request unlawful payments, fees, passwords, financial credentials, or sensitive information from candidates.</li>
                <li>Employers are responsible for conducting their own screening, verification, interviews, background checks, and hiring decisions.</li>
              </ol>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-900 text-xs sm:text-sm leading-relaxed">
                ABHI JOBS may remove, suspend, or restrict a job listing, employer account, recruiter account, or other Platform access where we reasonably believe that the applicable Terms have been violated.
              </div>
            </section>

            {/* Section 6: UPSKILLING AND TRAINING SERVICES */}
            <section
              id="section-6"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  6
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  6. UPSKILLING AND TRAINING SERVICES
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS may provide or facilitate access to courses, training, workshops, learning materials, career guidance, assessments, mentorship, or other upskilling services.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                These services are intended to help users <strong className="text-slate-900">develop skills and improve their career readiness</strong>.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold">
                Completion of any ABHI JOBS training, course, assessment, workshop, or program does not guarantee employment or placement.
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Where applicable, certificates or completion credentials indicate participation or completion of the relevant program and should not automatically be interpreted as professional licensing, accreditation, employment certification, or a guarantee of employment.
              </p>
            </section>

            {/* Section 7: USER CONTENT AND INFORMATION */}
            <section
              id="section-7"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  7
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  7. USER CONTENT AND INFORMATION
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Users may submit resumes, profiles, job applications, job descriptions, photographs, documents, messages, educational information, professional information, and other content (&ldquo;User Content&rdquo;).
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                You retain responsibility for the User Content you submit.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                By submitting User Content to ABHI JOBS, you represent that:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>You have the right to provide the information.</li>
                <li>The information is not knowingly false or misleading.</li>
                <li>The information does not unlawfully infringe another person&apos;s rights.</li>
                <li>The information does not contain malicious software or harmful code.</li>
                <li>Your submission does not violate applicable law.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
                You grant ABHI JOBS permission to use, store, process, display, and communicate your User Content as reasonably necessary to operate and provide the Platform and the services you request, subject to our applicable Privacy Policy.
              </div>
            </section>

            {/* Section 8: PRIVACY AND PERSONAL INFORMATION */}
            <section
              id="section-8"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  8
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  8. PRIVACY AND PERSONAL INFORMATION
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS may collect and process information necessary to operate the Platform, create user profiles, facilitate recruitment, provide training services, communicate with users, improve services, maintain security, and comply with applicable law.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                Examples may include information relating to:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Name and contact information;</li>
                <li>Resume and employment history;</li>
                <li>Education and qualifications;</li>
                <li>Skills and career interests;</li>
                <li>Job applications;</li>
                <li>Employer information;</li>
                <li>Training and learning activity; and</li>
                <li>Communications submitted through the Platform.</li>
              </ul>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS&apos;s collection and use of personal information is governed by its <strong className="text-slate-900">Privacy Policy</strong>, which forms part of these Terms.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                Users should not provide unnecessary sensitive or confidential information through the Platform.
              </div>
            </section>

            {/* Section 9: THIRD-PARTY EMPLOYERS AND WEBSITES */}
            <section
              id="section-9"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  9
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  9. THIRD-PARTY EMPLOYERS AND WEBSITES
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The Platform may contain links, job opportunities, advertisements, services, or information provided by third parties.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                Third-party websites and services are not controlled by ABHI JOBS.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                If you choose to access a third-party website or communicate with a third-party employer, recruiter, training provider, or organization, you do so at your own discretion and risk.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                ABHI JOBS does not necessarily endorse or guarantee the products, services, employment opportunities, representations, policies, or practices of third parties.
              </div>
            </section>

            {/* Section 10: PROHIBITED ACTIVITIES */}
            <section
              id="section-10"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  10
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  10. PROHIBITED ACTIVITIES
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                You must not use ABHI JOBS to:
              </p>

              <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Violate any applicable law or regulation.</li>
                <li>Create a false identity or impersonate another person or organization.</li>
                <li>Post fraudulent, misleading, or fake job vacancies.</li>
                <li>Submit fraudulent resumes, certificates, qualifications, or employment information.</li>
                <li>Harass, threaten, stalk, or abuse another user.</li>
                <li>Distribute spam or unsolicited bulk communications.</li>
                <li>Upload viruses, malware, malicious code, or harmful files.</li>
                <li>Attempt unauthorized access to accounts, systems, databases, or Platform infrastructure.</li>
                <li>Circumvent security or authentication mechanisms.</li>
                <li>Scrape, crawl, harvest, copy, reproduce, or systematically collect Platform data without prior written permission from ABHI JOBS.</li>
                <li>Use automated tools, bots, spiders, scripts, or similar technologies to access or extract Platform content without authorization.</li>
                <li>Copy, reproduce, modify, distribute, sell, license, or commercially exploit ABHI JOBS&apos;s content, technology, design, trademarks, or services without authorization.</li>
                <li>Reverse engineer, decompile, disassemble, or attempt to discover the source code of the Platform.</li>
                <li>Interfere with the operation, security, or availability of the Platform.</li>
                <li>Use candidate or employer information for unauthorized commercial purposes.</li>
                <li>Attempt to bypass any restrictions placed on your account or access.</li>
                <li>Engage in activities that may harm ABHI JOBS, its users, employers, candidates, or third parties.</li>
              </ul>
            </section>

            {/* Section 11: ACCOUNT SECURITY */}
            <section
              id="section-11"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  11
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  11. ACCOUNT SECURITY
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Where account registration is required, you are responsible for maintaining the confidentiality of your login credentials.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                You must immediately notify ABHI JOBS if you believe that:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Your account has been accessed without authorization;</li>
                <li>Your password has been compromised; or</li>
                <li>Someone is using your account without your permission.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                You are responsible for activity carried out through your account to the extent permitted by applicable law.
              </div>
            </section>

            {/* Section 12: JOB LISTING AND USER INFORMATION ACCURACY */}
            <section
              id="section-12"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  12
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  12. JOB LISTING AND USER INFORMATION ACCURACY
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS attempts to provide a useful platform for employment and career development. However, information may be submitted by users and third parties.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                Accordingly, ABHI JOBS does not warrant that:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Every job vacancy is genuine;</li>
                <li>Every employer is verified;</li>
                <li>Every candidate is qualified;</li>
                <li>Job information is always accurate or current;</li>
                <li>A vacancy will remain open;</li>
                <li>A candidate will receive a response;</li>
                <li>A candidate will be shortlisted;</li>
                <li>An employer will hire a candidate; or</li>
                <li>Information provided by another user is complete or accurate.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                Users should conduct appropriate verification and due diligence before relying upon information obtained through the Platform.
              </div>
            </section>

            {/* Section 13: FEES AND PAID SERVICES */}
            <section
              id="section-13"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  13
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  13. FEES AND PAID SERVICES
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Certain ABHI JOBS services may be offered free of charge, while other services may require payment.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Where a paid service is offered, the applicable price, payment terms, duration, cancellation terms, refund policy, and other conditions may be presented separately before purchase.
              </p>

              <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-[#004D40] text-xs sm:text-sm font-semibold">
                Unless expressly stated otherwise, payment for a ABHI JOBS service does not constitute payment for guaranteed employment or placement.
              </div>
            </section>

            {/* Section 14: INTELLECTUAL PROPERTY */}
            <section
              id="section-14"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  14
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  14. INTELLECTUAL PROPERTY
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The ABHI JOBS name, logo, branding, website design, software, graphics, text, interface, databases, features, and other original materials provided by ABHI JOBS are owned by or licensed to ABHI JOBS and may be protected by applicable intellectual-property laws.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                You may use the Platform only for its intended purpose.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                You may not reproduce, copy, modify, distribute, publish, sell, license, create derivative works from, or commercially exploit ABHI JOBS&apos;s intellectual property without prior written authorization.
              </div>
            </section>

            {/* Section 15: PLATFORM AVAILABILITY */}
            <section
              id="section-15"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  15
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  15. PLATFORM AVAILABILITY
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS will make reasonable efforts to keep the Platform available and functional.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                However, we do not guarantee uninterrupted, secure, error-free, or continuous availability.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                The Platform may occasionally be unavailable because of:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>Maintenance;</li>
                <li>Updates;</li>
                <li>Technical issues;</li>
                <li>Security incidents;</li>
                <li>Network problems;</li>
                <li>Third-party service interruptions;</li>
                <li>Force majeure events; or</li>
                <li>Other circumstances beyond ABHI JOBS&apos;s reasonable control.</li>
              </ul>
            </section>

            {/* Section 16: DISCLAIMER */}
            <section
              id="section-16"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  16
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  16. DISCLAIMER
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                To the maximum extent permitted by applicable law, ABHI JOBS provides the Platform and its services on an <strong className="text-slate-900">&ldquo;as available&rdquo; and &ldquo;as is&rdquo; basis</strong>.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS does not guarantee that the Platform or information available through it will always be accurate, complete, reliable, uninterrupted, secure, or suitable for a particular purpose.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold">
                ABHI JOBS does not guarantee employment, recruitment outcomes, salary, interviews, selection, promotions, or career advancement.
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Users are responsible for making their own decisions based on information obtained through the Platform.
              </p>
            </section>

            {/* Section 17: LIMITATION OF LIABILITY */}
            <section
              id="section-17"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  17
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  17. LIMITATION OF LIABILITY
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                To the maximum extent permitted by applicable law, ABHI JOBS and its directors, officers, employees, affiliates, partners, contractors, and service providers shall not be responsible for losses arising from:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>A user&apos;s interaction with another user;</li>
                <li>An employer&apos;s hiring or recruitment decision;</li>
                <li>A candidate&apos;s decision to accept or reject employment;</li>
                <li>Fraudulent or misleading information submitted by another user;</li>
                <li>The actions or omissions of employers, recruiters, candidates, or other third parties;</li>
                <li>Third-party websites or services;</li>
                <li>Temporary Platform interruptions;</li>
                <li>Unauthorized access caused by circumstances beyond ABHI JOBS&apos;s reasonable control; or</li>
                <li>Reliance upon information supplied by another user.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed">
                Nothing in these Terms is intended to exclude or limit liability that cannot lawfully be excluded or limited under applicable law.
              </div>
            </section>

            {/* Section 18: SUSPENSION OR TERMINATION */}
            <section
              id="section-18"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  18
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  18. SUSPENSION OR TERMINATION
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS may suspend, restrict, or terminate your account or access to the Platform if:
              </p>

              <ul className="space-y-2 text-sm sm:text-base text-slate-700 list-disc list-outside pl-5 leading-relaxed">
                <li>You violate these Terms;</li>
                <li>You provide false or misleading information;</li>
                <li>You engage in fraudulent or abusive conduct;</li>
                <li>Your activity creates a security or legal risk;</li>
                <li>Your account is used for prohibited activities; or</li>
                <li>ABHI JOBS is required to do so by applicable law or a competent authority.</li>
              </ul>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
                ABHI JOBS may also remove content, job listings, profiles, or other information that it reasonably believes violates these Terms or applicable law.
              </div>
            </section>

            {/* Section 19: REPORTING ABUSE OR FRAUD */}
            <section
              id="section-19"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  19
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  19. REPORTING ABUSE OR FRAUD
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                If you believe that a job listing, employer, candidate, account, message, or other content on ABHI JOBS is fraudulent, abusive, misleading, or violates these Terms, you should report it to ABHI JOBS through the available reporting mechanism or contact channel.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS may investigate reports and take appropriate action at its discretion and as required by applicable law.
              </p>
            </section>

            {/* Section 20: CHANGES TO THESE TERMS */}
            <section
              id="section-20"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  20
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  20. CHANGES TO THESE TERMS
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                ABHI JOBS may update or modify these Terms from time to time.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Updated Terms may be published on the Platform with a revised &ldquo;Last Updated&rdquo; date.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Your continued use of the Platform after the updated Terms become effective constitutes acceptance of the revised Terms, to the extent permitted by applicable law.
              </p>
            </section>

            {/* Section 21: GOVERNING LAW */}
            <section
              id="section-21"
              className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4 scroll-mt-24"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  21
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  21. GOVERNING LAW
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                These Terms shall be governed by and interpreted in accordance with the applicable laws of India.
              </p>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Any dispute arising in connection with these Terms or the use of the Platform shall be subject to the jurisdiction of the courts having appropriate jurisdiction, subject to applicable law.
              </p>
            </section>

            {/* Section 22: CONTACT ABHI JOBS */}
            <section
              id="section-22"
              className="bg-[#061226] text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-6 scroll-mt-24 border border-slate-800"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <span className="w-8 h-8 rounded-xl bg-teal-500 text-[#004D40] font-extrabold flex items-center justify-center text-sm">
                  22
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  22. CONTACT ABHI JOBS
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                If you have questions regarding these Terms, the ABHI JOBS Platform, or our services, you may contact us through the contact information provided on the ABHI JOBS website.
              </p>

              <div className="p-5 rounded-xl bg-white/5 border border-white/20 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-white">ABHI JOBS</h3>
                  <p className="text-xs text-slate-300 font-medium">Discover. Apply. Grow.</p>
                </div>

                <div className="pt-2 space-y-2 text-xs sm:text-sm text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-red-400 shrink-0" />
                    <span><strong>Email:</strong> <a href="mailto:support@abhijobs.in" className="text-red-300 hover:underline">support@abhijobs.in</a></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-red-400 shrink-0" />
                    <span><strong>Website:</strong> <button onClick={() => navigate('/')} className="text-red-300 hover:underline cursor-pointer">https://abhijobs.example.com</button></span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/contact')}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#004D40] text-xs font-bold hover:bg-teal-50 transition-colors cursor-pointer shadow-sm"
                >
                  Contact Support Desk
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};
