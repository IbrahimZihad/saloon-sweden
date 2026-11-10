export interface AppointmentEmailData {
  salonName: string;
  customerName: string;
  bookingReference: string;
  services: { name: string; durationMinutes: number; price: string }[];
  staffName: string;
  dateLabel: string;
  timeLabel: string;
  endTimeLabel: string;
  durationMinutes: number;
  totalPrice: string;
  currency: string;
  salonPhone?: string | null;
  salonAddress?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(salonName: string, heading: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6f1e7;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f1e7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#fffdf8;border-radius:12px;overflow:hidden;border:1px solid #e8dfcd;">
        <tr><td style="background-color:#2b2620;padding:28px 40px;">
          <p style="margin:0;color:#c8a24b;font-size:13px;letter-spacing:3px;text-transform:uppercase;">${escapeHtml(salonName)}</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h1 style="margin:0 0 20px;color:#2b2620;font-size:26px;font-weight:normal;">${escapeHtml(heading)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e8dfcd;">
          <p style="margin:0;color:#8a8072;font-size:12px;font-family:Arial,sans-serif;">Detta är ett automatiskt meddelande från ${escapeHtml(salonName)}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function detailsTable(data: AppointmentEmailData): string {
  const rows = data.services
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(s.name)}</td>
         <td align="right" style="padding:6px 0;color:#6b6257;font-family:Arial,sans-serif;font-size:13px;">${s.durationMinutes} min · ${escapeHtml(s.price)} ${escapeHtml(data.currency)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f1e7;border-radius:8px;padding:16px;margin:16px 0;">
    <tr><td colspan="2" style="padding:4px 0;color:#8a8072;font-family:Arial,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Bokningsreferens: <strong style="color:#2b2620;">${escapeHtml(data.bookingReference)}</strong></td></tr>
    ${rows}
    <tr><td colspan="2" style="padding-top:10px;border-top:1px solid #e0d5bf;"></td></tr>
    <tr><td style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;">Datum &amp; tid</td>
        <td align="right" style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(data.dateLabel)} kl. ${escapeHtml(data.timeLabel)}–${escapeHtml(data.endTimeLabel)}</td></tr>
    <tr><td style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;">Stylist</td>
        <td align="right" style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(data.staffName)}</td></tr>
    <tr><td style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;">Totalt</td>
        <td align="right" style="padding:6px 0;color:#2b2620;font-family:Arial,sans-serif;font-size:14px;"><strong>${escapeHtml(data.totalPrice)} ${escapeHtml(data.currency)}</strong> · ${data.durationMinutes} min</td></tr>
  </table>`;
}

export function bookingConfirmationEmail(data: AppointmentEmailData): { subject: string; html: string } {
  const subject = `Bokningsbekräftelse ${data.bookingReference} – ${data.salonName}`;
  const html = layout(
    data.salonName,
    'Tack för din bokning!',
    `<p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Hej ${escapeHtml(data.customerName)},</p>
     <p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Din tid är bokad. Vi ser fram emot att träffa dig!</p>
     ${detailsTable(data)}
     <p style="color:#6b6257;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;">Behöver du avboka eller ändra din tid? Ring oss${data.salonPhone ? ` på ${escapeHtml(data.salonPhone)}` : ''} och ange din bokningsreferens.</p>`,
  );
  return { subject, html };
}

export function appointmentConfirmedEmail(data: AppointmentEmailData): { subject: string; html: string } {
  const subject = `Din tid är bekräftad ${data.bookingReference} – ${data.salonName}`;
  const html = layout(
    data.salonName,
    'Din tid är bekräftad',
    `<p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Hej ${escapeHtml(data.customerName)},</p>
     <p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Vi bekräftar härmed din bokning.</p>
     ${detailsTable(data)}`,
  );
  return { subject, html };
}

export function cancellationEmail(data: AppointmentEmailData): { subject: string; html: string } {
  const subject = `Avbokning ${data.bookingReference} – ${data.salonName}`;
  const html = layout(
    data.salonName,
    'Din tid har avbokats',
    `<p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Hej ${escapeHtml(data.customerName)},</p>
     <p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Din bokning <strong>${escapeHtml(data.bookingReference)}</strong> (${escapeHtml(data.dateLabel)} kl. ${escapeHtml(data.timeLabel)}) har avbokats.</p>
     <p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Du är varmt välkommen att boka en ny tid när det passar dig.</p>`,
  );
  return { subject, html };
}

export function rescheduleEmail(data: AppointmentEmailData): { subject: string; html: string } {
  const subject = `Din tid har ändrats ${data.bookingReference} – ${data.salonName}`;
  const html = layout(
    data.salonName,
    'Din bokning har flyttats',
    `<p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Hej ${escapeHtml(data.customerName)},</p>
     <p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Din tid har flyttats. Här är dina nya uppgifter:</p>
     ${detailsTable(data)}`,
  );
  return { subject, html };
}

export function reminderEmail(data: AppointmentEmailData): { subject: string; html: string } {
  const subject = `Påminnelse: din tid imorgon ${data.bookingReference} – ${data.salonName}`;
  const html = layout(
    data.salonName,
    'Vi ses snart!',
    `<p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">Hej ${escapeHtml(data.customerName)},</p>
     <p style="color:#4a443b;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;">En vänlig påminnelse om din bokade tid:</p>
     ${detailsTable(data)}
     <p style="color:#6b6257;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;">Kan du inte komma? Hör av dig till oss så snart som möjligt${data.salonPhone ? ` på ${escapeHtml(data.salonPhone)}` : ''}.</p>`,
  );
  return { subject, html };
}