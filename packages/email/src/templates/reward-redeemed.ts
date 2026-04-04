import { emailHeading, emailParagraph, emailCode, emailHighlight } from '../template';

export function buildRewardRedeemedEmail({
  memberName = '',
  businessName = '',
  rewardName = '',
  pointsSpent = 0,
  redemptionCode = '',
  expiryDate = '',
}) {
  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-US', { dateStyle: 'long' })
    : null;
  const formattedExpiryEs = expiryDate
    ? new Date(expiryDate).toLocaleDateString('es', { dateStyle: 'long' })
    : null;

  const enSubject = `Reward redeemed: ${rewardName} at ${businessName}`;
  const esSubject = `Recompensa canjeada: ${rewardName} en ${businessName}`;

  const enHtmlContent = `
    ${emailHeading(`Redemption Confirmed ✅`)}
    ${emailParagraph(`Hi <strong>${memberName || 'there'}</strong>, your redemption at <strong>${businessName}</strong> has been confirmed.`)}
    ${emailHighlight(`
      <strong>Reward:</strong> ${rewardName}<br>
      <strong>Points spent:</strong> ${pointsSpent}
      ${formattedExpiry ? `<br><strong>Expires:</strong> ${formattedExpiry}` : ''}
    `)}
    ${emailParagraph(`Show the code below at the store to claim your reward:`)}
    ${emailCode(redemptionCode)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">This code can only be used once. Show it to the staff member at <strong>${businessName}</strong>.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Canje Confirmado ✅`)}
    ${emailParagraph(`Hola <strong>${memberName || 'ahí'}</strong>, tu canje en <strong>${businessName}</strong> fue confirmado.`)}
    ${emailHighlight(`
      <strong>Recompensa:</strong> ${rewardName}<br>
      <strong>Puntos gastados:</strong> ${pointsSpent}
      ${formattedExpiryEs ? `<br><strong>Vence:</strong> ${formattedExpiryEs}` : ''}
    `)}
    ${emailParagraph(`Mostrá el código de abajo en el local para reclamar tu recompensa:`)}
    ${emailCode(redemptionCode)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Este código solo puede usarse una vez. Mostráselo al personal de <strong>${businessName}</strong>.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
