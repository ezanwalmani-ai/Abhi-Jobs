import React from 'react';
import { JobSeekerDashboard } from '../jobSeeker/JobSeekerDashboard';

interface CandidateDashboardProps {
  navigate: (route: string) => void;
  defaultTab?: 'overview' | 'applications' | 'saved_jobs' | 'profile';
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ navigate, defaultTab = 'overview' }) => {
  return <JobSeekerDashboard navigate={navigate} defaultTab={defaultTab} />;
};
