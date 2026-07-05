import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/auth';
import { AppError } from '../utils/app-error';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  tenantId?: string;
}

export const tenantMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Faltan datos obligatorios o el formato es inválido.', 401, 'BAD_REQUEST_DATA');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded;
    // Inject the tenant ID specifically for strict isolation
    req.tenantId = decoded.id_comercio;

    next();
  } catch (error) {
    next(new AppError('No autorizado. Tu sesión ha expirado.', 401, 'SESSION_EXPIRED'));
  }
};
