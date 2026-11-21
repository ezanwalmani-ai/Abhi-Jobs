import {
  AssessmentBasicInfo,
  AssessmentCareerPreferences,
  AssessmentEducationInfo,
  AssessmentExperienceInfo,
  AssessmentSkillsMap,
  CareerAssessmentRecord,
  CareerReadinessReport,
  PracticalDomainKey,
  PracticalDomainScore,
  PracticalKnowledgeQuestion,
  RecommendedCourseItem,
  SkillEvaluationKey,
  SkillProficiencyLevel,
  SkillReportItem,
} from '../types/careerAssessment';
import { CandidateProfile, User } from '../types';

export const SKILL_LEVEL_OPTIONS: SkillProficiencyLevel[] = [
  'Beginner',
  'Basic',
  'Intermediate',
  'Advanced',
];

export const SKILL_EVALUATION_ITEMS: Array<{
  key: SkillEvaluationKey;
  label: string;
  hint: string;
}> = [
  {
    key: 'excel',
    label: 'Microsoft Excel',
    hint: 'Formulas, sorting, filtering, tables, and workplace spreadsheets',
  },
  {
    key: 'wordPowerPoint',
    label: 'Microsoft Word and PowerPoint',
    hint: 'Structured documents, formatting, and clear slide decks',
  },
  {
    key: 'emailCommunication',
    label: 'Email and professional communication',
    hint: 'Writing concise updates, follow-ups, and workplace messages',
  },
  {
    key: 'englishCommunication',
    label: 'English communication',
    hint: 'Speaking and writing clearly in professional conversations',
  },
  {
    key: 'interviewPreparation',
    label: 'Interview preparation',
    hint: 'Explaining your background, answering questions, and confidence',
  },
  {
    key: 'aiTools',
    label: 'Artificial Intelligence tools',
    hint: 'Using modern AI tools safely to assist research and work tasks',
  },
  {
    key: 'chatGptClaude',
    label: 'ChatGPT and Claude',
    hint: 'Prompting AI assistants effectively for writing, planning, and analysis',
  },
  {
    key: 'problemSolving',
    label: 'Problem-solving',
    hint: 'Breaking down issues, identifying root causes, and proposing options',
  },
  {
    key: 'teamworkWorkplace',
    label: 'Teamwork and workplace skills',
    hint: 'Collaboration, meeting deadlines, and reliable day-to-day habits',
  },
];

export const QUALIFICATION_OPTIONS = [
  'High School / 12th Grade',
  'Diploma / Vocational Certificate',
  "Bachelor's Degree",
  "Master's Degree",
  'Postgraduate Diploma / MBA',
  'Doctorate / PhD',
  'Other Qualification',
];

export const WORK_EXPERIENCE_OPTIONS = [
  '0 years (Fresher)',
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '5–8 years',
  '8+ years',
];

export const EMPLOYMENT_STATUS_OPTIONS = [
  'Student / Recent Graduate',
  'Actively Looking for a Job',
  'Employed Full-time',
  'Employed Part-time / Freelance',
  'On a Career Break',
];

export const PREFERRED_INDUSTRY_OPTIONS = [
  'Information Technology & Software',
  'Finance, Banking & Accounting',
  'Sales & Business Development',
  'Marketing & Digital Media',
  'Human Resources & Recruitment',
  'Operations & Supply Chain',
  'Customer Support & BPO',
  'Engineering & Manufacturing',
  'Healthcare & Pharma',
  'Education & Training',
];

/**
 * 10 Practical, Workplace-Scenario Multiple-Choice Questions
 */
