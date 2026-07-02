'use client';

import React, { useCallback, useState, useRef } from 'react';

interface UploadDropzoneProps {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export default function UploadDropzone({ onSuccess, onError }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      if (onError) onError('Formato inválido. Solo JPG, PNG o WEBP.');
      return false;
    }
    return true;
  };

  const handleFile = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/transactions/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('No autorizado. Sesión expirada.');
      }

      if (!response.ok) {
        let errorMsg = 'Error al subir el comprobante.';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch (_) {
          // ignore parse errors
        }
        throw new Error(errorMsg);
      }

      const data = await response.json().catch(() => ({}));
      clearFile();

      if (data.isDuplicate && onError) {
        // We use onError here just to display a warning toast/banner, but we still trigger onSuccess to refresh
        onError(data.message || '⚠️ Comprobante duplicado detectado y enviado a cuarentena.');
      }
      
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Error al subir el comprobante. Verifique la conexión.';
      if (onError) onError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-[1.01]'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        {!file ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Arrastra y suelta tu comprobante aquí, o elige una opción:
              </p>
              <p className="text-xs text-gray-500 mt-1">Solo JPG, PNG o WEBP</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full justify-center">
              {/* Botón de Galería (Label wrapper) */}
              <label className="cursor-pointer inline-flex justify-center items-center gap-2 px-6 py-3 border-2 border-blue-100 rounded-xl text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 shadow-sm transition-colors w-full sm:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="sr-only"
                />
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Subir de Galería
              </label>

              {/* Botón de Cámara (Label wrapper) */}
              <label className="cursor-pointer inline-flex justify-center items-center gap-2 px-6 py-3 border-2 border-emerald-100 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-sm transition-colors w-full sm:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFileChange}
                  className="sr-only"
                />
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tomar Foto
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="truncate max-w-[220px] font-medium">{file.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Image preview and OCR loading state */}
      {preview && (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 p-3 relative">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vista previa del comprobante</p>
          <div className="relative">
            <img
              src={preview}
              alt="Vista previa del comprobante"
              className={`max-h-56 w-full object-contain rounded-lg border border-slate-200 bg-white transition-opacity ${isUploading ? 'opacity-30' : 'opacity-100'}`}
            />
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                  <span className="text-sm text-slate-700 font-bold animate-pulse">Procesando con IA (OCR)...</span>
                </div>
                {/* Skeleton scanning line overlay */}
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {file && !isUploading && (
        <div className="flex space-x-3 justify-end pt-2">
          <button
            type="button"
            onClick={clearFile}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={uploadFile}
            className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
          >
            Subir Comprobante
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
