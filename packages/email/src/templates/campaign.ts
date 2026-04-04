import { emailButton, emailHeading, emailParagraph } from '../template';

// Used when a tenant sends an email campaign through the campaigns module.
// The tenant writes enBody and esBody in the form. If only one is provided,
// the other block shows a note explaining content is only available in the other language.

export function buildCampaignEmail({
  campaignName = '',
  subject = '',
  enBody = '',
  esBody = '',
  ctaText = '',
  ctaUrl = '',
  businessName = '',
}) {
  const hasEn = Boolean(enBody && enBody.trim());
  const hasEs = Boolean(esBody && esBody.trim());

  const onlyAvailableNote = `<p style="margin:0; font-size:13px; color:#94a3b8; font-style:italic; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px;">This content is only available in the other language. / Este contenido solo está disponible en el otro idioma.</p>`;

  const resolvedEnBody = hasEn ? enBody : onlyAvailableNote;
  const resolvedEsBody = hasEs ? esBody : onlyAvailableNote;

  const ctaButton = ctaText && ctaUrl ? emailButton(ctaText, ctaUrl) : '';

  const enHtmlContent = `
    ${emailHeading(subject || campaignName || 'Message from ' + businessName)}
    <div style="font-size:15px; color:#334155; line-height:1.7;">
      ${resolvedEnBody}
    </div>
    ${ctaButton}
  `;

  const esHtmlContent = `
    ${emailHeading(subject || campaignName || 'Mensaje de ' + businessName)}
    <div style="font-size:15px; color:#334155; line-height:1.7;">
      ${resolvedEsBody}
    </div>
    ${ctaButton}
  `;

  const enSubject = subject || campaignName || `Message from ${businessName}`;
  const esSubject = subject || campaignName || `Mensaje de ${businessName}`;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
