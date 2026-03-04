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
  const venue = data.eventVenue ? `<tr><td style="padding:8px 0;color:#999;">Sede</td><td style="padding:8px 0;color:#fff;text-align:right;">${data.eventVenue}</td></tr>` : ''
  const shirtRow = data.shirtSize ? `<tr><td style="padding:8px 0;color:#999;">Talla de playera</td><td style="padding:8px 0;color:#fff;text-align:right;">${data.shirtSize}</td></tr>` : ''

  const subject = `Confirmacion de registro - ${data.eventTitle}`

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="text-align:center;padding:0 0 32px;">
          <h1 style="margin:0;font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">AL FALLO</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#666;">Tu plataforma de eventos deportivos</p>
        </td></tr>
        <!-- Card -->
        <tr><td style="background-color:#141414;border-radius:12px;padding:40px 32px;border:1px solid #222;">
          <!-- Checkmark -->
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#16a34a;line-height:56px;text-align:center;">
              <span style="color:#fff;font-size:28px;">&#10003;</span>
            </div>
          </div>
          <h2 style="margin:0 0 8px;text-align:center;font-size:22px;color:#fff;">Registro confirmado</h2>
          <p style="margin:0 0 32px;text-align:center;font-size:15px;color:#999;">
            Hola <strong style="color:#fff;">${data.participantName}</strong>, tu registro ha sido confirmado exitosamente.
          </p>
          <!-- Event details table -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #222;border-bottom:1px solid #222;margin-bottom:24px;">
            <tr><td style="padding:8px 0;color:#999;">Evento</td><td style="padding:8px 0;color:#fff;text-align:right;font-weight:600;">${data.eventTitle}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Fecha</td><td style="padding:8px 0;color:#fff;text-align:right;">${date}</td></tr>
            <tr><td style="padding:8px 0;color:#999;">Ciudad</td><td style="padding:8px 0;color:#fff;text-align:right;">${data.eventCity}</td></tr>
            ${venue}
            <tr><td style="padding:8px 0;color:#999;">Distancia</td><td style="padding:8px 0;color:#fff;text-align:right;">${data.distanceName}</td></tr>
            ${shirtRow}
            <tr><td style="padding:8px 0;color:#999;font-weight:600;">Total pagado</td><td style="padding:8px 0;color:#16a34a;text-align:right;font-weight:700;font-size:16px;">${amount}</td></tr>
          </table>
          <p style="margin:0;text-align:center;font-size:13px;color:#666;">
            Guarda este correo como comprobante de tu inscripcion. Te esperamos en la linea de salida.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="text-align:center;padding:32px 0 0;">
          <p style="margin:0;font-size:12px;color:#444;">Al Fallo - Tu plataforma de eventos deportivos</p>
          <p style="margin:4px 0 0;font-size:11px;color:#333;">Este correo fue enviado automaticamente. No responder a este mensaje.</p>
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
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="text-align:center;padding:0 0 24px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">AL FALLO</h1>
        </td></tr>
        <tr><td style="background-color:#141414;border-radius:12px;padding:32px;border:1px solid #222;">
          <h2 style="margin:0 0 16px;font-size:18px;color:#fff;">Nuevo registro recibido</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 0;color:#999;">Participante</td><td style="padding:6px 0;color:#fff;text-align:right;">${data.participantName}</td></tr>
            <tr><td style="padding:6px 0;color:#999;">Email</td><td style="padding:6px 0;color:#fff;text-align:right;">${data.participantEmail}</td></tr>
            <tr><td style="padding:6px 0;color:#999;">Evento</td><td style="padding:6px 0;color:#fff;text-align:right;">${data.eventTitle}</td></tr>
            <tr><td style="padding:6px 0;color:#999;">Distancia</td><td style="padding:6px 0;color:#fff;text-align:right;">${data.distanceName}</td></tr>
            <tr><td style="padding:6px 0;color:#999;">Monto</td><td style="padding:6px 0;color:#16a34a;text-align:right;font-weight:600;">${amount}</td></tr>
          </table>
        </td></tr>
        <tr><td style="text-align:center;padding:24px 0 0;">
          <p style="margin:0;font-size:12px;color:#444;">Al Fallo - Tu plataforma de eventos deportivos</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, htmlBody }
}
