import { EstadoTransaccion } from '@prisma/client';
import { prisma } from '../models/db';

export class MatchService {
  /**
   * Intenta cruzar una transacción recién creada/actualizada con un correo pendiente.
   * Si hace match, vincula ambos y cambia estados.
   */
  public async matchTransaction(transaccionId: string): Promise<boolean> {
    try {
      const transaccion = await prisma.transaccion.findUnique({
        where: { id_transaccion: transaccionId }
      });

      if (!transaccion) return false;

      // Solo cruzamos si tiene los datos esenciales y no es un duplicado sospechoso ni está rechazada
      if (
        !transaccion.monto ||
        (!transaccion.referencia && !transaccion.nombre_remitente_ocr) ||
        !transaccion.fecha_transaccion ||
        transaccion.banco === 'OTROS_BANCOS' ||
        transaccion.estado === EstadoTransaccion.DUPLICADO_SOSPECHOSO ||
        transaccion.estado === EstadoTransaccion.RECHAZADO ||
        transaccion.id_alerta_email // Ya está vinculada
      ) {
        return false;
      }

      // Truncar la fecha al minuto para crear una ventana estricta de ese minuto exacto
      const txDate = new Date(transaccion.fecha_transaccion);
      const minutoInicio = new Date(txDate);
      minutoInicio.setSeconds(0, 0);
      
      const minutoFin = new Date(minutoInicio);
      minutoFin.setMinutes(minutoFin.getMinutes() + 1);

      const bancosAceptables = [transaccion.banco];
      if (transaccion.banco === 'NEQUI') bancosAceptables.push('BANCOLOMBIA');
      if (transaccion.banco === 'BANCOLOMBIA') bancosAceptables.push('NEQUI');

      const whereConditions: any = {
        id_comercio: transaccion.id_comercio,
        banco: { in: bancosAceptables },
        monto: transaccion.monto,
        estado_cruce: 'PENDIENTE',
        fecha_hora_transaccion: {
          gte: minutoInicio,
          lt: minutoFin
        }
      };

      const alertas = await prisma.alertaEmail.findMany({
        where: whereConditions,
        orderBy: { fecha_alerta: 'desc' }
      });

      if (alertas.length === 0) return false;

      let alertaMatch = null;

      // 1. Intento estricto por referencia
      if (transaccion.referencia) {
        alertaMatch = alertas.find(a => a.referencia === transaccion.referencia);
      }

      // 2. Intento por nombre remitente si no hubo match por referencia
      if (!alertaMatch && transaccion.nombre_remitente_ocr) {
        alertaMatch = alertas.find(a => 
          !a.referencia && // Solo cruzamos por nombre si el correo no exigía referencia
          a.nombre_remitente && 
          a.nombre_remitente.toLowerCase().includes(transaccion.nombre_remitente_ocr!.toLowerCase())
        );
      }

      // 3. Fallback inteligente: Si el correo no tiene referencia, pero el monto, banco y minuto coinciden exactamente,
      // y es la única alerta en ese minuto con esas características, asumimos que es un match seguro.
      if (!alertaMatch) {
        const unreferencedAlerts = alertas.filter(a => !a.referencia);
        if (unreferencedAlerts.length === 1) {
          alertaMatch = unreferencedAlerts[0];
        }
      }

      if (alertaMatch) {
        // Encontramos un Match! Hacemos la actualización atómica en transacción
        await prisma.$transaction([
          prisma.transaccion.update({
            where: { id_transaccion: transaccion.id_transaccion },
            data: {
              estado: EstadoTransaccion.VERIFICADO_SISTEMA,
              id_alerta_email: alertaMatch.id_alerta
            }
          }),
          prisma.alertaEmail.update({
            where: { id_alerta: alertaMatch.id_alerta },
            data: {
              estado_cruce: 'CONCILIADO'
            }
          })
        ]);
        console.log(`[MatchService] Match exitoso: TX ${transaccionId} con Alerta ${alertaMatch.id_alerta}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[MatchService] Error en matchTransaction(${transaccionId}):`, error);
      return false;
    }
  }

  /**
   * Intenta cruzar un correo recién llegado con alguna transacción pendiente (Subida sin verificar)
   */
  public async matchEmailAlert(alertaId: string): Promise<boolean> {
    try {
      const alerta = await prisma.alertaEmail.findUnique({
        where: { id_alerta: alertaId }
      });

      if (!alerta || alerta.estado_cruce !== 'PENDIENTE' || !alerta.fecha_hora_transaccion) return false;

      // Truncar la fecha al minuto para crear una ventana estricta de ese minuto exacto
      const alertaDate = new Date(alerta.fecha_hora_transaccion);
      const minutoInicio = new Date(alertaDate);
      minutoInicio.setSeconds(0, 0);
      
      const minutoFin = new Date(minutoInicio);
      minutoFin.setMinutes(minutoFin.getMinutes() + 1);

      const bancosAceptables = [alerta.banco];
      if (alerta.banco === 'NEQUI') bancosAceptables.push('BANCOLOMBIA');
      if (alerta.banco === 'BANCOLOMBIA') bancosAceptables.push('NEQUI');

      const whereConditions: any = {
        id_comercio: alerta.id_comercio,
        banco: { in: bancosAceptables },
        monto: alerta.monto,
        id_alerta_email: null, // No vinculada aún
        estado: {
          notIn: [EstadoTransaccion.DUPLICADO_SOSPECHOSO, EstadoTransaccion.RECHAZADO]
        },
        fecha_transaccion: {
          gte: minutoInicio,
          lt: minutoFin
        }
      };

      const transacciones = await prisma.transaccion.findMany({
        where: whereConditions,
        orderBy: { fecha_creacion: 'desc' }
      });

      if (transacciones.length === 0) return false;

      let txMatch = null;

      // 1. Intento estricto por referencia
      if (alerta.referencia) {
        txMatch = transacciones.find(t => t.referencia === alerta.referencia);
      }

      // 2. Intento por nombre remitente
      if (!txMatch && alerta.nombre_remitente) {
        txMatch = transacciones.find(t => 
          !alerta.referencia && // Solo si el correo no tiene ref exigible
          t.nombre_remitente_ocr &&
          alerta.nombre_remitente!.toLowerCase().includes(t.nombre_remitente_ocr.toLowerCase())
        );
      }

      // 3. Fallback inteligente
      if (!txMatch && !alerta.referencia) {
        if (transacciones.length === 1) {
          txMatch = transacciones[0];
        }
      }

      if (txMatch) {
        // Encontramos un Match! Hacemos la actualización atómica
        await prisma.$transaction([
          prisma.transaccion.update({
            where: { id_transaccion: txMatch.id_transaccion },
            data: {
              estado: EstadoTransaccion.VERIFICADO_SISTEMA,
              id_alerta_email: alerta.id_alerta
            }
          }),
          prisma.alertaEmail.update({
            where: { id_alerta: alerta.id_alerta },
            data: {
              estado_cruce: 'CONCILIADO'
            }
          })
        ]);
        console.log(`[MatchService] Match exitoso: Alerta ${alertaId} con TX ${txMatch.id_transaccion}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[MatchService] Error en matchEmailAlert(${alertaId}):`, error);
      return false;
    }
  }

  /**
   * Fuerza el cruce manual de una transacción con un correo específico (Case C)
   */
  public async manualMatch(transaccionId: string, alertaId: string, idComercio: string): Promise<boolean> {
    try {
      // Validar pertenencia
      const transaccion = await prisma.transaccion.findFirst({
        where: { id_transaccion: transaccionId, id_comercio: idComercio }
      });
      const alerta = await prisma.alertaEmail.findFirst({
        where: { id_alerta: alertaId, id_comercio: idComercio }
      });

      if (!transaccion || !alerta) {
        throw new Error('Transacción o Alerta no encontrada o no pertenece al comercio');
      }

      if (alerta.estado_cruce === 'CONCILIADO') {
        throw new Error('El correo seleccionado ya fue conciliado con otra transacción');
      }

      if (transaccion.id_alerta_email) {
        throw new Error('La transacción ya tiene un correo vinculado');
      }

      await prisma.$transaction([
        prisma.transaccion.update({
          where: { id_transaccion: transaccion.id_transaccion },
          data: {
            estado: EstadoTransaccion.VERIFICADO_MANUAL,
            id_alerta_email: alerta.id_alerta
          }
        }),
        prisma.alertaEmail.update({
          where: { id_alerta: alerta.id_alerta },
          data: {
            estado_cruce: 'CONCILIADO'
          }
        })
      ]);

      console.log(`[MatchService] Cruce Manual exitoso: TX ${transaccionId} con Alerta ${alertaId}`);
      return true;
    } catch (error) {
      console.error(`[MatchService] Error en manualMatch:`, error);
      throw error;
    }
  }
}
