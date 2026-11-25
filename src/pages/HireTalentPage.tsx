import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  EASE_PREMIUM,
  HeroTextReveal,
  AnimatedSectionHeading,
  StaggerGroup,
  StaggerItem,
  AnimatedFormFeedback,
} from '../lib/motion';
import {
  Search,
  UserCheck,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  Building2,
  Cpu,
  Factory,
  Landmark,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
} from 'lucide-react';

interface HireTalentPageProps {
  navigate: (route: string) => void;
}

const SERVICES = [
  {
    icon: Search,
    step: '01',
    title: 'Talent Sourcing',
    description:
      'Targeted headhunting and active database outreach to identify skilled professionals who match your role specifications and domain context.',
  },
  {
    icon: ClipboardCheck,
    step: '02',
    title: 'Candidate Screening',
    description:
      'Structured evaluation of work history, technical competencies, notice period, and compensation alignment before profiles reach your hiring managers.',
  },
  {
    icon: UserCheck,
    step: '03',
    title: 'Candidate Shortlisting',
    description:
      'Delivery of a curated shortlist of vetted, interview-ready candidates along with structured consultant assessment notes.',
  },
];

const INDUSTRIES = [
  { name: 'IT & Technology', icon: Cpu },
  { name: 'Engineering & Manufacturing', icon: Factory },
  { name: 'Finance & Accounting', icon: Landmark },
  { name: 'Sales & Marketing', icon: TrendingUp },
  { name: 'Human Resources', icon: Users },
  { name: 'Operations & Procurement', icon: Package },
];

export const HireTalentPage: React.FC<HireTalentPageProps> = ({ navigate }) => {
  const { submitHiringEnquiry } = useApp();
  const formRef = useRef<HTMLDivElement>(null);

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [vacancies, setVacancies] = useState('1');
  const [jobLocation, setJobLocation] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  const [error, setError] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !companyName.trim() ||
      !contactPerson.trim() ||
      !businessEmail.trim() ||
      !phoneNumber.trim() ||
      !jobTitle.trim() ||
      !jobLocation.trim()
    ) {
      setError('Please complete all required fields before submitting your requirement.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail.trim())) {
      setError('Please enter a valid business email address.');
      return;
    }

    const vacancyCount = Math.max(1, parseInt(vacancies, 10) || 1);

    const created = submitHiringEnquiry({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      businessEmail: businessEmail.trim(),
      phoneNumber: phoneNumber.trim(),
      jobTitle: jobTitle.trim(),
      vacancies: vacancyCount,
      jobLocation: jobLocation.trim(),
      additionalRequirements: additionalRequirements.trim(),
    });

    setSubmittedRef(created.id);
    setCompanyName('');
    setContactPerson('');
    setBusinessEmail('');
    setPhoneNumber('');
    setJobTitle('');
    setVacancies('1');
    setJobLocation('');
    setAdditionalRequirements('');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* HERO SECTION */}
      <section className="bg-[#102B4E] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_PREMIUM }}
            className="max-w-2xl space-y-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F47A24]">
              ABHI JOBS Recruitment Consultancy
            </p>
            <HeroTextReveal
              text="Find the Right People for Your Business."
              as="h1"
              highlightWords={['People']}
              highlightClassName="text-[#F47A24]"
              staggerMs={65}
              delay={0.06}
              distance={18}
              className="font-display text-[30px] sm:text-[36px] lg:text-[40px] font-extrabold tracking-tight leading-[1.15] text-white [text-wrap:balance]"
            />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24, ease: EASE_PREMIUM }}
              className="text-[15px] sm:text-base text-slate-300 leading-relaxed max-w-xl"
            >
              ABHI JOBS helps businesses identify, screen, and connect with qualified talent to meet their hiring requirements.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: 0.32, ease: EASE_PREMIUM }}
              className="pt-1"
            >
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={scrollToForm}
                className="group inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span>Submit Your Hiring Requirement</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-10 sm:py-12 bg-white border-b border-[#E5EAF0]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSectionHeading
            kicker="Our Recruitment Process"
            title="What We Do"
            className="mb-7"
          />

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-5" stagger={0.06}>
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <StaggerItem key={service.title}>
                  <div className="h-full bg-[#FAFBFD] rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 transition-all duration-200 p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-lg bg-[#102B4E] text-white flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-mono tabular-nums text-[#778397]">
                        {service.step}
                      </span>
                    </div>
                    <h3 className="font-display text-[18px] font-bold text-[#102B4E]">
                      {service.title}
                    </h3>
                    <p className="text-sm text-[#566479] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* INDUSTRIES WE RECRUIT FOR */}
      <section className="py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSectionHeading
            kicker="Domain Expertise"
            title="Industries We Recruit For"
            className="mb-7"
          />

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" stagger={0.05}>
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <StaggerItem key={ind.name}>
                  <div className="bg-white rounded-xl border border-[#E5EAF0] hover:border-[#102B4E]/30 transition-colors duration-150 p-4 sm:p-5 flex items-center gap-3.5 shadow-2xs">
                    <div className="w-9 h-9 rounded-lg bg-[#FFF4EC] text-[#F47A24] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-[#102B4E]">{ind.name}</span>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      {/* HIRING ENQUIRY FORM */}
      <section ref={formRef} className="pb-12 pt-2">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-[#E5EAF0] shadow-xs p-5 sm:p-6">
            <div className="mb-6 space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F47A24]">
                <Building2 className="w-4 h-4" />
                <span>Hiring Requirement Intake</span>
              </div>
              <h2 className="font-display text-xl sm:text-[26px] font-bold text-[#102B4E]">
                Submit Your Hiring Requirement
              </h2>
              <p className="text-sm text-[#778397]">
                Share your open position details below. All hiring mandates are managed directly by our dedicated ABHI JOBS recruitment consultants.
              </p>
            </div>

            {submittedRef ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_PREMIUM }}
                className="p-6 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] text-center space-y-3.5"
              >
                <motion.div
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-5 h-5" />
                </motion.div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#102B4E]">
                  Hiring Requirement Received
                </h3>
                <p className="text-sm text-[#778397] max-w-md mx-auto">
                  Thank you for connecting with ABHI JOBS. Your reference ID is{' '}
                  <span className="font-mono font-semibold text-[#102B4E]">{submittedRef}</span>. Our recruitment team will review your mandate and follow up promptly.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSubmittedRef(null)}
                    className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] rounded-lg bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Submit Another Requirement
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="w-full sm:w-auto px-5 py-2.5 min-h-[42px] rounded-lg border border-[#E5EAF0] text-[#253449] hover:bg-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Return Home
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <AnimatedFormFeedback type="error" message={error} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Meridian Industrial Systems"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Position / Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Backend Engineer"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                      Number of Vacancies *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={vacancies}
                      onChange={(e) => setVacancies(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Job Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. Bangalore, Karnataka (Hybrid)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#102B4E] mb-1.5">
                    Additional Requirements
                  </label>
                  <textarea
                    rows={4}
                    value={additionalRequirements}
                    onChange={(e) => setAdditionalRequirements(e.target.value)}
                    placeholder="Share required skills, experience range, budget, target joining timeline, or special notes..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E] resize-y"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Submit Requirement</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HireTalentPage;
