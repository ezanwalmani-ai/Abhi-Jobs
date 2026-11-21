import React from 'react';
import { useApp } from '../context/AppContext';
import { LearnHeroSection } from '../components/learning/LearnHeroSection';
import { CareerAssessmentSection } from '../components/learning/CareerAssessmentSection';
import { ExploreCoursesSection } from '../components/learning/ExploreCoursesSection';
import { WhyLearnSection } from '../components/learning/WhyLearnSection';
import { LearnFinalCtaSection } from '../components/learning/LearnFinalCtaSection';
import { ProfileEvaluationTest } from '../components/learning/assessment/ProfileEvaluationTest';

interface LearnWithAbhiPageProps {
  navigate: (route: string) => void;
  section?: 'home' | 'assessment';
}

export const LearnWithAbhiPage: React.FC<LearnWithAbhiPageProps> = ({
  navigate,
  section = 'home',
}) => {
  const { currentUser, currentCandidate } = useApp();

  const isAuthenticated = Boolean(currentUser);
  const fullName = currentCandidate?.name || currentUser?.name || '';
  const firstName = fullName ? fullName.trim().split(' ')[0] : null;

  const scrollToElement = (elementId: string) => {
    const target = document.getElementById(elementId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (section === 'assessment') {
    return (
      <ProfileEvaluationTest
        onBackToLearn={() => navigate('/learning')}
        onExploreCourses={() => {
          navigate('/learning');
          setTimeout(() => scrollToElement('explore-courses'), 180);
        }}
        onNavigateLogin={() => navigate('/login')}
        onNavigateResume={() => navigate(isAuthenticated ? '/resume' : '/login')}
        onNavigateJobs={() => navigate('/jobs')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#253449]">
      {/* 1. Hero Section */}
      <LearnHeroSection
        candidateFirstName={firstName}
        onExploreCourses={() => scrollToElement('explore-courses')}
        onTakeAssessment={() => scrollToElement('career-assessment')}
      />

      {/* 2. Career Assessment Section */}
      <CareerAssessmentSection
        onStartAssessment={() => navigate('/learning/assessment')}
      />

      {/* 3. Explore Courses Section */}
      <ExploreCoursesSection
        onOpenAssessment={() => navigate('/learning/assessment')}
        onNavigateToResume={() => navigate(isAuthenticated ? '/resume' : '/login')}
      />

      {/* 4. Why Learn with ABHI? */}
      <WhyLearnSection />

      {/* 5. Final Call to Action */}
      <LearnFinalCtaSection
        isAuthenticated={isAuthenticated}
        onStartLearning={() => scrollToElement('explore-courses')}
        onNavigateLogin={() => navigate('/login')}
      />
    </div>
  );
};

export default LearnWithAbhiPage;
