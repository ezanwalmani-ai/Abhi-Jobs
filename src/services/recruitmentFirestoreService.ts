import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  writeBatch,
  serverTimestamp,
} from '../lib/firebase';
import type {
  Application,
  ApplicationStatus,
  CandidateProfile,
  CourseEnquiry,
  EmployerProfile,
  HiringEnquiry,
  InternalNote,
  Interview,
  Job,
  NotificationItem,
} from '../types';

export interface WebsiteContentRecord {
  key: string;
  section: 'homepage' | 'announcement' | 'career_guide' | 'faq' | 'legal' | 'banner' | 'footer';
  title: string;
  subtitle?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  sortOrder: number;
  status: 'draft' | 'published' | 'archived';
  updatedBy: string;
  updatedAt: string;
}

export interface PublicSettingRecord {
  key: string;
  label: string;
  value: Record<string, string | number | boolean>;
  updatedBy: string;
  updatedAt: string;
}

export interface CertificateApprovalRequestRecord {
  id: string;
  userId: string;
  candidateName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  completedLessonsCount: number;
  candidateNote?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNote?: string;
  issuedCertificateId?: string;
  requestedAt: string;
  updatedAt: string;
}

export interface PlatformAggregateCounts {
  candidates: number;
  employers: number;
  verifiedEmployers: number;
  publishedJobs: number;
  totalJobs: number;
  applications: number;
  interviews: number;
  hiringEnquiries: number;
  courseEnquiries: number;
  pendingCertificateRequests: number;
  generatedAt: string;
  source: 'firestore_aggregation';
}

