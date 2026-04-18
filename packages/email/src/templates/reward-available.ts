import { emailButton, emailHeading, emailHighlight, emailParagraph } from '../template';

export function buildRewardAvailableEmail({
  memberName = '',
  businessName = '',
  rewardName = '',
  rewardDescription = '',
  pointsCost = 0,
  rewardsUrl = '',
}) {
  const url = rewardsUrl || 'https://app.loyalbase.dev';

  const enSubject = `A reward is waiting for you at ${businessName}!`;
  const esSubject = `¡Hay una recompensa esperándote en ${businessName}!`;

  const enHtmlContent = `
    ${emailHeading(`Reward Available! 🎁`)}
    ${emailParagraph(`Great news, <strong>${memberName || 'there'}</strong>! You have enough points to redeem a reward at ${businessName}.`)}
    ${emailHighlight(`<strong>${rewardName}</strong>${rewardDescription ? ` — ${rewardDescription}` : ''}`)}
    ${emailHighlight(`<strong>Points needed:</strong> ${pointsCost} points`)}
    ${emailParagraph(`Head over to your rewards and redeem it before it's gone!`)}
    ${emailButton('Redeem Now', url)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Recompensa Disponible! 🎁`)}
    ${emailParagraph(`¡Buenas noticias, <strong>${memberName || 'ahí'}</strong>! Tenés suficientes puntos para canjear una recompensa en ${businessName}.`)}
    ${emailHighlight(`<strong>${rewardName}</strong>${rewardDescription ? ` — ${rewardDescription}` : ''}`)}
    ${emailHighlight(`<strong>Puntos necesarios:</strong> ${pointsCost} puntos`)}
    ${emailParagraph(`¡Pasate por tus recompensas y canjeala antes de que se acabe!`)}
    ${emailButton('Canjear Ahora', url)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
