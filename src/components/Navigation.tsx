import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AbhiJobsLogo } from './AbhiJobsLogo';
import { useApp } from '../context/AppContext';
import { EASE_PREMIUM } from '../lib/motion';
import {
  Bell,
  Briefcase,
  Building2,
  Users,
  Menu,
  X,
  CheckCheck,
  User,
  Bookmark,
  GraduationCap,
  LayoutDashboard,
  Plus,
  CheckCircle2,
  ChevronDown,
  LogOut,
  LogIn,
  UserPlus,
  Settings,
  HelpCircle,
  BarChart3,
  ExternalLink,
  FileText,
} from 'lucide-react';

export interface NavigationProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, navigate }) => {
  const {
    currentRole,
    currentUser,
    currentCandidate,
    currentEmployer,
    logout,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentRoute]);

  const isAuthenticated = Boolean(currentUser);
  const isJobSeeker = isAuthenticated && (currentRole === 'job_seeker' || (currentRole as any) === 'candidate');
  const isEmployer = isAuthenticated && currentRole === 'employer';
  const isAdmin = isAuthenticated && currentRole === 'admin';

  // Navigation logo click
  const handleLogoClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (isJobSeeker) {
      navigate('/dashboard');
    } else if (isEmployer) {
      navigate('/employer/dashboard');
    } else if (isAdmin) {
      navigate('/admin');
    } else {
      if (currentRoute === '/' || currentRoute === '') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
    }
  };

  const handleSignOut = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  // Filter unread notifications strictly for current role
  const unreadCount = notifications.filter(
    (n) =>
      !n.read &&
      (n.targetRole === currentRole ||
        (n.targetRole === 'candidate' && isJobSeeker) ||
        (n.targetRole === 'job_seeker' && isJobSeeker) ||
        n.targetRole === 'all')
  ).length;

  // 1. PUBLIC / LOGGED-OUT NAVIGATION LINKS
  // Home | About | Find Jobs | Hire Talent
  const guestLinks = [
    {
      label: 'Home',
      action: () => navigate('/'),
      isActive: currentRoute === '/' || currentRoute === '',
    },
    {
      label: 'About',
      action: () => navigate('/about'),
      isActive: currentRoute === '/about',
    },
    {
      label: 'Find Jobs',
      action: () => navigate('/jobs'),
      isActive: currentRoute === '/jobs' || currentRoute.startsWith('/jobs/'),
    },
    {
      label: 'Hire Talent',
      action: () => navigate('/register/employer'),
      isActive: currentRoute === '/register/employer' || currentRoute === '/employers' || currentRoute === '/for-employers',
    },
  ];

  // 2. JOB SEEKER NAVIGATION LINKS
  // Home | Find Jobs | My Applications | Saved Jobs | My Learning | My Dashboard
  const jobSeekerLinks = [
    {
      label: 'Home',
      action: () => navigate('/'),
      isActive: currentRoute === '/' || currentRoute === '',
      icon: Briefcase,
    },
    {
      label: 'Find Jobs',
      action: () => navigate('/jobs'),
      isActive: currentRoute === '/jobs' || currentRoute.startsWith('/jobs/'),
      icon: Briefcase,
    },
    {
      label: 'My Applications',
      action: () => navigate('/applications'),
      isActive:
        currentRoute === '/applications' ||
        currentRoute.startsWith('/applications/') ||
        currentRoute === '/job-seeker/applications',
      icon: CheckCircle2,
    },
    {
      label: 'Saved Jobs',
      action: () => navigate('/saved-jobs'),
      isActive: currentRoute === '/saved-jobs' || currentRoute === '/job-seeker/saved-jobs',
      icon: Bookmark,
    },
    {
      label: 'My Learning',
      action: () => navigate('/learning'),
      isActive: currentRoute === '/learning' || currentRoute === '/job-seeker/upskill',
      icon: GraduationCap,
    },
    {
      label: 'My Dashboard',
      action: () => navigate('/dashboard'),
      isActive:
        currentRoute === '/dashboard' ||
        currentRoute === '/job-seeker/dashboard' ||
        currentRoute === '/candidate/dashboard',
      icon: LayoutDashboard,
    },
  ];

  // 3. EMPLOYER NAVIGATION LINKS
  // Home | Find Talent | Post a Job | Applications | My Company | Employer Dashboard
  const employerLinks = [
    {
      label: 'Home',
      action: () => navigate('/'),
      isActive: currentRoute === '/' || currentRoute === '',
      icon: Building2,
    },
    {
      label: 'Find Talent',
      action: () => navigate('/candidates'),
      isActive: currentRoute === '/candidates' || currentRoute === '/employer/candidates',
      icon: Users,
    },
    {
      label: 'Post a Job',
      action: () => navigate('/employer/post-job'),
      isActive: currentRoute === '/employer/post-job',
      icon: Plus,
    },
    {
      label: 'Applications',
      action: () => navigate('/employer/applications'),
      isActive: currentRoute === '/employer/applications',
      icon: CheckCircle2,
    },
    {
      label: 'My Company',
      action: () => navigate('/employer/profile'),
      isActive: currentRoute === '/employer/profile' || currentRoute === '/employer/company-profile',
      icon: Building2,
    },
    {
      label: 'Employer Dashboard',
      action: () => navigate('/employer/dashboard'),
      isActive: currentRoute === '/employer/dashboard',
      icon: LayoutDashboard,
    },
  ];

  // 4. ADMIN LINKS
  const adminLinks = [
    {
      label: 'Admin Console',
      action: () => navigate('/admin'),
      isActive: currentRoute === '/admin',
      icon: LayoutDashboard,
    },
    {
      label: 'Jobs Registry',
      action: () => navigate('/jobs'),
      isActive: currentRoute === '/jobs' || currentRoute.startsWith('/jobs/'),
      icon: Briefcase,
    },
    {
      label: 'Talent Directory',
      action: () => navigate('/candidates'),
      isActive: currentRoute === '/candidates',
      icon: Users,
    },
  ];

  const activeLinks = isJobSeeker
    ? jobSeekerLinks
    : isEmployer
    ? employerLinks
    : isAdmin
    ? adminLinks
    : guestLinks;

  const displayName = isJobSeeker
    ? currentCandidate?.name || currentUser?.name || 'Job Seeker'
    : isEmployer
    ? currentEmployer?.name || currentUser?.name || 'Employer'
    : currentUser?.name || 'User';

  const userInitials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E4E7EC] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20 gap-4 min-w-0">
          {/* ========================================= */}
          {/* LEFT: Official Brand Logo                 */}
          {/* ========================================= */}
          <div className="flex items-center shrink-0">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 group cursor-pointer focus:outline-hidden text-left"
              aria-label="ABHI JOBS Home"
            >
              <AbhiJobsLogo
                variant="horizontal"
                theme="color"
                size="md"
                showTagline={true}
                className="transition-transform group-hover:scale-[1.01]"
              />
            </button>
          </div>

          {/* ========================================= */}
          {/* CENTER: Desktop Role-Based Navigation     */}
          {/* ========================================= */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {activeLinks.map((link) => {
              const isActive = link.isActive;
              return (
                <button
                  key={link.label}
                  onClick={link.action}
                  className={`relative group px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-[#FF2B1A] font-semibold bg-red-50/70'
                      : 'text-[#667085] hover:text-[#101828]'
                  }`}
                >
                  <span>{link.label}</span>
                  {!isActive && (
                    <span className="absolute bottom-1 left-3 right-3 h-[2px] bg-[#FF2B1A] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-full pointer-events-none" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ========================================= */}
          {/* RIGHT: User Actions & Auth                */}
          {/* ========================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Employer Quick Action: Post a Job */}
                {isEmployer && (
                  <button
                    onClick={() => navigate('/employer/post-job')}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#004D40] hover:bg-[#00382f] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Post a Job</span>
                  </button>
                )}

                {/* Notifications Flyout */}
                <div className="relative shrink-0" ref={notifRef}>
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setUserMenuOpen(false);
                    }}
                    className="relative p-2.5 rounded-xl text-[#667085] hover:text-[#101828] hover:bg-[#F7F8FA] border border-transparent hover:border-[#E4E7EC] transition-colors cursor-pointer flex items-center justify-center focus:outline-hidden min-w-[40px] min-h-[40px]"
                    aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                  >
                    <div className="relative flex items-center justify-center">
                      <Bell className="w-5 h-5 shrink-0" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-[#FF2B1A] text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs pointer-events-none leading-none">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -4 }}
                        transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-[#E4E7EC] overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 bg-[#F7F8FA] border-b border-[#E4E7EC] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#101828] text-sm">Notifications</span>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-red-50 text-[#FF2B1A] text-xs font-bold border border-red-100">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllNotificationsAsRead}
                                className="text-[11px] text-[#004D40] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                title="Mark all notifications as read"
                              >
                                <CheckCheck className="w-3 h-3" /> Mark read
                              </button>
                            )}
                            {notifications.length > 0 && (
                              <button
                                onClick={clearAllNotifications}
                                className="text-[11px] text-slate-400 hover:text-[#FF2B1A] hover:underline font-semibold cursor-pointer"
                                title="Clear all notifications"
                              >
                                Clear all
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-[#E4E7EC]">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#667085]">
                              You're all caught up. No notifications yet.
                            </div>
                          ) : (
                            notifications.slice(0, 10).map((notif) => (
                              <div
                                key={notif.id}
                                className={`p-3.5 hover:bg-[#F7F8FA] transition-colors text-left flex items-start justify-between gap-2.5 ${
                                  !notif.read ? 'bg-teal-50/20' : ''
                                }`}
                              >
                                <div
                                  onClick={() => {
                                    markNotificationAsRead(notif.id);
                                    if (notif.link) {
                                      navigate(notif.link);
                                      setNotifOpen(false);
                                    }
                                  }}
                                  className="flex-1 cursor-pointer min-w-0"
                                >
                                  <div className="flex items-center gap-2">
                                    {!notif.read && (
                                      <span className="w-2 h-2 rounded-full bg-[#FF2B1A] shrink-0" title="Unread" />
                                    )}
                                    <span className="text-xs font-bold text-[#101828] truncate">{notif.title}</span>
                                    <span className="text-[10px] text-[#667085] shrink-0 whitespace-nowrap ml-auto">
                                      {notif.timestamp}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#667085] mt-1 leading-relaxed line-clamp-2">
                                    {notif.message}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notif.id);
                                  }}
                                  className="text-slate-300 hover:text-slate-500 p-1 rounded-md shrink-0 cursor-pointer"
                                  title="Dismiss notification"
                                  aria-label="Dismiss notification"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Avatar & Menu */}
                <div className="relative shrink-0" ref={userMenuRef}>
                  <button
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F7F8FA] border border-transparent hover:border-[#E4E7EC] transition-colors cursor-pointer focus:outline-hidden min-h-[40px]"
                    aria-label="User account menu"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#061226] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      {userInitials}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#667085] hidden sm:block shrink-0" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -4 }}
                        transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                        className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-[#E4E7EC] overflow-hidden z-50 divide-y divide-[#E4E7EC]"
                      >
                        {/* Dropdown Header */}
                        <div className="p-4 bg-[#F7F8FA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#061226] text-white flex items-center justify-center font-bold text-sm shrink-0">
                              {userInitials}
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <div className="text-sm font-bold text-[#101828] truncate">{displayName}</div>
                              <div className="text-xs text-[#667085] truncate">{currentUser?.email}</div>
                              <span
                                className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isJobSeeker
                                    ? 'bg-red-50 text-[#FF2B1A] border-red-200'
                                    : isEmployer
                                    ? 'bg-teal-50 text-[#004D40] border-teal-200'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {isJobSeeker ? 'Job Seeker' : isEmployer ? 'Employer' : 'Administrator'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown links */}
                        <div className="p-1.5 space-y-0.5">
                          {isJobSeeker && (
                            <>
                              <button
                                onClick={() => {
                                  navigate('/dashboard');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <LayoutDashboard className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                                <span className="truncate">My Dashboard</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/profile');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <User className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                                <span className="truncate">My Profile</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/job-seeker/resume');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <FileText className="w-4 h-4 text-[#004D40] shrink-0" />
                                <span className="truncate">Resume Builder</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/settings');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <Settings className="w-4 h-4 text-[#667085] shrink-0" />
                                <span className="truncate">Settings</span>
                              </button>
                            </>
                          )}

                          {isEmployer && (
                            <>
                              <button
                                onClick={() => {
                                  navigate('/employer/dashboard');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <LayoutDashboard className="w-4 h-4 text-[#004D40] shrink-0" />
                                <span className="truncate">Employer Dashboard</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/employer/profile');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <Building2 className="w-4 h-4 text-[#004D40] shrink-0" />
                                <span className="truncate">Company Profile</span>
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/employer/account');
                                  setUserMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                              >
                                <Settings className="w-4 h-4 text-[#667085] shrink-0" />
                                <span className="truncate">Settings</span>
                              </button>
                            </>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                navigate('/admin');
                                setUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer text-left"
                            >
                              <LayoutDashboard className="w-4 h-4 text-[#061226] shrink-0" />
                              <span className="truncate">Admin Console</span>
                            </button>
                          )}
                        </div>

                        {/* Sign Out */}
                        <div className="p-1.5">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#FF2B1A] hover:bg-red-50 cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4 text-[#FF2B1A] shrink-0" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Public / Guest Controls */
              <div className="hidden sm:flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#101828] hover:bg-[#F7F8FA] border border-[#E4E7EC] hover:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer min-h-[42px]"
                >
                  <LogIn className="w-4 h-4 text-[#667085] shrink-0" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/get-started')}
                  className="px-4 py-2 rounded-xl bg-[#FF2B1A] hover:bg-[#e02213] text-white text-sm font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center gap-1.5 min-h-[42px]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>Get Started</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#101828] hover:bg-[#F7F8FA] border border-[#E4E7EC] cursor-pointer focus:outline-hidden min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* MOBILE NAVIGATION DRAWER                  */}
      {/* ========================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE_PREMIUM }}
            className="lg:hidden w-full max-w-full overflow-hidden border-t border-[#E4E7EC] bg-white shadow-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {/* Authenticated User Banner on Mobile */}
              {isAuthenticated && (
                <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E4E7EC] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#061226] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[#101828] truncate">{displayName}</div>
                    <div className="text-xs text-[#667085] truncate">{currentUser?.email}</div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isJobSeeker
                          ? 'bg-red-50 text-[#FF2B1A] border-red-200'
                          : isEmployer
                          ? 'bg-teal-50 text-[#004D40] border-teal-200'
                          : 'bg-slate-200 text-slate-800 border-slate-300'
                      }`}
                    >
                      {isJobSeeker ? 'Job Seeker' : isEmployer ? 'Employer' : 'Administrator'}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="px-2 pb-1 text-[11px] font-bold uppercase text-[#667085] tracking-wider">
                  Navigation
                </div>
                {activeLinks.map((link) => {
                  const isActive = link.isActive;
                  return (
                    <button
                      key={link.label}
                      onClick={() => {
                        link.action();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-red-50 text-[#FF2B1A] font-bold'
                          : 'text-[#101828] hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {isActive && <span className="w-2 h-2 rounded-full bg-[#FF2B1A]" />}
                    </button>
                  );
                })}
              </div>

              {/* Actions for Mobile */}
              <div className="pt-3 border-t border-[#E4E7EC] space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => {
                        navigate(isJobSeeker ? '/settings' : '/employer/account');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#101828] hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-[#667085]" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full min-h-[44px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#FF2B1A] hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-[#FF2B1A]" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        navigate('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold text-[#101828] bg-white border border-[#E4E7EC] flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4 text-[#667085]" />
                      <span>Sign In</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/get-started');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#FF2B1A] flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Get Started</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export const Navbar = Navigation;
export default Navigation;
