import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export function buildReactivationEmail({ memberName = '', businessName = '', daysSinceVisit = 0, offerText = '', rewardsUrl = '' }) {
  const days = daysSinceVisit || 30;
  const offer = offerText || 'Double points on your next visit';
  const offerEs = offerText || 'Puntos dobles en tu próxima visita';
  const url = rewardsUrl || 'https://app.loyalbase.dev';

  const enSubject = `We miss you at ${businessName}`;
  const esSubject = `Te extrañamos en ${businessName}`;

  const enHtmlContent = `
    ${emailHeading(`We miss you! 💜`)}
    ${emailParagraph(`Hi <strong>${memberName || 'there'}</strong>, it's been ${days} days since your last visit to <strong>${businessName}</strong>.`)}
    ${emailHighlight(`<strong>Special offer just for you:</strong><br>${offer}`)}
    ${emailParagraph(`Come back and enjoy your loyalty rewards. Your points are waiting!`)}
    ${emailButton('See My Rewards', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">This offer is exclusively for loyal members like you.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Te extrañamos! 💜`)}
    ${emailParagraph(`Hola <strong>${memberName || 'ahí'}</strong>, pasaron ${days} días desde tu última visita a <strong>${businessName}</strong>.`)}
    ${emailHighlight(`<strong>Oferta especial solo para vos:</strong><br>${offerEs}`)}
    ${emailParagraph(`Volvé y disfrutá de tus recompensas de fidelización. ¡Tus puntos te están esperando!`)}
    ${emailButton('Ver Mis Recompensas', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Esta oferta es exclusiva para miembros fieles como vos.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
