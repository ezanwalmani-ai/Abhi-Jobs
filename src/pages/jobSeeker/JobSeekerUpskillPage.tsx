import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { EASE_PREMIUM } from '../../lib/motion';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Search,
  CheckCircle2,
  X,
  ArrowRight,
  Building2,
  Layers,
  Monitor,
  AlertCircle,
} from 'lucide-react';

interface JobSeekerUpskillPageProps {
  navigate: (route: string) => void;
}

export const JobSeekerUpskillPage: React.FC<JobSeekerUpskillPageProps> = ({ navigate }) => {
  const { currentUser, currentCandidate, courses, submitCourseEnquiry, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);

  // Enquiry form fields
  const [enqName, setEnqName] = useState(currentCandidate?.name || currentUser?.name || '');
  const [enqEmail, setEnqEmail] = useState(currentCandidate?.email || currentUser?.email || '');
  const [enqPhone, setEnqPhone] = useState(currentCandidate?.phone || '');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqError, setEnqError] = useState('');
  const [enqSubmitted, setEnqSubmitted] = useState(false);

  // Only published courses managed by the internal admin team
  const publishedCourses = useMemo(() => {
    return courses.filter((c) => c.status === 'published');
  }, [courses]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(publishedCourses.map((c) => c.category)));
    return ['All', ...cats];
  }, [publishedCourses]);

  const filteredCourses = useMemo(() => {
    return publishedCourses.filter((course) => {
      const matchesCat = selectedCategory === 'All' || course.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.category.toLowerCase().includes(q) ||
        (course.provider || '').toLowerCase().includes(q) ||
        course.skillsCovered.some((s) => s.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [publishedCourses, selectedCategory, searchQuery]);

  const openCourseModal = (course: Course) => {
    setSelectedCourse(course);
    setShowEnquiryForm(false);
    setEnqSubmitted(false);
    setEnqError('');
    setEnqName(currentCandidate?.name || currentUser?.name || '');
    setEnqEmail(currentCandidate?.email || currentUser?.email || '');
    setEnqPhone(currentCandidate?.phone || '');
    setEnqMessage('');
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setEnqError('');

    if (!enqName.trim() || !enqEmail.trim() || !enqPhone.trim()) {
      setEnqError('Please fill in your name, email address, and phone number.');
      return;
    }

    submitCourseEnquiry({
      courseId: selectedCourse.id,
      courseTitle: selectedCourse.title,
      name: enqName.trim(),
      email: enqEmail.trim(),
      phone: enqPhone.trim(),
      message: enqMessage.trim(),
    });

    // Also save enrollment record locally if logged in
    if (currentUser?.id) {
      try {
        const key = `abhijobs_enrollments_${currentUser.id}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.some((item: any) => item.courseId === selectedCourse.id)) {
          existing.unshift({
            courseId: selectedCourse.id,
            userId: currentUser.id,
            status: 'Started',
            progressPercentage: 0,
            lastActivity: 'Just now',
            enrolledAt: new Date().toISOString().split('T')[0],
          });
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch {}
    }

    setEnqSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* Header Banner */}
      <section className="bg-[#102B4E] text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F47A24]">
              Learn with ABHI
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Professional Courses &amp; Career Development
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Explore curated training programs offered by vetted partner institutes to strengthen job-ready skills and accelerate career growth.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Category Filter Bar */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl border border-[#E5EAF0] shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#778397] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, providers, or skills..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E5EAF0] text-sm text-[#253449] focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20 focus:border-[#102B4E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#102B4E] text-white'
                    : 'bg-[#F6F8FB] text-[#778397] hover:text-[#102B4E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Course Catalogue Grid */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-10">
        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-[#102B4E]/40 mx-auto" />
            <h3 className="font-display text-lg font-bold text-[#102B4E]">
              No matching courses found
            </h3>
            <p className="text-sm text-[#778397] max-w-md mx-auto">
              Try adjusting your search keywords or selecting a different category.
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-lg bg-[#102B4E] text-white text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <article
                key={course.id}
                className="bg-white rounded-2xl border border-[#E5EAF0] hover:border-[#102B4E]/30 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between"
              >
                {/* Clean Geometric Course Header Visual */}
                <div className="bg-[#102B4E] px-6 py-5 text-white relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-semibold text-[#F47A24]">{course.category}</span>
                    <span className="text-slate-300">{course.level}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold leading-snug text-white">
                    {course.title}
                  </h2>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <p className="text-sm text-[#778397] leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    <div className="space-y-2 text-xs text-[#253449]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                        <span className="text-[#778397]">Provider:</span>
                        <span className="font-semibold truncate">
                          {course.provider || 'Partner Training Institute'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                        <span className="text-[#778397]">Mode:</span>
                        <span className="font-semibold">{course.learningMode || 'Online'}</span>
                      </div>
                      {course.duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#102B4E]/60 shrink-0" />
                          <span className="text-[#778397]">Duration:</span>
                          <span className="font-semibold">{course.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5EAF0] flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-[#102B4E]">
                      {course.fees ? `Fees: ${course.fees}` : 'Contact for fees'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openCourseModal(course)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>View Course</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Course Details & Enquiry Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081D36]/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: EASE_PREMIUM }}
              className="bg-white rounded-2xl border border-[#E5EAF0] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#102B4E] text-white px-6 py-5 flex items-start justify-between gap-4 z-10">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#F47A24] uppercase tracking-wider">
                    {selectedCourse.category} · {selectedCourse.level}
                  </p>
                  <h3 className="font-display text-xl font-bold mt-1">
                    {selectedCourse.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Offered by {selectedCourse.provider || 'Approved Training Partner'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourse(null)}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0"
                  aria-label="Close course details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 sm:p-7 space-y-6">
                {enqSubmitted ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-display text-xl font-bold text-[#102B4E]">
                      Enquiry Submitted
                    </h4>
                    <p className="text-sm text-[#778397] max-w-md mx-auto">
                      Your interest in <strong>{selectedCourse.title}</strong> has been forwarded to the training coordinator. You will receive batch schedule and enrolment details shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(null)}
                      className="px-6 py-2.5 rounded-lg bg-[#102B4E] text-white text-sm font-semibold cursor-pointer"
                    >
                      Back to Courses
                    </button>
                  </div>
                ) : showEnquiryForm ? (
                  <form onSubmit={handleEnquirySubmit} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5EAF0]">
                      <h4 className="font-display text-base font-bold text-[#102B4E]">
                        Enquire / Enrol for this Program
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowEnquiryForm(false)}
                        className="text-xs font-semibold text-[#778397] hover:text-[#102B4E] cursor-pointer"
                      >
                        Back to Details
                      </button>
                    </div>

                    {enqError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{enqError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={enqName}
                          onChange={(e) => setEnqName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={enqEmail}
                          onChange={(e) => setEnqEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={enqPhone}
                        onChange={(e) => setEnqPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#102B4E] mb-1">
                        Questions / Preferred Batch Timing (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={enqMessage}
                        onChange={(e) => setEnqMessage(e.target.value)}
                        placeholder="Share preferred schedule or any questions about the curriculum..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5EAF0] text-sm focus:outline-none focus:ring-2 focus:ring-[#102B4E]/20"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowEnquiryForm(false)}
                        className="px-4 py-2.5 rounded-lg border border-[#E5EAF0] text-sm font-semibold text-[#253449] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-lg bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold cursor-pointer"
                      >
                        Submit Enquiry
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F8FB] p-4 rounded-xl border border-[#E5EAF0] text-xs">
                      <div>
                        <p className="text-[#778397]">Training Provider</p>
                        <p className="font-semibold text-[#102B4E] mt-0.5">
                          {selectedCourse.provider || 'Partner Institute'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#778397]">Delivery Mode</p>
                        <p className="font-semibold text-[#102B4E] mt-0.5">
                          {selectedCourse.learningMode || 'Online'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#778397]">Duration</p>
                        <p className="font-semibold text-[#102B4E] mt-0.5">
                          {selectedCourse.duration || 'Flexible'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#778397]">Program Fees</p>
                        <p className="font-semibold text-[#102B4E] mt-0.5">
                          {selectedCourse.fees || 'On Enquiry'}
                        </p>
                      </div>
                    </div>

                    {/* Overview */}
                    <div className="space-y-2">
                      <h4 className="font-display text-sm font-bold text-[#102B4E] uppercase tracking-wider">
                        Course Overview
                      </h4>
                      <p className="text-sm text-[#253449] leading-relaxed">
                        {selectedCourse.description}
                      </p>
                    </div>

                    {/* Learning Outcomes */}
                    {selectedCourse.outcomes && selectedCourse.outcomes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-display text-sm font-bold text-[#102B4E] uppercase tracking-wider">
                          Learning Outcomes
                        </h4>
                        <ul className="space-y-2">
                          {selectedCourse.outcomes.map((out, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-[#253449]">
                              <CheckCircle2 className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                              <span>{out}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Course Content / Modules */}
                    {selectedCourse.curriculum && selectedCourse.curriculum.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-display text-sm font-bold text-[#102B4E] uppercase tracking-wider">
                          Course Content
                        </h4>
                        <div className="space-y-2">
                          {selectedCourse.curriculum.map((mod, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#F6F8FB] border border-[#E5EAF0] text-sm text-[#253449]"
                            >
                              <span className="text-xs font-bold text-[#F47A24]">
                                0{idx + 1}
                              </span>
                              <span>{mod}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills Covered */}
                    {selectedCourse.skillsCovered && selectedCourse.skillsCovered.length > 0 && (
                      <div className="text-xs text-[#778397]">
                        <span className="font-semibold text-[#102B4E]">Key Skills: </span>
                        {selectedCourse.skillsCovered.join(' · ')}
                      </div>
                    )}

                    {/* Footer CTA */}
                    <div className="pt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/jobs')}
                        className="text-xs font-semibold text-[#102B4E] hover:text-[#F47A24] cursor-pointer text-left"
                      >
                        Browse related job openings →
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEnquiryForm(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <span>Enquire Now / Enrol Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobSeekerUpskillPage;
