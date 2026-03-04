import { defineAuth } from '@aws-amplify/backend'
import { postConfirmation } from '../functions/post-confirmation/resource'

const verificationEmailHtml = (code: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Al Fallo</h1>
</td></tr>
<tr><td style="padding:40px 32px;">
<h2 style="color:#ffffff;margin:0 0 16px;font-size:22px;">Verifica tu cuenta</h2>
<p style="color:#a1a1aa;margin:0 0 24px;font-size:16px;line-height:1.5;">Usa el siguiente codigo para verificar tu cuenta. Este codigo expira en 24 horas.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<div style="background-color:#2a2a2a;border:1px solid #3f3f46;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
<span style="color:#ffffff;font-size:36px;font-weight:700;letter-spacing:8px;">${code}</span>
</div>
</td></tr></table>
<p style="color:#71717a;margin:0;font-size:14px;line-height:1.5;">Si no creaste una cuenta en Al Fallo, puedes ignorar este correo.</p>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #27272a;text-align:center;">
<p style="color:#52525b;margin:0;font-size:13px;">Al Fallo - Tu plataforma de eventos deportivos</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

const invitationEmailHtml = (user: string, code: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
<h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Al Fallo</h1>
</td></tr>
<tr><td style="padding:40px 32px;">
<h2 style="color:#ffffff;margin:0 0 16px;font-size:22px;">Bienvenido a Al Fallo</h2>
<p style="color:#a1a1aa;margin:0 0 24px;font-size:16px;line-height:1.5;">Se ha creado una cuenta para ti. Usa las siguientes credenciales para iniciar sesion:</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td>
<div style="background-color:#2a2a2a;border:1px solid #3f3f46;border-radius:8px;padding:20px;margin:0 0 24px;">
<p style="color:#a1a1aa;margin:0 0 8px;font-size:14px;">Usuario</p>
<p style="color:#ffffff;margin:0 0 16px;font-size:18px;font-weight:600;">${user}</p>
<p style="color:#a1a1aa;margin:0 0 8px;font-size:14px;">Contrasena temporal</p>
<p style="color:#ffffff;margin:0;font-size:18px;font-weight:600;letter-spacing:2px;">${code}</p>
</div>
</td></tr></table>
<p style="color:#71717a;margin:0;font-size:14px;line-height:1.5;">Te pediremos que cambies tu contrasena la primera vez que inicies sesion.</p>
</td></tr>
<tr><td style="padding:24px 32px;border-top:1px solid #27272a;text-align:center;">
<p style="color:#52525b;margin:0;font-size:13px;">Al Fallo - Tu plataforma de eventos deportivos</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Al Fallo - Codigo de verificacion',
      verificationEmailBody: (createCode) =>
        verificationEmailHtml(createCode()),
      userInvitation: {
        emailSubject: 'Al Fallo - Te han invitado a unirte',
        emailBody: (username, code) =>
          invitationEmailHtml(username(), code()),
      },
    },
  },
  userAttributes: {
    preferredUsername: { mutable: true },
  },
  groups: ['organizadores', 'atletas'],
  triggers: {
    postConfirmation,
  },
})
