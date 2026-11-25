import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { RouteProtectionNotice } from './components/RouteProtectionNotice';
import { GlobalLoadingFeedback } from './components/GlobalLoadingFeedback';
import { CinematicBrandIntro, INTRO_SESSION_KEY } from './components/CinematicBrandIntro';
import { EASE_PREMIUM } from './lib/motion';
import { auth as firebaseAuth, onAuthStateChanged as onFirebaseAuthStateChanged } from './lib/firebase';

// Public & Shared Pages
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { AboutPage } from './pages/AboutPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { HireTalentPage } from './pages/HireTalentPage';

// Job Seeker Portal Pages
import { JobSeekerDashboard } from './pages/jobSeeker/JobSeekerDashboard';
import { JobSeekerApplicationsPage } from './pages/jobSeeker/JobSeekerApplicationsPage';
import { JobSeekerSavedJobsPage } from './pages/jobSeeker/JobSeekerSavedJobsPage';
import { JobSeekerProfilePage } from './pages/jobSeeker/JobSeekerProfilePage';
import { LearnWithAbhiPage } from './pages/LearnWithAbhiPage';
import { CertificateVerificationPage } from './pages/CertificateVerificationPage';
import { JobSeekerResumePage } from './pages/jobSeeker/JobSeekerResumePage';
import { JobSeekerRegisterPage } from './pages/jobSeeker/JobSeekerRegisterPage';
import { JobSeekerOnboardingPage } from './pages/jobSeeker/JobSeekerOnboardingPage';
import { JobSeekerSettingsPage } from './pages/jobSeeker/JobSeekerSettingsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { PasswordCheckerDemoPage } from './pages/PasswordCheckerDemoPage';

// Settings & Common Pages
import { SettingsPage } from './pages/SettingsPage';

// Employer Portal Pages
import { EmployerDashboard } from './pages/employer/EmployerDashboard';
import { EmployerJobsPage } from './pages/employer/EmployerJobsPage';
import { EmployerApplicationsPage } from './pages/employer/EmployerApplicationsPage';
import { EmployerCompanyProfilePage } from './pages/employer/EmployerCompanyProfilePage';
import { EmployerAccountPage } from './pages/employer/EmployerAccountPage';
import { EmployerSettingsPage } from './pages/employer/EmployerSettingsPage';
import { EmployerRegisterPage } from './pages/employer/EmployerRegisterPage';
import { PostJobPage } from './pages/employer/PostJobPage';

