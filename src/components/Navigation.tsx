import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AbhiJobsLogo } from './AbhiJobsLogo';
import { useApp } from '../context/AppContext';
import { EASE_PREMIUM } from '../lib/motion';
import {
  Bell,
  Menu,
  X,
  CheckCheck,
  User,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
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
    logout,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentRoute]);

  const isAuthenticated = Boolean(currentUser);
  const isAdmin = isAuthenticated && currentRole === 'admin';

  const handleLogoClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (currentRoute === '/' || currentRoute === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleSignOut = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  };

  const roleNotifications = notifications.filter((n) => {
    if (isAdmin) return n.targetRole === 'admin' || n.targetRole === 'all';
    return (
      n.targetRole === 'job_seeker' ||
      n.targetRole === 'candidate' ||
      n.targetRole === 'all' ||
      n.userId === currentUser?.id
    );
  });

  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  // Consistent corporate recruitment consultancy navigation
  const navLinks = [
    {
      label: 'Home',
      path: '/',
      isActive: currentRoute === '/' || currentRoute === '',
    },
    {
      label: 'Find Jobs',
      path: '/jobs',
      isActive: currentRoute === '/jobs' || currentRoute.startsWith('/jobs/'),
    },
    {
      label: 'My Applications',
      path: '/applications',
      isActive:
        currentRoute === '/applications' ||
        currentRoute.startsWith('/applications/') ||
        currentRoute === '/job-seeker/applications',
    },
    {
      label: 'Learn with ABHI',
      path: '/learning',
      isActive:
        currentRoute === '/learning' ||
        currentRoute === '/learn' ||
        currentRoute.startsWith('/learning/') ||
        currentRoute === '/job-seeker/upskill',
    },
    {
      label: 'Hire Talent',
      path: '/hire-talent',
      isActive:
        currentRoute === '/hire-talent' ||
        currentRoute === '/employers' ||
        currentRoute === '/for-employers',
    },
  ];

  const displayName = currentCandidate?.name || currentUser?.name || 'Candidate';
  const userInitials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#E5EAF0] shadow-[0_1px_2px_rgba(16,43,78,0.03)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[70px] gap-3 sm:gap-5 min-w-0">
          {/* LEFT: Official Exact abhi Jobs Logo */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E]/30 rounded-lg py-1 transition-opacity hover:opacity-90"
              aria-label="ABHI JOBS Home"
            >
              <AbhiJobsLogo variant="horizontal" theme="color" size="sm" showTagline={false} />
            </button>
          </div>

          {/* CENTER: Primary Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 min-w-0" aria-label="Main navigation">
            {navLinks.map((link) => (
              <motion.button
                key={link.label}
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(link.path)}
                className={`group relative px-3.5 py-2.5 text-[14px] tracking-[-0.005em] transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E]/25 ${
                  link.isActive
                    ? 'text-[#102B4E] font-semibold'
                    : 'text-[#475569] hover:text-[#102B4E] font-medium'
                }`}
              >
                <span>{link.label}</span>
                {link.isActive ? (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ duration: 0.2, ease: EASE_PREMIUM }}
                    className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#F47A24] rounded-full"
                  />
                ) : (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] bg-[#102B4E]/30 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-150 ease-out" />
                )}
              </motion.button>
            ))}
          </nav>

          {/* RIGHT: Auth / Dashboard / Notifications / Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Quick Dashboard / Admin Button on desktop */}
                <button
                  type="button"
                  onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
                  className="hidden md:inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-[13px] font-semibold text-[#102B4E] bg-[#FAFBFD] hover:bg-[#F1F5FA] border border-[#D4DCE6] hover:border-[#102B4E]/35 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E]/25"
                >
                  {isAdmin ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-[#F47A24]" />
                      <span>Admin Console</span>
                    </>
                  ) : (
                    <span>My Dashboard</span>
                  )}
                </button>

                {/* Notifications Bell with safe inner wrapper */}
                <div className="relative shrink-0" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen((prev) => !prev);
                      setUserMenuOpen(false);
                    }}
                    className="relative w-10 h-10 rounded-lg border border-[#E5EAF0] bg-white hover:bg-[#F6F8FB] hover:border-[#D4DCE6] flex items-center justify-center text-[#1E293B] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102B4E]/25"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <AnimatePresence>
                      {unreadCount > 0 && (
                        <motion.span
                          key={unreadCount}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.18, ease: EASE_PREMIUM }}
                          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F47A24] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white tabular-nums"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: EASE_PREMIUM }}
                        className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#E5EAF0] shadow-lg overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-[#E5EAF0] flex items-center justify-between bg-[#F6F8FB]">
                          <span className="text-xs font-bold text-[#102B4E] uppercase tracking-wider">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={markAllNotificationsAsRead}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F47A24] hover:text-[#DE6816] cursor-pointer"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-[#E5EAF0]">
                          {roleNotifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-xs text-[#778397]">
                              You have no new notifications.
                            </div>
                          ) : (
                            roleNotifications.slice(0, 8).map((n) => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                  markNotificationAsRead(n.id);
                                  setNotifOpen(false);
                                  if (n.link) navigate(n.link);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-[#F6F8FB] transition-colors cursor-pointer ${
                                  !n.read ? 'bg-[#FFF4EC]/50' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-semibold text-[#102B4E] leading-snug">
                                    {n.title}
                                  </p>
                                  {!n.read && (
                                    <span className="w-2 h-2 rounded-full bg-[#F47A24] shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-xs text-[#778397] mt-0.5 line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-[#778397] mt-1 block">
                                  {n.timestamp}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative shrink-0" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen((prev) => !prev);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-[#E5EAF0] bg-white hover:bg-[#F6F8FB] transition-colors cursor-pointer h-10"
                    aria-label="Account menu"
                  >
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={displayName}
                        className="w-7 h-7 rounded-md object-cover border border-[#E5EAF0]"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-[#102B4E] text-white text-xs font-bold flex items-center justify-center">
                        {userInitials}
                      </div>
                    )}
                    <span className="hidden sm:inline-block text-xs font-semibold text-[#253449] max-w-[110px] truncate">
                      {displayName.split(' ')[0]}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#778397] transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180 text-[#102B4E]' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: EASE_PREMIUM }}
                        className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-[#E5EAF0] shadow-lg overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-[#E5EAF0] bg-[#F6F8FB]">
                          <p className="text-sm font-bold text-[#102B4E] truncate">{displayName}</p>
                          <p className="text-xs text-[#778397] truncate">{currentUser?.email}</p>
                        </div>

                        <div className="py-1.5">
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUserMenuOpen(false);
                                navigate('/admin');
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-[#253449] hover:bg-[#F6F8FB] hover:text-[#102B4E] flex items-center gap-2.5 cursor-pointer"
                            >
                              <Shield className="w-4 h-4 text-[#F47A24]" />
                              <span>Admin &amp; Recruiter Console</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  navigate('/profile');
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[#253449] hover:bg-[#F6F8FB] hover:text-[#102B4E] flex items-center gap-2.5 cursor-pointer"
                              >
                                <User className="w-4 h-4 text-[#778397]" />
                                <span>My Profile</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  navigate('/dashboard');
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[#253449] hover:bg-[#F6F8FB] hover:text-[#102B4E] flex items-center gap-2.5 cursor-pointer"
                              >
                                <LayoutDashboard className="w-4 h-4 text-[#778397]" />
                                <span>My Dashboard</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setUserMenuOpen(false);
                                  navigate('/resume');
                                }}
                                className="w-full px-4 py-2.5 text-left text-sm text-[#253449] hover:bg-[#F6F8FB] hover:text-[#102B4E] flex items-center gap-2.5 cursor-pointer"
                              >
                                <FileText className="w-4 h-4 text-[#778397]" />
                                <span>Resume Builder</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              navigate('/settings');
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[#253449] hover:bg-[#F6F8FB] hover:text-[#102B4E] flex items-center gap-2.5 cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-[#778397]" />
                            <span>Settings</span>
                          </button>
                        </div>

                        <div className="border-t border-[#E5EAF0] py-1.5">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-[#102B4E] hover:bg-[#F6F8FB] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register/job-seeker')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#F47A24] hover:bg-[#DE6816] text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden w-11 h-11 rounded-lg border border-[#E5EAF0] bg-white hover:bg-[#F6F8FB] flex items-center justify-center text-[#102B4E] cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_PREMIUM }}
            className="lg:hidden bg-white border-t border-[#E5EAF0] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(link.path);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    link.isActive
                      ? 'bg-[#FFF4EC] text-[#102B4E] font-semibold'
                      : 'text-[#253449] hover:bg-[#F6F8FB]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#F47A24]" />}
                </button>
              ))}

              <div className="pt-3 mt-3 border-t border-[#E5EAF0] space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(isAdmin ? '/admin' : '/dashboard');
                      }}
                      className="w-full py-3 px-3.5 rounded-lg bg-[#102B4E] text-white text-sm font-semibold text-center cursor-pointer"
                    >
                      {isAdmin ? 'Admin Console' : 'My Dashboard'}
                    </button>
                    {!isAdmin && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate('/profile');
                          }}
                          className="py-2.5 px-3 rounded-lg border border-[#E5EAF0] text-xs font-semibold text-[#102B4E] cursor-pointer"
                        >
                          My Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate('/resume');
                          }}
                          className="py-2.5 px-3 rounded-lg border border-[#E5EAF0] text-xs font-semibold text-[#102B4E] cursor-pointer"
                        >
                          Resume Builder
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full py-2.5 px-3.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-center cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/login');
                      }}
                      className="py-3 px-4 rounded-lg border border-[#E5EAF0] text-[#102B4E] text-sm font-semibold text-center cursor-pointer"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/register/job-seeker');
                      }}
                      className="py-3 px-4 rounded-lg bg-[#F47A24] text-white text-sm font-semibold text-center cursor-pointer"
                    >
                      Register
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
