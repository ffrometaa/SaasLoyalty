import { emailButton, emailHeading, emailParagraph } from '../template';

export function buildMemberInviteEmail({
  memberName = '',
  businessName = '',
  joinUrl = '',
  tenantLogoUrl = '',
  tenantPrimaryColor = '',
}) {
  const color = tenantPrimaryColor || '#7c3aed';

  const enSubject = `You've been added to ${businessName}'s loyalty program`;
  const esSubject = `Te agregaron al programa de fidelización de ${businessName}`;

  const enHtmlContent = `
    ${emailHeading(`Welcome to ${businessName}! 🎉`, color)}
    ${emailParagraph(`Hi${memberName ? ` <strong>${memberName}</strong>` : ''}! You've been added to <strong>${businessName}</strong>'s loyalty program.`)}
    ${emailParagraph(`Earn points on every visit and redeem them for exclusive rewards. Click the button below to access your account and see your current balance.`)}
    ${emailButton('Access My Account', joinUrl, color)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">If you have any questions, contact the store directly.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Bienvenido a ${businessName}! 🎉`, color)}
    ${emailParagraph(`¡Hola${memberName ? ` <strong>${memberName}</strong>` : ''}! Te sumaron al programa de fidelización de <strong>${businessName}</strong>.`)}
    ${emailParagraph(`Acumulá puntos en cada visita y canjeálos por recompensas exclusivas. Hacé clic en el botón para acceder a tu cuenta y ver tu saldo actual.`)}
    ${emailButton('Acceder a Mi Cuenta', joinUrl, color)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Si tenés alguna duda, contactá al local directamente.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent, tenantLogoUrl, tenantPrimaryColor: color };
}
