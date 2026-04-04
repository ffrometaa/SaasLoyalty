import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export function buildTrialExpiryEmail({ businessName = '', daysLeft = 0, dashboardUrl = '' }) {
  const url = dashboardUrl || 'https://dashboard.loyalbase.dev/settings/billing';

  const enSubject = `Your LoyaltyOS trial ends in ${daysLeft} days`;
  const esSubject = `Tu período de prueba de LoyaltyOS termina en ${daysLeft} días`;

  const enHtmlContent = `
    ${emailHeading(`Your Trial is Ending Soon`)}
    ${emailParagraph(`Hi <strong>${businessName}</strong>, your LoyaltyOS trial ends in <strong>${daysLeft} days</strong>.`)}
    ${emailHighlight(`
      <strong>What you will lose access to without a paid plan:</strong>
      <ul style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li>Member management and points tracking</li>
        <li>Rewards and redemption system</li>
        <li>Campaign sending</li>
        <li>Analytics and insights</li>
        <li>Team member access</li>
      </ul>
    `)}
    ${emailParagraph(`Add a payment method now to keep all your data and continue serving your members.`)}
    ${emailButton('Add Payment Method', url)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Tu Período de Prueba Termina Pronto`)}
    ${emailParagraph(`Hola <strong>${businessName}</strong>, tu período de prueba de LoyaltyOS termina en <strong>${daysLeft} días</strong>.`)}
    ${emailHighlight(`
      <strong>Sin un plan pago, perderás acceso a:</strong>
      <ul style="margin:10px 0 0; padding-left:20px; color:#334155; line-height:2;">
        <li>Gestión de miembros y seguimiento de puntos</li>
        <li>Sistema de recompensas y canje</li>
        <li>Envío de campañas</li>
        <li>Analytics e informes</li>
        <li>Acceso de miembros del equipo</li>
      </ul>
    `)}
    ${emailParagraph(`Agregá un método de pago ahora para conservar todos tus datos y seguir atendiendo a tus miembros.`)}
    ${emailButton('Agregar Método de Pago', url)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
