import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export function buildWelcomeTenantEmail({ businessName = '', plan = '', dashboardUrl = '' }) {
  const url = dashboardUrl || 'https://dashboard.loyalbase.dev';
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Starter';

  const enSubject = `Welcome to LoyaltyOS, ${businessName}! Your 14-day trial is active`;
  const esSubject = `¡Bienvenido a LoyaltyOS, ${businessName}! Tu período de prueba de 14 días está activo`;

  const enHtmlContent = `
    ${emailHeading(`Welcome to LoyaltyOS! 🎉`)}
    ${emailParagraph(`Hi <strong>${businessName}</strong>, your LoyaltyOS account has been created successfully on the <strong>${planLabel}</strong> plan. You have 14 days to explore all features for free.`)}
    ${emailHighlight(`
      <strong>Next steps:</strong>
      <ol style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li>Go to your dashboard and complete your business profile</li>
        <li>Configure your first rewards</li>
        <li>Share your member app link with your customers</li>
        <li>Start recording visits and earning points!</li>
      </ol>
    `)}
    ${emailButton('Go to Dashboard →', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">If you have any questions, reply to this email and we will help you right away.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Bienvenido a LoyaltyOS! 🎉`)}
    ${emailParagraph(`Hola <strong>${businessName}</strong>, tu cuenta de LoyaltyOS fue creada exitosamente con el plan <strong>${planLabel}</strong>. Tenés 14 días gratis para explorar todas las funcionalidades.`)}
    ${emailHighlight(`
      <strong>Primeros pasos:</strong>
      <ol style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li>Ingresá al dashboard y completá tu perfil de negocio</li>
        <li>Configurá tus primeras recompensas</li>
        <li>Compartí el link de tu app con tus clientes</li>
        <li>¡Empezá a registrar visitas y acumular puntos!</li>
      </ol>
    `)}
    ${emailButton('Ir al Dashboard →', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Si tenés alguna duda, respondé este email y te ayudamos enseguida.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
