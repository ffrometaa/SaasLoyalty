import { emailButton, emailHeading, emailParagraph, emailHighlight } from '../template';

export function buildPaymentFailedEmail({ businessName = '', amountDue = '', billingUrl = '' }) {
  const url = billingUrl || 'https://dashboard.loyalbase.dev/settings/billing';

  const enSubject = `Action required: Payment failed for your LoyaltyOS subscription`;
  const esSubject = `Acción requerida: El pago de tu suscripción a LoyaltyOS falló`;

  const enHtmlContent = `
    ${emailHeading(`Payment Failed ⚠️`)}
    ${emailParagraph(`Hi <strong>${businessName}</strong>, we were unable to process your payment.`)}
    ${emailHighlight(`
      <strong>Amount due:</strong> ${amountDue}<br>
      <strong>Action required:</strong> Update your payment method within 7 days to avoid service interruption.
    `)}
    ${emailParagraph(`If payment is not resolved within 7 days, your account will be suspended and your members will lose access to the loyalty program.`)}
    ${emailButton('Update Payment Method', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">If you believe this is an error, please contact us by replying to this email.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Pago Fallido ⚠️`)}
    ${emailParagraph(`Hola <strong>${businessName}</strong>, no pudimos procesar tu pago.`)}
    ${emailHighlight(`
      <strong>Monto adeudado:</strong> ${amountDue}<br>
      <strong>Acción requerida:</strong> Actualizá tu método de pago en los próximos 7 días para evitar la interrupción del servicio.
    `)}
    ${emailParagraph(`Si el pago no se resuelve en 7 días, tu cuenta será suspendida y tus miembros perderán acceso al programa de fidelización.`)}
    ${emailButton('Actualizar Método de Pago', url)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Si creés que esto es un error, por favor contactanos respondiendo este email.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
