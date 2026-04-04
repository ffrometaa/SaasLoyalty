import { emailHeading, emailParagraph, emailPoints, emailHighlight } from '../template';

export function buildReferralBonusEmail({ memberName = '', referredName = '', bonusPoints = 0, newTotalBalance = 0 }) {
  const enSubject = `Referral confirmed! You earned ${bonusPoints} bonus points`;
  const esSubject = `¡Referido confirmado! Ganaste ${bonusPoints} puntos de bonificación`;

  const enHtmlContent = `
    ${emailHeading(`Referral Bonus Earned! 🤝`)}
    ${emailParagraph(`Great news, <strong>${memberName || 'there'}</strong>! Your referral has been confirmed.`)}
    ${referredName ? emailHighlight(`<strong>${referredName}</strong> joined the loyalty program through your referral.`) : ''}
    ${emailPoints(bonusPoints, 'Bonus points earned')}
    ${emailHighlight(`<strong>New total balance:</strong> ${newTotalBalance} points`)}
    ${emailParagraph(`Keep referring friends and earn more rewards! Every referral brings you closer to exclusive benefits.`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Bono de Referido Ganado! 🤝`)}
    ${emailParagraph(`¡Buenas noticias, <strong>${memberName || 'ahí'}</strong>! Tu referido fue confirmado.`)}
    ${referredName ? emailHighlight(`<strong>${referredName}</strong> se unió al programa de fidelización a través de tu referido.`) : ''}
    ${emailPoints(bonusPoints, 'Puntos de bonificación ganados')}
    ${emailHighlight(`<strong>Nuevo saldo total:</strong> ${newTotalBalance} puntos`)}
    ${emailParagraph(`¡Seguí referenciando amigos y ganá más recompensas! Cada referido te acerca a beneficios exclusivos.`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
