import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export interface OnboardingDay3EmailParams {
  businessName?: string;
  dashboardUrl?: string;
  rewardsUrl?: string;
}

export function buildOnboardingDay3Email({
  businessName = '',
  dashboardUrl = 'https://dashboard.loyalbase.dev',
  rewardsUrl = 'https://dashboard.loyalbase.dev/rewards',
}: OnboardingDay3EmailParams = {}) {
  const enSubject = `Day 3 check-in — have you created your first reward?`;
  const esSubject = `Día 3 — ¿Ya creaste tu primera recompensa?`;

  const enHtmlContent = `
    ${emailHeading(`How's it going, ${businessName}? 👋`)}
    ${emailParagraph(`It's been 3 days since you joined LoyaltyOS. We wanted to check in — have you set up your first reward yet?`)}
    ${emailHighlight(`Creating a reward is the most important step to getting your loyalty program running. It only takes 2 minutes.`)}
    ${emailParagraph(`Members can start earning and redeeming points as soon as you publish your first reward. Don't leave them waiting!`)}
    ${emailButton('Create Your First Reward →', rewardsUrl)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Need help? Visit your <a href="${dashboardUrl}" style="color:#4f46e5;">dashboard</a> or reply to this email — we're here.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¿Cómo va todo, ${businessName}? 👋`)}
    ${emailParagraph(`Hace 3 días que te uniste a LoyaltyOS. Queríamos consultarte — ¿ya configuraste tu primera recompensa?`)}
    ${emailHighlight(`Crear una recompensa es el paso más importante para poner en marcha tu programa de fidelización. Solo lleva 2 minutos.`)}
    ${emailParagraph(`Los miembros podrán empezar a ganar y canjear puntos en cuanto publiques tu primera recompensa. ¡No los hagas esperar!`)}
    ${emailButton('Crear tu Primera Recompensa →', rewardsUrl)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">¿Necesitás ayuda? Visitá tu <a href="${dashboardUrl}" style="color:#4f46e5;">dashboard</a> o respondé este email — estamos acá.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
