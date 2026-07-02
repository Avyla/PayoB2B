'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { DashboardMetrics, MetricsData } from '@/components/DashboardMetrics';
import { TransactionsTable, Transaction } from '@/components/TransactionsTable';
import { SharedFilterBar, FilterValues } from '@/components/SharedFilterBar';
import { UploadModal } from '@/components/UploadModal';
import { toast } from 'sonner';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw new Error('No autorizado. Sesión expirada.');
    }
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
};

interface TxResponse {
  data: Transaction[];
  total: number;
}

interface EmailStatus {
  connected: boolean;
  email: string | null;
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterValues>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    
    return {
      banco: '',
      estado: '',
      origen: '',
      fecha_inicio: today.toISOString(),
      fecha_fin: endToday.toISOString()
    };
  });
  
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const { data: whatsappLinks } = useSWR(`${apiUrl}/whatsapp-links`, fetcher);

  // Build query string
  const queryParams = new URLSearchParams();
  if (filters.banco) queryParams.append('banco', filters.banco);
  if (filters.estado) queryParams.append('estado', filters.estado);
  if (filters.origen) queryParams.append('origen', filters.origen);
  if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
  
  // Pagination
  queryParams.append('limit', limit.toString());
  queryParams.append('offset', ((page - 1) * limit).toString());
  
  const queryString = queryParams.toString();
  const txUrl = `${apiUrl}/transactions${queryString ? `?${queryString}` : ''}`;
  
  const metricsParams = new URLSearchParams();
  if (filters.fecha_inicio) metricsParams.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) metricsParams.append('fecha_fin', filters.fecha_fin);
  const metricsQueryString = metricsParams.toString();
  const metricsUrl = `${apiUrl}/dashboard/metrics${metricsQueryString ? `?${metricsQueryString}` : ''}`;
  
  const { data: metrics, error: metricsError, mutate: mutateMetrics } = useSWR<MetricsData>(metricsUrl, fetcher, { revalidateOnMount: true, revalidateOnFocus: true });
  const { data: txResponse, error: txError, mutate: mutateTx, isLoading: txLoading } = useSWR<TxResponse>(txUrl, fetcher, { revalidateOnMount: true, revalidateOnFocus: true, dedupingInterval: 1000 });
  const transactions = txResponse?.data || [];
  const total = txResponse?.total || 0;

  const handleUpdateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${apiUrl}/transactions/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      mutateTx();
      mutateMetrics();
      toast.success('Transacción actualizada correctamente');
    } catch (error) {
      console.error('Failed to update transaction', error);
      toast.error('Error al actualizar la transacción');
    }
  };

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1); // Reset page on filter change
    toast.success('Filtros aplicados');
  };

  const handleUploadSuccess = () => {
    toast.success('¡Comprobante cargado y procesado con éxito!');
    setIsUploadModalOpen(false);
    mutateTx();
    mutateMetrics();
  };

  const handleUploadError = (msg: string) => {
    toast.error(msg);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex justify-between items-start md:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            {getGreeting()}
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de comprobantes bancarios, extracción OCR y verificación en tiempo real.</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="shrink-0 bg-slate-900 text-white p-3 md:px-5 md:py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="hidden md:inline">Cargar Comprobante</span>
        </button>
      </div>

      {/* Full Width Metrics */}
      <DashboardMetrics metrics={metrics || null} loading={!metrics && !metricsError} />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Transacciones Recientes</h2>
        </div>
        
        <SharedFilterBar
        initialFilters={filters}
        onApplyFilters={handleApplyFilters}
        whatsappLinks={whatsappLinks || []}
      />   <TransactionsTable 
          transactions={transactions} 
          loading={txLoading} 
          onUpdateTransaction={handleUpdateTransaction} 
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
        />
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess} 
        onError={handleUploadError} 
      />
    </div>
  );
}
