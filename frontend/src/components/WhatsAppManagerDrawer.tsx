'use client';

import React, { useState } from 'react';
import useSWR from 'swr';

interface WhatsAppNumber {
  id_numero: string;
  numero: string;
  etiqueta: string | null;
  fecha_registro: string;
}

interface WhatsAppManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ocurrió un error al cargar los datos.');
  }
  return res.json();
};

// Utilidad simple para enmascarar el teléfono: +XX XXX XXX XXXX
const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '');
  const match = clean.match(/^(\d{2})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  if (clean.length > 2) {
      return `+${clean.substring(0, 2)} ${clean.substring(2)}`;
  }
  return clean ? `+${clean}` : '';
};

export default function WhatsAppManagerDrawer({ isOpen, onClose }: WhatsAppManagerDrawerProps) {
  const [numeroRaw, setNumeroRaw] = useState('');
  const [numeroDisplay, setNumeroDisplay] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [numberToDelete, setNumberToDelete] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const { data: numbers, error, mutate, isLoading } = useSWR<WhatsAppNumber[]>(
    isOpen ? `${apiUrl}/whatsapp-links` : null,
    fetcher
  );

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setNumeroRaw(rawValue);
    setNumeroDisplay(formatPhoneNumber(rawValue));
  };

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numeroRaw.length < 10) {
      showToast('El número es demasiado corto.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/whatsapp-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numero: numeroRaw, etiqueta })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al agregar número');
      }

      setNumeroRaw('');
      setNumeroDisplay('');
      setEtiqueta('');
      showToast('Número vinculado correctamente', 'success');
      mutate();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveNumber = async (id: string) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/whatsapp-links/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Error al eliminar número');

      setNumberToDelete(null);
      setDeleteConfirmationText('');
      showToast('Número desvinculado correctamente', 'success');
      mutate();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
               <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.122.553 4.195 1.603 6.012L.15 23.465l5.545-1.454a11.967 11.967 0 006.336 1.802h.005c6.645 0 12.031-5.388 12.031-12.035A12.038 12.038 0 0012.031 0zm7.143 17.185c-.302.846-1.748 1.62-2.424 1.705-.632.08-1.46.229-4.108-.868-3.385-1.403-5.59-4.88-5.759-5.105-.17-.225-1.375-1.832-1.375-3.493 0-1.66.862-2.477 1.173-2.816.312-.338.675-.423.899-.423.225 0 .45-.005.644.004.204.01.479-.078.748.57.283.678.966 2.36 1.05 2.53.085.169.141.366.028.591-.112.226-.17.367-.34.564-.17.198-.354.436-.508.579-.17.158-.35.333-.153.672.198.339.88 1.453 1.892 2.355 1.306 1.162 2.394 1.522 2.733 1.691.34.17.538.14.739-.085.201-.225.867-1.011 1.096-1.358.228-.348.455-.291.766-.17.311.121 1.965.927 2.304 1.096.34.17.565.254.648.396.084.141.084.819-.218 1.665z"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Números WhatsApp</h2>
              <p className="text-sm text-slate-500">Agrega los celulares autorizados</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setNumberToDelete(null);
              setDeleteConfirmationText('');
              onClose();
            }}
            className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-2 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 relative">
          
          {toastMessage && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border shadow-sm animate-in fade-in slide-in-from-top-2 ${toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              {toastMessage.text}
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
            <form onSubmit={handleAddNumber} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">WhatsApp (con código país)</label>
                <input 
                  type="text" 
                  placeholder="+57 300 123 4567" 
                  value={numeroDisplay}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-semibold text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Etiqueta (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Ej: Sede Norte..." 
                  value={etiqueta}
                  onChange={(e) => setEtiqueta(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all font-semibold text-slate-800"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || numeroRaw.length < 10}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-sm flex justify-center items-center gap-2 mt-2"
              >
                {isSubmitting ? (
                   <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Vinculando...</>
                ) : 'Vincular Número'}
              </button>
            </form>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-widest pl-1">Números Vinculados</h4>
            
            {isLoading ? (
              <div className="text-center py-6 text-slate-500 text-sm font-semibold flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                Cargando...
              </div>
            ) : error ? (
              <div className="text-center py-6 text-rose-500 text-sm font-semibold bg-white rounded-xl border border-rose-100">Error al cargar números</div>
            ) : numbers?.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                   <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-sm font-semibold text-slate-600">Aún no has agregado ningún número.</p>
                <p className="text-xs text-slate-400 mt-1">Ingresa los datos arriba para comenzar.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {numbers?.map((num) => (
                  <li key={num.id_numero} className="flex flex-col p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-colors">
                    
                    {/* Normal View */}
                    {numberToDelete !== num.id_numero && (
                      <div className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.388 0 12.035c0 2.122.553 4.195 1.603 6.012L.15 23.465l5.545-1.454a11.967 11.967 0 006.336 1.802h.005c6.645 0 12.031-5.388 12.031-12.035A12.038 12.038 0 0012.031 0zm7.143 17.185c-.302.846-1.748 1.62-2.424 1.705-.632.08-1.46.229-4.108-.868-3.385-1.403-5.59-4.88-5.759-5.105-.17-.225-1.375-1.832-1.375-3.493 0-1.66.862-2.477 1.173-2.816.312-.338.675-.423.899-.423.225 0 .45-.005.644.004.204.01.479-.078.748.57.283.678.966 2.36 1.05 2.53.085.169.141.366.028.591-.112.226-.17.367-.34.564-.17.198-.354.436-.508.579-.17.158-.35.333-.153.672.198.339.88 1.453 1.892 2.355 1.306 1.162 2.394 1.522 2.733 1.691.34.17.538.14.739-.085.201-.225.867-1.011 1.096-1.358.228-.348.455-.291.766-.17.311.121 1.965.927 2.304 1.096.34.17.565.254.648.396.084.141.084.819-.218 1.665z"/></svg>
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm tracking-wide">
                              {formatPhoneNumber(num.numero)}
                            </p>
                            {num.etiqueta && (
                              <p className="text-xs font-medium text-slate-500 mt-0.5">{num.etiqueta}</p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => setNumberToDelete(num.id_numero)}
                          className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-full transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}

                    {/* Strict Deletion View */}
                    {numberToDelete === num.id_numero && (
                      <div className="w-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 p-3 rounded-t-xl border-b border-rose-100 flex items-center gap-2">
                           <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Confirmación Requerida</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-b-xl border border-t-0 border-slate-200">
                           <p className="text-xs text-slate-600 font-medium mb-3">Escribe la palabra <strong className="text-slate-900 font-bold select-all">ELIMINAR</strong> para confirmar que deseas desvincular el número <strong>{formatPhoneNumber(num.numero)}</strong>.</p>
                          <input 
                            type="text" 
                            placeholder="ELIMINAR"
                            value={deleteConfirmationText}
                            onChange={(e) => setDeleteConfirmationText(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300 mb-3"
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setNumberToDelete(null);
                                setDeleteConfirmationText('');
                              }}
                              className="px-4 py-2 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => handleRemoveNumber(num.id_numero)}
                              disabled={deleteConfirmationText !== 'ELIMINAR' || isDeleting}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {isDeleting ? 'Eliminando...' : 'Confirmar Baja'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
