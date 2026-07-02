'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { EvidenceDrawer } from './EvidenceDrawer';
import EmptyState from './EmptyState';

/** Format a number as Colombian Peso (COP) */
const formatCOP = (amount: string | number | null): string => {
  if (amount === null || amount === undefined || amount === '') return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export interface Transaction {
  id_transaccion: string;
  banco: 'NEQUI' | 'BANCOLOMBIA' | 'OTROS_BANCOS';
  monto: number | null;
  referencia: string | null;
  fecha_transaccion: string | null;
  estado: 'SUBIDO_SIN_VERIFICAR' | 'VERIFICADO_MANUAL' | 'VERIFICADO_SISTEMA' | 'RECHAZADO' | 'DUPLICADO_SOSPECHOSO';
  url_imagen_gcs: string;
  canal_ingreso?: string;
  numero_whatsapp_origen?: string | null;
  nombre_remitente_ocr?: string | null;
  creador?: { nombre_completo: string; email: string } | null;
  duplicado_de?: Transaction | null;
  alerta_email?: {
    asunto: string | null;
    remitente_original: string | null;
    nombre_remitente: string | null;
    banco: 'NEQUI' | 'BANCOLOMBIA' | 'OTROS_BANCOS';
    monto: number | null;
    referencia: string | null;
    fecha_hora_transaccion: string | null;
  } | null;
  notas_revision?: string | null;
  fecha_creacion: string;
}

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('Error fetching data');
  return res.json();
};

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  total?: number;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
  transactions, 
  loading, 
  onUpdateTransaction,
  total = 0,
  page = 1,
  limit = 10,
  onPageChange
}) => {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Fetch whatsapp links for alias mapping
  const { data: whatsappLinks } = useSWR(`${apiUrl}/whatsapp-links`, fetcher);

  if (loading) {
    return <div className="text-center py-8">Cargando transacciones...</div>;
  }

  const openEditModal = async (tx: Transaction) => {
    // Show drawer immediately
    setEditingTx({ ...tx, url_imagen_gcs: '' });
    if (tx.duplicado_de) {
      setEditingTx(current => current ? { ...current, duplicado_de: { ...tx.duplicado_de!, url_imagen_gcs: '' } } : current);
    }
    
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/transactions/${tx.id_transaccion}/image`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEditingTx(current => {
          if (!current || current.id_transaccion !== tx.id_transaccion) return current;
          return {
            ...current,
            url_imagen_gcs: data.url,
            duplicado_de: current.duplicado_de ? { ...current.duplicado_de, url_imagen_gcs: data.duplicadoUrl } : undefined
          };
        });
      }
    } catch (e) {
      console.error('Failed to fetch image URL', e);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha TX</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Banco</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ref</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id_transaccion} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                  {tx.fecha_transaccion ? new Date(tx.fecha_transaccion).toLocaleDateString() : new Date(tx.fecha_creacion).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                  {tx.banco === 'OTROS_BANCOS' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      Otros Bancos
                    </span>
                  ) : tx.banco === 'NEQUI' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200">Nequi</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Bancolombia</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{tx.referencia || <span className="text-red-400 italic font-sans">Falta ref</span>}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-extrabold tabular-nums">
                  {tx.monto
                    ? formatCOP(tx.monto)
                    : <span className="text-red-400 italic font-normal">Falta monto</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase tracking-widest font-extrabold rounded-md ${
                    tx.estado === 'VERIFICADO_SISTEMA' ? 'bg-emerald-100 text-emerald-800' :
                    tx.estado === 'VERIFICADO_MANUAL' ? 'bg-slate-100 text-slate-600' :
                    tx.estado === 'RECHAZADO' ? 'bg-rose-100 text-rose-800' :
                    tx.estado === 'DUPLICADO_SOSPECHOSO' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {tx.estado === 'VERIFICADO_SISTEMA' ? 'Sistema' :
                     tx.estado === 'VERIFICADO_MANUAL' ? 'Manual' :
                     tx.estado === 'RECHAZADO' ? 'Rechazado' :
                     tx.estado === 'DUPLICADO_SOSPECHOSO' ? 'Duplicado' :
                     'Sin Verificar'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                  <button 
                    onClick={() => openEditModal(tx)} 
                    className={`font-bold px-4 py-1.5 rounded-md transition-colors text-xs uppercase tracking-wider shadow-sm border ${
                      tx.estado === 'SUBIDO_SIN_VERIFICAR' || tx.estado === 'DUPLICADO_SOSPECHOSO'
                        ? 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50' 
                        : 'text-slate-500 bg-transparent border-transparent hover:bg-slate-100 shadow-none'
                    }`}
                  >
                    {tx.estado === 'SUBIDO_SIN_VERIFICAR' ? 'Verificar' : tx.estado === 'DUPLICADO_SOSPECHOSO' ? 'Resolver' : 'Auditar'}
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 bg-slate-50 rounded-b-lg">
                  <EmptyState 
                    title="¡Todo está al día!" 
                    description="No tienes transacciones pendientes en este momento. Tómate un café o prepárate para la siguiente ola de ventas." 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="text-sm text-gray-700">
            Mostrando página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span> ({total} resultados)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Evidence Drawer */}
      <EvidenceDrawer 
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onUpdateTransaction={onUpdateTransaction}
        whatsappLinks={whatsappLinks || []}
      />
    </div>
  );
};
