import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export interface WelcomeTenantEmailParams {
  businessName?: string;
  plan?: string;
  dashboardUrl?: string;
  trialDays?: number;
  isFoundingPartner?: boolean;
}

export function buildWelcomeTenantEmail({
  businessName = '',
  plan = '',
  dashboardUrl = '',
  trialDays = 14,
  isFoundingPartner = false,
}: WelcomeTenantEmailParams = {}) {
  const url = dashboardUrl || 'https://dashboard.loyalbase.dev';
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Starter';

  const enSubject = `Welcome to LoyaltyOS, ${businessName}! Your ${trialDays}-day trial is active`;
  const esSubject = `¡Bienvenido a LoyaltyOS, ${businessName}! Tu período de prueba de ${trialDays} días está activo`;

  const enFoundingCallout = isFoundingPartner
    ? emailHighlight(
        `🌟 You're a Founding Partner! Enjoy your extended ${trialDays}-day trial and 20% lifetime discount.`
      )
    : '';

  const esFoundingCallout = isFoundingPartner
    ? emailHighlight(
        `🌟 ¡Sos Founding Partner! Disfrutá tu trial extendido de ${trialDays} días y 20% de descuento de por vida.`
      )
    : '';

  const enHtmlContent = `
    ${emailHeading(`Welcome to LoyaltyOS! 🎉`)}
    ${emailParagraph(`Hi <strong>${businessName}</strong>, your LoyaltyOS account has been created successfully on the <strong>${planLabel}</strong> plan. You have ${trialDays} days to explore all features for free.`)}
    ${enFoundingCallout}
    ${emailHighlight(`
      <strong>Next steps:</strong>
      <ol style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li><a href="${url}/settings" style="color:#4f46e5;">Complete your business profile</a></li>
        <li><a href="${url}/rewards" style="color:#4f46e5;">Create your first reward</a></li>
        <li><a href="${url}/members" style="color:#4f46e5;">Invite your first member</a></li>
      </ol>
    `)}
    ${emailButton('Go to Dashboard →', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">If you have any questions, reply to this email and we will help you right away.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Bienvenido a LoyaltyOS! 🎉`)}
    ${emailParagraph(`Hola <strong>${businessName}</strong>, tu cuenta de LoyaltyOS fue creada exitosamente con el plan <strong>${planLabel}</strong>. Tenés ${trialDays} días gratis para explorar todas las funcionalidades.`)}
    ${esFoundingCallout}
    ${emailHighlight(`
      <strong>Primeros pasos:</strong>
      <ol style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li><a href="${url}/settings" style="color:#4f46e5;">Completá tu perfil de negocio</a></li>
        <li><a href="${url}/rewards" style="color:#4f46e5;">Creá tu primera recompensa</a></li>
        <li><a href="${url}/members" style="color:#4f46e5;">Invitá a tu primer miembro</a></li>
      </ol>
    `)}
    ${emailButton('Ir al Dashboard →', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Si tenés alguna duda, respondé este email y te ayudamos enseguida.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
