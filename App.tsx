import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/Toast';
import { RouteProtectionNotice } from './components/RouteProtectionNotice';
import { GlobalLoadingFeedback } from './components/GlobalLoadingFeedback';
import { EASE_PREMIUM } from './lib/motion';
import { supabase } from './supabaseClient';

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

// Job Seeker Portal Pages
import { JobSeekerDashboard } from './pages/jobSeeker/JobSeekerDashboard';
import { JobSeekerApplicationsPage } from './pages/jobSeeker/JobSeekerApplicationsPage';
import { JobSeekerSavedJobsPage } from './pages/jobSeeker/JobSeekerSavedJobsPage';
import { JobSeekerProfilePage } from './pages/jobSeeker/JobSeekerProfilePage';
import { JobSeekerUpskillPage } from './pages/jobSeeker/JobSeekerUpskillPage';
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
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [routeParams, setRouteParams] = useState<{ id?: string; query?: string; location?: string; email?: string; registered?: string }>({});
  const { currentRole, currentUser, logout, isGlobalLoading, globalLoadingMessage } = useApp();
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

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

  const isAuthenticated = Boolean(currentUser);
  const isJobSeeker = isAuthenticated && (currentRole === 'job_seeker' || (currentRole as any) === 'candidate');
  const isEmployer = isAuthenticated && currentRole === 'employer';
  const isAdmin = isAuthenticated && currentRole === 'admin';

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
      route === '/jobs' ||
      route.startsWith('/jobs/') ||
      route.startsWith('/job/') ||
      route === '/companies' ||
      route === '/candidates' ||
      route === '/about' ||
      route === '/contact' ||
      route === '/privacy' ||
      route === '/terms' ||
      route === '/how-it-works' ||
      route === '/password-checker-demo'
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
      route.startsWith('/learning') ||
      route === '/career-tools' ||
      route.startsWith('/employer') ||
      route === '/employer-dashboard' ||
      route === '/company' ||
      route === '/my-jobs' ||
      route.startsWith('/admin')
    );
  };

  const isCurrentRoutePrivate = checkIsPrivateRoute(currentRoute);
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        const active = Boolean(session);
        setHasValidSession(active);

        // Protect private pages with supabase.auth.getSession() — if no session, redirect to /login
        if (checkIsPrivateRoute(currentRoute) && !active) {
          navigate('/login');
        }
      } catch {
        if (!isMounted) return;
        setHasValidSession(false);
        if (checkIsPrivateRoute(currentRoute)) {
          navigate('/login');
        }
      }
    };

    checkSession();

    // Sync auth state in real time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const active = Boolean(session);
      setHasValidSession(active);
      if (checkIsPrivateRoute(currentRoute) && !active) {
        navigate('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [currentRoute]);

  const renderContent = () => {
    // 0. Protect private pages with supabase.auth.getSession() — if no session, redirect to /login
    if (isCurrentRoutePrivate) {
      if (hasValidSession === false) {
        return <LoginPage navigate={navigate} redirectMessage="Please sign in to access this page." />;
      }
      if (hasValidSession === null) {
        return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-8 h-8 border-3 border-[#004D40] border-t-transparent rounded-full animate-spin" />
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

      case '/employers':
      case '/for-employers':
        return isEmployer ? (
          <EmployerDashboard navigate={navigate} />
        ) : (
          <EmployerRegisterPage navigate={navigate} />
        );

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

      case '/register/employer':
        return <EmployerRegisterPage navigate={navigate} />;

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
        return isEmployer ? (
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
      case '/job-seeker/upskill':
        return <JobSeekerUpskillPage navigate={navigate} />;

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

      // Admin Portal
      case '/admin':
        return <AdminDashboard navigate={navigate} />;

      case '/404':
        return <NotFoundPage navigate={navigate} />;

      default:
        // If route is explicitly home or empty, render HomePage, otherwise show branded 404
        if (!currentRoute || currentRoute === '/' || currentRoute === '') {
          return <HomePage navigate={navigate} />;
        }
        return <NotFoundPage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-[#101828] font-sans selection:bg-[#FF2B1A] selection:text-white">
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
      <Footer navigate={navigate} />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
