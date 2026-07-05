import React from 'react';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Dashboard | Payo B2B',
  description: 'Gestión de comprobantes bancarios, extracción OCR y verificación en tiempo real.',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
