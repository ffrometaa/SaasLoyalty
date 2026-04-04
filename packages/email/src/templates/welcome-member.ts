import { emailButton, emailHeading, emailParagraph, emailPoints } from '../template';

export function buildWelcomeMemberEmail({ memberName = '', businessName = '', pointsBalance = 0, memberAppUrl = '' }) {
  const url = memberAppUrl || 'https://app.loyalbase.dev';
  const points = pointsBalance || 0;

  const enSubject = `Welcome to ${businessName}'s loyalty program!`;
  const esSubject = `¡Bienvenido al programa de fidelización de ${businessName}!`;

  const enHtmlContent = `
    ${emailHeading(`Welcome, ${memberName || 'there'}! 🎉`)}
    ${emailParagraph(`You've joined <strong>${businessName}</strong>'s loyalty program. Earn points every time you visit and redeem them for exclusive rewards.`)}
    ${emailParagraph(`<strong>How it works:</strong>`)}
    ${emailParagraph(`<ol style="margin:0 0 16px; padding-left:20px; color:#334155; line-height:2;"><li>Visit the store and earn points</li><li>Accumulate points to reach new tiers</li><li>Redeem points for rewards and discounts</li></ol>`)}
    ${emailPoints(points, 'Your current points')}
    ${emailButton('View My Rewards', url)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Bienvenido, ${memberName || 'ahí'}! 🎉`)}
    ${emailParagraph(`Te sumaste al programa de fidelización de <strong>${businessName}</strong>. Ganás puntos cada vez que visitás y los canjeás por recompensas exclusivas.`)}
    ${emailParagraph(`<strong>¿Cómo funciona?</strong>`)}
    ${emailParagraph(`<ol style="margin:0 0 16px; padding-left:20px; color:#334155; line-height:2;"><li>Visitá el local y acumulá puntos</li><li>Acumulá puntos para subir de nivel</li><li>Canjea puntos por recompensas y descuentos</li></ol>`)}
    ${emailPoints(points, 'Tus puntos actuales')}
    ${emailButton('Ver Mis Recompensas', url)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