export const PRACTICAL_KNOWLEDGE_QUESTIONS: PracticalKnowledgeQuestion[] = [
  {
    id: 'pq_excel_1',
    domain: 'excel',
    domainLabel: 'Basic Excel Knowledge',
    scenario:
      'You have two Excel sheets: Sheet 1 lists 400 Employee IDs, and Sheet 2 holds Employee IDs alongside Department names.',
    question:
      'What is the cleanest, most reliable way to pull each employee’s Department into Sheet 1?',
    options: [
      { id: 'A', text: 'Copy and paste each department manually row by row' },
      { id: 'B', text: 'Use XLOOKUP or VLOOKUP referencing the Employee ID' },
      { id: 'C', text: 'Use the SUM function across both sheets' },
      { id: 'D', text: 'Merge all cells in Sheet 1 and sort alphabetically' },
    ],
    correctOptionId: 'B',
    explanation:
      'XLOOKUP or VLOOKUP matches records automatically by a unique identifier like Employee ID and avoids manual copy-paste errors.',
  },
  {
    id: 'pq_excel_2',
    domain: 'excel',
    domainLabel: 'Basic Excel Knowledge',
    scenario:
      'In Excel, cell B1 stores a fixed 18% GST rate. You write =A2*B1 in cell C2 and drag the formula down to row 100, but rows 3–100 show 0.',
    question: 'How should you fix the formula in C2 before dragging it down?',
    options: [
      { id: 'A', text: 'Change it to =A2*$B$1 so the reference to B1 stays locked' },
      { id: 'B', text: 'Change it to =AVERAGE(A2,B1)' },
      { id: 'C', text: 'Format column C as Text instead of Number' },
      { id: 'D', text: 'Wrap the formula in bold formatting' },
    ],
    correctOptionId: 'A',
    explanation:
      'Using an absolute reference ($B$1) keeps the tax rate cell fixed while A2 updates automatically down each row.',
  },
  {
    id: 'pq_email_1',
    domain: 'email',
    domainLabel: 'Professional Email Communication',
    scenario:
      'A monthly client report due at 4:00 PM will be delayed by two hours because you are waiting for verified figures from Finance.',
    question: 'What is the most professional email approach?',
    options: [
      { id: 'A', text: 'Wait until 6:00 PM and send the report without mentioning the delay' },
      {
        id: 'B',
        text: 'Send a brief proactive email before 4:00 PM noting the verified delivery time of 6:00 PM',
      },
      { id: 'C', text: 'Send incomplete unverified numbers at 3:55 PM to hit the timestamp' },
      { id: 'D', text: 'Email with the subject line "URGENT SORRY" and blame the Finance team' },
    ],
    correctOptionId: 'B',
    explanation:
      'Proactive, calm communication before a deadline passes builds trust and avoids passing blame or sending inaccurate data.',
  },
  {
    id: 'pq_email_2',
    domain: 'email',
    domainLabel: 'Professional Email Communication',
    scenario:
      'Your manager sends a company-wide announcement to 60 employees and asks anyone who needs a parking pass to reply to Facilities.',
    question: 'How should you reply if you need a parking pass?',
    options: [
      { id: 'A', text: 'Click "Reply All" so everyone knows you requested a pass' },
      { id: 'B', text: 'Reply directly to Facilities (or only the requested contact), not all 60 people' },
      { id: 'C', text: 'Forward the announcement back to your manager without a message' },
      { id: 'D', text: 'Put all 60 colleagues in CC and ask if anyone else needs one' },
    ],
    correctOptionId: 'B',
    explanation:
      'Avoiding unnecessary "Reply All" traffic respects colleagues’ inboxes and directs requests strictly to the responsible person.',
  },
  {
    id: 'pq_workplace_1',
    domain: 'workplace',
    domainLabel: 'Workplace Communication',
    scenario:
      'At 11:00 AM, a senior colleague asks you to finish a 3-hour presentation today, while you are already working on a priority client deliverable due at 5:00 PM for your manager.',
    question: 'What is the best immediate step?',
    options: [
      { id: 'A', text: 'Say yes to both and quietly miss one of the deadlines' },
      { id: 'B', text: 'Ignore the new request until tomorrow morning' },
      {
        id: 'C',
        text: 'Politely share your current priority deadline and align with your manager on which task takes precedence',
      },
      { id: 'D', text: 'Drop your manager’s deliverable without telling them' },
    ],
    correctOptionId: 'C',
    explanation:
      'Transparently flagging competing deadlines lets leadership clarify priorities before commitments are missed.',
  },
  {
    id: 'pq_interview_1',
    domain: 'interview',
    domainLabel: 'Interview Situations',
    scenario:
      'During an interview, the hiring manager asks: "Tell me about a time you made a mistake at work or on a project."',
    question: 'Which response structure makes the strongest impression?',
    options: [
      { id: 'A', text: 'Say you rarely make mistakes because you are a perfectionist' },
      { id: 'B', text: 'Explain how a teammate caused the issue so you were not at fault' },
      {
        id: 'C',
        text: 'Briefly state what happened, take ownership, explain how you fixed it, and share the habit you added to prevent it again',
      },
      { id: 'D', text: 'Ask to skip the question and talk only about your strengths' },
    ],
    correctOptionId: 'C',
    explanation:
      'Hiring teams look for accountability, calm problem resolution, and evidence that you learn from real feedback.',
  },
  {
    id: 'pq_interview_2',
    domain: 'interview',
    domainLabel: 'Interview Situations',
    scenario:
      'In an interview, you are asked whether you have experience with a reporting tool listed as "nice to have" in the job description, which you have not used before.',
    question: 'What is the most effective and honest response?',
    options: [
      { id: 'A', text: 'Claim you have used it for two years and hope to learn it later' },
      { id: 'B', text: 'Say "No" and stop talking immediately' },
      {
        id: 'C',
        text: 'Be honest that you have not used that exact tool yet, mention a similar tool you know, and note how you would ramp up quickly',
      },
      { id: 'D', text: 'Tell the interviewer the tool is outdated and unnecessary' },
    ],
    correctOptionId: 'C',
    explanation:
      'Honesty paired with transferable skills demonstrates integrity and adaptability — both essential in interviews.',
  },
  {
    id: 'pq_ai_1',
    domain: 'ai',
    domainLabel: 'AI Tools and Productivity',
    scenario:
      'You want to use ChatGPT or Claude to help tighten the wording of a client proposal summary.',
    question: 'Which practice is essential before pasting text into an AI tool and sharing the output?',
    options: [
      { id: 'A', text: 'Paste confidential client phone numbers and passwords so the AI has full context' },
      {
        id: 'B',
        text: 'Remove confidential/personal data before prompting, and fact-check every figure and claim in the draft before sending',
      },
      { id: 'C', text: 'Send the AI’s first output immediately without reading it' },
      { id: 'D', text: 'Ask the AI to invent extra client metrics to make the proposal sound stronger' },
    ],
    correctOptionId: 'B',
    explanation:
      'Responsible workplace AI use protects confidential information and always includes human verification of facts and tone.',
  },
  {
    id: 'pq_ai_2',
    domain: 'ai',
    domainLabel: 'AI Tools and Productivity',
    scenario:
      'You ask an AI assistant: "Write a follow-up email." The result feels too generic and misses the point.',
    question: 'What is the fastest way to get a genuinely useful workplace draft?',
    options: [
      { id: 'A', text: 'Repeat the exact same 4-word prompt three times' },
      {
        id: 'B',
        text: 'Specify the audience, purpose, key points to cover, preferred length, and professional tone',
      },
      { id: 'C', text: 'Type the prompt in ALL CAPS' },
      { id: 'D', text: 'Ask the AI to make the email 1,500 words long' },
    ],
    correctOptionId: 'B',
    explanation:
      'Providing clear context (audience, goal, key facts, tone, and length) transforms generic AI text into structured, usable drafts.',
  },
  {
    id: 'pq_problem_1',
    domain: 'problemSolving',
    domainLabel: 'Problem-Solving',
    scenario:
      'Your weekly operations dashboard suddenly shows a 40% drop in completed orders compared to the previous week.',
    question: 'What should be your first analytical step before alerting executives?',
    options: [
      { id: 'A', text: 'Immediately email leadership saying sales have collapsed by 40%' },
      {
        id: 'B',
        text: 'Verify whether the data source or date filter changed, then check which region or product line drove the drop',
      },
      { id: 'C', text: 'Delete the dashboard chart so nobody notices' },
      { id: 'D', text: 'Guess the reason based on one colleague’s opinion' },
    ],
    correctOptionId: 'B',
    explanation:
      'Strong problem-solving starts by validating data integrity and isolating variables before escalating conclusions.',
  },
];

