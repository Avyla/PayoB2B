'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Spinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const slides = [
    {
      title: "Automatización de comprobantes.",
      description: "Extrae automáticamente los datos de tus comprobantes de Nequi y Bancolombia.",
      icon: (
        <svg className="w-12 h-12 text-teal-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: "Visibilidad centralizada.",
      description: "Consolida los reportes de WhatsApp y web en un único panel B2B.",
      icon: (
        <svg className="w-12 h-12 text-teal-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: "Trazabilidad operativa.",
      description: "Audita cada ingreso, desde el cajero hasta tu cierre de caja.",
      icon: (
        <svg className="w-12 h-12 text-teal-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      
      {/* Left Column: Marketing / Identity (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative flex-col justify-center items-center overflow-hidden">
        
        {/* Abstract UI Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Glowing Orbs */}
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-teal-500/20 blur-[100px]" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px]" />
          
          {/* Glassmorphism Abstract Cards */}
          <div className="absolute top-[15%] right-[15%] w-64 h-32 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl transform rotate-12 flex items-center p-4">
            <div className="w-10 h-10 rounded-full bg-teal-400/20 flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <div className="h-2 w-24 bg-white/20 rounded mb-2"></div>
              <div className="h-2 w-16 bg-white/10 rounded"></div>
            </div>
          </div>
          
          <div className="absolute bottom-[20%] left-[10%] w-56 h-28 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl transform -rotate-6 flex items-center p-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </div>
             <div>
              <div className="h-2 w-20 bg-white/20 rounded mb-2"></div>
              <div className="h-2 w-12 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>

        {/* Carousel Content */}
        <div className="relative z-10 w-full max-w-lg px-12">
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                <span className="text-white font-bold text-lg leading-none">P</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Payo</h1>
            </div>
            <p className="text-slate-400 text-lg">El motor de crecimiento para tu operación B2B.</p>
          </div>

          <div className="relative h-48 transition-all duration-500">
            {slides.map((slide, index) => (
              <div 
                key={index} 
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
              >
                {slide.icon}
                <h2 className="text-2xl font-semibold text-white mb-3 leading-tight">{slide.title}</h2>
                <p className="text-slate-300 text-lg">{slide.description}</p>
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="flex gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeSlide ? 'w-8 bg-teal-400' : 'w-4 bg-slate-700 hover:bg-slate-600'}`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Login Form (Visible everywhere) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            {/* Logo on mobile only */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30">
                <span className="text-white font-bold text-lg leading-none">P</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payo</h1>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Bienvenido de nuevo</h2>
            <p className="mt-2 text-sm text-slate-500">Ingresa a tu cuenta para acceder a tu panel de control.</p>
          </div>

          <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-slate-900 text-sm"
                  placeholder="ejemplo@empresa.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors text-slate-900 text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                    Recordarme
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Spinner className="w-5 h-5 text-teal-400" /> : 'Ingresar a Payo'}
                </button>
              </div>
            </form>
          </div>
          
          {/* Footer links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Términos de Servicio</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Política de Privacidad</Link>
            <span className="hidden sm:inline">•</span>
            <Link href="/support" className="hover:text-slate-900 transition-colors">Soporte Técnico</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
