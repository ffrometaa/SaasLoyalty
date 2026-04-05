import { emailButton, emailHeading, emailParagraph } from '../template';

export function buildPasswordResetEmail({ recoveryUrl = '', appName = 'LoyaltyOS' }) {
  const enSubject = `Reset your ${appName} password`;
  const esSubject = `Restablecer tu contraseña de ${appName}`;

  const enHtmlContent = `
    ${emailHeading('Reset your password')}
    ${emailParagraph('We received a request to reset the password for your account. Click the button below to create a new one.')}
    ${emailButton('Reset Password', recoveryUrl)}
    ${emailParagraph('<span style="font-size:13px; color:#64748b;">This link expires in 1 hour. If you didn\'t request this, you can safely ignore this email.</span>')}
  `;

  const esHtmlContent = `
    ${emailHeading('Restablecer tu contraseña')}
    ${emailParagraph('Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva.')}
    ${emailButton('Restablecer contraseña', recoveryUrl)}
    ${emailParagraph('<span style="font-size:13px; color:#64748b;">Este link expira en 1 hora. Si no solicitaste este cambio, puedes ignorar este mensaje con seguridad.</span>')}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