const DOMAIN_LABELS: Record<PracticalDomainKey, string> = {
  excel: 'Basic Excel Knowledge',
  email: 'Professional Email Communication',
  workplace: 'Workplace Communication',
  interview: 'Interview Situations',
  ai: 'AI Tools & Productivity',
  problemSolving: 'Problem-Solving',
};

const SKILL_SCORE_MAP: Record<SkillProficiencyLevel, number> = {
  Beginner: 25,
  Basic: 50,
  Intermediate: 75,
  Advanced: 100,
};

export function createInitialAssessment(
  userId: string,
  user?: User | null,
  candidate?: CandidateProfile | null
): CareerAssessmentRecord {
  const topEdu = candidate?.education?.[0];
  const topExp = candidate?.experiences?.[0];
  const currentCity =
    candidate?.city ||
    (candidate?.location ? candidate.location.split(',')[0]?.trim() : '') ||
    '';

  const basicInfo: AssessmentBasicInfo = {
    fullName: candidate?.name || user?.name || '',
    email: candidate?.email || user?.email || '',
    mobileNumber: candidate?.phone || '',
    currentCity,
    preferredJobLocation: candidate?.preferredLocation || currentCity || '',
  };

  const education: AssessmentEducationInfo = {
    highestQualification: topEdu?.qualification || '',
    fieldOfStudy: topEdu?.fieldOfStudy || '',
    graduationYear: topEdu?.endYear || '',
    currentlyStudying: '',
  };

  const hasExp = Boolean(
    candidate?.experienceType === 'experienced' ||
      (candidate?.experiences && candidate.experiences.length > 0)
  );

  const experience: AssessmentExperienceInfo = {
    experienceType: candidate?.experienceType || (hasExp ? 'experienced' : ''),
    totalWorkExperience: hasExp ? '' : '',
    currentEmploymentStatus: candidate?.workStatus || '',
    previousOrCurrentRole: candidate?.currentRole || topExp?.jobTitle || '',
    industryOfExperience: '',
  };

  const careerPreferences: AssessmentCareerPreferences = {
    preferredJobRoles: candidate?.desiredRole || '',
    preferredIndustries: [],
    careerObjective: candidate?.about ? candidate.about.slice(0, 320) : '',
    careerGoal: '',
  };

  const skillsEvaluation: AssessmentSkillsMap = {
    excel: '',
    wordPowerPoint: '',
    emailCommunication: '',
    englishCommunication: '',
    interviewPreparation: '',
    aiTools: '',
    chatGptClaude: '',
    problemSolving: '',
    teamworkWorkplace: '',
  };

  return {
    id: `assess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    status: 'in_progress',
    currentStep: 0,
    basicInfo,
    education,
    experience,
    careerPreferences,
    skillsEvaluation,
    practicalAnswers: {},
    learningRecommendationConsent: false,
    recruitmentConsent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates an honest, strictly calculated Career Readiness Report
 * derived purely from the candidate's submitted answers.
 */
export function calculateCareerReadinessReport(
  record: CareerAssessmentRecord
): CareerReadinessReport {
  // 1. Self-evaluated skill results
  const skillResults: SkillReportItem[] = SKILL_EVALUATION_ITEMS.map((item) => {
    const chosen = (record.skillsEvaluation[item.key] || 'Beginner') as SkillProficiencyLevel;
    return {
      key: item.key,
      label: item.label,
      level: chosen,
      scorePercent: SKILL_SCORE_MAP[chosen],
    };
  });

  const selfEvaluationAveragePercent = Math.round(
    skillResults.reduce((acc, s) => acc + s.scorePercent, 0) / skillResults.length
  );

  // 2. Practical knowledge scoring (strictly graded against verified answer key)
  const domainTotals: Record<PracticalDomainKey, { correct: number; total: number }> = {
    excel: { correct: 0, total: 0 },
    email: { correct: 0, total: 0 },
    workplace: { correct: 0, total: 0 },
    interview: { correct: 0, total: 0 },
    ai: { correct: 0, total: 0 },
    problemSolving: { correct: 0, total: 0 },
  };

  let overallPracticalCorrect = 0;
  PRACTICAL_KNOWLEDGE_QUESTIONS.forEach((q) => {
    domainTotals[q.domain].total += 1;
    if (record.practicalAnswers[q.id] === q.correctOptionId) {
      domainTotals[q.domain].correct += 1;
      overallPracticalCorrect += 1;
    }
  });

  const overallPracticalTotal = PRACTICAL_KNOWLEDGE_QUESTIONS.length;
  const overallPracticalPercent = Math.round(
    (overallPracticalCorrect / overallPracticalTotal) * 100
  );

  const practicalDomainScores: PracticalDomainScore[] = (
    Object.keys(domainTotals) as PracticalDomainKey[]
  ).map((domain) => {
    const { correct, total } = domainTotals[domain];
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      correct,
      total,
      percent: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  // 3. Honest Readiness Band (strictly reflecting answers, never claiming guaranteed job readiness)
  const combinedIndicator = Math.round(
    overallPracticalPercent * 0.6 + selfEvaluationAveragePercent * 0.4
  );
  let readinessBand = 'Foundational Stage';
  let readinessSummary =
    'Your responses highlight clear opportunities to build core digital, communication, and interview fundamentals through structured free courses.';

  if (combinedIndicator >= 80 && overallPracticalPercent >= 80) {
    readinessBand = 'Strong Workplace Foundation';
    readinessSummary =
      'Your practical scenario responses and skill ratings show solid workplace readiness. Focused upskilling in specialist areas can help you stand out further.';
  } else if (combinedIndicator >= 60) {
    readinessBand = 'Developing Career Readiness';
    readinessSummary =
      'You already have a useful working base across several areas. Strengthening a few targeted practical skills will increase your confidence in interviews and day-to-day roles.';
  }

  // 4. Strengths (derived strictly from Intermediate/Advanced skills & 100% practical domains)
  const strengths: string[] = [];
  practicalDomainScores.forEach((d) => {
    if (d.correct === d.total && d.total > 0) {
      strengths.push(`Answered all ${d.label.toLowerCase()} scenario questions accurately (${d.correct}/${d.total}).`);
    }
  });
  skillResults.forEach((s) => {
    if (s.level === 'Advanced' || s.level === 'Intermediate') {
      strengths.push(`${s.label} — self-assessed at ${s.level} proficiency.`);
    }
  });
  if (strengths.length === 0) {
    strengths.push(
      'Completed the full profile evaluation honestly — giving you a clear, practical baseline for structured skill growth.'
    );
  }

  // 5. Areas Requiring Improvement (derived strictly from Beginner/Basic ratings & missed MCQs)
  const areasForImprovement: string[] = [];
  practicalDomainScores.forEach((d) => {
    if (d.correct < d.total) {
      areasForImprovement.push(
        `${d.label} (${d.correct}/${d.total} correct in practical scenarios).`
      );
    }
  });
  skillResults.forEach((s) => {
    if (s.level === 'Beginner' || s.level === 'Basic') {
      areasForImprovement.push(`${s.label} — currently at ${s.level} level.`);
    }
  });
  if (areasForImprovement.length === 0) {
    areasForImprovement.push(
      'No major foundational gaps detected — consider advancing role-specific expertise aligned with your target career path.'
    );
  }

  // 6. Personalized Course Recommendations (driven directly by responses)
  const recommendedCourses: RecommendedCourseItem[] = [];
  const addRec = (item: RecommendedCourseItem) => {
    if (!recommendedCourses.some((r) => r.id === item.id)) {
      recommendedCourses.push(item);
    }
  };

  const getSkill = (k: SkillEvaluationKey) =>
    record.skillsEvaluation[k] || 'Beginner';
  const isWeakSkill = (k: SkillEvaluationKey) => {
    const lvl = getSkill(k);
    return lvl === 'Beginner' || lvl === 'Basic';
  };

  const excelScore = domainTotals.excel;
  if (isWeakSkill('excel') || excelScore.correct < excelScore.total) {
    addRec({
      id: 'rec-excel-for-job-seekers',
      title: 'Excel for Job Seekers',
      categoryId: 'excel-digital-skills',
      categoryName: 'Excel and Digital Skills',
      reason: isWeakSkill('excel')
        ? `Based on your ${getSkill('excel')} Excel self-evaluation${excelScore.correct < excelScore.total ? ` and ${excelScore.correct}/${excelScore.total} practical Excel score` : ''}.`
        : `Recommended to reinforce practical lookup and formula accuracy (${excelScore.correct}/${excelScore.total} on Excel scenarios).`,
      priority: 'Recommended First',
    });
  }

  if (isWeakSkill('englishCommunication')) {
    addRec({
      id: 'rec-improve-your-english',
      title: 'Improve Your English',
      categoryId: 'communication-english',
      categoryName: 'Communication and English',
      reason: `Tailored for your current ${getSkill('englishCommunication')} English communication confidence.`,
      priority: 'Recommended First',
    });
  }

  const interviewScore = domainTotals.interview;
  if (isWeakSkill('interviewPreparation') || interviewScore.correct < interviewScore.total) {
    addRec({
      id: 'rec-interview-preparation',
      title: 'Interview Preparation',
      categoryId: 'interview-preparation',
      categoryName: 'Interview Preparation',
      reason: isWeakSkill('interviewPreparation')
        ? `Builds structured answering confidence from your current ${getSkill('interviewPreparation')} interview preparation level.`
        : `Helpful practice for real-world behavioral and honesty interview scenarios (${interviewScore.correct}/${interviewScore.total}).`,
      priority: 'Recommended First',
    });
  }

  const aiScore = domainTotals.ai;
  if (isWeakSkill('aiTools') || isWeakSkill('chatGptClaude') || aiScore.correct < aiScore.total) {
    addRec({
      id: 'rec-chatgpt-claude-job-seekers',
      title: 'ChatGPT and Claude for Job Seekers',
      categoryId: 'ai-productivity',
      categoryName: 'Artificial Intelligence and Productivity',
      reason:
        isWeakSkill('aiTools') || isWeakSkill('chatGptClaude')
          ? 'Helps you build practical prompting and responsible workplace AI skills from scratch.'
          : `Strengthens safe, structured AI prompting habits (${aiScore.correct}/${aiScore.total} on AI scenarios).`,
      priority: 'Recommended First',
    });
  }

  if (record.careerPreferences.careerGoal === 'career_change') {
    addRec({
      id: 'rec-change-career-domain',
      title: 'How to Change Your Career Domain',
      categoryId: 'career-development',
      categoryName: 'Career Development',
      reason:
        'Matched to your stated goal of making a career change into a new role or industry.',
      priority: 'Recommended First',
    });
  }

  const emailScore = domainTotals.email;
  const workplaceScore = domainTotals.workplace;
  if (
    isWeakSkill('emailCommunication') ||
    emailScore.correct < emailScore.total ||
    workplaceScore.correct < workplaceScore.total
  ) {
    addRec({
      id: 'rec-professional-email-workplace',
      title: 'Professional Email & Workplace Communication',
      categoryId: 'communication-english',
      categoryName: 'Communication and English',
      reason:
        'Covers proactive deadline updates, inbox etiquette, and clear workplace stakeholder communication.',
      priority: 'Suggested Next',
    });
  }

  if (
    record.experience.experienceType === 'fresher' ||
    record.careerPreferences.careerGoal === 'first_job' ||
    isWeakSkill('teamworkWorkplace') ||
    isWeakSkill('problemSolving') ||
    domainTotals.problemSolving.correct < domainTotals.problemSolving.total
  ) {
    addRec({
      id: 'rec-workplace-skills-foundations',
      title: 'Workplace Problem-Solving & Professional Habits',
      categoryId: 'workplace-skills',
      categoryName: 'Workplace Skills',
      reason:
        record.experience.experienceType === 'fresher'
          ? 'Designed for freshers and early-career candidates stepping into structured corporate environments.'
          : 'Strengthens root-cause analysis, prioritization, and dependable team collaboration.',
      priority: 'Suggested Next',
    });
  }

  if (isWeakSkill('wordPowerPoint')) {
    addRec({
      id: 'rec-word-powerpoint-essentials',
      title: 'Business Documents & Presentations Essentials',
      categoryId: 'excel-digital-skills',
      categoryName: 'Excel and Digital Skills',
      reason: `Builds clarity in workplace documents and slide decks from your ${getSkill('wordPowerPoint')} rating.`,
      priority: 'Suggested Next',
    });
  }

  // Ensure even high-scoring candidates receive relevant growth tracks aligned with their goals
  if (recommendedCourses.length === 0) {
    addRec({
      id: 'rec-career-growth-positioning',
      title: 'Career Planning & Senior Interview Positioning',
      categoryId: 'career-development',
      categoryName: 'Career Development',
      reason:
        'Your baseline scores are strong — focus next on strategic positioning for your target roles.',
      priority: 'Suggested Next',
    });
    addRec({
      id: 'rec-chatgpt-claude-job-seekers',
      title: 'ChatGPT and Claude for Job Seekers',
      categoryId: 'ai-productivity',
      categoryName: 'Artificial Intelligence and Productivity',
      reason:
        'Accelerate job search research, role preparation, and daily workplace workflows.',
      priority: 'Suggested Next',
    });
  }

  // 7. Suggested Next Steps
  const suggestedNextSteps: string[] = [];
  if (recommendedCourses[0]) {
    suggestedNextSteps.push(
      `Start with "${recommendedCourses[0].title}" under ${recommendedCourses[0].categoryName} once lessons open in Learn with ABHI.`
    );
  }
  if (record.careerPreferences.preferredJobRoles.trim()) {
    suggestedNextSteps.push(
      `Tailor your resume in the ABHI JOBS Resume Builder specifically toward "${record.careerPreferences.preferredJobRoles.trim()}".`
    );
  } else {
    suggestedNextSteps.push(
      'Update your ABHI JOBS Resume Builder and candidate profile with your strongest verified skills.'
    );
  }
  if (overallPracticalPercent < 80) {
    suggestedNextSteps.push(
      'Review the scenario explanations in this report to strengthen day-to-day workplace decision-making.'
    );
  }
  suggestedNextSteps.push(
    `Explore curated openings on Find Jobs${record.basicInfo.preferredJobLocation.trim() ? ` in ${record.basicInfo.preferredJobLocation.trim()}` : ''} that match your experience level.`
  );

  return {
    overallPracticalCorrect,
    overallPracticalTotal,
    overallPracticalPercent,
    selfEvaluationAveragePercent,
    readinessBand,
    readinessSummary,
    skillResults,
    practicalDomainScores,
    strengths: strengths.slice(0, 6),
    areasForImprovement: areasForImprovement.slice(0, 6),
    recommendedCourses: recommendedCourses.slice(0, 5),
    suggestedNextSteps,
    generatedAt: new Date().toISOString(),
  };
}
