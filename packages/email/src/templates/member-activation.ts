import { emailButton, emailHeading, emailParagraph } from '../template';

export function buildMemberActivationEmail({
  memberName = '',
  businessName = '',
  registerUrl = '',
  tenantLogoUrl = '',
  tenantPrimaryColor = '',
}) {
  const color = tenantPrimaryColor || '#7c3aed';

  const enSubject = `Activate your account — ${businessName} loyalty program`;
  const esSubject = `Activa tu cuenta — programa de fidelidad de ${businessName}`;

  const enHtmlContent = `
    ${emailHeading(`Hi${memberName ? ` ${memberName}` : ''}!`, color)}
    ${emailParagraph(`You've been invited to activate your account in <strong>${businessName}</strong>'s loyalty program.`)}
    ${emailParagraph('Create your password to access your points and rewards.')}
    ${emailButton('Activate my account', registerUrl, color)}
    ${emailParagraph('<span style="font-size:13px; color:#64748b;">This link expires in 7 days. If you weren\'t expecting this invitation, you can safely ignore this email.</span>')}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Hola${memberName ? ` ${memberName}` : ''}!`, color)}
    ${emailParagraph(`Te invitamos a activar tu cuenta en el programa de fidelidad de <strong>${businessName}</strong>.`)}
    ${emailParagraph('Crea tu contraseña para acceder a tus puntos y recompensas.')}
    ${emailButton('Activar mi cuenta', registerUrl, color)}
    ${emailParagraph('<span style="font-size:13px; color:#64748b;">Este link expira en 7 días. Si no esperabas esta invitación, puedes ignorar este mensaje con seguridad.</span>')}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent, tenantLogoUrl, tenantPrimaryColor: color };
}
