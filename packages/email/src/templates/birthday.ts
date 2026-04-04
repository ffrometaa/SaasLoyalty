import { emailButton, emailHeading, emailParagraph, emailPoints } from '../template';

export function buildBirthdayEmail({ memberName = '', businessName = '', bonusPoints = 0, expiryDate = '', rewardsUrl = '' }) {
  const url = rewardsUrl || 'https://app.loyalbase.dev';
  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-US', { dateStyle: 'long' })
    : null;
  const formattedExpiryEs = expiryDate
    ? new Date(expiryDate).toLocaleDateString('es', { dateStyle: 'long' })
    : null;

  const enSubject = `Happy Birthday, ${memberName || 'there'}! Here's a gift from ${businessName} 🎂`;
  const esSubject = `¡Feliz cumpleaños, ${memberName || 'ahí'}! Un regalo de ${businessName} 🎂`;

  const enHtmlContent = `
    ${emailHeading(`Happy Birthday! 🎂`)}
    ${emailParagraph(`Wishing you a wonderful birthday, <strong>${memberName || 'there'}</strong>! <strong>${businessName}</strong> has a special gift for you today:`)}
    ${emailPoints(bonusPoints, 'Birthday bonus points')}
    ${formattedExpiry ? emailParagraph(`<span style="font-size:13px; color:#64748b;">These bonus points expire on <strong>${formattedExpiry}</strong>. Don't forget to use them!</span>`) : ''}
    ${emailButton('Redeem My Birthday Gift', url)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Feliz Cumpleaños! 🎂`)}
    ${emailParagraph(`¡Que tengas un cumpleaños increíble, <strong>${memberName || 'ahí'}</strong>! <strong>${businessName}</strong> tiene un regalo especial para vos hoy:`)}
    ${emailPoints(bonusPoints, 'Puntos de regalo de cumpleaños')}
    ${formattedExpiryEs ? emailParagraph(`<span style="font-size:13px; color:#64748b;">Estos puntos vencen el <strong>${formattedExpiryEs}</strong>. ¡No te olvides de usarlos!</span>`) : ''}
    ${emailButton('Canjear Mi Regalo de Cumpleaños', url)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
