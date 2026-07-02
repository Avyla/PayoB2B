'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function SmartBackButton() {
  const router = useRouter();
  const [href, setHref] = useState('/login');

  useEffect(() => {
    // Si el usuario tiene token (está autenticado), el botón volverá al dashboard.
    // De lo contrario, lo enviará al login (estado por defecto).
    const token = localStorage.getItem('token');
    if (token) {
      setHref('/dashboard');
    }
  }, []);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <button 
      onClick={handleBack} 
      className="text-teal-500 hover:text-teal-400 font-medium inline-flex items-center gap-2 transition-colors focus:outline-none"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Volver
    </button>
  );
}
