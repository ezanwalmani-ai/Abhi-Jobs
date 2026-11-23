/**
 * SERVER-ONLY File-Backed Learning Data Store for Learn with ABHI.
 *
 * SECURITY BOUNDARY:
 * - NEVER import this file in client-side `src/` code.
 * - Persists authoritative quiz banks, active sessions (with option shuffles),
 *   lesson progress, graded attempts, module unlocks, and certificates on the
 *   server filesystem (`.learning-data/store.json`) using atomic writes.
 * - Used when external cloud database credentials are not yet active (e.g.
 *   before Firebase Blaze upgrade or when Supabase learning storage is inactive),
 *   keeping answer keys and grading strictly server-side and surviving restarts.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  AssessmentType,
  LearningStoreDiagnostics,
  LearningStoreRepository,
  PersistedAssessmentConfig,
  PersistedAssessmentSession,
  PersistedAttemptRecord,
  PersistedCertificateRecord,
  PersistedCourseDefinition,
  PersistedModuleUnlockRecord,
} from './learningStore';
import { isSigningSecretConfigured } from './learningStore';

interface FileStoreState {
  courses: Record<string, PersistedCourseDefinition>;
  assessments: Record<string, PersistedAssessmentConfig>;
  sessions: Record<string, PersistedAssessmentSession>;
  lessonProgress: Record<string, string[]>; // key: `${userId}::${courseId}`
  attempts: Record<string, PersistedAttemptRecord>;
  moduleUnlocks: Record<string, PersistedModuleUnlockRecord>; // key: `${userId}::${courseId}`
  certificates: Record<string, PersistedCertificateRecord>; // key: certificateId
  updatedAt: string;
}

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), '.learning-data');
const DEFAULT_STORE_FILE = path.join(DEFAULT_DATA_DIR, 'store.json');

function createEmptyState(): FileStoreState {
  return {
    courses: {},
    assessments: {},
    sessions: {},
    lessonProgress: {},
    attempts: {},
    moduleUnlocks: {},
    certificates: {},
    updatedAt: new Date().toISOString(),
  };
}

function compositeKey(userId: string, courseId: string): string {
  return `${userId}::${courseId}`;
}

export class FileLearningStoreRepository implements LearningStoreRepository {
  readonly backendName = 'server-file-store';
  readonly isProductionDurable = false;

  private readonly filePath: string;
  private state: FileStoreState;

  constructor(customPath?: string) {
    this.filePath = customPath || DEFAULT_STORE_FILE;
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): FileStoreState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<FileStoreState>;
        return {
          courses: parsed.courses && typeof parsed.courses === 'object' ? parsed.courses : {},
          assessments:
            parsed.assessments && typeof parsed.assessments === 'object' ? parsed.assessments : {},
          sessions: parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {},
          lessonProgress:
            parsed.lessonProgress && typeof parsed.lessonProgress === 'object'
              ? parsed.lessonProgress
              : {},
          attempts: parsed.attempts && typeof parsed.attempts === 'object' ? parsed.attempts : {},
          moduleUnlocks:
            parsed.moduleUnlocks && typeof parsed.moduleUnlocks === 'object'
              ? parsed.moduleUnlocks
              : {},
          certificates:
            parsed.certificates && typeof parsed.certificates === 'object'
              ? parsed.certificates
              : {},
          updatedAt:
            typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[fileLearningStore] Failed to load existing store file; starting clean:', err);
    }
    return createEmptyState();
  }

  private persist(): void {
    this.state.updatedAt = new Date().toISOString();
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf8');
    fs.renameSync(tempPath, this.filePath);
  }

  // Courses
  async getCourseDefinition(courseId: string): Promise<PersistedCourseDefinition | undefined> {
    const rec = this.state.courses[courseId];
    return rec ? { ...rec } : undefined;
  }

  async upsertCourseDefinition(
    record: PersistedCourseDefinition
  ): Promise<PersistedCourseDefinition> {
    this.state.courses[record.courseId] = { ...record };
    this.persist();
    return { ...record };
  }

  // Assessment configs
  async getAssessmentConfigById(id: string): Promise<PersistedAssessmentConfig | undefined> {
    const cfg = this.state.assessments[id];
    return cfg ? structuredClone(cfg) : undefined;
  }

  async listCourseAssessments(courseId: string): Promise<PersistedAssessmentConfig[]> {
    return Object.values(this.state.assessments)
      .filter((cfg) => cfg.courseId === courseId)
      .map((cfg) => structuredClone(cfg));
  }

  async upsertAssessmentConfig(
    config: PersistedAssessmentConfig
  ): Promise<PersistedAssessmentConfig> {
    this.state.assessments[config.id] = structuredClone(config);
    this.persist();
    return structuredClone(config);
  }

  // Assessment sessions
  async createAssessmentSession(
    session: PersistedAssessmentSession
  ): Promise<PersistedAssessmentSession> {
    this.state.sessions[session.sessionId] = structuredClone(session);
    this.persist();
    return structuredClone(session);
  }

  async getAssessmentSession(sessionId: string): Promise<PersistedAssessmentSession | undefined> {
    const s = this.state.sessions[sessionId];
    return s ? structuredClone(s) : undefined;
  }

  async markAssessmentSessionSubmitted(sessionId: string, userId: string): Promise<boolean> {
    const existing = this.state.sessions[sessionId];
    if (!existing || existing.userId !== userId || existing.submitted) {
      return false;
    }
    existing.submitted = true;
    this.persist();
    return true;
  }

  async pruneExpiredSessions(nowIso: string): Promise<number> {
    const nowMs = new Date(nowIso).getTime();
    let removed = 0;
    for (const [id, sess] of Object.entries(this.state.sessions)) {
      const expMs = new Date(sess.expiresAt).getTime();
      if (sess.submitted || Number.isNaN(expMs) || expMs <= nowMs) {
        delete this.state.sessions[id];
        removed += 1;
      }
    }
    if (removed > 0) this.persist();
    return removed;
  }

  // Lesson progress
  async getLessonProgress(userId: string, courseId: string): Promise<string[]> {
    const list = this.state.lessonProgress[compositeKey(userId, courseId)];
    return Array.isArray(list) ? [...list] : [];
  }

  async upsertLessonProgress(
    userId: string,
    courseId: string,
    completedLessonIds: string[]
  ): Promise<string[]> {
    const unique = Array.from(
      new Set(
        completedLessonIds
          .filter((id) => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim().slice(0, 128))
      )
    ).slice(0, 200);
    this.state.lessonProgress[compositeKey(userId, courseId)] = unique;
    this.persist();
    return [...unique];
  }

  // Attempts
  async insertAttempt(attempt: PersistedAttemptRecord): Promise<PersistedAttemptRecord> {
    this.state.attempts[attempt.id] = structuredClone(attempt);
    this.persist();
    return structuredClone(attempt);
  }

  async countCandidateAttempts(
    userId: string,
    courseId: string,
    assessmentType: AssessmentType,
    moduleId?: string
  ): Promise<number> {
    let count = 0;
    for (const att of Object.values(this.state.attempts)) {
      if (
        att.userId === userId &&
        att.courseId === courseId &&
        att.assessmentType === assessmentType &&
        (assessmentType === 'final_assessment' || att.moduleId === moduleId)
      ) {
        count += 1;
      }
    }
    return count;
  }

  async listAttempts(filters?: {
    courseId?: string;
    assessmentType?: string;
    userId?: string;
  }): Promise<PersistedAttemptRecord[]> {
    return Object.values(this.state.attempts)
      .filter((att) => {
        if (filters?.userId && att.userId !== filters.userId) return false;
        if (filters?.courseId && filters.courseId !== 'all' && att.courseId !== filters.courseId) {
          return false;
        }
        if (
          filters?.assessmentType &&
          filters.assessmentType !== 'all' &&
          att.assessmentType !== filters.assessmentType
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .map((att) => structuredClone(att));
  }

  async deleteAttemptById(attemptId: string): Promise<boolean> {
    if (!this.state.attempts[attemptId]) return false;
    delete this.state.attempts[attemptId];
    this.persist();
    return true;
  }

  // Module unlocks
  async getModuleUnlock(
    userId: string,
    courseId: string
  ): Promise<PersistedModuleUnlockRecord | undefined> {
    const rec = this.state.moduleUnlocks[compositeKey(userId, courseId)];
    return rec ? structuredClone(rec) : undefined;
  }

  async upsertModuleUnlock(
    record: PersistedModuleUnlockRecord
  ): Promise<PersistedModuleUnlockRecord> {
    this.state.moduleUnlocks[compositeKey(record.userId, record.courseId)] =
      structuredClone(record);
    this.persist();
    return structuredClone(record);
  }

  // Certificates
  async getCertificateByUserCourse(
    userId: string,
    courseId: string
  ): Promise<PersistedCertificateRecord | undefined> {
    const found = Object.values(this.state.certificates).find(
      (c) => c.userId === userId && c.courseId === courseId
    );
    return found ? structuredClone(found) : undefined;
  }

  async getCertificateById(certificateId: string): Promise<PersistedCertificateRecord | undefined> {
    const found = this.state.certificates[certificateId];
    return found ? structuredClone(found) : undefined;
  }

  async listCertificatesByUser(userId: string): Promise<PersistedCertificateRecord[]> {
    return Object.values(this.state.certificates)
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .map((c) => structuredClone(c));
  }

  async insertCertificate(cert: PersistedCertificateRecord): Promise<PersistedCertificateRecord> {
    this.state.certificates[cert.certificateId] = structuredClone(cert);
    this.persist();
    return structuredClone(cert);
  }

  // Reset & Diagnostics
  async resetAllLearningData(): Promise<{
    clearedConfigs: number;
    clearedAttempts: number;
    clearedProgressEntries: number;
    clearedCertificates: number;
    clearedCourseDefinitions: number;
    clearedSessions: number;
    clearedModuleUnlocks: number;
  }> {
    const summary = {
      clearedConfigs: Object.keys(this.state.assessments).length,
      clearedAttempts: Object.keys(this.state.attempts).length,
      clearedProgressEntries: Object.keys(this.state.lessonProgress).length,
      clearedCertificates: Object.keys(this.state.certificates).length,
      clearedCourseDefinitions: Object.keys(this.state.courses).length,
      clearedSessions: Object.keys(this.state.sessions).length,
      clearedModuleUnlocks: Object.keys(this.state.moduleUnlocks).length,
    };
    this.state = createEmptyState();
    this.persist();
    return summary;
  }

  async getDiagnostics(): Promise<LearningStoreDiagnostics> {
    return {
      backend: this.backendName,
      isProductionDurable: this.isProductionDurable,
      supabaseConfigured: false,
      signingSecretConfigured: isSigningSecretConfigured(),
      connected: true,
      courseDefinitionsCount: Object.keys(this.state.courses).length,
      quizConfigsCount: Object.keys(this.state.assessments).length,
      attemptsCount: Object.keys(this.state.attempts).length,
      lessonProgressEntriesCount: Object.keys(this.state.lessonProgress).length,
      moduleUnlocksCount: Object.keys(this.state.moduleUnlocks).length,
      certificatesCount: Object.keys(this.state.certificates).length,
      updatedAt: this.state.updatedAt,
    };
  }
}
