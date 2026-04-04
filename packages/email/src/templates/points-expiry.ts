import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export function buildPointsExpiryEmail({ memberName = '', businessName = '', expiringPoints = 0, expiryDate = '', rewardsUrl = '' }) {
  const url = rewardsUrl || 'https://app.loyalbase.dev';
  const formattedExpiry = new Date(expiryDate).toLocaleDateString('en-US', { dateStyle: 'long' });
  const formattedExpiryEs = new Date(expiryDate).toLocaleDateString('es', { dateStyle: 'long' });

  const enSubject = `Your points at ${businessName} are expiring soon!`;
  const esSubject = `¡Tus puntos en ${businessName} vencen pronto!`;

  const enHtmlContent = `
    ${emailHeading(`Points Expiring Soon ⏳`)}
    ${emailParagraph(`Hi <strong>${memberName || 'there'}</strong>, don't let your hard-earned points go to waste!`)}
    ${emailHighlight(`
      <strong>${expiringPoints} points</strong> at <strong>${businessName}</strong> will expire on <strong>${formattedExpiry}</strong>.
    `)}
    ${emailParagraph(`Use them now to redeem rewards before they're gone.`)}
    ${emailButton('Use My Points Now', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">After this date, the points will no longer be available in your account.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Puntos por Vencer ⏳`)}
    ${emailParagraph(`Hola <strong>${memberName || 'ahí'}</strong>, ¡no dejes que tus puntos ganados con esfuerzo se pierdan!`)}
    ${emailHighlight(`
      <strong>${expiringPoints} puntos</strong> en <strong>${businessName}</strong> vencen el <strong>${formattedExpiryEs}</strong>.
    `)}
    ${emailParagraph(`Usálos ahora para canjear recompensas antes de que expiren.`)}
    ${emailButton('Usar Mis Puntos Ahora', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Después de esa fecha, los puntos ya no estarán disponibles en tu cuenta.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