function toIso(val: unknown): string {
  if (typeof val === 'string' && val.trim()) return val;
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

export function sanitizeFirestoreId(raw: string, fallbackPrefix = 'rec'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  if (cleaned.length >= 3) return cleaned;
  return `${fallbackPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function isSafeHttpUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out as Partial<T>;
}

// ============================================================================
// CANDIDATES (/candidates/{uid} + opt-in non-PII /candidate_directory/{uid})
// ============================================================================

export async function fetchCandidateProfileFromFirestore(
  uid: string
): Promise<CandidateProfile | null> {
  const snap = await getDoc(doc(db, 'candidates', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: String(d.id || uid),
    userId: String(d.userId || uid),
    name: String(d.name || ''),
    email: String(d.email || ''),
    phone: String(d.phone || ''),
    location: String(d.location || ''),
    city: typeof d.city === 'string' ? d.city : undefined,
    state: typeof d.state === 'string' ? d.state : undefined,
    headline: String(d.headline || ''),
    about: String(d.about || ''),
    currentRole: String(d.currentRole || ''),
    desiredRole: String(d.desiredRole || ''),
    experienceLevel: (d.experienceLevel as CandidateProfile['experienceLevel']) || 'Fresher',
    experienceType: d.experienceType === 'experienced' ? 'experienced' : 'fresher',
    workStatus: typeof d.workStatus === 'string' ? d.workStatus : undefined,
    yearsOfExperience: typeof d.yearsOfExperience === 'number' ? d.yearsOfExperience : 0,
    preferredLocation: String(d.preferredLocation || ''),
    workPreference: (d.workPreference as CandidateProfile['workPreference']) || 'Hybrid',
    preferredIndustry: typeof d.preferredIndustry === 'string' ? d.preferredIndustry : undefined,
    expectedSalary: d.expectedSalary && typeof d.expectedSalary === 'object' ? d.expectedSalary : undefined,
    willingToRelocate: typeof d.willingToRelocate === 'boolean' ? d.willingToRelocate : undefined,
    gender: typeof d.gender === 'string' ? d.gender : undefined,
    dob: typeof d.dob === 'string' ? d.dob : undefined,
    marketingConsent: typeof d.marketingConsent === 'boolean' ? d.marketingConsent : undefined,
    availability: (d.availability as CandidateProfile['availability']) || 'Immediate',
    profileVisibility: d.profileVisibility === 'private' ? 'private' : 'employers_only',
    availableForOpportunities: Boolean(d.availableForOpportunities),
    skills: Array.isArray(d.skills) ? d.skills.map(String) : [],
    education: Array.isArray(d.education) ? d.education : [],
    experiences: Array.isArray(d.experiences) ? d.experiences : [],
    certifications: Array.isArray(d.certifications) ? d.certifications : [],
    completionPercentage: typeof d.completionPercentage === 'number' ? d.completionPercentage : 0,
    recommendations: [],
    avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
    lastActive: toIso(d.updatedAt),
  };
}

export async function saveCandidateProfileToFirestore(
  uid: string,
  profile: CandidateProfile
): Promise<void> {
  const ref = doc(db, 'candidates', uid);
  const existing = await getDoc(ref);
  const visibility: 'employers_only' | 'private' =
    profile.profileVisibility === 'private' ? 'private' : 'employers_only';

  const safeAvatar =
    profile.avatar && !profile.avatar.startsWith('data:') && profile.avatar.length <= 500
      ? profile.avatar
      : undefined;

  const baseDoc = stripUndefined({
    id: uid,
    userId: uid,
    name: (profile.name || 'Candidate').trim().slice(0, 120),
    email: (profile.email || auth.currentUser?.email || 'user@abhijobs.careers').trim().slice(0, 150),
    phone: profile.phone ? profile.phone.trim().slice(0, 30) : undefined,
    location: (profile.location || 'India').trim().slice(0, 120),
    city: profile.city ? profile.city.trim().slice(0, 80) : undefined,
    state: profile.state ? profile.state.trim().slice(0, 80) : undefined,
    headline: (profile.headline || '').trim().slice(0, 200),
    about: profile.about ? profile.about.trim().slice(0, 2500) : undefined,
    currentRole: profile.currentRole ? profile.currentRole.trim().slice(0, 120) : undefined,
    desiredRole: profile.desiredRole ? profile.desiredRole.trim().slice(0, 120) : undefined,
    experienceLevel: ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'].includes(profile.experienceLevel)
      ? profile.experienceLevel
      : 'Fresher',
    experienceType: profile.experienceType === 'experienced' ? 'experienced' : 'fresher',
    workStatus: profile.workStatus ? String(profile.workStatus).slice(0, 80) : undefined,
    yearsOfExperience: Math.max(0, Math.min(60, Number(profile.yearsOfExperience) || 0)),
    preferredLocation: profile.preferredLocation ? profile.preferredLocation.slice(0, 120) : undefined,
    workPreference: ['Remote', 'Hybrid', 'On-site', 'Flexible'].includes(profile.workPreference)
      ? profile.workPreference
      : 'Hybrid',
    preferredIndustry: profile.preferredIndustry ? profile.preferredIndustry.slice(0, 100) : undefined,
    expectedSalary: profile.expectedSalary,
    willingToRelocate: profile.willingToRelocate,
    gender: profile.gender ? profile.gender.slice(0, 40) : undefined,
    dob: profile.dob ? profile.dob.slice(0, 32) : undefined,
    marketingConsent: profile.marketingConsent,
    availability: ['Immediate', '15 Days', '30 Days', 'Exploring'].includes(profile.availability)
      ? profile.availability
      : 'Immediate',
    profileVisibility: visibility,
    availableForOpportunities: Boolean(profile.availableForOpportunities),
    skills: (profile.skills || []).slice(0, 40).map((s) => String(s).slice(0, 80)),
    education: (profile.education || []).slice(0, 15),
    experiences: (profile.experiences || []).slice(0, 20),
    certifications: (profile.certifications || []).slice(0, 25),
    completionPercentage: Math.max(0, Math.min(100, Math.round(profile.completionPercentage || 0))),
    avatar: safeAvatar,
    updatedAt: serverTimestamp(),
  });

  if (existing.exists()) {
    await updateDoc(ref, baseDoc);
  } else {
    await setDoc(ref, {
      ...baseDoc,
      createdAt: serverTimestamp(),
    });
  }

  // Sync non-PII opt-in /candidate_directory/{uid} entry
  const dirRef = doc(db, 'candidate_directory', uid);
  if (visibility === 'employers_only' && profile.availableForOpportunities) {
    await setDoc(
      dirRef,
      stripUndefined({
        uid,
        displayName: (profile.name || 'Candidate').trim().slice(0, 120),
        headline: (profile.headline || '').trim().slice(0, 200),
        location: (profile.location || 'India').trim().slice(0, 120),
        desiredRole: profile.desiredRole ? profile.desiredRole.trim().slice(0, 120) : undefined,
        experienceLevel: ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'].includes(profile.experienceLevel)
          ? profile.experienceLevel
          : 'Fresher',
        yearsOfExperience: Math.max(0, Math.min(60, Number(profile.yearsOfExperience) || 0)),
        workPreference: ['Remote', 'Hybrid', 'On-site', 'Flexible'].includes(profile.workPreference)
          ? profile.workPreference
          : 'Hybrid',
        availability: ['Immediate', '15 Days', '30 Days', 'Exploring'].includes(profile.availability)
          ? profile.availability
          : 'Immediate',
        skills: (profile.skills || []).slice(0, 40).map((s) => String(s).slice(0, 80)),
        availableForOpportunities: true,
        completionPercentage: Math.max(0, Math.min(100, Math.round(profile.completionPercentage || 0))),
        updatedAt: serverTimestamp(),
      })
    );
  } else {
    await deleteDoc(dirRef).catch(() => {});
  }
}

export async function listCandidatesAdminFromFirestore(maxItems = 100): Promise<CandidateProfile[]> {
  const q = query(collection(db, 'candidates'), orderBy('updatedAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  const results: CandidateProfile[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    results.push({
      id: String(d.id || docSnap.id),
      userId: String(d.userId || docSnap.id),
      name: String(d.name || ''),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      location: String(d.location || ''),
      headline: String(d.headline || ''),
      about: String(d.about || ''),
      currentRole: String(d.currentRole || ''),
      desiredRole: String(d.desiredRole || ''),
      experienceLevel: (d.experienceLevel as CandidateProfile['experienceLevel']) || 'Fresher',
      yearsOfExperience: typeof d.yearsOfExperience === 'number' ? d.yearsOfExperience : 0,
      preferredLocation: String(d.preferredLocation || ''),
      workPreference: (d.workPreference as CandidateProfile['workPreference']) || 'Hybrid',
      availability: (d.availability as CandidateProfile['availability']) || 'Immediate',
      profileVisibility: d.profileVisibility === 'private' ? 'private' : 'employers_only',
      availableForOpportunities: Boolean(d.availableForOpportunities),
      skills: Array.isArray(d.skills) ? d.skills.map(String) : [],
      education: Array.isArray(d.education) ? d.education : [],
      experiences: Array.isArray(d.experiences) ? d.experiences : [],
      certifications: Array.isArray(d.certifications) ? d.certifications : [],
      completionPercentage: typeof d.completionPercentage === 'number' ? d.completionPercentage : 0,
      recommendations: [],
      avatar: typeof d.avatar === 'string' ? d.avatar : undefined,
      lastActive: toIso(d.updatedAt),
    });
  });
  return results;
}

// ============================================================================
// SAVED JOBS, RECENTLY VIEWED & NOTIFICATIONS (/users/{uid}/...)
// ============================================================================

export async function listUserSavedJobIds(uid: string): Promise<string[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'saved_jobs'));
  return snap.docs.map((d) => d.id);
}

export async function setSavedJobInFirestore(
  uid: string,
  job: Pick<Job, 'id' | 'title' | 'companyName'>,
  save: boolean
): Promise<void> {
  const jobId = sanitizeFirestoreId(job.id, 'job');
  const ref = doc(db, 'users', uid, 'saved_jobs', jobId);
  if (save) {
    await setDoc(ref, {
      jobId,
      userId: uid,
      jobTitle: (job.title || 'Job').slice(0, 180),
      companyName: (job.companyName || 'Company').slice(0, 140),
      savedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(ref).catch(() => {});
  }
}

export async function listRecentlyViewedJobIds(uid: string): Promise<string[]> {
  const q = query(
    collection(db, 'users', uid, 'recently_viewed_jobs'),
    orderBy('viewedAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.id);
}

export async function recordRecentlyViewedJobInFirestore(uid: string, jobId: string): Promise<void> {
  const cleanId = sanitizeFirestoreId(jobId, 'job');
  await setDoc(doc(db, 'users', uid, 'recently_viewed_jobs', cleanId), {
    jobId: cleanId,
    userId: uid,
    viewedAt: serverTimestamp(),
  });
}

export async function listUserNotificationsFromFirestore(uid: string): Promise<NotificationItem[]> {
  const q = query(
    collection(db, 'users', uid, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: String(d.id || docSnap.id),
      userId: uid,
      targetRole: 'all',
      title: String(d.title || ''),
      message: String(d.message || ''),
      type: (d.type as NotificationItem['type']) || 'system',
      timestamp: toIso(d.createdAt),
      read: Boolean(d.read),
      link: typeof d.link === 'string' ? d.link : undefined,
    };
  });
}

export async function markUserNotificationReadInFirestore(
  uid: string,
  notificationId: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true });
}

// ============================================================================
// EMPLOYERS (/employers/{employerId} + /private_contacts/default)
// ============================================================================

function mapEmployerDoc(docId: string, d: Record<string, any>, contact?: Record<string, any>): EmployerProfile {
  const verificationStatus = (d.verificationStatus as EmployerProfile['verificationStatus']) || 'pending';
  return {
    id: String(d.id || docId),
    userId: String(d.ownerUid || ''),
    companyName: String(d.companyName || ''),
    name: String(d.companyName || ''),
    website: String(d.website || ''),
    industry: String(d.industry || 'General'),
    companySize: String(d.companySize || '1-50'),
    size: String(d.companySize || '1-50'),
    location: String(d.location || ''),
    recruiterName: String(contact?.recruiterName || ''),
    recruiterRole: String(contact?.recruiterRole || ''),
    recruiterEmail: String(contact?.recruiterEmail || ''),
    recruiterPhone: String(contact?.recruiterPhone || ''),
    logo: String(d.logo || ''),
    about: String(d.about || ''),
    description: String(d.about || ''),
    benefits: Array.isArray(d.benefits) ? d.benefits.map(String) : [],
    culture: String(d.culture || ''),
    socialLinks: d.socialLinks && typeof d.socialLinks === 'object' ? d.socialLinks : {},
    verificationStatus,
    verified: verificationStatus === 'verified',
    verifiedAt: typeof d.verifiedAt === 'string' ? d.verifiedAt : undefined,
    activeJobsCount: typeof d.activeJobsCount === 'number' ? d.activeJobsCount : 0,
  };
}

export async function listVerifiedEmployersFromFirestore(maxItems = 100): Promise<EmployerProfile[]> {
  const q = query(
    collection(db, 'employers'),
    where('verificationStatus', '==', 'verified'),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapEmployerDoc(docSnap.id, docSnap.data()));
}

export async function listAllEmployersAdminFromFirestore(maxItems = 150): Promise<EmployerProfile[]> {
  const q = query(collection(db, 'employers'), orderBy('updatedAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  const results: EmployerProfile[] = [];
  for (const docSnap of snap.docs) {
    let contactData: Record<string, any> | undefined;
    try {
      const contactSnap = await getDoc(
        doc(db, 'employers', docSnap.id, 'private_contacts', 'default')
      );
      if (contactSnap.exists()) {
        contactData = contactSnap.data();
      }
    } catch {
      // Non-fatal if contact subdoc not yet created
    }
    results.push(mapEmployerDoc(docSnap.id, docSnap.data(), contactData));
  }
  return results;
}

export async function fetchOwnerEmployerFromFirestore(ownerUid: string): Promise<EmployerProfile | null> {
  const q = query(collection(db, 'employers'), where('ownerUid', '==', ownerUid), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const first = snap.docs[0];
  let contactData: Record<string, any> | undefined;
  try {
    const contactSnap = await getDoc(doc(db, 'employers', first.id, 'private_contacts', 'default'));
    if (contactSnap.exists()) contactData = contactSnap.data();
  } catch {
    // ignore
  }
  return mapEmployerDoc(first.id, first.data(), contactData);
}

/**
 * Self-registers a new employer strictly as verificationStatus='pending', verified=false
 * (matching firestore.rules — employers can NEVER self-verify).
 */
export async function createEmployerInFirestore(params: {
  ownerUid: string;
  companyName: string;
  website?: string;
  industry: string;
  companySize: string;
  location: string;
  about: string;
  logo?: string;
  recruiterName: string;
  recruiterRole: string;
  recruiterEmail: string;
  recruiterPhone: string;
}): Promise<EmployerProfile> {
  const employerId = sanitizeFirestoreId(`emp_${params.ownerUid}`, 'emp');
  const batch = writeBatch(db);

  const publicRef = doc(db, 'employers', employerId);
  batch.set(
    publicRef,
    stripUndefined({
      id: employerId,
      ownerUid: params.ownerUid,
      companyName: params.companyName.trim().slice(0, 150),
      website: params.website && isSafeHttpUrl(params.website) ? params.website.slice(0, 300) : undefined,
      industry: (params.industry || 'General').trim().slice(0, 100),
      companySize: (params.companySize || '1-50').trim().slice(0, 60),
      location: (params.location || 'India').trim().slice(0, 140),
      logo:
        params.logo && !params.logo.startsWith('data:') && params.logo.length <= 500
          ? params.logo
          : undefined,
      about: (params.about || '').trim().slice(0, 3000),
      benefits: [],
      verificationStatus: 'pending',
      verified: false,
      activeJobsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  const contactRef = doc(db, 'employers', employerId, 'private_contacts', 'default');
  batch.set(contactRef, {
    id: 'default',
    employerId,
    ownerUid: params.ownerUid,
    recruiterName: (params.recruiterName || 'Recruiter').trim().slice(0, 120),
    recruiterRole: (params.recruiterRole || 'HR Manager').trim().slice(0, 100),
    recruiterEmail: params.recruiterEmail.trim().slice(0, 150),
    recruiterPhone: (params.recruiterPhone || '').trim().slice(0, 30),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  return {
    id: employerId,
    userId: params.ownerUid,
    companyName: params.companyName.trim(),
    name: params.companyName.trim(),
    website: params.website || '',
    industry: params.industry || 'General',
    companySize: params.companySize || '1-50',
    size: params.companySize || '1-50',
    location: params.location || 'India',
    recruiterName: params.recruiterName,
    recruiterRole: params.recruiterRole,
    recruiterEmail: params.recruiterEmail,
    recruiterPhone: params.recruiterPhone,
    logo: params.logo || '',
    about: params.about || '',
    description: params.about || '',
    benefits: [],
    culture: '',
    socialLinks: {},
    verificationStatus: 'pending',
    verified: false,
    activeJobsCount: 0,
  };
}

export async function updateEmployerVerificationInFirestore(params: {
  employerId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  adminUid: string;
}): Promise<void> {
  const verified = params.verificationStatus === 'verified';
  const payload: Record<string, unknown> = {
    verificationStatus: params.verificationStatus,
    verified,
    verifiedBy: params.adminUid,
    updatedAt: serverTimestamp(),
  };
  if (verified) {
    payload.verifiedAt = new Date().toISOString();
  }
  await updateDoc(doc(db, 'employers', params.employerId), payload);
}

// ============================================================================
// JOBS (/jobs/{jobId})
// ============================================================================

function mapJobDoc(docId: string, d: Record<string, any>): Job {
  return {
    id: String(d.id || docId),
    employerId: String(d.employerId || ''),
    companyName: String(d.companyName || ''),
    companyLogo: String(d.companyLogo || ''),
    title: String(d.title || ''),
    department: String(d.department || 'General'),
    industry: String(d.industry || 'General'),
    location: String(d.location || ''),
    employmentType: (d.employmentType as Job['employmentType']) || 'Full-time',
    workMode: (d.workMode as Job['workMode']) || 'On-site',
    experienceLevel: (d.experienceLevel as Job['experienceLevel']) || 'Mid',
    minExperienceYears: typeof d.minExperienceYears === 'number' ? d.minExperienceYears : 0,
    salary: d.salary && typeof d.salary === 'object'
      ? {
          min: Number(d.salary.min) || 0,
          max: Number(d.salary.max) || 0,
          currency: String(d.salary.currency || 'INR'),
          period: (d.salary.period as Job['salary']['period']) || 'yearly',
        }
      : { min: 0, max: 0, currency: 'INR', period: 'yearly' },
    overview: String(d.overview || ''),
    responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities.map(String) : [],
    requirements: Array.isArray(d.requirements) ? d.requirements.map(String) : [],
    preferredSkills: Array.isArray(d.preferredSkills) ? d.preferredSkills.map(String) : [],
    benefits: Array.isArray(d.benefits) ? d.benefits.map(String) : [],
    deadline: String(d.deadline || ''),
    postedDate: toIso(d.postedAt || d.createdAt),
    status: (d.status as Job['status']) || 'published',
    applicantsCount: typeof d.applicantsCount === 'number' ? d.applicantsCount : 0,
    viewsCount: typeof d.viewsCount === 'number' ? d.viewsCount : 0,
    isVerifiedCompany: Boolean(d.isVerifiedCompany),
    featured: Boolean(d.featured),
  };
}

export async function listPublishedJobsFromFirestore(maxItems = 100): Promise<Job[]> {
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'published'),
    orderBy('postedAt', 'desc'),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapJobDoc(docSnap.id, docSnap.data()));
}

export async function listAllJobsAdminFromFirestore(maxItems = 150): Promise<Job[]> {
  const q = query(collection(db, 'jobs'), orderBy('updatedAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapJobDoc(docSnap.id, docSnap.data()));
}

export async function saveJobToFirestore(params: {
  job: Job;
  employerOwnerUid: string;
  isNew?: boolean;
}): Promise<Job> {
  const jobId = sanitizeFirestoreId(params.job.id || `job_${Date.now()}`, 'job');
  const ref = doc(db, 'jobs', jobId);
  const existing = params.isNew ? null : await getDoc(ref);

  const payload = stripUndefined({
    id: jobId,
    employerId: sanitizeFirestoreId(params.job.employerId || `emp_${params.employerOwnerUid}`, 'emp'),
    employerOwnerUid: params.employerOwnerUid,
    companyName: (params.job.companyName || 'Company').slice(0, 150),
    companyLogo:
      params.job.companyLogo && !params.job.companyLogo.startsWith('data:')
        ? params.job.companyLogo.slice(0, 500)
        : undefined,
    title: params.job.title.trim().slice(0, 160),
    department: (params.job.department || 'General').slice(0, 100),
    industry: (params.job.industry || 'General').slice(0, 100),
    location: (params.job.location || 'India').slice(0, 140),
    employmentType: params.job.employmentType || 'Full-time',
    workMode: params.job.workMode || 'On-site',
    experienceLevel: params.job.experienceLevel || 'Mid',
    minExperienceYears: Math.max(0, Math.min(50, Number(params.job.minExperienceYears) || 0)),
    salary: {
      min: Number(params.job.salary?.min) || 0,
      max: Number(params.job.salary?.max) || 0,
      currency: String(params.job.salary?.currency || 'INR').slice(0, 10),
      period: params.job.salary?.period || 'yearly',
    },
    overview: (params.job.overview || params.job.title).slice(0, 4000),
    responsibilities: (params.job.responsibilities || []).slice(0, 25).map((r) => String(r).slice(0, 300)),
    requirements: (params.job.requirements || []).slice(0, 25).map((r) => String(r).slice(0, 300)),
    preferredSkills: (params.job.preferredSkills || []).slice(0, 25).map((s) => String(s).slice(0, 80)),
    benefits: (params.job.benefits || []).slice(0, 20).map((b) => String(b).slice(0, 150)),
    deadline: params.job.deadline ? params.job.deadline.slice(0, 64) : undefined,
    status: params.job.status || 'draft',
    applicantsCount: Math.max(0, Number(params.job.applicantsCount) || 0),
    viewsCount: Math.max(0, Number(params.job.viewsCount) || 0),
    isVerifiedCompany: Boolean(params.job.isVerifiedCompany),
    featured: Boolean(params.job.featured),
    updatedAt: serverTimestamp(),
  });

  if (existing && existing.exists()) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, {
      ...payload,
      applicantsCount: 0,
      viewsCount: 0,
      postedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  return { ...params.job, id: jobId };
}

export async function updateJobModerationInFirestore(
  jobId: string,
  updates: { status?: Job['status']; featured?: boolean }
): Promise<void> {
  await updateDoc(doc(db, 'jobs', jobId), {
    ...stripUndefined(updates),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// APPLICATIONS (/applications/{id} + /internal_notes/{noteId}) & INTERVIEWS
// ============================================================================

function mapApplicationDoc(docId: string, d: Record<string, any>): Application {
  return {
    id: String(d.id || docId),
    jobId: String(d.jobId || ''),
    jobTitle: String(d.jobTitle || ''),
    companyName: String(d.companyName || ''),
    companyLogo: '',
    candidateId: String(d.candidateId || ''),
    candidateName: String(d.candidateName || ''),
    candidateEmail: String(d.candidateEmail || ''),
    candidatePhone: String(d.candidatePhone || ''),
    candidateHeadline: String(d.candidateHeadline || ''),
    candidateLocation: String(d.candidateLocation || ''),
    candidateExperienceYears: typeof d.candidateExperienceYears === 'number' ? d.candidateExperienceYears : 0,
    candidateSkills: Array.isArray(d.candidateSkills) ? d.candidateSkills.map(String) : [],
    resumeName: String(d.resumeName || 'Structured ABHI Resume'),
    coverNote: typeof d.coverNote === 'string' ? d.coverNote : undefined,
    status: (d.status as ApplicationStatus) || 'Applied',
    appliedDate: toIso(d.appliedAt),
    appliedAt: toIso(d.appliedAt),
    timeline: Array.isArray(d.timeline) ? d.timeline : [],
    interviewId: typeof d.interviewId === 'string' ? d.interviewId : undefined,
    matchScore: typeof d.matchScore === 'number' ? d.matchScore : undefined,
  };
}

export async function listCandidateApplicationsFromFirestore(
  candidateUid: string
): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('candidateId', '==', candidateUid),
    orderBy('appliedAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapApplicationDoc(docSnap.id, docSnap.data()));
}

export async function listEmployerApplicationsFromFirestore(
  employerOwnerUid: string
): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('employerOwnerUid', '==', employerOwnerUid),
    orderBy('appliedAt', 'desc'),
    limit(150)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapApplicationDoc(docSnap.id, docSnap.data()));
}

export async function listAllApplicationsAdminFromFirestore(maxItems = 150): Promise<Application[]> {
  const q = query(collection(db, 'applications'), orderBy('appliedAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => mapApplicationDoc(docSnap.id, docSnap.data()));
}

export async function submitApplicationToFirestore(params: {
  job: Job;
  employerOwnerUid: string;
  candidate: CandidateProfile;
  resumeName: string;
  resumeId?: string;
  coverNote?: string;
}): Promise<Application> {
  const applicationId = sanitizeFirestoreId(
    `app_${params.job.id}_${params.candidate.userId}`,
    'app'
  );
  const nowIso = new Date().toISOString();
  const initialTimeline = [{ status: 'Applied' as ApplicationStatus, date: nowIso }];

  await setDoc(
    doc(db, 'applications', applicationId),
    stripUndefined({
      id: applicationId,
      jobId: params.job.id,
      employerId: params.job.employerId,
      employerOwnerUid: params.employerOwnerUid,
      jobTitle: params.job.title.slice(0, 160),
      companyName: params.job.companyName.slice(0, 150),
      candidateId: params.candidate.userId,
      candidateName: (params.candidate.name || 'Candidate').slice(0, 120),
      candidateEmail: params.candidate.email.slice(0, 150),
      candidatePhone: params.candidate.phone ? params.candidate.phone.slice(0, 30) : undefined,
      candidateHeadline: (params.candidate.headline || '').slice(0, 200),
      candidateLocation: (params.candidate.location || 'India').slice(0, 140),
      candidateExperienceYears: Math.max(0, Math.min(60, Number(params.candidate.yearsOfExperience) || 0)),
      candidateSkills: (params.candidate.skills || []).slice(0, 40).map((s) => String(s).slice(0, 80)),
      resumeId: params.resumeId ? params.resumeId.slice(0, 128) : undefined,
      resumeName: (params.resumeName || 'Structured ABHI Resume').slice(0, 160),
      coverNote: params.coverNote ? params.coverNote.slice(0, 2000) : undefined,
      status: 'Applied',
      timeline: initialTimeline,
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return {
    id: applicationId,
    jobId: params.job.id,
    jobTitle: params.job.title,
    companyName: params.job.companyName,
    companyLogo: params.job.companyLogo,
    candidateId: params.candidate.userId,
    candidateName: params.candidate.name,
    candidateEmail: params.candidate.email,
    candidatePhone: params.candidate.phone,
    candidateHeadline: params.candidate.headline,
    candidateLocation: params.candidate.location,
    candidateExperienceYears: params.candidate.yearsOfExperience,
    candidateSkills: params.candidate.skills,
    resumeName: params.resumeName || 'Structured ABHI Resume',
    coverNote: params.coverNote,
    status: 'Applied',
    appliedDate: nowIso,
    appliedAt: nowIso,
    timeline: initialTimeline,
  };
}

export async function updateApplicationStatusInFirestore(params: {
  applicationId: string;
  status: ApplicationStatus;
  timeline: Application['timeline'];
  interviewId?: string;
}): Promise<void> {
  await updateDoc(
    doc(db, 'applications', params.applicationId),
    stripUndefined({
      status: params.status,
      timeline: params.timeline.slice(0, 30),
      interviewId: params.interviewId,
      updatedAt: serverTimestamp(),
    })
  );
}

/**
 * Private internal recruiter/admin notes strictly isolated under
 * /applications/{applicationId}/internal_notes/{noteId} (candidates are DENIED read/write).
 */
export async function listApplicationInternalNotes(applicationId: string): Promise<InternalNote[]> {
  const q = query(
    collection(db, 'applications', applicationId, 'internal_notes'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: String(d.id || docSnap.id),
      author: String(d.authorName || ''),
      text: String(d.text || ''),
      createdAt: toIso(d.createdAt),
    };
  });
}

export async function addApplicationInternalNote(params: {
  applicationId: string;
  authorUid: string;
  authorName: string;
  authorRole: 'employer' | 'recruitment_admin' | 'super_admin';
  text: string;
}): Promise<InternalNote> {
  const noteId = sanitizeFirestoreId(`note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'note');
  const nowIso = new Date().toISOString();
  await setDoc(doc(db, 'applications', params.applicationId, 'internal_notes', noteId), {
    id: noteId,
    applicationId: params.applicationId,
    authorUid: params.authorUid,
    authorName: params.authorName.trim().slice(0, 120),
    authorRole: params.authorRole,
    text: params.text.trim().slice(0, 2000),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return {
    id: noteId,
    author: params.authorName.trim(),
    text: params.text.trim(),
    createdAt: nowIso,
  };
}

export async function scheduleInterviewInFirestore(params: {
  interview: Omit<Interview, 'id'>;
  employerOwnerUid: string;
  createdByUid: string;
}): Promise<Interview> {
  const interviewId = sanitizeFirestoreId(`int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'int');
  await setDoc(
    doc(db, 'interviews', interviewId),
    stripUndefined({
      id: interviewId,
      applicationId: params.interview.applicationId,
      jobId: params.interview.jobId,
      jobTitle: params.interview.jobTitle.slice(0, 160),
      candidateId: params.interview.candidateId,
      candidateName: params.interview.candidateName.slice(0, 120),
      employerId: params.interview.employerId,
      employerOwnerUid: params.employerOwnerUid,
      companyName: params.interview.companyName.slice(0, 150),
      scheduledDate: params.interview.date.slice(0, 32),
      scheduledTime: params.interview.time.slice(0, 32),
      type: params.interview.type,
      meetingLink:
        params.interview.meetingLink && isSafeHttpUrl(params.interview.meetingLink)
          ? params.interview.meetingLink.slice(0, 500)
          : undefined,
      location: params.interview.location ? params.interview.location.slice(0, 300) : undefined,
      notes: params.interview.notes ? params.interview.notes.slice(0, 1500) : undefined,
      status: params.interview.status || 'Scheduled',
      createdBy: params.createdByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  return { ...params.interview, id: interviewId };
}

export async function listInterviewsAdminFromFirestore(maxItems = 100): Promise<Interview[]> {
  const q = query(collection(db, 'interviews'), orderBy('updatedAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: String(d.id || docSnap.id),
      applicationId: String(d.applicationId || ''),
      jobId: String(d.jobId || ''),
      jobTitle: String(d.jobTitle || ''),
      candidateId: String(d.candidateId || ''),
      candidateName: String(d.candidateName || ''),
      employerId: String(d.employerId || ''),
      companyName: String(d.companyName || ''),
      date: String(d.scheduledDate || ''),
      time: String(d.scheduledTime || ''),
      type: (d.type as Interview['type']) || 'Video',
      meetingLink: typeof d.meetingLink === 'string' ? d.meetingLink : undefined,
      location: typeof d.location === 'string' ? d.location : undefined,
      notes: typeof d.notes === 'string' ? d.notes : undefined,
      status: (d.status as Interview['status']) || 'Scheduled',
    };
  });
}

// ============================================================================
// WEBSITE CMS (/website_content/{key}) & PUBLIC SETTINGS (/public_settings/{key})
// ============================================================================

export async function listPublishedWebsiteContent(): Promise<WebsiteContentRecord[]> {
  const q = query(
    collection(db, 'website_content'),
    where('status', '==', 'published'),
    orderBy('sortOrder', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      key: String(d.key || docSnap.id),
      section: (d.section as WebsiteContentRecord['section']) || 'homepage',
      title: String(d.title || ''),
      subtitle: typeof d.subtitle === 'string' ? d.subtitle : undefined,
      body: String(d.body || ''),
      ctaLabel: typeof d.ctaLabel === 'string' ? d.ctaLabel : undefined,
      ctaUrl: typeof d.ctaUrl === 'string' ? d.ctaUrl : undefined,
      sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 0,
      status: (d.status as WebsiteContentRecord['status']) || 'published',
      updatedBy: String(d.updatedBy || ''),
      updatedAt: toIso(d.updatedAt),
    };
  });
}

export async function listAllWebsiteContentAdmin(): Promise<WebsiteContentRecord[]> {
  const snap = await getDocs(collection(db, 'website_content'));
  return snap.docs
    .map((docSnap) => {
      const d = docSnap.data();
      return {
        key: String(d.key || docSnap.id),
        section: (d.section as WebsiteContentRecord['section']) || 'homepage',
        title: String(d.title || ''),
        subtitle: typeof d.subtitle === 'string' ? d.subtitle : undefined,
        body: String(d.body || ''),
        ctaLabel: typeof d.ctaLabel === 'string' ? d.ctaLabel : undefined,
        ctaUrl: typeof d.ctaUrl === 'string' ? d.ctaUrl : undefined,
        sortOrder: typeof d.sortOrder === 'number' ? d.sortOrder : 0,
        status: (d.status as WebsiteContentRecord['status']) || 'draft',
        updatedBy: String(d.updatedBy || ''),
        updatedAt: toIso(d.updatedAt),
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertWebsiteContent(
  record: Omit<WebsiteContentRecord, 'updatedAt'>
): Promise<WebsiteContentRecord> {
  const key = sanitizeFirestoreId(record.key, 'cms');
  const ref = doc(db, 'website_content', key);
  const payload = stripUndefined({
    key,
    section: record.section,
    title: record.title.trim().slice(0, 200),
    subtitle: record.subtitle?.trim() ? record.subtitle.trim().slice(0, 400) : undefined,
    body: record.body.slice(0, 20000),
    ctaLabel: record.ctaLabel?.trim() ? record.ctaLabel.trim().slice(0, 80) : undefined,
    ctaUrl: record.ctaUrl?.trim() ? record.ctaUrl.trim().slice(0, 300) : undefined,
    sortOrder: Math.max(0, Math.min(1000, Math.round(record.sortOrder || 0))),
    status: record.status,
    updatedBy: record.updatedBy,
    updatedAt: serverTimestamp(),
  });
  await setDoc(ref, payload);
  return { ...record, key, updatedAt: new Date().toISOString() };
}

export async function deleteWebsiteContent(key: string): Promise<void> {
  await deleteDoc(doc(db, 'website_content', key));
}

export async function listPublicSettings(): Promise<PublicSettingRecord[]> {
  const snap = await getDocs(collection(db, 'public_settings'));
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      key: String(d.key || docSnap.id),
      label: String(d.label || docSnap.id),
      value: d.value && typeof d.value === 'object' ? d.value : {},
      updatedBy: String(d.updatedBy || ''),
      updatedAt: toIso(d.updatedAt),
    };
  });
}

export async function upsertPublicSetting(
  record: Omit<PublicSettingRecord, 'updatedAt'>
): Promise<PublicSettingRecord> {
  const key = sanitizeFirestoreId(record.key, 'setting');
  await setDoc(doc(db, 'public_settings', key), {
    key,
    label: record.label.trim().slice(0, 120),
    value: record.value,
    updatedBy: record.updatedBy,
    updatedAt: serverTimestamp(),
  });
  return { ...record, key, updatedAt: new Date().toISOString() };
}

// ============================================================================
// HIRING & COURSE ENQUIRIES (Public create-only; zero public reads)
// ============================================================================

export async function createHiringEnquiryInFirestore(
  input: Omit<HiringEnquiry, 'id' | 'status' | 'createdAt'>
): Promise<HiringEnquiry> {
  const id = sanitizeFirestoreId(`henq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'henq');
  const nowIso = new Date().toISOString();
  await setDoc(
    doc(db, 'hiring_enquiries', id),
    stripUndefined({
      id,
      companyName: input.companyName.trim().slice(0, 150),
      contactPerson: input.contactPerson.trim().slice(0, 120),
      businessEmail: input.businessEmail.trim().slice(0, 150),
      phoneNumber: input.phoneNumber.trim().slice(0, 30),
      jobTitle: input.jobTitle.trim().slice(0, 160),
      vacancies: Math.max(1, Math.min(1000, Number(input.vacancies) || 1)),
      jobLocation: input.jobLocation.trim().slice(0, 140),
      additionalRequirements: (input.additionalRequirements || '').trim().slice(0, 3000),
      status: 'New',
      submittedByUid: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  return { ...input, id, status: 'New', createdAt: nowIso };
}

export async function listHiringEnquiriesAdminFromFirestore(maxItems = 100): Promise<HiringEnquiry[]> {
  const q = query(collection(db, 'hiring_enquiries'), orderBy('createdAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: String(d.id || docSnap.id),
      companyName: String(d.companyName || ''),
      contactPerson: String(d.contactPerson || ''),
      businessEmail: String(d.businessEmail || ''),
      phoneNumber: String(d.phoneNumber || ''),
      jobTitle: String(d.jobTitle || ''),
      vacancies: typeof d.vacancies === 'number' ? d.vacancies : 1,
      jobLocation: String(d.jobLocation || ''),
      additionalRequirements: String(d.additionalRequirements || ''),
      status: (d.status as HiringEnquiry['status']) || 'New',
      assignedRecruiter: typeof d.assignedRecruiter === 'string' ? d.assignedRecruiter : undefined,
      internalNotes: typeof d.internalNotes === 'string' ? d.internalNotes : undefined,
      createdAt: toIso(d.createdAt),
    };
  });
}

export async function updateHiringEnquiryAdminInFirestore(
  enquiryId: string,
  updates: {
    status: HiringEnquiry['status'];
    assignedRecruiter?: string;
    internalNotes?: string;
  }
): Promise<void> {
  await updateDoc(
    doc(db, 'hiring_enquiries', enquiryId),
    stripUndefined({
      status: updates.status,
      assignedRecruiter: updates.assignedRecruiter?.slice(0, 128),
      internalNotes: updates.internalNotes?.slice(0, 2000),
      updatedAt: serverTimestamp(),
    })
  );
}

export async function createCourseEnquiryInFirestore(
  input: Omit<CourseEnquiry, 'id' | 'createdAt'>
): Promise<CourseEnquiry> {
  const id = sanitizeFirestoreId(`cenq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 'cenq');
  const nowIso = new Date().toISOString();
  await setDoc(
    doc(db, 'course_enquiries', id),
    stripUndefined({
      id,
      courseId: sanitizeFirestoreId(input.courseId, 'course'),
      courseTitle: input.courseTitle.trim().slice(0, 160),
      name: input.name.trim().slice(0, 120),
      email: input.email.trim().slice(0, 150),
      phone: input.phone.trim().slice(0, 30),
      message: input.message?.trim() ? input.message.trim().slice(0, 2000) : undefined,
      status: 'New',
      submittedByUid: auth.currentUser?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
  return { ...input, id, createdAt: nowIso };
}

export async function listCourseEnquiriesAdminFromFirestore(
  maxItems = 100
): Promise<(CourseEnquiry & { status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; internalNotes?: string })[]> {
  const q = query(collection(db, 'course_enquiries'), orderBy('createdAt', 'desc'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: String(d.id || docSnap.id),
      courseId: String(d.courseId || ''),
      courseTitle: String(d.courseTitle || ''),
      name: String(d.name || ''),
      email: String(d.email || ''),
      phone: String(d.phone || ''),
      message: typeof d.message === 'string' ? d.message : undefined,
      status: (d.status as 'New' | 'Contacted' | 'Enrolled' | 'Closed') || 'New',
      internalNotes: typeof d.internalNotes === 'string' ? d.internalNotes : undefined,
      createdAt: toIso(d.createdAt),
    };
  });
}

export async function updateCourseEnquiryAdminInFirestore(
  enquiryId: string,
  updates: { status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; internalNotes?: string }
): Promise<void> {
  await updateDoc(
    doc(db, 'course_enquiries', enquiryId),
    stripUndefined({
      status: updates.status,
      internalNotes: updates.internalNotes?.slice(0, 2000),
      updatedAt: serverTimestamp(),
    })
  );
}

// ============================================================================
// ADMIN-APPROVED CERTIFICATE ISSUANCE QUEUE (Starter-Tier Interim Workflow)
// ============================================================================
// Transparently writes issuanceMethod: 'admin_approved' with ZERO fake HMAC
// verificationSignature, matching firestore.rules Branch B exactly.

export function generateAdminApprovedCertificateId(): string {
  const year = new Date().getFullYear();
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ABHI-${year}-${suffix}`;
}

export async function submitCertificateApprovalRequest(params: {
  userId: string;
  candidateName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  completedLessonsCount: number;
  candidateNote?: string;
}): Promise<CertificateApprovalRequestRecord> {
  const requestId = sanitizeFirestoreId(`certreq_${params.userId}_${params.courseId}`, 'certreq');
  const nowIso = new Date().toISOString();

  await setDoc(
    doc(db, 'certificate_requests', requestId),
    stripUndefined({
      id: requestId,
      userId: params.userId,
      candidateName: params.candidateName.trim().slice(0, 120),
      courseId: params.courseId,
      courseSlug: params.courseSlug.slice(0, 128),
      courseTitle: params.courseTitle.slice(0, 160),
      completedLessonsCount: Math.max(0, Math.min(500, Math.round(params.completedLessonsCount))),
      candidateNote: params.candidateNote?.trim() ? params.candidateNote.trim().slice(0, 500) : undefined,
      status: 'pending',
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  return {
    id: requestId,
    userId: params.userId,
    candidateName: params.candidateName.trim(),
    courseId: params.courseId,
    courseSlug: params.courseSlug,
    courseTitle: params.courseTitle,
    completedLessonsCount: params.completedLessonsCount,
    candidateNote: params.candidateNote?.trim(),
    status: 'pending',
    requestedAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function listCertificateApprovalRequestsAdmin(
  maxItems = 100
): Promise<CertificateApprovalRequestRecord[]> {
  const q = query(
    collection(db, 'certificate_requests'),
    orderBy('requestedAt', 'desc'),
    limit(maxItems)
  );
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const d = docSnap.data();
    return {
      id: String(d.id || docSnap.id),
      userId: String(d.userId || ''),
      candidateName: String(d.candidateName || ''),
      courseId: String(d.courseId || ''),
      courseSlug: String(d.courseSlug || ''),
      courseTitle: String(d.courseTitle || ''),
      completedLessonsCount: typeof d.completedLessonsCount === 'number' ? d.completedLessonsCount : 0,
      candidateNote: typeof d.candidateNote === 'string' ? d.candidateNote : undefined,
      status: (d.status as CertificateApprovalRequestRecord['status']) || 'pending',
      reviewedBy: typeof d.reviewedBy === 'string' ? d.reviewedBy : undefined,
      reviewNote: typeof d.reviewNote === 'string' ? d.reviewNote : undefined,
      issuedCertificateId: typeof d.issuedCertificateId === 'string' ? d.issuedCertificateId : undefined,
      requestedAt: toIso(d.requestedAt),
      updatedAt: toIso(d.updatedAt),
    };
  });
}

/**
 * Atomically approves a certificate request using a Firestore writeBatch:
 * 1. Writes /public_certificates/{certificateId} (issuanceMethod: 'admin_approved')
 * 2. Writes /users/{userId}/certificates/{courseId} (issuanceMethod: 'admin_approved', NO fake verificationSignature)
 * 3. Marks /certificate_requests/{requestId} -> 'approved'
 */
export async function approveCertificateRequestAtomic(params: {
  request: CertificateApprovalRequestRecord;
  adminUid: string;
  reviewNote?: string;
}): Promise<{ certificateId: string }> {
  const certificateId = generateAdminApprovedCertificateId();
  const issueDate = new Date().toISOString();
  const batch = writeBatch(db);

  const publicRef = doc(db, 'public_certificates', certificateId);
  batch.set(publicRef, {
    certificateId,
    candidateName: params.request.candidateName.slice(0, 120),
    courseId: params.request.courseId,
    courseTitle: params.request.courseTitle.slice(0, 160),
    issueDate,
    status: 'valid',
    issuanceMethod: 'admin_approved',
    issuedAt: serverTimestamp(),
  });

  const userCertRef = doc(db, 'users', params.request.userId, 'certificates', params.request.courseId);
  batch.set(
    userCertRef,
    stripUndefined({
      certificateId,
      userId: params.request.userId,
      candidateName: params.request.candidateName.slice(0, 120),
      courseId: params.request.courseId,
      courseSlug: params.request.courseSlug.slice(0, 128),
      courseTitle: params.request.courseTitle.slice(0, 160),
      completionDate: issueDate,
      templateId: 'default_abhi_certificate',
      status: 'valid',
      issuanceMethod: 'admin_approved',
      approvedBy: params.adminUid,
      approvalNote: params.reviewNote?.trim() ? params.reviewNote.trim().slice(0, 500) : undefined,
      issuedAt: serverTimestamp(),
    })
  );

  const reqRef = doc(db, 'certificate_requests', params.request.id);
  batch.update(
    reqRef,
    stripUndefined({
      status: 'approved',
      reviewedBy: params.adminUid,
      reviewNote: params.reviewNote?.trim() ? params.reviewNote.trim().slice(0, 500) : undefined,
      issuedCertificateId: certificateId,
      updatedAt: serverTimestamp(),
    })
  );

  await batch.commit();
  return { certificateId };
}

export async function rejectCertificateRequest(params: {
  requestId: string;
  adminUid: string;
  reviewNote: string;
}): Promise<void> {
  await updateDoc(doc(db, 'certificate_requests', params.requestId), {
    status: 'rejected',
    reviewedBy: params.adminUid,
    reviewNote: params.reviewNote.trim().slice(0, 500),
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// USER ACCOUNT SUSPENSION / REACTIVATION (Support Admin & Super Admin)
// ============================================================================

export async function setUserAccountStatusInFirestore(
  targetUid: string,
  status: 'active' | 'suspended'
): Promise<void> {
  await updateDoc(doc(db, 'users', targetUid), {
    status,
    lastActive: new Date().toISOString(),
  });
}

// ============================================================================
// EFFICIENT FIRESTORE AGGREGATION ANALYTICS (getCountFromServer — ZERO FULL SCANS)
// ============================================================================

async function safeCount(qRef: any): Promise<number> {
  try {
    const snap = await getCountFromServer(qRef);
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function fetchPlatformAggregateCounts(): Promise<PlatformAggregateCounts> {
  const [
    candidates,
    employers,
    verifiedEmployers,
    publishedJobs,
    totalJobs,
    applications,
    interviews,
    hiringEnquiries,
    courseEnquiries,
    pendingCertificateRequests,
  ] = await Promise.all([
    safeCount(collection(db, 'candidates')),
    safeCount(collection(db, 'employers')),
    safeCount(query(collection(db, 'employers'), where('verificationStatus', '==', 'verified'))),
    safeCount(query(collection(db, 'jobs'), where('status', '==', 'published'))),
    safeCount(collection(db, 'jobs')),
    safeCount(collection(db, 'applications')),
    safeCount(collection(db, 'interviews')),
    safeCount(collection(db, 'hiring_enquiries')),
    safeCount(collection(db, 'course_enquiries')),
    safeCount(query(collection(db, 'certificate_requests'), where('status', '==', 'pending'))),
  ]);

  return {
    candidates,
    employers,
    verifiedEmployers,
    publishedJobs,
    totalJobs,
    applications,
    interviews,
    hiringEnquiries,
    courseEnquiries,
    pendingCertificateRequests,
    generatedAt: new Date().toISOString(),
    source: 'firestore_aggregation',
  };
}
