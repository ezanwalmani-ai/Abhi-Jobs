import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface AdminAuditEntry {
  id: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  targetType: 'candidate' | 'application' | 'document' | 'candidate_id_registry' | 'system';
  targetId: string;
  candidateCode?: string;
  summary: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export class AdminAuditStore {
  private readonly filePath: string;
  private entries: AdminAuditEntry[];

  constructor(storagePath?: string) {
    this.filePath = storagePath
      ? path.resolve(storagePath)
      : path.resolve(process.cwd(), '.learning-data', 'admin-audit-log.json');
    this.entries = this.load();
  }

  private load(): AdminAuditEntry[] {
    try {
      if (fs.existsSync(this.filePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore corrupted log
    }
    return [];
  }

  private persist(): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.entries, null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  public append(entry: Omit<AdminAuditEntry, 'id' | 'createdAt'>): AdminAuditEntry {
    const record: AdminAuditEntry = {
      ...entry,
      id: `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    this.entries = [record, ...this.entries].slice(0, 5000);
    this.persist();
    return record;
  }

  public list(filter?: { targetId?: string; limit?: number }): AdminAuditEntry[] {
    const limit = Math.min(Math.max(filter?.limit || 100, 1), 500);
    const items = filter?.targetId
      ? this.entries.filter((e) => e.targetId === filter.targetId)
      : this.entries;
    return items.slice(0, limit);
  }
}

export const defaultAdminAuditStore = new AdminAuditStore();
