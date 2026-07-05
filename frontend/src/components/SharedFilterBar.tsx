'use client';
import React, { useState, useEffect } from 'react';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomDropdown, DropdownOption } from './CustomDropdown';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterValues {
  fecha_inicio: string;
  fecha_fin: string;
  banco: string;
  origen: string;
  estado: string;
}

interface SharedFilterBarProps {
  initialFilters?: Partial<FilterValues>;
  onApplyFilters: (filters: FilterValues) => void;
  showEstado?: boolean;
  whatsappLinks?: any[];
}

export const SharedFilterBar: React.FC<SharedFilterBarProps> = ({ 
  initialFilters, 
  onApplyFilters,
  showEstado = true,
  whatsappLinks = []
}) => {
  const [fecha_inicio, setFechaInicio] = useState<Date | null>(initialFilters?.fecha_inicio ? new Date(initialFilters.fecha_inicio) : null);
  const [fecha_fin, setFechaFin] = useState<Date | null>(initialFilters?.fecha_fin ? new Date(initialFilters.fecha_fin) : null);
  const [banco, setBanco] = useState(initialFilters?.banco || '');
  const [origen, setOrigen] = useState(initialFilters?.origen || '');
  const [estado, setEstado] = useState(initialFilters?.estado || '');
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleApply = () => {
    onApplyFilters({
      fecha_inicio: fecha_inicio ? fecha_inicio.toISOString() : '',
      fecha_fin: fecha_fin ? fecha_fin.toISOString() : '',
      banco,
      origen,
      estado
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    
    setFechaInicio(today);
    setFechaFin(endToday);
    setBanco('');
    setOrigen('');
    setEstado('');
    onApplyFilters({ 
      fecha_inicio: today.toISOString(), 
      fecha_fin: endToday.toISOString(), 
      banco: '', 
      origen: '', 
      estado: '' 
    });
    setIsOpen(false);
  };

  const bancoOptions: DropdownOption[] = [
    { value: '', label: 'Todos los bancos' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'BANCOLOMBIA', label: 'Bancolombia' },
    { value: 'OTROS_BANCOS', label: 'Otros Bancos' },
  ];

  const estadoOptions: DropdownOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'SUBIDO_SIN_VERIFICAR', label: 'Sin verificar' },
    { value: 'VERIFICADO_MANUAL', label: 'Verificado (Manual)' },
    { value: 'VERIFICADO_SISTEMA', label: 'Verificado (Sistema)' },
    { value: 'DUPLICADO_SOSPECHOSO', label: 'Duplicado Sospechoso' },
    { value: 'RECHAZADO', label: 'Rechazado' },
  ];

  const origenOptions: DropdownOption[] = [
    { value: '', label: 'Cualquier origen' },
    { value: 'WEB', label: 'Web (Admin)' },
    ...(whatsappLinks.map((link: any) => ({
      value: link.numero,
      label: link.etiqueta ? `${link.etiqueta} (${link.numero})` : link.numero
    })))
  ];

  const filterFields = (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1 bg-white">
      <div className="w-full flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Desde</label>
        <CustomDatePicker selected={fecha_inicio} onChange={setFechaInicio} placeholderText="Fecha de inicio" showTimeSelect={true} maxDate={fecha_fin} />
      </div>

      <div className="w-full flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Hasta</label>
        <CustomDatePicker selected={fecha_fin} onChange={setFechaFin} placeholderText="Fecha fin" showTimeSelect={true} minDate={fecha_inicio} />
      </div>

      <div className="w-full flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Banco</label>
        <CustomDropdown value={banco} onChange={setBanco} options={bancoOptions} />
      </div>
      
      {showEstado && (
        <div className="w-full flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Estado</label>
          <CustomDropdown value={estado} onChange={setEstado} options={estadoOptions} />
        </div>
      )}

      <div className="w-full flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Origen / Cajero</label>
        <CustomDropdown value={origen} onChange={setOrigen} options={origenOptions} />
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex flex-col md:flex-row gap-3 w-full justify-end">
      <button
        onClick={handleReset}
        className="w-full md:w-auto bg-white text-slate-700 border border-slate-200 px-6 py-2.5 rounded-md hover:bg-slate-50 hover:border-slate-300 shadow-sm text-sm font-bold transition-colors md:order-1 order-2"
      >
        Limpiar
      </button>
      <button
        onClick={handleApply}
        className="w-full md:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-md hover:bg-slate-800 shadow-sm text-sm font-bold transition-colors md:order-2 order-1"
      >
        Aplicar
      </button>
    </div>
  );

  // Avoid hydration mismatch for motion components
  if (!isMounted) return null;

  return (
    <div className="mb-6 flex justify-end">
      {/* Trigger Button (Visible on all screens) */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-white border border-slate-200 px-4 py-2 rounded-md font-bold text-sm text-slate-700 flex justify-center items-center gap-2 shadow-sm hover:bg-slate-50 transition-colors w-full md:w-auto"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Filtros de Búsqueda
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Global Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm" 
              onClick={() => setIsOpen(false)} 
            />

            {/* Mobile Bottom Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-6 pb-0 flex justify-between items-center shrink-0 border-b border-slate-100 pb-4">
                <h3 className="font-bold text-xl text-slate-800 tracking-tight">Filtros</h3>
                <button onClick={() => setIsOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {filterFields}

              <div className="p-6 pt-4 bg-white border-t border-slate-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                {actionButtons}
              </div>
            </motion.div>

            {/* Desktop Right Drawer (Slide-Over) */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="hidden md:flex fixed inset-y-0 right-0 w-96 z-50 bg-white shadow-2xl flex-col"
            >
              <div className="p-6 flex justify-between items-center shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-tight">Filtros de Búsqueda</h3>
                    <p className="text-xs font-medium text-slate-500">Refina las transacciones</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-2 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {filterFields}

              <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                {actionButtons}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
