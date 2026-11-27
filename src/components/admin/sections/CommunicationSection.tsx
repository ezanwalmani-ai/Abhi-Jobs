import React, { useState } from 'react';
import {
  Send,
  Bell,
  Info,
  Loader2,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { AdminDataTable } from '../AdminDataTable';
import {
  sendUserNotificationAdmin,
  listNotificationsForUserAdmin,
  type AdminNotificationRecord,
  type AdminUserRecord,
  type CourseEnquiry,
  type HiringEnquiry,
} from '../../../services/adminPanelService';
import {
  updateHiringEnquiryAdminInFirestore,
  updateCourseEnquiryAdminInFirestore,
} from '../../../services/recruitmentFirestoreService';
import type { SupportTicket } from '../../../types';
import type { AdminModuleId } from '../adminNavConfig';
import type { ResolvedAdminSession } from '../../../services/adminRbacService';

export interface CommunicationSectionProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  users: AdminUserRecord[];
  hiringEnquiries: HiringEnquiry[];
  courseEnquiries: (CourseEnquiry & { status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; internalNotes?: string })[];
  localSupportTickets: SupportTicket[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateLocalTicketStatus: (ticketId: string, status: SupportTicket['status']) => void;
  onNotify: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  onInspectRecord: (title: string, subtitle: string, record: Record<string, unknown>) => void;
}

export const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  activeModule,
  adminSession,
  users,
  hiringEnquiries,
  courseEnquiries,
  localSupportTickets,
  loading,
  onRefresh,
  onUpdateLocalTicketStatus,
  onNotify,
  onInspectRecord,
}) => {
  // Notifications state
  const [targetUserId, setTargetUserId] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<AdminNotificationRecord['type']>('system');
  const [notifLink, setNotifLink] = useState('');
  const [sending, setSending] = useState(false);
  const [inspectUid, setInspectUid] = useState('');
  const [userNotifs, setUserNotifs] = useState<AdminNotificationRecord[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Enquiries tab toggle
  const [enquiryTab, setEnquiryTab] = useState<'hiring' | 'course'>('hiring');
  const canExportCsv = Boolean(adminSession.permissions?.canExportCsv);

  const handleCsvExported = (rowCount: number, filename: string) => {
    onNotify(
      'success',
      'CSV Export Downloaded',
      `Exported ${rowCount} visible ${rowCount === 1 ? 'record' : 'records'} to ${filename}.`
    );
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim() || !notifTitle.trim() || !notifMessage.trim() || !adminSession.uid) {
      onNotify('warning', 'Missing Fields', 'Select or enter a target Firebase UID, title, and message.');
      return;
    }
    setSending(true);
    try {
      await sendUserNotificationAdmin({
        targetUserId: targetUserId.trim(),
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        link: notifLink.trim() || undefined,
        createdByUid: adminSession.uid,
      });
      onNotify(
        'success',
        'Notification Dispatched',
        `Written to /users/${targetUserId.trim()}/notifications.`
      );
      setNotifTitle('');
      setNotifMessage('');
      setNotifLink('');
      if (inspectUid === targetUserId.trim()) {
        const refreshed = await listNotificationsForUserAdmin(inspectUid);
        setUserNotifs(refreshed);
      }
    } catch (err: any) {
      onNotify('error', 'Dispatch Failed', err?.message || 'Firestore rejected the notification.');
    } finally {
      setSending(false);
    }
  };

  const handleLoadUserNotifications = async (uid: string) => {
    const clean = uid.trim();
    if (!clean) return;
    setInspectUid(clean);
    setLoadingNotifs(true);
    try {
      const items = await listNotificationsForUserAdmin(clean, 50);
      setUserNotifs(items);
    } catch (err: any) {
      onNotify('error', 'Lookup Failed', err?.message || 'Could not load notifications for that UID.');
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Notifications Module
  if (activeModule === 'comm-notifications') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form
          onSubmit={handleSendNotification}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5"
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[#102B4E]" />
            <h3 className="text-sm font-bold text-[#081D36]">
              Send Per-User Notification (/users/&#123;uid&#125;/notifications)
            </h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#081D36] mb-1">
              Target User (Firebase UID) *
            </label>
            <input
              type="text"
              required
              list="admin-users-datalist"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Select or paste Firebase UID..."
              className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
            />
            <datalist id="admin-users-datalist">
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Title *</label>
              <input
                type="text"
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Notification headline"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#081D36] mb-1">Category</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as AdminNotificationRecord['type'])}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white"
              >
                <option value="system">System</option>
                <option value="application">Application</option>
                <option value="interview">Interview</option>
                <option value="learning">Learning</option>
                <option value="message">Message</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#081D36] mb-1">Message *</label>
            <textarea
              rows={3}
              required
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Clear message displayed inside the user's notification bell..."
              className="w-full p-3 rounded-lg border border-slate-200 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#081D36] mb-1">
              Optional App Route Link
            </label>
            <input
              type="text"
              value={notifLink}
              onChange={(e) => setNotifLink(e.target.value)}
              placeholder="e.g. /applications or /learning"
              className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#102B4E] hover:bg-[#081D36] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Send Notification</span>
          </button>
        </form>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
            <h3 className="text-sm font-bold text-[#081D36] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#102B4E]" />
              <span>Inspect User Notification Inbox</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                list="admin-users-datalist"
                value={inspectUid}
                onChange={(e) => setInspectUid(e.target.value)}
                placeholder="Enter Firebase UID to inspect..."
                className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => handleLoadUserNotifications(inspectUid)}
                disabled={loadingNotifs}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#102B4E] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Load</span>
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100 flex-1 max-h-[420px] overflow-y-auto">
            {userNotifs.map((n) => (
              <div key={n.id} className="p-4 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#081D36]">{n.title}</span>
                  <span className={n.read ? 'text-slate-400' : 'text-emerald-700 font-semibold'}>
                    {n.read ? 'Read' : 'Unread'}
                  </span>
                </div>
                <p className="text-slate-600">{n.message}</p>
                <div className="text-[10px] font-mono text-slate-400">
                  {n.type} · {n.createdAt ? n.createdAt.slice(0, 16).replace('T', ' ') : '—'}
                </div>
              </div>
            ))}
            {userNotifs.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                Enter a user&apos;s Firebase UID above to view their Firestore notifications.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Support Tickets Module (Honest Disclosure of Firestore vs Local Context)
  if (activeModule === 'comm-support-tickets') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-950">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Firestore Collection Status: No /support_tickets Collection Deployed</p>
            <p className="text-amber-900 leading-relaxed">
              The current production <code className="font-mono text-xs">firestore.rules</code> governs{' '}
              <code className="font-mono text-xs">/hiring_enquiries</code> and{' '}
              <code className="font-mono text-xs">/course_enquiries</code> (managed live under Contact Enquiries). Any rows shown below come strictly from the browser session&apos;s legacy local context and are NOT persisted to Cloud Firestore until a dedicated <code className="font-mono text-xs">/support_tickets</code> schema &amp; ruleset is approved.
            </p>
          </div>
        </div>

        <AdminDataTable<SupportTicket>
          key="table-comm-support-tickets"
          rows={localSupportTickets}
          rowKey={(t) => t.id}
          csvExportFilename="support-tickets"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search local session tickets..."
          searchText={(t) => `${t.subject} ${t.userName} ${t.userEmail} ${t.description}`}
          columns={[
            {
              key: 'subject',
              header: 'Subject (Local Session Only)',
              csvColumns: [
                { header: 'Subject', value: (t) => t.subject },
                { header: 'User Name', value: (t) => t.userName },
                { header: 'User Email', value: (t) => t.userEmail },
              ],
              render: (t) => (
                <div>
                  <div className="font-semibold text-[#081D36]">{t.subject}</div>
                  <div className="text-[11px] text-slate-500">{t.userName} · {t.userEmail}</div>
                </div>
              ),
            },
            {
              key: 'priority',
              header: 'Priority',
              csvValue: (t) => t.priority,
              render: (t) => <span className="text-xs capitalize text-slate-700">{t.priority}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              csvValue: (t) => t.status,
              render: (t) => (
                <select
                  value={t.status}
                  onChange={(e) =>
                    onUpdateLocalTicketStatus(t.id, e.target.value as SupportTicket['status'])
                  }
                  className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              ),
            },
          ]}
          emptyTitle="No local support tickets"
          emptyDescription="Use Contact Enquiries to manage live Firestore hiring and course enquiries."
        />
      </div>
    );
  }

  // Contact Enquiries (Unified Hiring & Course Enquiries from Firestore)
  const canHiring = Boolean(adminSession.permissions?.canManageHiringEnquiries);
  const canCourse = Boolean(adminSession.permissions?.canManageCourseEnquiries);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEnquiryTab('hiring')}
          className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${
            enquiryTab === 'hiring'
              ? 'bg-[#102B4E] text-white border-[#102B4E]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Hiring Enquiries ({hiringEnquiries.length})
        </button>
        <button
          type="button"
          onClick={() => setEnquiryTab('course')}
          className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${
            enquiryTab === 'course'
              ? 'bg-[#102B4E] text-white border-[#102B4E]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Course Enquiries ({courseEnquiries.length})
        </button>
      </div>

      {enquiryTab === 'hiring' ? (
        <AdminDataTable<HiringEnquiry>
          key="table-comm-hiring-enquiries"
          rows={hiringEnquiries}
          rowKey={(e) => e.id}
          loading={loading}
          csvExportFilename="hiring-enquiries"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search hiring enquiries..."
          searchText={(e) => `${e.companyName} ${e.contactPerson} ${e.businessEmail} ${e.jobTitle}`}
          columns={[
            {
              key: 'company',
              header: 'Company & Role',
              csvColumns: [
                { header: 'Company', value: (e) => e.companyName },
                { header: 'Job Title', value: (e) => e.jobTitle },
                { header: 'Location', value: (e) => e.jobLocation },
              ],
              render: (e) => (
                <div>
                  <div className="font-semibold text-[#081D36]">{e.companyName}</div>
                  <div className="text-[11px] text-slate-500">{e.jobTitle} · {e.jobLocation}</div>
                </div>
              ),
            },
            {
              key: 'contact',
              header: 'Contact',
              csvColumns: [
                { header: 'Contact Person', value: (e) => e.contactPerson },
                { header: 'Business Email', value: (e) => e.businessEmail },
                { header: 'Phone', value: (e) => e.phoneNumber || '' },
              ],
              render: (e) => (
                <div className="text-xs">
                  <div>{e.contactPerson}</div>
                  <div className="text-[11px] text-slate-500">{e.businessEmail} · {e.phoneNumber}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              csvValue: (e) => e.status,
              render: (e) =>
                canHiring ? (
                  <select
                    value={e.status}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={async (ev) => {
                      const next = ev.target.value as HiringEnquiry['status'];
                      try {
                        await updateHiringEnquiryAdminInFirestore(e.id, { status: next });
                        onNotify('success', 'Hiring Enquiry Updated', `${e.companyName} → ${next}`);
                        await onRefresh();
                      } catch (err: any) {
                        onNotify('error', 'Update Failed', err?.message || 'Firestore rejected update.');
                      }
                    }}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-slate-700">{e.status}</span>
                ),
            },
          ]}
          onRowClick={(e) =>
            onInspectRecord(e.companyName, `Hiring Enquiry · ${e.status}`, e as unknown as Record<string, unknown>)
          }
          emptyTitle="No hiring enquiries found"
          emptyDescription="Employer enquiries submitted to /hiring_enquiries will appear here."
        />
      ) : (
        <AdminDataTable<CourseEnquiry & { status: 'New' | 'Contacted' | 'Enrolled' | 'Closed'; internalNotes?: string }>
          key="table-comm-course-enquiries"
          rows={courseEnquiries}
          rowKey={(e) => e.id}
          loading={loading}
          csvExportFilename="course-enquiries"
          canExportCsv={canExportCsv}
          onCsvExported={handleCsvExported}
          searchPlaceholder="Search course enquiries..."
          searchText={(e) => `${e.courseTitle} ${e.name} ${e.email} ${e.phone}`}
          columns={[
            {
              key: 'learner',
              header: 'Enquirer & Course',
              csvColumns: [
                { header: 'Enquirer Name', value: (e) => e.name },
                { header: 'Course', value: (e) => e.courseTitle },
              ],
              render: (e) => (
                <div>
                  <div className="font-semibold text-[#081D36]">{e.name}</div>
                  <div className="text-[11px] text-slate-500">{e.courseTitle}</div>
                </div>
              ),
            },
            {
              key: 'contact',
              header: 'Contact',
              csvColumns: [
                { header: 'Email', value: (e) => e.email },
                { header: 'Phone', value: (e) => e.phone || '' },
              ],
              render: (e) => (
                <div className="text-xs text-slate-600">
                  {e.email} · {e.phone}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              csvValue: (e) => e.status,
              render: (e) =>
                canCourse ? (
                  <select
                    value={e.status}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={async (ev) => {
                      const next = ev.target.value as 'New' | 'Contacted' | 'Enrolled' | 'Closed';
                      try {
                        await updateCourseEnquiryAdminInFirestore(e.id, { status: next });
                        onNotify('success', 'Course Enquiry Updated', `${e.name} → ${next}`);
                        await onRefresh();
                      } catch (err: any) {
                        onNotify('error', 'Update Failed', err?.message || 'Firestore rejected update.');
                      }
                    }}
                    className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Enrolled">Enrolled</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-slate-700">{e.status}</span>
                ),
            },
          ]}
          onRowClick={(e) =>
            onInspectRecord(e.name, `Course Enquiry · ${e.courseTitle}`, e as unknown as Record<string, unknown>)
          }
          emptyTitle="No course enquiries found"
          emptyDescription="Learner enquiries submitted to /course_enquiries will appear here."
        />
      )}
    </div>
  );
};
