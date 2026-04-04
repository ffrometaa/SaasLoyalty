import { emailButton, emailHeading, emailParagraph, emailPoints, emailHighlight } from '../template';

export function buildPointsEarnedEmail({
  memberName = '',
  businessName = '',
  pointsEarned = 0,
  totalBalance = 0,
  pointsToNextTier = 0,
  nextTierName = '',
  rewardsUrl = '',
}) {
  const url = rewardsUrl || 'https://app.loyalbase.dev';

  const enSubject = `You earned ${pointsEarned} points at ${businessName}!`;
  const esSubject = `¡Ganaste ${pointsEarned} puntos en ${businessName}!`;

  const enHtmlContent = `
    ${emailHeading(`Points Earned! ⭐`)}
    ${emailParagraph(`Great visit, <strong>${memberName || 'there'}</strong>! Here's your points update:`)}
    ${emailPoints(pointsEarned, 'Points earned this visit')}
    ${emailHighlight(`<strong>New total balance:</strong> ${totalBalance} points`)}
    ${pointsToNextTier && nextTierName ? emailParagraph(`You need <strong>${pointsToNextTier} more points</strong> to reach <strong>${nextTierName}</strong> tier!`) : ''}
    ${emailButton('View Rewards', url)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Puntos ganados! ⭐`)}
    ${emailParagraph(`¡Gran visita, <strong>${memberName || 'ahí'}</strong>! Acá está tu actualización de puntos:`)}
    ${emailPoints(pointsEarned, 'Puntos ganados en esta visita')}
    ${emailHighlight(`<strong>Nuevo saldo total:</strong> ${totalBalance} puntos`)}
    ${pointsToNextTier && nextTierName ? emailParagraph(`¡Necesitás <strong>${pointsToNextTier} puntos más</strong> para alcanzar el nivel <strong>${nextTierName}</strong>!`) : ''}
    ${emailButton('Ver Recompensas', url)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
