import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export interface OnboardingDay7EmailParams {
  businessName?: string;
  dashboardUrl?: string;
  daysLeft?: number;
  upgradeUrl?: string;
}

export function buildOnboardingDay7Email({
  businessName = '',
  dashboardUrl = 'https://dashboard.loyalbase.dev',
  daysLeft = 7,
  upgradeUrl = 'https://dashboard.loyalbase.dev/settings?tab=billing',
}: OnboardingDay7EmailParams = {}) {
  const enSubject = `Day 7 — ${daysLeft} days left in your trial`;
  const esSubject = `Día 7 — te quedan ${daysLeft} días de prueba`;

  const enHtmlContent = `
    ${emailHeading(`One week in — great progress, ${businessName}! 🚀`)}
    ${emailParagraph(`You're 7 days into your LoyaltyOS trial and you have <strong>${daysLeft} days left</strong>. Now is the perfect time to make sure your loyalty program is set up and ready to grow.`)}
    ${emailHighlight(`<strong>Quick checklist before your trial ends:</strong>
      <ul style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li>Create at least one reward your customers will love</li>
        <li>Invite your first members to join the program</li>
        <li>Share a reward link on social media</li>
      </ul>`)}
    ${emailParagraph(`Don't lose the momentum — upgrade now to keep all your data and keep rewarding your customers.`)}
    ${emailButton('Upgrade Before Trial Ends →', upgradeUrl)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Still have questions? Visit your <a href="${dashboardUrl}" style="color:#4f46e5;">dashboard</a> or reply to this email.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Una semana adentro — ¡gran progreso, ${businessName}! 🚀`)}
    ${emailParagraph(`Ya llevas 7 días en tu trial de LoyaltyOS y te quedan <strong>${daysLeft} días</strong>. Es el momento perfecto para asegurarte de que tu programa de fidelización esté listo para crecer.`)}
    ${emailHighlight(`<strong>Checklist rápido antes de que termine tu trial:</strong>
      <ul style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li>Creá al menos una recompensa que tus clientes amen</li>
        <li>Invitá a tus primeros miembros al programa</li>
        <li>Compartí un enlace de recompensa en redes sociales</li>
      </ul>`)}
    ${emailParagraph(`No pierdas el impulso — actualizá ahora para conservar todos tus datos y seguir recompensando a tus clientes.`)}
    ${emailButton('Actualizá Antes de que Termine el Trial →', upgradeUrl)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">¿Tenés preguntas? Visitá tu <a href="${dashboardUrl}" style="color:#4f46e5;">dashboard</a> o respondé este email.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
