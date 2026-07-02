'use client';
import React, { useState } from 'react';

export interface FilterValues {
  banco: string;
  estado: string;
  startDate: string;
  endDate: string;
}

interface AdvancedFiltersProps {
  initialFilters?: Partial<FilterValues>;
  onApplyFilters: (filters: FilterValues) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ initialFilters, onApplyFilters }) => {
  const [banco, setBanco] = useState(initialFilters?.banco || '');
  const [estado, setEstado] = useState(initialFilters?.estado || '');
  const [startDate, setStartDate] = useState(initialFilters?.startDate || '');
  const [endDate, setEndDate] = useState(initialFilters?.endDate || '');

  const handleApply = () => {
    onApplyFilters({ banco, estado, startDate, endDate });
    setIsOpen(false);
  };

  const handleReset = () => {
    setBanco('');
    setEstado('');
    setStartDate('');
    setEndDate('');
    onApplyFilters({ banco: '', estado: '', startDate: '', endDate: '' });
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setIsOpen(true)} 
          className="w-full bg-white border border-slate-300 p-3 rounded-xl font-bold text-slate-700 flex justify-center items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtros Avanzados
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Filter Container */}
      <div className={`
        ${isOpen 
          ? 'fixed inset-x-0 bottom-0 z-50 bg-white p-6 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-slide-up' 
          : 'hidden md:flex bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 flex-wrap md:flex-nowrap gap-3 items-end'}
      `}>
        {isOpen && (
          <div className="flex justify-between items-center mb-2 md:hidden">
            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Filtros</h3>
            <button onClick={() => setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      <div className="flex-1 min-w-[140px]">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Banco</label>
        <div className="relative">
          <select
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2.5 font-semibold transition-colors"
          >
            <option value="">Todos los bancos</option>
            <option value="NEQUI">Nequi</option>
            <option value="BANCOLOMBIA">Bancolombia</option>
            <option value="OTROS_BANCOS">Otros Bancos</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Estado</label>
        <div className="relative">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2.5 font-semibold transition-colors"
          >
            <option value="">Todos los estados</option>
            <option value="SUBIDO_SIN_VERIFICAR">⏳ Sin verificar</option>
            <option value="VERIFICADO_MANUAL">👤 Verificado (Manual)</option>
            <option value="VERIFICADO_SISTEMA">⚡ Verificado (Sistema)</option>
            <option value="DUPLICADO_SOSPECHOSO">⚠️ Duplicado Sospechoso</option>
            <option value="RECHAZADO">✖ Rechazado</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-[130px]">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Desde</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2.5 font-semibold transition-colors"
        />
      </div>

      <div className="flex-1 min-w-[130px]">
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Hasta</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2.5 font-semibold transition-colors"
        />
      </div>

      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-2 w-full md:w-auto mt-4 md:mt-0">
        <button
          onClick={handleApply}
          className="w-full md:w-auto bg-slate-900 text-white px-5 py-3 md:py-2.5 rounded-xl hover:bg-slate-800 shadow-sm text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Aplicar
        </button>
        <button
          onClick={handleReset}
          className="w-full md:w-auto bg-white text-slate-600 border border-slate-300 px-5 py-3 md:py-2.5 rounded-xl hover:bg-slate-50 shadow-sm text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
    </>
  );
};