// Admin Portal
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    try {
      const path = window.location.pathname;
      if (path && path !== '/') {
        return path;
      }
    } catch {}
    return '/';
  });
  const [routeParams, setRouteParams] = useState<{ id?: string; query?: string; location?: string; email?: string; registered?: string }>({});
  const { currentRole, currentUser, adminSession, logout, isGlobalLoading, globalLoadingMessage } = useApp();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Show full-screen cinematic brand intro on initial homepage entry during this session
  // Respects prefers-reduced-motion and does not block deep links
  const [showBrandIntro, setShowBrandIntro] = useState<boolean>(() => {
    try {
      const path = window.location.pathname || '/';
      if (path !== '/' && path !== '') return false;
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
      }
      return sessionStorage.getItem(INTRO_SESSION_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  const handleReplayIntro = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setCurrentRoute('/');
    setShowBrandIntro(true);
  };

  // Route navigation helper with visual feedback transition
  const navigate = (path: string) => {
    setIsNavigating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (path === '/#about' || path === '#about') {
      setCurrentRoute('/about');
      return;
    }

    if (path.startsWith('/jobs/') && path !== '/jobs/') {
      const id = path.replace('/jobs/', '');
      setRouteParams({ id });
      setCurrentRoute('/jobs/:id');
      return;
    }

    if (path.startsWith('/applications/') && path !== '/applications/') {
      const id = path.replace('/applications/', '');
      setRouteParams({ id });
      setCurrentRoute('/applications/:id');
      return;
    }

    if (path.startsWith('/learning/courses/') && path.endsWith('/learn')) {
      const slug = path.replace('/learning/courses/', '').replace(/\/learn$/, '');
      if (slug) {
        setRouteParams({ id: slug });
        setCurrentRoute('/learning/courses/:slug/learn');
        return;
      }
    }

    if (path.startsWith('/learning/courses/') && path !== '/learning/courses/') {
      const slug = path.replace('/learning/courses/', '');
      setRouteParams({ id: slug });
      setCurrentRoute('/learning/courses/:slug');
      return;
    }

    if (path.startsWith('/verify-certificate/') && path !== '/verify-certificate/') {
      const certId = decodeURIComponent(path.replace('/verify-certificate/', '').split('?')[0]);
      setRouteParams({ id: certId });
      setCurrentRoute('/verify-certificate/:certificateId');
      return;
    }

    if (path.startsWith('/jobs?')) {
      const urlParams = new URLSearchParams(path.split('?')[1]);
      setRouteParams({
        query: urlParams.get('query') || '',
        location: urlParams.get('location') || '',
      });
      setCurrentRoute('/jobs');
      return;
    }

    if (path.startsWith('/login') || path.startsWith('/signin')) {
      if (path.includes('?')) {
        const urlParams = new URLSearchParams(path.split('?')[1]);
        setRouteParams({
          email: urlParams.get('email') || '',
          registered: urlParams.get('registered') || '',
        });
      } else {
        setRouteParams({});
      }
      setCurrentRoute('/login');
      return;
    }

    setRouteParams({});
    setCurrentRoute(path);
  };

  // Complete route transition animation
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentRoute, routeParams, isNavigating]);

  const isAuthenticated = Boolean(currentUser || firebaseAuth.currentUser);
  const isAdmin = Boolean(adminSession?.authorized);
  const isJobSeeker = isAuthenticated && !isAdmin && (currentRole === 'job_seeker' || (currentRole as any) === 'candidate');
  const isEmployer = isAuthenticated && !isAdmin && currentRole === 'employer';

  // Helper to determine if a route is private
  const checkIsPrivateRoute = (route: string) => {
    if (
      route === '/' ||
      route === '/login' ||
      route === '/select-role' ||
      route === '/register' ||
      route === '/register/job-seeker' ||
      route === '/register/employer' ||
      route === '/employer/register' ||
      route === '/hire-talent' ||
      route === '/employers' ||
      route === '/for-employers' ||
      route === '/learning' ||
      route === '/learn' ||
      route.startsWith('/learning/') ||
      route === '/verify-certificate' ||
      route.startsWith('/verify-certificate/') ||
      route === '/job-seeker/upskill' ||
      route === '/jobs' ||
      route.startsWith('/jobs/') ||
      route.startsWith('/job/') ||
      route === '/companies' ||
      route === '/candidates' ||
      route === '/about' ||
      route === '/contact' ||
      route === '/privacy' ||
      route === '/privacy-policy' ||
      route === '/terms' ||
      route === '/terms-and-conditions' ||
      route === '/how-it-works' ||
      route === '/password-checker-demo' ||
      route.startsWith('/admin') ||
      route === '/abhi-control-center' ||
      route.startsWith('/abhi-control-center/')
    ) {
      return false;
    }

    return (
      route === '/dashboard' ||
      route.startsWith('/dashboard') ||
      route.startsWith('/job-seeker') ||
      route.startsWith('/applications') ||
      route === '/saved-jobs' ||
      route.startsWith('/profile') ||
      route === '/resume' ||
      route.startsWith('/settings') ||
      route === '/career-tools' ||
      route.startsWith('/employer') ||
      route === '/employer-dashboard' ||
      route === '/company' ||
      route === '/my-jobs'
    );
  };

  const isCurrentRoutePrivate = checkIsPrivateRoute(currentRoute);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(() => {
    if (Boolean(currentUser) || Boolean(firebaseAuth.currentUser)) return true;
    return null;
  });

  useEffect(() => {
    let isMounted = true;

    // Authoritative Firebase Auth state listener
    const unsubscribeFirebase = onFirebaseAuthStateChanged(firebaseAuth, (fbUser) => {
      if (!isMounted) return;
      const active = Boolean(fbUser) || Boolean(currentUser);
      setHasValidSession(active);
      if (checkIsPrivateRoute(currentRoute) && !active) {
        navigate('/login');
      }
    });

    return () => {
      isMounted = false;
      unsubscribeFirebase();
    };
  }, [currentRoute, currentUser]);

  const renderContent = () => {
    // 0. Protect private pages — accurately check if any authentication layer has an active session
    const isSessionActive = Boolean(currentUser) || Boolean(firebaseAuth.currentUser) || hasValidSession === true;

    if (isCurrentRoutePrivate) {
      if (!isSessionActive && hasValidSession === false) {
        return <LoginPage navigate={navigate} redirectMessage="Please sign in to access this page." />;
      }
      if (!isSessionActive && hasValidSession === null) {
        return (
          <div className="min-h-screen bg-[#F6F8FB] flex items-center justify-center p-6">
            <div className="w-8 h-8 border-3 border-[#102B4E] border-t-transparent rounded-full animate-spin" />
          </div>
        );
      }
    }

    // 1. If Job Seeker tries to access Employer routes
    if (currentRoute.startsWith('/employer') && isJobSeeker) {
      return (
        <RouteProtectionNotice
          attemptedRoute={currentRoute}
          requiredRole="employer"
          currentRole="job_seeker"
          onRedirectToAllowed={() => navigate('/dashboard')}
          onSignOut={() => {
            logout();
            navigate('/login');
          }}
        />
      );
    }

    // 2. If Employer tries to access Job Seeker-only routes
    if (
      (currentRoute.startsWith('/job-seeker') ||
        currentRoute.startsWith('/candidate') ||
        currentRoute.startsWith('/applications') ||
        currentRoute === '/saved-jobs' ||
        currentRoute === '/profile' ||
        currentRoute === '/learning' ||
        currentRoute === '/career-tools') &&
      currentRoute !== '/job-seeker/onboarding' &&
      isEmployer
    ) {
      return (
        <RouteProtectionNotice
          attemptedRoute={currentRoute}
          requiredRole="job_seeker"
          currentRole="employer"
          onRedirectToAllowed={() =>
            currentRoute.startsWith('/applications')
              ? navigate('/employer/applications')
              : navigate('/employer/dashboard')
          }
          onSignOut={() => {
            logout();
            navigate('/login');
          }}
        />
      );
    }

    return renderCurrentPage();
  };

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage navigate={navigate} />;

      case '/jobs':
        return (
          <JobsPage
            navigate={navigate}
            initialQuery={routeParams.query}
            initialLocation={routeParams.location}
          />
        );

      case '/jobs/:id':
        return (
          <JobDetailPage
            jobId={routeParams.id || 'job-1'}
            navigate={navigate}
          />
        );

      case '/candidates':
        return <CandidatesPage navigate={navigate} />;

      case '/companies':
        return <CompaniesPage navigate={navigate} />;

      case '/about':
        return <AboutPage navigate={navigate} />;

      case '/how-it-works':
      case '/how-abhi-jobs-works':
        return <HowItWorksPage navigate={navigate} />;

      case '/hire-talent':
      case '/employers':
      case '/for-employers':
      case '/register/employer':
      case '/employer/register':
        return <HireTalentPage navigate={navigate} />;

      case '/contact':
        return <ContactPage navigate={navigate} />;

      // Legal & Compliance
      case '/terms-and-conditions':
      case '/terms':
        return <TermsPage navigate={navigate} />;

      case '/privacy':
      case '/privacy-policy':
        return <PrivacyPolicyPage navigate={navigate} />;

      // Auth & Onboarding
      case '/get-started':
      case '/role-selection':
      case '/join':
      case '/select-role':
        return <RoleSelectionPage navigate={navigate} />;

      case '/register/job-seeker':
      case '/register':
        return <JobSeekerRegisterPage navigate={navigate} />;

      case '/password-checker':
      case '/security/password-checker':
        return <PasswordCheckerDemoPage navigate={navigate} />;

      case '/job-seeker/onboarding':
        return <JobSeekerOnboardingPage navigate={navigate} />;

      case '/login':
      case '/signin':
        return (
          <LoginPage
            navigate={navigate}
            initialEmail={routeParams.email}
            isSignupSuccess={routeParams.registered === 'true'}
          />
        );

      // Job Seeker Portal Dedicated Routes
      case '/dashboard':
        return isAdmin ? (
          <AdminDashboard navigate={navigate} />
        ) : isEmployer ? (
          <EmployerDashboard navigate={navigate} />
        ) : (
          <JobSeekerDashboard navigate={navigate} defaultTab="overview" />
        );

      case '/job-seeker/dashboard':
      case '/candidate/dashboard':
      case '/candidate/interviews':
        return <JobSeekerDashboard navigate={navigate} defaultTab="overview" />;

      case '/applications':
      case '/job-seeker/applications':
        return <JobSeekerApplicationsPage navigate={navigate} />;

      case '/applications/:id':
        return <JobSeekerApplicationsPage navigate={navigate} initialSelectedAppId={routeParams.id} />;

      case '/saved-jobs':
      case '/job-seeker/saved-jobs':
        return <JobSeekerSavedJobsPage navigate={navigate} />;

      case '/profile':
      case '/job-seeker/profile':
      case '/candidate/profile':
        return <JobSeekerProfilePage navigate={navigate} />;

      case '/learning':
      case '/learn':
      case '/job-seeker/upskill':
        return <LearnWithAbhiPage navigate={navigate} section="home" />;

      case '/learning/assessment':
        return <LearnWithAbhiPage navigate={navigate} section="assessment" />;

      case '/learning/courses/:slug':
        return (
          <LearnWithAbhiPage
            navigate={navigate}
            section="course-detail"
            courseSlug={routeParams.id}
          />
        );

      case '/learning/courses/:slug/learn':
        return (
          <LearnWithAbhiPage
            navigate={navigate}
            section="course-player"
            courseSlug={routeParams.id}
          />
        );

      case '/learning/admin/content':
        return <LearnWithAbhiPage navigate={navigate} section="admin-content" />;

      case '/verify-certificate':
        return <CertificateVerificationPage navigate={navigate} />;

      case '/verify-certificate/:certificateId':
        return (
          <CertificateVerificationPage
            navigate={navigate}
            initialCertificateId={routeParams.id}
          />
        );

      case '/resume':
      case '/career-tools':
      case '/job-seeker/career-tools':
      case '/job-seeker/resume':
        return <JobSeekerResumePage navigate={navigate} />;

      case '/settings':
        return <SettingsPage navigate={navigate} />;

      case '/job-seeker/settings':
        return <JobSeekerSettingsPage navigate={navigate} />;

      case '/support':
      case '/help':
        return <ContactPage navigate={navigate} />;

      // Employer Portal Dedicated Routes
      case '/employer/dashboard':
        return <EmployerDashboard navigate={navigate} />;

      case '/employer/analytics':
      case '/employer/insights':
        return <EmployerDashboard navigate={navigate} />;

      case '/employer/settings':
      case '/employer/account':
        return <EmployerSettingsPage navigate={navigate} />;

      case '/employer/jobs':
        return <EmployerJobsPage navigate={navigate} />;

      case '/employer/post-job':
        return <PostJobPage navigate={navigate} />;

      case '/employer/applications':
        return <EmployerApplicationsPage navigate={navigate} />;

      case '/employer/profile':
      case '/employer/company-profile':
        return <EmployerCompanyProfilePage navigate={navigate} />;

      case '/employer/candidates':
        return <CandidatesPage navigate={navigate} />;

      // Private Central Admin Panel (never linked in public navigation)
      case '/admin':
      case '/abhi-control-center':
        return <AdminDashboard navigate={navigate} />;

      case '/404':
        return <NotFoundPage navigate={navigate} />;

      default:
        // Handle direct deep-link loads to /learning/courses/<slug>/learn and /learning/courses/<slug>
        if (currentRoute.startsWith('/learning/courses/') && currentRoute.endsWith('/learn')) {
          const directLearnSlug = currentRoute
            .replace('/learning/courses/', '')
            .replace(/\/learn$/, '');
          if (directLearnSlug) {
            return (
              <LearnWithAbhiPage
                navigate={navigate}
                section="course-player"
                courseSlug={directLearnSlug}
              />
            );
          }
        }
        if (currentRoute.startsWith('/learning/courses/') && currentRoute !== '/learning/courses/') {
          const directSlug = currentRoute.replace('/learning/courses/', '');
          return (
            <LearnWithAbhiPage
              navigate={navigate}
              section="course-detail"
              courseSlug={directSlug}
            />
          );
        }
        if (currentRoute.startsWith('/verify-certificate/') && currentRoute !== '/verify-certificate/') {
          const directCertId = decodeURIComponent(
            currentRoute.replace('/verify-certificate/', '').split('?')[0]
          );
          return (
            <CertificateVerificationPage
              navigate={navigate}
              initialCertificateId={directCertId}
            />
          );
        }
        // If route is explicitly home or empty, render HomePage, otherwise show branded 404
        if (!currentRoute || currentRoute === '/' || currentRoute === '') {
          return <HomePage navigate={navigate} />;
        }
        return <NotFoundPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FB] text-[#253449] font-sans selection:bg-[#102B4E] selection:text-white">
      {/* Full-Screen Cinematic Brand Introduction (Initial Session Entry) */}
      <CinematicBrandIntro
        isOpen={showBrandIntro}
        onComplete={() => setShowBrandIntro(false)}
      />

      {/* Global Progress Bar & Asynchronous Operation Overlay */}
      <GlobalLoadingFeedback
        isNavigating={isNavigating}
        isLoading={isGlobalLoading}
        loadingMessage={globalLoadingMessage}
      />

      {/* Top Navbar */}
      <Navbar currentRoute={currentRoute} navigate={navigate} />

      {/* Dynamic Page Content with Smooth Transition */}
      <main className="flex-1 w-full overflow-x-clip">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRoute}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE_PREMIUM }}
            className="w-full flex-1 flex flex-col"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Footer */}
      <Footer navigate={navigate} onReplayIntro={handleReplayIntro} />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </MotionConfig>
  );
}
