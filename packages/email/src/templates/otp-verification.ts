import { emailHeading, emailParagraph, emailCode } from '../template';

export function buildOtpVerificationEmail({ otp = '' }) {
  const enSubject = `${otp} is your LoyaltyOS verification code`;
  const esSubject = `${otp} es tu código de verificación de LoyaltyOS`;

  const enHtmlContent = `
    ${emailHeading(`Verification Code`)}
    ${emailParagraph(`We detected a sign-in from a new device. Enter the code below to continue:`)}
    ${emailCode(otp)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">This code expires in <strong>10 minutes</strong>.<br>If this wasn't you, ignore this email and consider changing your password.</span>`)}
  `;

  const esHtmlContent = `
    ${emailHeading(`Código de Verificación`)}
    ${emailParagraph(`Detectamos un inicio de sesión desde un dispositivo nuevo. Ingresá el código de abajo para continuar:`)}
    ${emailCode(otp)}
    ${emailParagraph(`<span style="font-size:13px; color:#64748b;">Este código vence en <strong>10 minutos</strong>.<br>Si no fuiste vos, ignorá este email y considerá cambiar tu contraseña.</span>`)}
  `;

  return { enSubject, esSubject, enHtmlContent, esHtmlContent };
}
