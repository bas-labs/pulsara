interface RegistrationEmailData {
  participantName: string
  eventTitle: string
  eventDate: string // ISO datetime
  eventCity: string
  eventVenue: string | undefined
  distanceName: string
  amountPaid: number // centavos
  shirtSize: string | undefined
}

interface OrganizerNotificationData {
  participantName: string
  participantEmail: string
  eventTitle: string
  distanceName: string
  amountPaid: number // centavos
}

function formatCurrency(centavos: number): string {
  const pesos = centavos / 100
  return `$${pesos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
}

function formatDateSpanish(isoDate: string): string {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  const d = new Date(isoDate)
  return `${d.getUTCDate()} de ${months[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

export function buildRegistrationConfirmationEmail(data: RegistrationEmailData): { subject: string; htmlBody: string } {
  const amount = formatCurrency(data.amountPaid)
  const date = formatDateSpanish(data.eventDate)
  const venue = data.eventVenue ? `<tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Sede</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.eventVenue}</td></tr>` : ''
  const shirtRow = data.shirtSize ? `<tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Talla de playera</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.shirtSize}</td></tr>` : ''

  const subject = `Confirmacion de registro - ${data.eventTitle}`

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Al Fallo</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 32px;">
          <!-- Checkmark -->
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#16a34a;line-height:56px;text-align:center;">
              <span style="color:#ffffff;font-size:28px;">&#10003;</span>
            </div>
          </div>
          <h2 style="color:#ffffff;margin:0 0 8px;text-align:center;font-size:22px;">Registro confirmado</h2>
          <p style="color:#a1a1aa;margin:0 0 32px;text-align:center;font-size:15px;line-height:1.5;">
            Hola <strong style="color:#ffffff;">${data.participantName}</strong>, tu registro ha sido confirmado exitosamente.
          </p>
          <!-- Event details -->
          <div style="background-color:#2a2a2a;border:1px solid #3f3f46;border-radius:8px;padding:20px;margin:0 0 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Evento</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-weight:600;font-size:14px;">${data.eventTitle}</td></tr>
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Fecha</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${date}</td></tr>
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Ciudad</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.eventCity}</td></tr>
              ${venue}
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Distancia</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.distanceName}</td></tr>
              ${shirtRow}
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;font-weight:600;">Total pagado</td><td style="padding:6px 0;color:#16a34a;text-align:right;font-weight:700;font-size:16px;">${amount}</td></tr>
            </table>
          </div>
          <p style="color:#71717a;margin:0;text-align:center;font-size:14px;line-height:1.5;">
            Guarda este correo como comprobante de tu inscripcion. Te esperamos en la linea de salida.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid #27272a;text-align:center;">
          <p style="color:#52525b;margin:0;font-size:13px;">Al Fallo - Tu plataforma de eventos deportivos</p>
          <p style="color:#3f3f46;margin:4px 0 0;font-size:11px;">Este correo fue enviado automaticamente. No responder a este mensaje.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, htmlBody }
}

export function buildOrganizerNotificationEmail(data: OrganizerNotificationData): { subject: string; htmlBody: string } {
  const amount = formatCurrency(data.amountPaid)

  const subject = `Nuevo registro - ${data.eventTitle}`

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#1a1a1a;border-radius:12px;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Al Fallo</h1>
        </td></tr>
        <tr><td style="padding:40px 32px;">
          <h2 style="color:#ffffff;margin:0 0 16px;font-size:22px;">Nuevo registro recibido</h2>
          <div style="background-color:#2a2a2a;border:1px solid #3f3f46;border-radius:8px;padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Participante</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.participantName}</td></tr>
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Email</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.participantEmail}</td></tr>
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Evento</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.eventTitle}</td></tr>
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Distancia</td><td style="padding:6px 0;color:#ffffff;text-align:right;font-size:14px;">${data.distanceName}</td></tr>
              <tr><td style="padding:6px 0;color:#a1a1aa;font-size:14px;">Monto</td><td style="padding:6px 0;color:#16a34a;text-align:right;font-weight:600;font-size:14px;">${amount}</td></tr>
            </table>
          </div>
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid #27272a;text-align:center;">
          <p style="color:#52525b;margin:0;font-size:13px;">Al Fallo - Tu plataforma de eventos deportivos</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, htmlBody }
}
