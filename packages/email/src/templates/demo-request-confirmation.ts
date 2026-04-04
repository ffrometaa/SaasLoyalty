import { emailHeading, emailParagraph, emailHighlight } from '../template';

export function buildDemoRequestConfirmationEmail({ ownerName = '', businessName = '', businessType = '', message = '' }) {
  const enSubject = `We received your demo request for ${businessName}`;
  const esSubject = `Recibimos tu solicitud de demo para ${businessName}`;

  const enHtmlContent = `
    ${emailHeading(`Request Received! ✅`)}
    ${emailParagraph(`Hi <strong>${ownerName}</strong>, thank you for your interest in LoyaltyOS!`)}
    ${emailHighlight(`
      <strong>We received your demo request for:</strong><br>
      ${businessName}${businessType ? ` · ${businessType}` : ''}
      ${message ? `<br><br><em>"${message}"</em>` : ''}
    `)}
    ${emailParagraph(`<strong>What happens next:</strong>`)}
    ${emailParagraph(`<ol style="margin:0 0 16px; padding-left:20px; color:#334155; line-height:2;"><li>Our team will review your information</li><li>We will contact you within 24 hours</li><li>We will schedule a personalized demo for your business</li></ol>`)}
    ${emailParagraph(`If you have any urgent questions, write to us at <a href="mailto:hello@loyalbase.dev" style="color:#7c3aed;">hello@loyalbase.dev</a>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`¡Solicitud Recibida! ✅`)}
    ${emailParagraph(`Hola <strong>${ownerName}</strong>, ¡gracias por tu interés en LoyaltyOS!`)}
    ${emailHighlight(`
      <strong>Recibimos tu solicitud de demo para:</strong><br>
      ${businessName}${businessType ? ` · ${businessType}` : ''}
      ${message ? `<br><br><em>"${message}"</em>` : ''}
    `)}
    ${emailParagraph(`<strong>¿Qué pasa ahora?</strong>`)}
    ${emailParagraph(`<ol style="margin:0 0 16px; padding-left:20px; color:#334155; line-height:2;"><li>Nuestro equipo revisará tu información</li><li>Nos comunicaremos con vos en menos de 24 horas</li><li>Coordinaremos una demo personalizada para tu negocio</li></ol>`)}
    ${emailParagraph(`Si tenés alguna consulta urgente, escribinos a <a href="mailto:hello@loyalbase.dev" style="color:#7c3aed;">hello@loyalbase.dev</a>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
