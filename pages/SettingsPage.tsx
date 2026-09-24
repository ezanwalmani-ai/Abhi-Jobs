import React from 'react';
import { useApp } from '../context/AppContext';
import { JobSeekerSettingsPage } from './jobSeeker/JobSeekerSettingsPage';
import { EmployerSettingsPage } from './employer/EmployerSettingsPage';

interface SettingsPageProps {
  navigate: (route: string) => void;
  initialSection?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ navigate, initialSection }) => {
  const { currentRole } = useApp();
  const isEmployer = currentRole === 'employer';

  if (isEmployer) {
    return <EmployerSettingsPage navigate={navigate} initialSection={initialSection} />;
  }

  return <JobSeekerSettingsPage navigate={navigate} initialSection={initialSection} />;
};
