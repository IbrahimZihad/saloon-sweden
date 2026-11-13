# GDPR operations

Practical notes for running the salon site in line with the GDPR and Swedish
data protection law. This is a working checklist, not legal advice.

## 1. Data controller

The controller is the salon. The privacy policy fills its name, address and
contact details from the public business settings, so keep **Admin → Settings**
accurate (name, address, postal code, city, country, e-mail, phone).

If the salon has an organisation number and wants it published, set
`SALON_ORG_NUMBER` in `frontend/src/lib/legal.ts`. Leave it empty to omit the
line; Art. 13 only requires the controller's identity and contact details.

## 2. Purposes and legal bases

| Processing | Data | Legal basis |
| --- | --- | --- |
| Online booking and reminders | Name, e-mail, phone, service, stylist, time, optional notes | Contract (Art. 6(1)(b)) |
| Contact form | Name, e-mail, optional phone, message | Legitimate interest or contract (Art. 6(1)(f)/(b)) |
| Accounting records | Booking/payment records | Legal obligation (Art. 6(1)(c)) |
| Marketing e-mail | E-mail, name, consent flag | Consent (Art. 6(1)(a)) |
| Security, rate limiting, logs | IP address, request metadata | Legitimate interest (Art. 6(1)(f)) |

Marketing messages may only be sent to customers with `marketingConsent = true`.
The booking checkbox is an acknowledgment of the policy, **not** marketing
consent.

## 3. Retention (enforced by the daily job)

| Data | Period | Setting |
| --- | --- | --- |
| Customer personal data without a booking | 36 months since last booking, then anonymised | `RETENTION_CUSTOMER_MONTHS` |
| Handled contact messages | 12 months | `RETENTION_CONTACT_MESSAGE_DAYS` |
| E-mail notification logs (recipient + body) | 90 days | `RETENTION_NOTIFICATION_DAYS` |
| Appointment rows required for bookkeeping | 7 years (Swedish bookkeeping law) | not deleted |
| Server logs | Per hosting provider, only as long as needed | provider setting |

The job runs daily at 03:15 Europe/Stockholm inside the API process. Run it
manually with:

```bash
npm --prefix backend run db:retention       # development (tsx)
npm --prefix backend run db:retention:prod  # production (compiled dist)
```

Customers with a booking inside the window (including upcoming ones) and
customers with marketing consent are never anonymised.

## 4. Processors and transfers

The public privacy policy names the main processors. Keep this table current and
make sure each vendor's data processing agreement (DPA) is accepted:

| Vendor | Role | Location | Safeguard |
| --- | --- | --- | --- |
| Aiven | Managed MySQL | EU region (verify) | DPA + TLS with CA verification |
| Render | Backend hosting | United States | DPA + SCCs |
| Vercel | Frontend hosting | United States | DPA + SCCs |
| E-mail provider (SMTP) | Transactional e-mail | Verify | DPA + SCCs if outside EU/EEA |

Also note:

- Uploaded images are stored on the backend's persistent disk (`UPLOAD_DIRECTORY`).
- No analytics, advertising pixels or third-party embeds are loaded. Google Maps
  is only embedded if `mapEmbedUrl` is configured in settings.

## 5. Data subject requests

Handled in **Admin → Customers**:

| Right | Where |
| --- | --- |
| Access / portability | Export button → `GET /api/admin/customers/:id/export` (JSON) |
| Erasure | Delete/anonymise → `DELETE /api/admin/customers/:id` |
| Rectification | Edit the customer record |
| Restriction / objection | Anonymise or stop processing; document the request |

Verify the requester's identity before exporting or erasing. Respond within one
month (extendable by two months for complex requests).

Erasure anonymises the customer and clears appointment notes and notification
logs; appointment rows remain because they are financial records.

## 6. Breach procedure

1. Contain the incident (revoke credentials, close the exposure).
2. Assess risk to data subjects and document what happened.
3. Notify **IMY** within **72 hours** if the breach is likely to result in a
   risk to rights and freedoms (`imy.se`).
4. Inform affected data subjects without undue delay if the risk is high.
5. Keep an internal incident log, including decisions and remedial actions.

## 7. Processing record (Art. 30) — template

Keep a short internal document with one row per processing activity:

| Field | Example |
| --- | --- |
| Activity | Online booking |
| Controller | Salon name, org. number, contact |
| Purposes | Administer and confirm bookings, send reminders |
| Categories of data subjects | Customers |
| Categories of personal data | Name, e-mail, phone, booking details, optional notes |
| Recipients | Aiven, Render, Vercel, e-mail provider |
| Transfers outside EU/EEA | Yes (US providers) — SCCs |
| Retention | See section 3 |
| Security measures | TLS, encrypted credentials, role-based access, rate limiting |

## 8. Routine checklist

- [ ] Business settings (name, address, e-mail, phone) are current.
- [ ] `SALON_ORG_NUMBER` set if it should be published.
- [ ] DPAs accepted and filed for every processor.
- [ ] Retention job ran (check the `[retention]` log line).
- [ ] Admin accounts follow least privilege; remove leavers promptly.
- [ ] Backups exist and are restorable; access is restricted.
- [ ] Policy updated when a new tool or purpose is introduced.
- [ ] No analytics/marketing script is added without prior opt-in consent.
