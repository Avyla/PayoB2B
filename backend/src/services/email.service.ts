import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; text-align: center;">Recuperación de Contraseña</h2>
      <p style="color: #334155; font-size: 16px;">
        Hola,
      </p>
      <p style="color: #334155; font-size: 16px;">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Payo.
        Si no realizaste esta solicitud, puedes ignorar este correo.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Restablecer mi contraseña
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        Este enlace expirará en 1 hora por motivos de seguridad.
      </p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        El equipo de Payo
      </p>
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'Payo Soporte <onboarding@resend.dev>', // Usando el sandbox de Resend para desarrollo
      to: [to],
      subject: 'Restablecer contraseña - Payo',
      html: htmlContent,
    });
    
    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send email');
  }
};
