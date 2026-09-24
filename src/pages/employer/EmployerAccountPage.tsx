import React from 'react';
import { EmployerSettingsPage } from './EmployerSettingsPage';

interface EmployerAccountPageProps {
  navigate: (route: string) => void;
}

export const EmployerAccountPage: React.FC<EmployerAccountPageProps> = ({ navigate }) => {
  return <EmployerSettingsPage navigate={navigate} initialSection="account" />;
};
