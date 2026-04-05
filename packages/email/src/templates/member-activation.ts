import { emailButton, emailHeading, emailParagraph, emailDivider } from '../template';

export function buildMemberActivationEmail({
  memberName = '',
  businessName = '',
  registerUrl = '',
  tenantLogoUrl = '',
  tenantPrimaryColor = '',
  joinCode = '',
  memberAppUrl = 'https://member.loyalbase.dev',
}) {
  const color = tenantPrimaryColor || '#7c3aed';
  const joinPageUrl = `${memberAppUrl}/join`;

  const enSubject = `Activate your account — ${businessName} loyalty program`;
  const esSubject = `Activa tu cuenta — programa de fidelidad de ${businessName}`;

  // Join code display box (shown when joinCode is provided)
  const joinCodeBox = joinCode
    ? `
    ${emailDivider()}
    <p style="margin:0 0 12px; font-size:14px; font-weight:700; color:#0f172a;">Or use this code to join manually</p>
    <div style="text-align:center; margin:16px 0;">
      <div style="display:inline-block; background:#f1f5f9; border:2px solid ${color}; border-radius:12px; padding:16px 32px;">
        <span style="font-family:'Courier New',monospace; font-size:32px; font-weight:bold; letter-spacing:0.3em; color:#0f172a;">${joinCode}</span>
      </div>
    </div>
    <p style="margin:8px 0 0; font-size:13px; color:#64748b; text-align:center;">
      Go to <a href="${joinPageUrl}" style="color:${color};">${joinPageUrl}</a> and enter this code to join <strong>${businessName}</strong>
    </p>
    <p style="margin:16px 0 0; font-size:12px; color:#94a3b8; text-align:center;">This link expires in 7 days.</p>
    `
    : `<p style="margin:16px 0 0; font-size:12px; color:#94a3b8;">This link expires in 7 days. If you weren't expecting this invitation, you can safely ignore this email.</p>`;

  const joinCodeBoxEs = joinCode
    ? `
    ${emailDivider()}
    <p style="margin:0 0 12px; font-size:14px; font-weight:700; color:#0f172a;">O usa este código para unirte manualmente</p>
    <div style="text-align:center; margin:16px 0;">
      <div style="display:inline-block; background:#f1f5f9; border:2px solid ${color}; border-radius:12px; padding:16px 32px;">
        <span style="font-family:'Courier New',monospace; font-size:32px; font-weight:bold; letter-spacing:0.3em; color:#0f172a;">${joinCode}</span>
      </div>
    </div>
    <p style="margin:8px 0 0; font-size:13px; color:#64748b; text-align:center;">
      Ve a <a href="${joinPageUrl}" style="color:${color};">${joinPageUrl}</a> e ingresa este código para unirte a <strong>${businessName}</strong>
    </p>
    <p style="margin:16px 0 0; font-size:12px; color:#94a3b8; text-align:center;">Este link expira en 7 días.</p>
    `
    : `<p style="margin:16px 0 0; font-size:12px; color:#94a3b8;">Este link expira en 7 días. Si no esperabas esta invitación, puedes ignorar este mensaje con seguridad.</p>`;

  const enHtmlContent = `
    ${emailHeading(`Hi${memberName ? ` ${memberName}` : ''}!`, color)}
    ${emailParagraph(`You've been invited to activate your account in <strong>${businessName}</strong>'s loyalty program.`)}
    ${emailParagraph('Create your password to access your points and rewards.')}
    ${emailButton('Activate my account', registerUrl, color)}
    ${joinCodeBox}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Hola${memberName ? ` ${memberName}` : ''}!`, color)}
    ${emailParagraph(`Te invitamos a activar tu cuenta en el programa de fidelidad de <strong>${businessName}</strong>.`)}
    ${emailParagraph('Crea tu contraseña para acceder a tus puntos y recompensas.')}
    ${emailButton('Activar mi cuenta', registerUrl, color)}
    ${joinCodeBoxEs}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent, tenantLogoUrl, tenantPrimaryColor: color };
}
