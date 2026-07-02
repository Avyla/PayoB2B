import React from 'react';
import UploadDropzone from './UploadDropzone';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function UploadModal({ isOpen, onClose, onSuccess, onError }: UploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 transform transition-all animate-slide-up">
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Cargar Comprobante</h2>
            <p className="text-sm text-slate-500 mt-1">Sube la imagen para extraer los datos (OCR).</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-6 bg-slate-50">
          <UploadDropzone 
            onSuccess={() => {
              onSuccess();
              onClose();
            }} 
            onError={onError} 
          />
        </div>
      </div>
    </div>
  );
}
