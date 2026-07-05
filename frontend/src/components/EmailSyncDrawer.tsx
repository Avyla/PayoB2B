'use client';

import React, { useState } from 'react';
import useSWR from 'swr';

interface EmailStatus {
  connected: boolean;
  accounts: string[];
}

interface PendingEmail {
  id_alerta: string;
  banco: string;
  monto: number;
  referencia: string | null;
  nombre_remitente: string | null;
  remitente_original?: string | null;
  asunto?: string | null;
  fecha_alerta: string;
  estado_cruce: string;
  html_original?: string;
}

interface Transaction {
  id_transaccion: string;
  banco: string;
  monto: number | null;
  referencia: string | null;
  fecha_transaccion: string | null;
  estado: string;
  creador?: { nombre_completo: string } | null;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token') || '';
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error('Error fetching data');
  }
  return res.json();
};

interface EmailSyncDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailSyncDrawer: React.FC<EmailSyncDrawerProps> = ({ isOpen, onClose }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  
  const { data: status, error, mutate } = useSWR<EmailStatus>(
    isOpen ? `${apiUrl}/email/status` : null, 
    fetcher, 
    { refreshInterval: 3000, revalidateOnFocus: true }
  );

  const { data: pendingData, mutate: mutatePending } = useSWR<{ data: PendingEmail[] }>(
    status?.connected && isOpen ? `${apiUrl}/email/pendientes` : null, 
    fetcher
  );

  const { data: dlqData, mutate: mutateDlq } = useSWR<{ data: PendingEmail[] }>(
    status?.connected && isOpen ? `${apiUrl}/email/dlq` : null, 
    fetcher
  );

  const [loading, setLoading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'dlq'>('pending');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [linkingEmailId, setLinkingEmailId] = useState<string | null>(null);
  const [linkingTransactionId, setLinkingTransactionId] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const { data: unverifiedData } = useSWR<{ data: Transaction[] }>(
    linkingEmailId && isOpen ? `${apiUrl}/transactions?estado=SUBIDO_SIN_VERIFICAR` : null,
    fetcher
  );

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/email/auth-url`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.url) {
        const width = 500, height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        window.open(data.url, 'GmailAuth', `width=${width},height=${height},top=${top},left=${left}`);
      }
    } catch (err) {
      console.error('Error obteniendo URL de autenticación', err);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setSyncMessage(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/email/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({ text: data.message, type: 'success' });
        mutatePending();
      } else {
        setSyncMessage({ text: data.error || 'Error al sincronizar', type: 'error' });
      }
    } catch (err) {
      setSyncMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleReprocess = async (id: string) => {
    setReprocessingId(id);
    setSyncMessage(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/email/dlq/${id}/reprocess`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({ text: data.message, type: 'success' });
        mutateDlq();
        mutatePending();
      } else {
        setSyncMessage({ text: data.error || 'Error al reprocesar', type: 'error' });
      }
    } catch (err) {
      setSyncMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setReprocessingId(null);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleDisconnect = async (email: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/email/disconnect?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSyncMessage({ text: `Cuenta ${email} desvinculada`, type: 'success' });
        setEmailToDelete(null);
        setDeleteConfirmationText('');
        mutate();
      } else {
        const data = await res.json();
        setSyncMessage({ text: data.error || 'Error al desvincular', type: 'error' });
      }
    } catch (err) {
      setSyncMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleLinkManual = async () => {
    if (!linkingEmailId || !linkingTransactionId) return;
    setIsLinking(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/transactions/${linkingTransactionId}/link-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_alerta_email: linkingEmailId })
      });
      if (res.ok) {
        setSyncMessage({ text: 'Vinculado exitosamente', type: 'success' });
        setLinkingEmailId(null);
        setLinkingTransactionId(null);
        mutatePending();
      } else {
        const data = await res.json();
        setSyncMessage({ text: data.error || 'Error al vincular', type: 'error' });
      }
    } catch (err) {
      setSyncMessage({ text: 'Error de conexión', type: 'error' });
    } finally {
      setIsLinking(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const isLoadingStatus = !status && !error;

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Sincronización de Correo</h2>
              <p className="text-sm text-slate-500">Gestión de alertas y errores bancarios</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 p-2 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isLoadingStatus ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : status?.connected ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Huérfanos</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pendingData?.data?.length || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-xs font-semibold text-rose-500 uppercase">Errores (DLQ)</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{dlqData?.data?.length || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-800">Cuentas de Recaudo Vinculadas</h3>
                  <button onClick={handleConnect} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                    + Vincular otra cuenta
                  </button>
                </div>
                
                <div className="space-y-3">
                  {status.accounts.map(account => (
                    <div key={account} className="flex flex-col border border-slate-100 rounded-xl bg-slate-50/50 transition-colors">
                      {emailToDelete !== account && (
                        <div className="flex justify-between items-center p-3">
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <p className="text-sm font-medium text-slate-700">{account}</p>
                          </div>
                          <button onClick={() => setEmailToDelete(account)} title="Desvincular cuenta" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                      
                      {emailToDelete === account && (
                        <div className="w-full flex flex-col animate-in fade-in zoom-in-95 duration-200">
                          <div className="bg-rose-50 p-3 rounded-t-xl border-b border-rose-100 flex items-center gap-2">
                             <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                             <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Confirmación Requerida</p>
                          </div>
                          <div className="p-3 bg-white rounded-b-xl border border-t-0 border-slate-200">
                             <p className="text-xs text-slate-600 font-medium mb-3">Escribe la palabra <strong className="text-slate-900 font-bold select-all">ELIMINAR</strong> para confirmar que deseas desvincular <strong>{account}</strong>.</p>
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
                                  setEmailToDelete(null);
                                  setDeleteConfirmationText('');
                                }}
                                className="px-4 py-2 rounded-lg text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => handleDisconnect(account)}
                                disabled={deleteConfirmationText !== 'ELIMINAR' || loading}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {loading ? 'Eliminando...' : 'Confirmar Baja'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSync} disabled={loading} className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Sincronizar Todas Ahora'}
                  </button>
                </div>
              </div>
              
              {syncMessage && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                  {syncMessage.text}
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex border-b border-slate-200">
                  <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'pending' ? 'text-slate-900 border-slate-900 bg-slate-50/50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}`}>
                    Buzón Huérfanos ({pendingData?.data?.length || 0})
                  </button>
                  <button onClick={() => setActiveTab('dlq')} className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'dlq' ? 'text-rose-600 border-rose-600 bg-rose-50/50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}`}>
                    Cola Errores ({dlqData?.data?.length || 0})
                  </button>
                </div>
                
                <div className="p-0">
                  {activeTab === 'pending' ? (
                    pendingData && pendingData.data.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {pendingData.data.map(email => (
                          <div key={email.id_alerta} className="p-5 hover:bg-slate-50 transition-colors">
                            {linkingEmailId === email.id_alerta ? (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                  <h4 className="text-sm font-bold text-slate-800">Seleccionar transacción para vincular</h4>
                                  <button onClick={() => { setLinkingEmailId(null); setLinkingTransactionId(null); }} className="text-xs text-slate-500 hover:text-slate-700">Cancelar</button>
                                </div>
                                {!unverifiedData ? (
                                  <div className="text-center py-4"><div className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div></div>
                                ) : unverifiedData.data.length === 0 ? (
                                  <p className="text-sm text-slate-500 text-center py-4">No hay transacciones pendientes (Subidas sin verificar).</p>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {unverifiedData.data.map(tx => (
                                      <div key={tx.id_transaccion} onClick={() => setLinkingTransactionId(tx.id_transaccion)} className={`p-3 rounded-xl border text-sm cursor-pointer transition-colors ${linkingTransactionId === tx.id_transaccion ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'}`}>
                                        <div className="flex justify-between">
                                          <p className="font-semibold">${tx.monto?.toLocaleString('es-CO')} <span className="opacity-75 font-normal">({tx.banco})</span></p>
                                          <p className="text-xs opacity-75">{new Date(tx.fecha_transaccion || '').toLocaleDateString()}</p>
                                        </div>
                                        <p className="text-xs mt-1 opacity-80">Ref: {tx.referencia || 'N/A'}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex justify-end pt-2">
                                  <button onClick={handleLinkManual} disabled={!linkingTransactionId || isLinking} className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg disabled:opacity-50 hover:bg-slate-800 transition">
                                    {isLinking ? 'Vinculando...' : 'Confirmar Vínculo'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div className="flex-1 min-w-0 w-full">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${email.banco === 'NEQUI' ? 'bg-fuchsia-100 text-fuchsia-800' : email.banco === 'BANCOLOMBIA' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}>{email.banco}</span>
                                    <span className="text-sm font-bold text-slate-900">${email.monto.toLocaleString('es-CO')}</span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-700 mt-1 truncate" title={`Ref: ${email.referencia || 'N/A'} • Remitente: ${email.nombre_remitente || email.remitente_original || 'N/A'}`}>Ref: {email.referencia || 'N/A'} • Remitente: {email.nombre_remitente || email.remitente_original || 'N/A'}</p>
                                  <p className="text-xs text-slate-500 mt-1">{new Date(email.fecha_alerta).toLocaleString('es-CO')}</p>
                                </div>
                                <button onClick={() => setLinkingEmailId(email.id_alerta)} className="shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm w-full sm:w-auto text-center">
                                  Vincular Manualmente
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Buzón vacío</p>
                        <p className="text-xs text-slate-500 mt-1">No hay correos huérfanos pendientes.</p>
                      </div>
                    )
                  ) : (
                    dlqData && dlqData.data.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {dlqData.data.map(email => (
                          <div key={email.id_alerta} className="p-5 bg-rose-50/30 hover:bg-rose-50/60 transition-colors">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                              <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">Error de Parseo</span>
                                  <p className="text-sm font-bold text-slate-900 truncate" title={email.asunto || 'Sin Asunto'}>{email.asunto || 'Sin Asunto'}</p>
                                </div>
                                <p className="text-xs text-slate-600 mt-1 font-medium truncate" title={`De: ${email.remitente_original || email.nombre_remitente || 'Desconocido'}`}>De: {email.remitente_original || email.nombre_remitente || 'Desconocido'}</p>
                                <p className="text-xs text-slate-500 mt-1">{new Date(email.fecha_alerta).toLocaleString('es-CO')}</p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                                <button onClick={() => setExpandedEmailId(expandedEmailId === email.id_alerta ? null : email.id_alerta)} className="w-full sm:w-auto shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm">
                                  {expandedEmailId === email.id_alerta ? 'Ocultar' : 'Ver Correo'}
                                </button>
                                <button onClick={() => handleReprocess(email.id_alerta)} disabled={reprocessingId === email.id_alerta} className="w-full sm:w-auto shrink-0 whitespace-nowrap text-xs font-semibold px-3 py-2 border border-rose-200 rounded-lg bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition flex justify-center items-center gap-2 shadow-sm">
                                  {reprocessingId === email.id_alerta ? <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div> : 'Re-procesar (IA)'}
                                </button>
                              </div>
                            </div>
                            {expandedEmailId === email.id_alerta && email.html_original && (
                              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white h-96 shadow-inner relative">
                                <iframe srcDoc={email.html_original} className="w-full h-full border-0 absolute inset-0" sandbox="" title="Vista Previa del Correo" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Cola limpia</p>
                        <p className="text-xs text-slate-500 mt-1">No hay correos con errores de parseo.</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Conecta tu Gmail</h3>
                <p className="text-sm text-slate-500 mt-2">Extrae automáticamente referencias de pagos y facilita el cruce automático.</p>
              </div>
              <button onClick={handleConnect} className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition">
                Conectar con Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
