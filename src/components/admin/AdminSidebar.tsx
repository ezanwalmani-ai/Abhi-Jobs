import React from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  GraduationCap,
  Mail,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import {
  canAccessAdminModule,
  getNavItemById,
  type AdminModuleId,
} from './adminNavConfig';
import type { ResolvedAdminSession } from '../../services/adminRbacService';

export interface AdminSidebarCounts {
  users?: number;
  jobs?: number;
  applications?: number;
  enrolments?: number;
  enquiries?: number;
}

interface AdminSidebarProps {
  activeModule: AdminModuleId;
  adminSession: ResolvedAdminSession;
  collapsed: boolean;
  mobileOpen: boolean;
  counts?: AdminSidebarCounts;
  onSelectModule: (id: AdminModuleId) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onOpenPublicSite: () => void;
  onSignOut: () => void;
}

interface PrimaryNavItem {
  id: 'overview' | 'users' | 'jobs' | 'applications' | 'learning' | 'enquiries' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  candidateModules: AdminModuleId[];
  matches: (moduleId: AdminModuleId) => boolean;
  countKey?: keyof AdminSidebarCounts;
}

const PRIMARY_NAV_ITEMS: PrimaryNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    candidateModules: ['overview-dashboard', 'overview-analytics', 'overview-reports'],
    matches: (m) => m.startsWith('overview-'),
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    candidateModules: [
      'people-users',
      'people-candidates',
      'people-employers',
      'people-account-status',
      'people-user-details',
    ],
    matches: (m) => m.startsWith('people-') && m !== 'people-admins',
    countKey: 'users',
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    candidateModules: [
      'recruitment-jobs-all',
      'recruitment-jobs-published',
      'recruitment-jobs-pending',
      'recruitment-jobs-closed',
      'recruitment-companies',
      'recruitment-saved-jobs',
    ],
    matches: (m) =>
      m.startsWith('recruitment-jobs-') ||
      m === 'recruitment-companies' ||
      m === 'recruitment-saved-jobs',
    countKey: 'jobs',
  },
  {
    id: 'applications',
    label: 'Applications',
    icon: FileText,
    candidateModules: ['recruitment-applications', 'recruitment-interviews'],
    matches: (m) => m === 'recruitment-applications' || m === 'recruitment-interviews',
    countKey: 'applications',
  },
  {
    id: 'learning',
    label: 'Learning',
    icon: GraduationCap,
    candidateModules: [
      'learning-enrolments',
      'learning-dashboard',
      'learning-courses',
      'learning-quizzes',
      'learning-attempts',
      'learning-certificates',
      'learning-cert-verify',
    ],
    matches: (m) => m.startsWith('learning-'),
    countKey: 'enrolments',
  },
  {
    id: 'enquiries',
    label: 'Enquiries',
    icon: Mail,
    candidateModules: [
      'comm-contact-enquiries',
      'recruitment-enquiries',
      'comm-notifications',
      'comm-support-tickets',
    ],
    matches: (m) => m.startsWith('comm-') || m === 'recruitment-enquiries',
    countKey: 'enquiries',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Sliders,
    candidateModules: [
      'platform-website-settings',
      'platform-admin-roles',
      'people-admins',
      'platform-admin-activity',
      'platform-system-health',
      'platform-data-management',
    ],
    matches: (m) => m.startsWith('platform-') || m === 'people-admins',
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeModule,
  adminSession,
  collapsed,
  mobileOpen,
  counts,
  onSelectModule,
  onToggleCollapse,
  onCloseMobile,
  onOpenPublicSite,
  onSignOut,
}) => {
  const visibleItems = PRIMARY_NAV_ITEMS.map((item) => {
    const firstAllowed = item.candidateModules.find((modId) =>
      canAccessAdminModule(adminSession.permissions, getNavItemById(modId))
    );
    return firstAllowed ? { ...item, targetModule: firstAllowed } : null;
  }).filter((item): item is PrimaryNavItem & { targetModule: AdminModuleId } => item !== null);

  const renderSidebarInner = (isMobileDrawer: boolean) => {
    const isCompact = collapsed && !isMobileDrawer;

    return (
      <div className="flex flex-col h-full bg-white text-[#475569] select-none">
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-[#E5EAF0] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#102B4E] text-white font-bold text-xs flex items-center justify-center shrink-0 tracking-tight">
              AJ
            </div>
            {!isCompact && (
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#102B4E] tracking-[-0.015em] truncate">
                  ABHI JOBS
                </div>
                <div className="text-[11px] font-medium text-[#64748B] truncate">Admin Console</div>
              </div>
            )}
          </div>

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="min-w-[44px] min-h-[44px] -mr-2 rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="min-w-[34px] min-h-[34px] rounded-lg text-[#64748B] hover:text-[#102B4E] hover:bg-[#F6F8FB] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Clean 7-Item Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Admin navigation"
        >
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matches(activeModule);
            const countVal = item.countKey && counts ? counts[item.countKey] : undefined;

            return (
              <button
                key={item.id}
                type="button"
                title={isCompact ? item.label : undefined}
                onClick={() => {
                  onSelectModule(item.targetModule);
                  if (isMobileDrawer) onCloseMobile();
                }}
                className={`w-full min-h-[42px] px-3 rounded-lg text-[13px] flex items-center transition-colors cursor-pointer ${
                  isCompact ? 'justify-center px-0' : 'justify-between gap-2.5'
                } ${
                  isActive
                    ? 'bg-[#102B4E] text-white font-semibold shadow-2xs'
                    : 'text-[#475569] hover:bg-[#F6F8FB] hover:text-[#102B4E] font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-[#F47A24]' : 'text-[#64748B]'
                    }`}
                  />
                  {!isCompact && <span className="truncate">{item.label}</span>}
                </span>

                {!isCompact && typeof countVal === 'number' && (
                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 ${
                      isActive ? 'text-slate-200' : 'text-[#64748B]'
                    }`}
                  >
                    {countVal}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Minimal Footer */}
        <div className="p-3 border-t border-[#E5EAF0] space-y-1 shrink-0 bg-[#FAFBFD]">
          {!isCompact && (
            <div className="px-2.5 py-2 mb-1">
              <div className="text-xs font-semibold text-[#102B4E] truncate">
                {adminSession.displayName || 'Administrator'}
              </div>
              <div className="text-[11px] text-[#64748B] truncate">
                {adminSession.permissions?.label || adminSession.role}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenPublicSite}
            title="View Website"
            className={`w-full min-h-[38px] px-2.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#102B4E] hover:bg-white flex items-center gap-2.5 transition-colors cursor-pointer ${
              isCompact ? 'justify-center px-0' : ''
            }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-[#64748B]" />
            {!isCompact && <span>View Website</span>}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            title="Sign Out"
            className={`w-full min-h-[38px] px-2.5 rounded-lg text-xs font-medium text-[#475569] hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer ${
              isCompact ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#64748B]" />
            {!isCompact && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[#E5EAF0] bg-white transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[236px]'
        }`}
      >
        {renderSidebarInner(false)}
      </aside>

      {/* Mobile & Tablet Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#081D36]/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] max-w-[82vw] h-full shadow-xl border-r border-[#E5EAF0] bg-white">
            {renderSidebarInner(true)}
          </aside>
        </div>
      )}
    </>
  );
};
