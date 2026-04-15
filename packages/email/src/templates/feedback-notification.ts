// Internal notification email — sent to hello@loyalbase.dev when a feedback
// submission arrives. Not bilingual (internal team use only).

export function buildFeedbackNotificationEmail({
  source = '',
  type = '',
  message = '',
  fromEmail = '',
  tenantName = '',
}) {
  const sourceLabel = source === 'tenant' ? 'Tenant (Dashboard)' : 'Member (Member App)';
  const typeLabel: Record<string, string> = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    suggestion: 'Suggestion',
    general: 'General Feedback',
  };

  const subject = `[Feedback] ${typeLabel[type] ?? type} from ${fromEmail || 'anonymous'} (${sourceLabel})`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f8fafc;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr>
          <td style="background:#7c3aed;border-radius:12px 12px 0 0;padding:20px 32px;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">LoyaltyOS Internal</p>
            <h1 style="margin:4px 0 0;font-size:20px;font-weight:800;color:#ffffff;">New Feedback Submission</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:8px;padding:16px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Details</p>
                        <p style="margin:0 0 4px;font-size:14px;color:#0f172a;"><strong>Source:</strong> ${sourceLabel}</p>
                        <p style="margin:0 0 4px;font-size:14px;color:#0f172a;"><strong>Type:</strong> ${typeLabel[type] ?? type}</p>
                        ${fromEmail ? `<p style="margin:0 0 4px;font-size:14px;color:#0f172a;"><strong>From:</strong> ${fromEmail}</p>` : ''}
                        ${tenantName ? `<p style="margin:0;font-size:14px;color:#0f172a;"><strong>Business:</strong> ${tenantName}</p>` : ''}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Message</p>
                  <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
                    <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.7;white-space:pre-wrap;">${message}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f1f5f9;border-radius:0 0 12px 12px;padding:16px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">LoyaltyOS Internal Notification · Do not reply to this email</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
