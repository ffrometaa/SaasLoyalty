// ─── MAIN BILINGUAL EMAIL TEMPLATE ────────────────────────────────────────────
// Every outgoing email must be wrapped with this function.
// English block first, horizontal divider, Spanish block below, shared footer.

export function buildBilingualEmail({
  enSubject = '',
  esSubject = '',
  enHtmlContent = '',
  esHtmlContent = '',
  tenantName = '',
  tenantLogoUrl = '',
  tenantPrimaryColor = '',
}) {
  const accent = tenantPrimaryColor || '#7c3aed';

  const subject = `${enSubject} / ${esSubject}`;

  const logo = tenantLogoUrl
    ? `<img src="${tenantLogoUrl}" alt="${tenantName || 'LoyalBase'}" style="max-height:48px; max-width:180px; display:block; margin:0 auto;" />`
    : `<span style="font-size:24px; font-weight:800; letter-spacing:-0.5px; font-family:system-ui,-apple-system,sans-serif;"><span style="color:#1a1a3e;">Loyal</span><span style="color:#5C50E8;">Base</span></span>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#ffffff; border-radius:12px 12px 0 0; padding:28px 40px; text-align:center; border-bottom:1px solid #e2e8f0;">
              ${logo}
              ${tenantName && !tenantLogoUrl ? `<p style="margin:6px 0 0; font-size:13px; color:#64748b;">${tenantName}</p>` : ''}
            </td>
          </tr>

          <!-- ENGLISH BLOCK -->
          <tr>
            <td style="background-color:#ffffff; padding:36px 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:right; padding-bottom:12px;">
                    <span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">EN</span>
                  </td>
                </tr>
                <tr>
                  <td style="color:#0f172a; font-size:15px; line-height:1.7;">
                    ${enHtmlContent}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="background-color:#ffffff; padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e2e8f0; padding:0;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SPANISH BLOCK -->
          <tr>
            <td style="background-color:#ffffff; padding:28px 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:right; padding-bottom:12px;">
                    <span style="font-size:10px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; background:#f1f5f9; border-radius:4px; padding:3px 8px;">ES</span>
                  </td>
                </tr>
                <tr>
                  <td style="color:#0f172a; font-size:15px; line-height:1.7;">
                    ${esHtmlContent}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f1f5f9; border-radius:0 0 12px 12px; padding:24px 40px; border-top:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 8px; font-size:13px; color:#64748b;">
                      <a href="{{unsubscribe_url}}" style="color:#94a3b8; text-decoration:underline;">Unsubscribe</a>
                      &nbsp;·&nbsp;
                      <a href="{{unsubscribe_url}}" style="color:#94a3b8; text-decoration:underline;">Cancelar suscripción</a>
                    </p>
                    <p style="margin:0; font-size:12px; color:#94a3b8;">
                      LoyalBase LLC · St. Petersburg, FL 33702, USA
                    </p>
                    <p style="margin:4px 0 0; font-size:11px; color:#cbd5e1;">
                      Powered by <strong style="color:#5C50E8;">Loyal</strong><strong style="color:#5C50E8;">Base</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

// ─── SHARED HTML HELPERS ──────────────────────────────────────────────────────

export function emailButton(text = '', url = '', color = '') {
  const bg = color || '#7c3aed';
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:8px; background-color:${bg};">
        <a href="${url}" style="display:inline-block; padding:13px 28px; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:8px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function emailHeading(text = '', color = '') {
  const c = color || '#0f172a';
  return `<h1 style="margin:0 0 16px; font-size:24px; font-weight:800; color:${c}; line-height:1.2;">${text}</h1>`;
}

export function emailParagraph(text = '') {
  return `<p style="margin:0 0 16px; font-size:15px; color:#334155; line-height:1.7;">${text}</p>`;
}

export function emailHighlight(text = '', color = '') {
  const bg = color ? `${color}18` : '#7c3aed18';
  const border = color ? `${color}40` : '#7c3aed40';
  return `<div style="background:${bg}; border:1px solid ${border}; border-radius:8px; padding:16px 20px; margin:16px 0;">
    <p style="margin:0; font-size:15px; color:#0f172a;">${text}</p>
  </div>`;
}

export function emailCode(code = '') {
  return `<div style="text-align:center; margin:20px 0;">
    <div style="display:inline-block; background:#f1f5f9; border:2px solid #e2e8f0; border-radius:10px; padding:16px 32px;">
      <span style="font-size:36px; font-weight:900; letter-spacing:6px; color:#7c3aed; font-family:'Courier New',monospace;">${code}</span>
    </div>
  </div>`;
}

export function emailDivider() {
  return `<div style="border-top:1px solid #e2e8f0; margin:20px 0;"></div>`;
}

export function emailPoints(amount = 0, label = '') {
  return `<div style="text-align:center; margin:20px 0;">
    <div style="display:inline-block; background:linear-gradient(135deg,#7c3aed18,#6366f118); border:1px solid #7c3aed40; border-radius:12px; padding:20px 36px;">
      <p style="margin:0; font-size:40px; font-weight:900; color:#7c3aed; line-height:1;">${amount}</p>
      <p style="margin:4px 0 0; font-size:13px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">${label}</p>
    </div>
  </div>`;
}
