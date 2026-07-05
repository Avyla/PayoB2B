import React from 'react';

export interface MetricsData {
  totalAmount: number;
  countPending: number;
  countVerified: number;
  countRejected: number;
  countNequi?: number;
  countBancolombia?: number;
  countOtrosBancos?: number;
}

interface DashboardMetricsProps {
  metrics: MetricsData | null;
  loading: boolean;
}

/** Format a number as Colombian Peso (COP) */
const formatCOP = (amount: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics, loading }) => {
  if (loading || !metrics) {
    return (
      <div className="mb-8 space-y-6 animate-pulse">
        {/* Primary Metric Skeleton */}
        <div className="bg-slate-100 border border-slate-200 p-10 md:p-14 rounded-2xl h-48 md:h-56 w-full" />
        
        {/* Secondary Metrics Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 border border-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 mb-8">
        
        {/* Primary Metric: Monto Total (Left Side) */}
        <div className="lg:w-2/5 bg-slate-900 p-8 md:p-10 rounded-3xl shadow-sm flex flex-col justify-center text-white border border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-md">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-300">Dinero Total Conciliado</span>
            </div>
            <p className="text-5xl md:text-6xl font-black tracking-tighter text-white">
              {formatCOP(metrics.totalAmount)}
            </p>
            <p className="mt-6 text-sm font-medium text-slate-400 border-t border-white/10 pt-4">
              Basado en <span className="text-white font-bold">{metrics.countVerified + metrics.countPending}</span> transacciones activas
            </p>
          </div>
        </div>

        {/* Secondary Metrics (Right Side Grid) */}
        <div className="lg:w-3/5 grid grid-cols-2 gap-4 md:gap-6">
          
          {/* Verificados */}
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:bg-emerald-100 transition-colors" />
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Verificados</span>
              <p className="text-4xl font-black text-slate-900 mt-2">{metrics.countVerified}</p>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              Completados
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 opacity-50 group-hover:bg-amber-100 transition-colors" />
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Por Verificar</span>
              <p className="text-4xl font-black text-slate-900 mt-2">{metrics.countPending}</p>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-1.5 text-amber-600 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              En cola
            </div>
          </div>

          {/* Rechazados */}
          <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -z-0 opacity-50 group-hover:bg-rose-100 transition-colors" />
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Rechazados</span>
              <p className="text-4xl font-black text-slate-900 mt-2">{metrics.countRejected}</p>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-1.5 text-rose-600 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              Anulados
            </div>
          </div>

          {/* Distribución por Banco */}
          <div className="bg-sky-50 border border-sky-100 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-800">Distribución Bancos</span>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700">Nequi</span>
                  </div>
                  <span className="font-black text-slate-900">{metrics.countNequi ?? 0}</span>
                </div>
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700">B.colombia</span>
                  </div>
                  <span className="font-black text-slate-900">{metrics.countBancolombia ?? 0}</span>
                </div>
                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" />
                    <span className="text-sm font-bold text-slate-700">Otros</span>
                  </div>
                  <span className="font-black text-slate-900">{metrics.countOtrosBancos ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
  );
};
