import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Transaction } from './TransactionsTable';

interface EvidenceDrawerProps {
  transaction: Transaction | null;
  onClose: () => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  whatsappLinks: any[];
}

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('Error fetching data');
  return res.json();
};

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  transaction,
  onClose,
  onUpdateTransaction,
  whatsappLinks,
}) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const { data: pendingData } = useSWR(
    transaction?.estado === 'SUBIDO_SIN_VERIFICAR' ? `${apiUrl}/email/pendientes` : null,
    fetcher
  );

  const [showEmailLinker, setShowEmailLinker] = useState(false);
  const [linking, setLinking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    banco: transaction?.banco || 'DESCONOCIDO',
    monto: transaction?.monto || '',
    referencia: transaction?.referencia || '',
    fecha_transaccion: transaction?.fecha_transaccion
      ? new Date(new Date(transaction.fecha_transaccion).getTime() - 5 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16)
      : '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        banco: transaction.banco || 'DESCONOCIDO',
        monto: transaction.monto || '',
        referencia: transaction.referencia || '',
        fecha_transaccion: transaction.fecha_transaccion
          ? new Date(new Date(transaction.fecha_transaccion).getTime() - 5 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 16)
          : '',
      });
      setShowEmailLinker(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveEdit = () => {
    const updates = {
      banco: formData.banco as any,
      monto: formData.monto ? Number(formData.monto) : null,
      referencia: formData.referencia || null,
      fecha_transaccion: formData.fecha_transaccion ? `${formData.fecha_transaccion}:00-05:00` : null,
      estado: 'VERIFICADO_MANUAL' as any,
    };
    onUpdateTransaction(transaction.id_transaccion, updates);
    onClose();
  };

  const handleLinkEmail = async (emailId: string) => {
    setLinking(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/transactions/${transaction.id_transaccion}/link-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_alerta_email: emailId }),
      });
      if (res.ok) {
        onUpdateTransaction(transaction.id_transaccion, { estado: 'VERIFICADO_MANUAL' });
        onClose();
      } else {
        const errorData = await res.json();
        showToast('Error: ' + (errorData.error || 'No se pudo vincular'));
      }
    } catch (e) {
      console.error(e);
      showToast('Error de conexión al vincular');
    } finally {
      setLinking(false);
    }
  };

  const getAlias = (numero: string | null | undefined) => {
    if (!numero) return null;
    const link = whatsappLinks?.find((l) => l.numero === numero);
    if (link?.etiqueta) return `${link.etiqueta} (${numero})`;
    return numero;
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full md:max-w-4xl h-full flex flex-col md:flex-row overflow-hidden shadow-2xl animate-slide-left">
        {/* DUPLICATES RESOLUTION VIEW */}
        {transaction.estado === 'DUPLICADO_SOSPECHOSO' && transaction.duplicado_de ? (
          <div className="w-full flex flex-col h-full bg-white">
            <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Resolución de Duplicado
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                  Coincidencia en Referencia ({transaction.referencia}) y Banco ({transaction.banco}).
                </p>
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

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 bg-slate-50">
              <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-3 text-center uppercase tracking-wider text-xs">
                  Sospechoso (Nuevo)
                </h3>
                <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-2 relative min-h-[250px]">
                  {transaction.url_imagen_gcs ? (
                    <>
                      <a
                        href={transaction.url_imagen_gcs}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors bg-white/80 px-2 py-1 rounded"
                      >
                        Abrir ↗
                      </a>
                      <img
                        src={transaction.url_imagen_gcs}
                        className="max-w-full max-h-[40vh] object-contain rounded"
                        alt="Sospechoso"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mb-2"></div>
                      <span className="text-[10px] uppercase font-bold tracking-wider">Cargando...</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-xs font-semibold text-slate-500 text-center">
                  Subido por: {getAlias(transaction.numero_whatsapp_origen) || 'Web'}
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-slate-500 mb-3 text-center uppercase tracking-wider text-xs">
                  Original (Aprobado)
                </h3>
                <div className="flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg p-2 relative min-h-[250px]">
                  {transaction.duplicado_de.url_imagen_gcs ? (
                    <>
                      <a
                        href={transaction.duplicado_de.url_imagen_gcs}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors bg-white/80 px-2 py-1 rounded"
                      >
                        Abrir ↗
                      </a>
                      <img
                        src={transaction.duplicado_de.url_imagen_gcs}
                        className="max-w-full max-h-[40vh] object-contain rounded"
                        alt="Original"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mb-2"></div>
                      <span className="text-[10px] uppercase font-bold tracking-wider">Cargando...</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-xs font-semibold text-slate-400 text-center">
                  Subido por: {getAlias(transaction.duplicado_de.numero_whatsapp_origen) || 'Web'}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-slate-200 flex justify-end gap-3 bg-white">
              <button
                onClick={() => {
                  onUpdateTransaction(transaction.id_transaccion, {
                    estado: 'RECHAZADO',
                    notas_revision: 'Rechazado por ser duplicado exacto',
                  });
                  onClose();
                }}
                className="px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl"
              >
                Rechazar
              </button>
              <button
                onClick={() => {
                  onUpdateTransaction(transaction.id_transaccion, {
                    estado: 'VERIFICADO_MANUAL',
                    notas_revision: 'Aprobación forzada (No es duplicado)',
                  });
                  onClose();
                }}
                className="px-6 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Aprobar Forzosamente
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* EVIDENCE VIEW */}
            <div className="md:w-1/2 bg-slate-50 border-r border-slate-200 flex flex-col relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-50" />
              <div className="p-5 border-b border-slate-200 bg-white/50 backdrop-blur-md flex justify-between items-center z-10">
                <h3 className="font-bold text-slate-800 tracking-tight">Evidencia del Comprobante</h3>
                {transaction.url_imagen_gcs && (
                  <a
                    href={transaction.url_imagen_gcs}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Abrir en HD ↗
                  </a>
                )}
              </div>
              <div className="flex-1 p-6 overflow-auto flex items-center justify-center min-h-[300px] z-10 bg-slate-100/50">
                {transaction.url_imagen_gcs ? (
                  <img
                    src={transaction.url_imagen_gcs}
                    alt="Comprobante"
                    className="max-w-full h-auto max-h-[80vh] object-contain shadow-md border border-slate-300 rounded-xl bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mb-4"></div>
                    <span className="text-sm font-bold uppercase tracking-widest">Cargando imagen...</span>
                  </div>
                )}
              </div>
            </div>

            {/* DETAILS / AUDIT PANE */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto bg-white">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
                    {transaction.estado === 'SUBIDO_SIN_VERIFICAR' ? 'Validación Manual' : 'Auditoría de Transacción'}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 text-[10px] uppercase tracking-widest font-extrabold rounded-md border ${
                      transaction.estado === 'VERIFICADO_SISTEMA'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : transaction.estado === 'VERIFICADO_MANUAL'
                        ? 'bg-slate-50 text-slate-600 border-slate-300'
                        : transaction.estado === 'RECHAZADO'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-white text-slate-500 border-slate-300'
                    }`}
                  >
                    {transaction.estado}
                  </span>
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

              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Banco</label>
                    <select
                      value={formData.banco}
                      disabled={transaction.estado !== 'SUBIDO_SIN_VERIFICAR'}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-slate-500 focus:border-slate-500 p-3 border disabled:bg-slate-50 disabled:text-slate-600 font-semibold text-slate-800"
                    >
                      <option value="DESCONOCIDO">Seleccione</option>
                      <option value="NEQUI">Nequi</option>
                      <option value="BANCOLOMBIA">Bancolombia</option>
                      <option value="OTROS_BANCOS">Otros Bancos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Monto ($)</label>
                    <input
                      type="number"
                      value={formData.monto}
                      disabled={transaction.estado !== 'SUBIDO_SIN_VERIFICAR'}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-slate-500 p-3 border disabled:bg-slate-50 disabled:text-slate-700 font-extrabold text-xl text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Referencia</label>
                  <input
                    type="text"
                    value={formData.referencia}
                    disabled={transaction.estado !== 'SUBIDO_SIN_VERIFICAR'}
                    onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                    className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-slate-500 p-3 border disabled:bg-slate-50 disabled:text-slate-700 font-mono font-bold text-slate-800"
                  />
                </div>

                {/* Trazabilidad (Auditoría cruzada) */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Auditoría y Origen</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Cajero / Creador
                      </span>
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        {transaction.canal_ingreso === 'WHATSAPP' ? (
                          <span className="text-emerald-500 text-lg">📱</span>
                        ) : (
                          <span className="text-blue-500 text-lg">💻</span>
                        )}
                        {transaction.canal_ingreso === 'WHATSAPP'
                          ? getAlias(transaction.numero_whatsapp_origen)
                          : transaction.creador?.nombre_completo || 'Usuario Web'}
                      </div>
                    </div>
                  </div>
                  {transaction.alerta_email && (
                    <div className="mt-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                        Conciliación Automática (Email)
                      </h4>
                      <p className="font-semibold text-slate-700 truncate">{transaction.alerta_email.nombre_remitente}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {transaction.alerta_email.banco} - ${Number(transaction.alerta_email.monto).toLocaleString('es-CO')}
                      </p>
                    </div>
                  )}
                </div>

                {showEmailLinker && (
                  <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex justify-between items-center">
                      Correos Pendientes
                      <span className="bg-slate-200 text-slate-600 text-xs px-2 rounded-full">
                        {pendingData?.data?.length || 0}
                      </span>
                    </h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {pendingData && pendingData.data.length > 0 ? (
                        pendingData.data.map((email: any) => (
                          <div
                            key={email.id_alerta}
                            className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg shadow-sm"
                          >
                            <div>
                              <p className="font-semibold text-slate-800">
                                ${email.monto.toLocaleString('es-CO')}{' '}
                                <span className="text-xs font-normal">({email.banco})</span>
                              </p>
                              <p className="text-xs text-slate-500">Ref: {email.referencia}</p>
                            </div>
                            <button
                              onClick={() => handleLinkEmail(email.id_alerta)}
                              disabled={linking}
                              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-md hover:bg-slate-800"
                            >
                              Vincular
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-2">No hay correos pendientes.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botonera inferior */}
              <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-slate-100 flex-wrap gap-y-3 shrink-0">
                {transaction.estado === 'SUBIDO_SIN_VERIFICAR' ? (
                  <>
                    <button
                      onClick={() => setShowEmailLinker(!showEmailLinker)}
                      className="px-6 py-3 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl"
                    >
                      {showEmailLinker ? 'Ocultar Correos' : 'Vincular Correo'}
                    </button>
                    <button
                      onClick={() => {
                        onUpdateTransaction(transaction.id_transaccion, { estado: 'RECHAZADO' });
                        onClose();
                      }}
                      className="px-6 py-3 text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-300"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-6 py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                    >
                      Guardar y Verificar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-8 py-3 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    Cerrar Auditoría
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-sm">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
