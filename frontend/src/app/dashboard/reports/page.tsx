'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { TransactionsTable } from '@/components/TransactionsTable';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SharedFilterBar, FilterValues } from '@/components/SharedFilterBar';
import { DropdownOption } from '@/components/CustomDropdown';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) {
    let errorMessage = 'Ocurrió un error al cargar los datos.';
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      errorMessage = 'No autorizado. Sesión expirada.';
    } else {
      try {
        const data = await res.json();
        if (data.message) errorMessage = data.message;
      } catch (e) {}
    }
    throw new Error(errorMessage);
  }
  return res.json();
};

const CHART_COLORS = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1']; // Dark Premium Slate Palette

export default function ReportsDashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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

  const [activeTab, setActiveTab] = useState<'anomalias' | 'todas'>('anomalias');

  const { data: whatsappLinks } = useSWR(`${apiUrl}/whatsapp-links`, fetcher);

  const queryParams = new URLSearchParams();
  if (filters.fecha_inicio) queryParams.append('fecha_inicio', filters.fecha_inicio);
  if (filters.fecha_fin) queryParams.append('fecha_fin', filters.fecha_fin);
  if (filters.banco) queryParams.append('banco', filters.banco);
  if (filters.origen) queryParams.append('origen', filters.origen);
  if (filters.estado) queryParams.append('estado', filters.estado);

  const { data: cierreData, isLoading: loadingCierre } = useSWR(`${apiUrl}/reports/cierre?${queryParams.toString()}`, fetcher);
  const { data: anomaliasData, isLoading: loadingAnomalias } = useSWR(`${apiUrl}/reports/anomalias?${queryParams.toString()}`, fetcher);
  const { data: eficienciaData, isLoading: loadingEficiencia } = useSWR(`${apiUrl}/reports/eficiencia?${queryParams.toString()}`, fetcher);
  const { data: transaccionesData, isLoading: loadingTransacciones } = useSWR(activeTab === 'todas' ? `${apiUrl}/transactions?${queryParams.toString()}` : null, fetcher);

  const handleExportCSV = () => {
    if (!cierreData?.data) return;
    
    const rows = [['Banco', 'Estado', 'Monto Total']];
    cierreData.data.forEach((item: any) => {
      rows.push([item.banco, item.estado, item._sum.monto || 0]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CierreCaja_${filters.fecha_inicio.split('T')[0]}_${filters.fecha_fin.split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCOP = (amount: string | number | null): string => {
    if (amount === null || amount === undefined || amount === '') return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  // Transform data for Recharts (Agrupado por Banco independientemente del Estado)
  const chartData = React.useMemo(() => {
    if (!cierreData?.data) return [];
    const groupedByBanco: Record<string, number> = {};
    cierreData.data.forEach((item: any) => {
      groupedByBanco[item.banco] = (groupedByBanco[item.banco] || 0) + Number(item._sum.monto || 0);
    });
    return Object.entries(groupedByBanco).map(([name, value]) => ({ name, value }));
  }, [cierreData]);

  const bancoOptions: DropdownOption[] = [
    { value: '', label: 'Todos los bancos' },
    { value: 'NEQUI', label: 'Nequi' },
    { value: 'BANCOLOMBIA', label: 'Bancolombia' },
    { value: 'OTROS_BANCOS', label: 'Otros Bancos' },
  ];

  const origenOptions: DropdownOption[] = [
    { value: '', label: 'Cualquier origen' },
    { value: 'WEB', label: 'Web (Admin)' },
    ...(whatsappLinks?.map((link: any) => ({
      value: link.numero,
      label: link.etiqueta ? `${link.etiqueta} (${link.numero})` : link.numero
    })) || [])
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reportes y Auditoría</h1>
          <p className="text-slate-500 font-medium mt-1">Inteligencia de negocios y trazabilidad.</p>
        </div>
        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exportar CSV
        </button>
      </div>

      {/* Global Filter Bar */}
      <SharedFilterBar
        initialFilters={filters}
        onApplyFilters={setFilters}
        whatsappLinks={whatsappLinks || []}
        showEstado={false}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cierre de Caja Card (Recharts) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Cierre de Caja Agrupado
          </h2>
          {loadingCierre ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Cargando métricas...</div>
          ) : chartData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center h-auto md:h-64 gap-8">
              <div className="w-full md:w-1/2 h-64 md:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCOP(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 overflow-y-auto max-h-64 pr-2 space-y-3 pb-4 md:pb-0">
                {cierreData?.data?.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-700">{item.banco}</span>
                      <span className="font-extrabold text-slate-900">{formatCOP(item._sum.monto)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold uppercase tracking-widest ${item.estado === 'VERIFICADO_SISTEMA' || item.estado === 'VERIFICADO_MANUAL' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {item.estado === 'VERIFICADO_SISTEMA' || item.estado === 'VERIFICADO_MANUAL' ? 'Aprobado' : 'Pendiente / Fallido'}
                      </span>
                      <span className="text-slate-500 font-medium">{item._count.id_transaccion} txs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
               <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
               <p>No hay transacciones en este turno.</p>
             </div>
          )}
        </div>

        {/* Eficiencia Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Eficiencia
          </h2>
          {loadingEficiencia ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Calculando...</div>
          ) : (
            <div className="flex flex-col justify-center h-64">
              <div className="text-center mb-6">
                <p className="text-6xl font-extrabold text-slate-900">{eficienciaData?.porcentaje_automatizacion || 0}%</p>
                <p className="text-sm font-medium text-slate-500 mt-2">Automatización (Cero Toques)</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xl font-bold text-slate-900">{eficienciaData?.verificado_sistema || 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">Auto-Conciliadas</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <p className="text-xl font-bold text-slate-900">{eficienciaData?.total_transacciones || 0}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">Volumen Total</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auditoría / Anomalías Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              Auditoría de Transacciones
            </h2>
            <p className="text-sm text-slate-500 mt-1">Revisa transacciones y verifica la evidencia visual frente a los datos extraídos.</p>
          </div>
          <div className="flex bg-slate-200/60 p-1 rounded-lg w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('anomalias')}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'anomalias' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Anomalías
            </button>
            <button 
              onClick={() => setActiveTab('todas')}
              className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'todas' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas las Transacciones
            </button>
          </div>
        </div>
        
        <div className="p-0">
          {(activeTab === 'anomalias' ? loadingAnomalias : loadingTransacciones) ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <svg className="w-8 h-8 text-slate-300 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span className="text-slate-400 font-medium">Cargando transacciones...</span>
            </div>
          ) : (
            <TransactionsTable 
              transactions={activeTab === 'anomalias' ? (anomaliasData?.listado || []) : (transaccionesData?.data || [])} 
              loading={false}
              onUpdateTransaction={async (id, updates) => {
                const token = localStorage.getItem('token') || '';
                await fetch(`${apiUrl}/transactions/${id}`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(updates)
                });
                window.location.reload();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
