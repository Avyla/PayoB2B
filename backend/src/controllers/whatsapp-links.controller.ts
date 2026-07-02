import { Response } from 'express';
import { prisma } from '../models/db';
import { AuthenticatedRequest } from '../middlewares/tenant.middleware';
import { WhatsAppFirewall } from '../services/whatsapp-firewall.service';

export const getLinkedNumbers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id_comercio = req.user?.id_comercio;
    if (!id_comercio) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const numbers = await prisma.numeroWhatsApp.findMany({
      where: { id_comercio },
      orderBy: { fecha_registro: 'desc' },
    });

    res.status(200).json(numbers);
  } catch (error) {
    console.error('Error fetching linked numbers:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const addLinkedNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id_comercio = req.user?.id_comercio;
    if (!id_comercio) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (req.user?.rol !== 'ADMINISTRADOR') {
      res.status(403).json({ error: 'Solo los administradores pueden vincular números de WhatsApp' });
      return;
    }

    const { numero, etiqueta } = req.body;

    if (!numero) {
      res.status(400).json({ error: 'El número es obligatorio' });
      return;
    }

    // Check limit
    const count = await prisma.numeroWhatsApp.count({
      where: { id_comercio }
    });

    if (count >= 5) {
      res.status(400).json({ error: 'Has alcanzado el límite máximo de 5 números por comercio' });
      return;
    }

    // Check if number is already registered
    const existing = await prisma.numeroWhatsApp.findUnique({
      where: { numero },
    });

    if (existing) {
      res.status(400).json({ error: 'El número ya está vinculado a un comercio' });
      return;
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
    console.error('Error adding linked number:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const removeLinkedNumber = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id_comercio = req.user?.id_comercio;
    const id = req.params.id as string;

    if (!id_comercio) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    if (req.user?.rol !== 'ADMINISTRADOR') {
      res.status(403).json({ error: 'Solo los administradores pueden desvincular números de WhatsApp' });
      return;
    }

    const number = await prisma.numeroWhatsApp.findUnique({
      where: { id_numero: id },
    });

    if (!number) {
      res.status(404).json({ error: 'Número no encontrado' });
      return;
    }

    if (number.id_comercio !== id_comercio) {
      res.status(403).json({ error: 'No tiene permiso para eliminar este número' });
      return;
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
    console.error('Error removing linked number:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
