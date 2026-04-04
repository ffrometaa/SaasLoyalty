import { emailButton, emailHeading, emailParagraph } from '../template';

export function buildTeamInviteEmail({ businessName = '', inviterEmail = '', inviteUrl = '' }) {
  const enSubject = `You've been invited to join ${businessName} on LoyaltyOS`;
  const esSubject = `Te invitaron a unirte a ${businessName} en LoyaltyOS`;

  const enHtmlContent = `
    ${emailHeading(`You're invited to join LoyaltyOS`)}
    ${emailParagraph(`<strong>${inviterEmail}</strong> has invited you to help manage <strong>${businessName}</strong>'s loyalty program on LoyaltyOS.`)}
    ${emailParagraph(`Click the button below to accept the invitation and create your account.`)}
    ${emailButton('Accept Invitation', inviteUrl)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">This invitation expires in 7 days. If you were not expecting this, you can safely ignore this email.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Te invitaron a unirte a LoyaltyOS`)}
    ${emailParagraph(`<strong>${inviterEmail}</strong> te invitó a ayudar a gestionar el programa de fidelización de <strong>${businessName}</strong> en LoyaltyOS.`)}
    ${emailParagraph(`Hacé clic en el botón de abajo para aceptar la invitación y crear tu cuenta.`)}
    ${emailButton('Aceptar Invitación', inviteUrl)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Esta invitación vence en 7 días. Si no esperabas este mensaje, podés ignorarlo sin problema.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
