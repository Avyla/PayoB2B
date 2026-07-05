import { Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { prisma } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { WhatsAppFirewall } from '../services/whatsapp-firewall.service';

export const getLinkedNumbers = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_comercio = req.user?.id_comercio;
    if (!id_comercio) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    const numbers = await prisma.numeroWhatsApp.findMany({
      where: { id_comercio },
      orderBy: { fecha_registro: 'desc' },
    });

    res.status(200).json(numbers);
  } catch (error) {
    next(error);
  }
};

export const addLinkedNumber = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_comercio = req.user?.id_comercio;
    if (!id_comercio) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    if (req.user?.rol !== 'ADMINISTRADOR') {
      throw new AppError('No tienes los permisos necesarios para realizar esta acción.', 403, 'FORBIDDEN_ACTION');
    }

    const { numero, etiqueta } = req.body;

    if (!numero) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    // Check limit
    const count = await prisma.numeroWhatsApp.count({
      where: { id_comercio }
    });

    if (count >= 5) {
      throw new AppError('Has alcanzado el límite máximo de 5 números por comercio', 400, 'BAD_REQUEST_DATA');
    }

    // Check if number is already registered
    const existing = await prisma.numeroWhatsApp.findUnique({
      where: { numero },
    });

    if (existing) {
      throw new AppError('El número ya está vinculado a un comercio', 400, 'BAD_REQUEST_DATA');
    }

    const newNumber = await prisma.numeroWhatsApp.create({
      data: {
        numero,
        etiqueta,
        id_comercio,
      },
    });

    // Sincronizar con el Firewall en memoria
    WhatsAppFirewall.addNumber(numero);

    // Audit log
    const usuario = await prisma.usuario.findUnique({ where: { id_usuario: req.user!.id_usuario } });
    if (usuario) {
      await prisma.logAuditoria.create({
        data: {
          id_comercio,
          id_usuario: usuario.id_usuario,
          nombre_usuario: usuario.nombre_completo,
          rol_usuario: usuario.rol,
          accion: 'VINCULACION_WHATSAPP',
          detalles: `El administrador vinculó el número de WhatsApp: +${numero} (${etiqueta || 'Sin etiqueta'})`
        }
      });
    }

    res.status(201).json(newNumber);
  } catch (error) {
    next(error);
  }
};

export const removeLinkedNumber = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id_comercio = req.user?.id_comercio;
    const id = req.params.id as string;

    if (!id_comercio) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 400, 'BAD_REQUEST_DATA');
    }

    if (req.user?.rol !== 'ADMINISTRADOR') {
      throw new AppError('No tienes los permisos necesarios para realizar esta acción.', 403, 'FORBIDDEN_ACTION');
    }

    const number = await prisma.numeroWhatsApp.findUnique({
      where: { id_numero: id },
    });

    if (!number) {
      throw new AppError('El recurso solicitado no fue encontrado.', 404, 'RESOURCE_NOT_FOUND');
    }

    if (number.id_comercio !== id_comercio) {
      throw new AppError('No tienes los permisos necesarios para realizar esta acción.', 403, 'FORBIDDEN_ACTION');
    }

    await prisma.numeroWhatsApp.delete({
      where: { id_numero: id },
    });

    // Sincronizar con el Firewall en memoria
    WhatsAppFirewall.removeNumber(number.numero);

    // Audit log
    const usuario = await prisma.usuario.findUnique({ where: { id_usuario: req.user!.id_usuario } });
    if (usuario) {
      await prisma.logAuditoria.create({
        data: {
          id_comercio,
          id_usuario: usuario.id_usuario,
          nombre_usuario: usuario.nombre_completo,
          rol_usuario: usuario.rol,
          accion: 'DESVINCULACION_WHATSAPP',
          detalles: `El administrador desvinculó el número de WhatsApp: +${number.numero}`
        }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
