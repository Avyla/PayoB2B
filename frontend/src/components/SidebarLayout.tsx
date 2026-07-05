'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import WhatsAppManagerDrawer from './WhatsAppManagerDrawer';
import { EmailSyncDrawer } from './EmailSyncDrawer';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const publicRoutes = ['/login', '/terms', '/privacy', '/support', '/forgot-password', '/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (isPublicRoute) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, isPublicRoute]);

  // No renderizar el sidebar en rutas públicas, y retornar inmediatamente para evitar glitches
  if (isPublicRoute) {
    return (
      <div className="h-screen w-full overflow-y-auto">
        {children}
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // O un spinner
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white flex-col flex-shrink-0 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-900 p-1 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </span>
            Payo<span className="text-emerald-400">B2B</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2">Principal</p>
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${pathname === '/dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            Dashboard
          </Link>
          <Link 
            href="/dashboard/reports" 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${pathname.startsWith('/dashboard/reports') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Reportes / Auditoría
          </Link>

          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6">Integraciones</p>
          <button 
            onClick={() => setIsEmailOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Sincronizar Correo
          </button>
          <button 
            onClick={() => setIsWhatsAppOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            WhatsApp
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 rounded-xl transition-colors font-medium text-left"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          
          {/* Trust Banner / Footer Global */}
          <footer className="mt-12 pt-6 border-t border-slate-200/60 text-center pb-2">
            <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Payo utiliza IA para automatizar la lectura de comprobantes, la cual puede cometer errores ocasionales. Tus imágenes y datos financieros nunca se utilizan para entrenar modelos públicos. <Link href="/privacy" className="text-emerald-600 hover:text-emerald-500 hover:underline font-medium transition-all">Tu privacidad y Payo</Link> <span className="mx-2 text-slate-300">|</span> v1.0.0-beta
            </p>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around items-center px-2 py-2 pb-safe shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard" className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${pathname === '/dashboard' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-bold tracking-wide">Inicio</span>
        </Link>
        <Link href="/dashboard/reports" className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${pathname.startsWith('/dashboard/reports') ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="text-[10px] font-bold tracking-wide">Admin</span>
        </Link>
        <button onClick={() => setIsEmailOpen(true)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isEmailOpen ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span className="text-[10px] font-bold tracking-wide">Buzón</span>
        </button>
        <button onClick={() => setIsWhatsAppOpen(true)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isWhatsAppOpen ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[10px] font-bold tracking-wide">WhatsApp</span>
        </button>
        <button onClick={() => { if (typeof window !== 'undefined') { localStorage.removeItem('token'); window.location.href = '/login'; } }} className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span className="text-[10px] font-bold tracking-wide">Salir</span>
        </button>
      </nav>

      {/* Integrations Modals */}
      <WhatsAppManagerDrawer isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)} />
      <EmailSyncDrawer isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} />
    </div>
  );
}
