import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { CareerAssessmentRecord } from '../../../types/careerAssessment';
import { PRACTICAL_KNOWLEDGE_QUESTIONS } from '../../../services/careerAssessmentEngine';
import { EASE_PREMIUM } from '../../../lib/motion';

interface AssessmentResultsReportProps {
  record: CareerAssessmentRecord;
  savedToCloud: boolean;
  onRetakeAssessment: () => void;
  onExploreCourses: () => void;
  onNavigateResume: () => void;
  onNavigateJobs: () => void;
  onBackToLearn: () => void;
}

const CAREER_GOAL_LABELS: Record<string, string> = {
  first_job: 'Looking for First Job',
  better_job: 'Looking for a Better Job',
  career_change: 'Exploring a Career Change',
};

export const AssessmentResultsReport: React.FC<AssessmentResultsReportProps> = ({
  record,
  savedToCloud,
  onRetakeAssessment,
  onExploreCourses,
  onNavigateResume,
  onNavigateJobs,
  onBackToLearn,
}) => {
  const [showScenarioReview, setShowScenarioReview] = useState(false);

  const report = record.report;
  if (!report) return null;

  const submittedDate = record.submittedAt
    ? new Date(record.submittedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Just now';

  return (
    <div className="min-h-screen bg-[#F6F8FB] py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToLearn}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#566479] hover:text-[#102B4E] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Learn with ABHI</span>
          </button>

          <button
            type="button"
            onClick={onRetakeAssessment}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Take New Assessment</span>
          </button>
        </div>

        {/* 1. Career Readiness Report Hero Summary */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_PREMIUM }}
          className="bg-[#102B4E] text-white rounded-2xl p-6 sm:p-10 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span>
              <strong className="text-[#F47A24]">Personalised Career Readiness Report</strong>
              {' · '}Completed {submittedDate}
            </span>
            <span>
              {savedToCloud
                ? 'Saved to your private ABHI JOBS account'
                : 'Saved privately to your candidate session'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white [text-wrap:balance]">
                {report.readinessBand}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {report.readinessSummary}
              </p>
            </div>

            {/* Calculated Real Scores */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 pt-4 lg:pt-0 lg:border-l lg:border-white/15 lg:pl-8">
              <div className="space-y-1">
                <p className="text-xs text-slate-300">Practical Scenarios</p>
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                  {report.overallPracticalCorrect}/{report.overallPracticalTotal}
                </p>
                <p className="text-xs text-[#F47A24] font-semibold tabular-nums">
                  {report.overallPracticalPercent}% accurate
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-300">Self-Evaluated Skills</p>
                <p className="font-display text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                  {report.selfEvaluationAveragePercent}%
                </p>
                <p className="text-xs text-slate-300">Across 9 skill areas</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300/90 pt-4 border-t border-white/15 leading-relaxed">
            This report is calculated strictly from your submitted responses to guide your learning plan. It does not guarantee job readiness and is never used to automatically reject or rank your applications.
          </p>
        </motion.section>

        {/* 2. Candidate Profile + Education & Experience Summary */}
        <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Candidate Profile Summary */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-[#102B4E]">
                Candidate Profile Summary
              </h2>
              <dl className="divide-y divide-[#E5EAF0] text-sm">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Full Name</dt>
                  <dd className="font-semibold text-[#102B4E] text-right">
                    {record.basicInfo.fullName}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Contact</dt>
                  <dd className="font-medium text-[#253449] text-right break-all">
                    {record.basicInfo.email} · {record.basicInfo.mobileNumber}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Location</dt>
                  <dd className="font-medium text-[#253449] text-right">
                    {record.basicInfo.currentCity} (Prefers: {record.basicInfo.preferredJobLocation})
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Career Goal</dt>
                  <dd className="font-semibold text-[#F47A24] text-right">
                    {CAREER_GOAL_LABELS[record.careerPreferences.careerGoal] || 'Career Growth'}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Preferred Roles</dt>
                  <dd className="font-medium text-[#253449] text-right">
                    {record.careerPreferences.preferredJobRoles}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Education & Experience Summary */}
            <div className="space-y-4 lg:border-l lg:border-[#E5EAF0] lg:pl-10">
              <h2 className="font-display text-lg font-bold text-[#102B4E]">
                Education &amp; Experience Summary
              </h2>
              <dl className="divide-y divide-[#E5EAF0] text-sm">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Qualification</dt>
                  <dd className="font-semibold text-[#102B4E] text-right">
                    {record.education.highestQualification} in {record.education.fieldOfStudy}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Graduation</dt>
                  <dd className="font-medium text-[#253449] text-right">
                    {record.education.graduationYear}
                    {record.education.currentlyStudying === 'yes' ? ' · Currently studying' : ''}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Experience Level</dt>
                  <dd className="font-semibold text-[#102B4E] text-right capitalize">
                    {record.experience.experienceType} ({record.experience.totalWorkExperience})
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#778397]">Current Status</dt>
                  <dd className="font-medium text-[#253449] text-right">
                    {record.experience.currentEmploymentStatus}
                  </dd>
                </div>
                {(record.experience.previousOrCurrentRole ||
                  record.experience.industryOfExperience) && (
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-[#778397]">Role &amp; Industry</dt>
                    <dd className="font-medium text-[#253449] text-right">
                      {[
                        record.experience.previousOrCurrentRole,
                        record.experience.industryOfExperience,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>

        {/* 3. Skill Assessment Results & Practical Domain Breakdown */}
        <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Self-Evaluated Skills */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#102B4E]">
                  Skill Assessment Results
                </h2>
                <p className="text-xs text-[#778397] mt-0.5">
                  Your self-evaluated proficiency across nine core workplace areas.
                </p>
              </div>

              <div className="space-y-3.5">
                {report.skillResults.map((skill) => (
                  <div key={skill.key} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="font-medium text-[#253449]">{skill.label}</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          skill.level === 'Advanced' || skill.level === 'Intermediate'
                            ? 'text-[#102B4E]'
                            : 'text-[#F47A24]'
                        }`}
                      >
                        {skill.level}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#EDF2F7] overflow-hidden">
                      <div
                        style={{ width: `${skill.scorePercent}%` }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          skill.level === 'Advanced' || skill.level === 'Intermediate'
                            ? 'bg-[#102B4E]'
                            : 'bg-[#F47A24]'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Knowledge Domain Results */}
            <div className="lg:col-span-5 lg:border-l lg:border-[#E5EAF0] lg:pl-8 space-y-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#102B4E]">
                  Practical Knowledge Score
                </h2>
                <p className="text-xs text-[#778397] mt-0.5">
                  Calculated directly from your 10 workplace scenario responses.
                </p>
              </div>

              <div className="divide-y divide-[#E5EAF0]">
                {report.practicalDomainScores.map((domain) => (
                  <div
                    key={domain.domain}
                    className="py-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-[#253449] font-medium">{domain.label}</span>
                    <span
                      className={`font-bold tabular-nums shrink-0 ${
                        domain.correct === domain.total ? 'text-emerald-700' : 'text-[#F47A24]'
                      }`}
                    >
                      {domain.correct}/{domain.total} ({domain.percent}%)
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowScenarioReview((prev) => !prev)}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl border border-[#E5EAF0] hover:border-[#102B4E] text-xs font-semibold text-[#102B4E] inline-flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>
                  {showScenarioReview
                    ? 'Hide Answer Explanations'
                    : 'Review Practical Question Explanations'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showScenarioReview ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Expandable Practical Scenario Review */}
          {showScenarioReview && (
            <div className="pt-6 border-t border-[#E5EAF0] space-y-4">
              <h3 className="font-display text-base font-bold text-[#102B4E]">
                Practical Scenario Review
              </h3>
              <div className="divide-y divide-[#E5EAF0]">
                {PRACTICAL_KNOWLEDGE_QUESTIONS.map((q, idx) => {
                  const chosen = record.practicalAnswers[q.id];
                  const isCorrect = chosen === q.correctOptionId;
                  const chosenText = q.options.find((o) => o.id === chosen)?.text || 'Not answered';
                  const correctText =
                    q.options.find((o) => o.id === q.correctOptionId)?.text || '';

                  return (
                    <div key={q.id} className="py-4 space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-[#102B4E]">
                          {idx + 1}. {q.question}
                        </p>
                        <span
                          className={`font-bold shrink-0 ${
                            isCorrect ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Review'}
                        </span>
                      </div>
                      <p className="text-[#566479]">
                        <strong className="text-[#253449]">Your answer:</strong> {chosenText}
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-800">
                          <strong>Recommended choice:</strong> {correctText}
                        </p>
                      )}
                      <p className="text-[#778397]">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* 4. Strengths & Areas Requiring Improvement */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#102B4E]">Strengths</h2>
            <ul className="space-y-3">
              {report.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-[#253449]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#102B4E]">
              Areas Requiring Improvement
            </h2>
            <ul className="space-y-3">
              {report.areasForImprovement.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-[#253449]">
                  <AlertCircle className="w-4 h-4 text-[#F47A24] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Recommended Courses */}
        <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#F47A24]">Personalised Learning Path</p>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#102B4E]">
                Recommended Courses for You
              </h2>
            </div>
            <button
              type="button"
              onClick={onExploreCourses}
              className="text-sm font-semibold text-[#102B4E] hover:text-[#F47A24] inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Browse Full Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-[#E5EAF0] border-t border-[#E5EAF0]">
            {report.recommendedCourses.map((course) => (
              <div
                key={course.id}
                className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs text-[#778397]">
                    <span className="font-semibold text-[#102B4E]">{course.categoryName}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="text-[#F47A24] font-semibold">{course.priority}</span>
                  </p>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#102B4E]">
                    {course.title}
                  </h3>
                  <p className="text-sm text-[#566479] leading-relaxed">{course.reason}</p>
                </div>

                <button
                  type="button"
                  onClick={onExploreCourses}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#F47A24]" />
                  <span>Explore Category</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Suggested Next Steps & Consent Record */}
        <section className="bg-white rounded-2xl border border-[#E5EAF0] p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-xl font-extrabold text-[#102B4E]">
            Suggested Next Steps
          </h2>

          <ol className="space-y-3">
            {report.suggestedNextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-[#253449]">
                <span className="font-display text-xs font-bold text-[#F47A24] tabular-nums pt-0.5 shrink-0">
                  0{idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="pt-4 border-t border-[#E5EAF0] flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onExploreCourses}
              className="min-h-[46px] px-6 py-3 rounded-xl bg-[#F47A24] hover:bg-[#DE6816] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer transition-colors"
            >
              <span>Explore Free Courses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNavigateResume}
              className="min-h-[46px] px-5 py-3 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              Open Resume Builder
            </button>
            <button
              type="button"
              onClick={onNavigateJobs}
              className="min-h-[46px] px-5 py-3 rounded-xl border border-[#D4DCE6] hover:border-[#102B4E] text-[#102B4E] text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              Browse Open Jobs
            </button>
          </div>

          {/* Transparent Consent Record */}
          <div className="p-4 rounded-xl bg-[#F6F8FB] border border-[#E5EAF0] flex items-start gap-2.5 text-xs text-[#566479]">
            <ShieldCheck className="w-4 h-4 text-[#102B4E] shrink-0 mt-0.5" />
            <span>
              <strong>Consent preferences recorded:</strong> Learning recommendations enabled · Recruitment consultant review:{' '}
              <strong>{record.recruitmentConsent ? 'Opted in' : 'Not shared (learning only)'}</strong>.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AssessmentResultsReport;
