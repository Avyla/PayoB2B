import { Request, Response } from 'express';
import { prisma } from '../models/db';
import { comparePassword, generateToken } from '../utils/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      id_usuario: user.id_usuario,
      id_comercio: user.id_comercio,
      rol: user.rol,
    });

    res.json({ token, user: { email: user.email, rol: user.rol, nombre_completo: user.nombre_completo } });
} catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Rate limiting in-memory store for forgot password
// Map of email to array of timestamps
const forgotPasswordRateLimit = new Map<string, number[]>();

const cleanOldRequests = (email: string) => {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const requests = forgotPasswordRateLimit.get(email) || [];
  const validRequests = requests.filter(time => time > oneHourAgo);
  if (validRequests.length > 0) {
    forgotPasswordRateLimit.set(email, validRequests);
  } else {
    forgotPasswordRateLimit.delete(email);
  }
  return validRequests.length;
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Rate Limiting Check
    const requestCount = cleanOldRequests(email);
    if (requestCount >= 3) {
      res.status(429).json({ error: 'Too many requests. Please try again in an hour.' });
      return;
    }

    // Add new request timestamp
    const requests = forgotPasswordRateLimit.get(email) || [];
    requests.push(Date.now());
    forgotPasswordRateLimit.set(email, requests);

    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 even if user doesn't exist for security reasons (avoid email enumeration)
      res.status(200).json({ message: 'If your email is registered, you will receive a reset link shortly.' });
      return;
    }

    // Generate token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.usuario.update({
      where: { email },
      data: {
        reset_password_token: token,
        reset_password_expires: expires,
      },
    });

    const { sendPasswordResetEmail } = await import('../services/email.service');
    await sendPasswordResetEmail(email, token);

    res.status(200).json({ message: 'If your email is registered, you will receive a reset link shortly.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    const user = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    const { hashPassword } = await import('../utils/auth');
    const newPasswordHash = await hashPassword(new_password);

    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        password_hash: newPasswordHash,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
