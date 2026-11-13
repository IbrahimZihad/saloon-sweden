import { AddressInfo } from 'node:net';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { Op } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { Appointment, ContactMessage, Customer, EmailNotification, Service, Staff } from '../src/database/models';
import { NotificationStatus, NotificationType } from '../src/database/enums';
import type { DatabaseService } from '../src/database/database.service';
import type { RetentionService } from '../src/retention/retention.service';
import { closeDatabase, resetDatabase, seedAll } from './db';

// sanitize-html pulls in an ESM-only htmlparser2 that Jest's CJS runtime cannot
// require. The real sanitizer runs in the live app; here we stub the boundary
// with equivalent tag-stripping so booking logic is exercised against MySQL.
jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: (value: string) => String(value).replace(/<[^>]*>/g, ''),
}));

interface Slot {
  startsAt: string;
  endsAt: string;
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
}

const CUSTOMER_EMAIL = 'integration.kund@example.com';

describe('App integration (isolated test database)', () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;
  let adminCookie: string;
  let staffCookie: string;
  let serviceId: string;
  let annaId: string;
  let slots: Slot[];
  let happyReference: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await resetDatabase();
    await seedAll();

    app = await createApp();
    server = app.listen(0);
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;

    adminCookie = await login(process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
    staffCookie = await login('anna@example.com', process.env.STAFF_DEMO_PASSWORD!);

    const service = await Service.findOne({ where: { slug: 'mens-haircut' } });
    const anna = await Staff.findOne({ where: { slug: 'anna' } });
    expect(service).not.toBeNull();
    expect(anna).not.toBeNull();
    serviceId = service!.id;
    annaId = anna!.id;

    const datesRes = await request(baseUrl)
      .get('/api/public/availability/dates')
      .query({ serviceIds: serviceId, staffId: annaId })
      .expect(200);
    const dates: string[] = datesRes.body.dates;
    expect(dates.length).toBeGreaterThan(2);
    const chosenDate = dates[2];

    const slotsRes = await request(baseUrl)
      .get('/api/public/availability/slots')
      .query({ serviceIds: serviceId, date: chosenDate, staffId: annaId })
      .expect(200);
    // The grid interval (15 min) is shorter than the service (30 min), so
    // adjacent returned slots overlap. Pick mutually disjoint slots so each
    // test case books an independent time.
    const all: Slot[] = slotsRes.body.slots;
    slots = [];
    for (const s of all) {
      const last = slots[slots.length - 1];
      if (!last || new Date(s.startsAt).getTime() >= new Date(last.endsAt).getTime()) {
        slots.push(s);
      }
    }
    expect(slots.length).toBeGreaterThanOrEqual(9);
  }, 60000);

  afterAll(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
    await closeDatabase();
  });

  async function login(email: string, password: string): Promise<string> {
    const res = await request(baseUrl)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    const token = cookies.find((c) => c.startsWith('salon_token='));
    expect(token).toBeDefined();
    return token!.split(';')[0];
  }

  function body(slot: Slot, overrides: Record<string, unknown> = {}) {
    return {
      serviceIds: [serviceId],
      staffId: annaId,
      startsAt: slot.startsAt,
      fullName: 'Integration Kund',
      email: CUSTOMER_EMAIL,
      phone: '+46 70 123 45 67',
      ...overrides,
    };
  }

  // -------------------------------------------------------------------------
  // Authentication & RBAC
  // -------------------------------------------------------------------------
  describe('auth & RBAC', () => {
    it('logs in an admin and sets an HTTP-only cookie', async () => {
      const res = await request(baseUrl)
        .post('/api/auth/login')
        .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
        .expect(200);
      expect(res.body.user.role).toBe('ADMIN');
      const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
        c.startsWith('salon_token='),
      );
      expect(cookie).toMatch(/HttpOnly/i);
    });

    it('rejects a wrong password with 401', async () => {
      await request(baseUrl)
        .post('/api/auth/login')
        .send({ email: process.env.ADMIN_EMAIL, password: 'definitely-wrong-password' })
        .expect(401);
    });

    it('rejects an unknown email with 401', async () => {
      await request(baseUrl)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'whatever12345' })
        .expect(401);
    });

    it('rejects an invalid login body with 400', async () => {
      await request(baseUrl)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'short' })
        .expect(400);
    });

    it('requires authentication for /auth/me (401)', async () => {
      await request(baseUrl).get('/api/auth/me').expect(401);
    });

    it('returns the current admin for a valid cookie', async () => {
      const res = await request(baseUrl).get('/api/auth/me').set('Cookie', adminCookie).expect(200);
      expect(res.body.role).toBe('ADMIN');
    });

    it('blocks unauthenticated access to admin appointments (401)', async () => {
      await request(baseUrl).get('/api/admin/appointments').expect(401);
    });

    it('allows STAFF to read appointments (200)', async () => {
      await request(baseUrl).get('/api/admin/appointments').set('Cookie', staffCookie).expect(200);
    });

    it('allows ADMIN on an ADMIN-only route (200)', async () => {
      await request(baseUrl).get('/api/admin/users').set('Cookie', adminCookie).expect(200);
    });

    it('forbids STAFF on an ADMIN-only route (403)', async () => {
      await request(baseUrl).get('/api/admin/users').set('Cookie', staffCookie).expect(403);
    });

    it('rejects a tampered token (401)', async () => {
      await request(baseUrl)
        .get('/api/auth/me')
        .set('Cookie', 'salon_token=not.a.validjwt')
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // Availability
  // -------------------------------------------------------------------------
  describe('availability', () => {
    it('returns bookable dates within the window', async () => {
      const res = await request(baseUrl)
        .get('/api/public/availability/dates')
        .query({ serviceIds: serviceId })
        .expect(200);
      expect(Array.isArray(res.body.dates)).toBe(true);
      expect(res.body.dates.length).toBeGreaterThan(0);
    });

    it('returns real slots with 24h local times', async () => {
      const res = await request(baseUrl)
        .get('/api/public/availability/slots')
        .query({ serviceIds: serviceId, date: slots[0].startsAt.slice(0, 10), staffId: annaId })
        .expect(200);
      expect(res.body.slots.length).toBeGreaterThan(0);
      for (const slot of res.body.slots as Slot[]) {
        expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
        expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
        expect(new Date(slot.endsAt).getTime()).toBeGreaterThan(new Date(slot.startsAt).getTime());
      }
    });

    it('rejects a past date (400)', async () => {
      await request(baseUrl)
        .get('/api/public/availability/slots')
        .query({ serviceIds: serviceId, date: '2020-01-01' })
        .expect(400);
    });

    it('rejects a malformed date (400)', async () => {
      await request(baseUrl)
        .get('/api/public/availability/slots')
        .query({ serviceIds: serviceId, date: '01-01-2024' })
        .expect(400);
    });

    it('rejects an unknown service (400)', async () => {
      const future = slots[0].startsAt.slice(0, 10);
      await request(baseUrl)
        .get('/api/public/availability/slots')
        .query({ serviceIds: 'nonexistent-service-id', date: future })
        .expect(400);
    });

    it('requires at least one service (400)', async () => {
      await request(baseUrl).get('/api/public/availability/dates').expect(400);
    });
  });

  // -------------------------------------------------------------------------
  // Booking engine
  // -------------------------------------------------------------------------
  describe('booking', () => {
    it('books a public appointment without an account (201)', async () => {
      const res = await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[0]))
        .expect(201);
      expect(res.body.bookingReference).toMatch(/^SLN-[A-Z0-9]{8}$/);
      expect(res.body.status).toBe('CONFIRMED');
      expect(res.body.source).toBe('ONLINE');
      expect(typeof res.body.totalPrice).toBe('string');
      happyReference = res.body.bookingReference;
    });

    it('prevents sequential double-booking of the same slot (400/409)', async () => {
      await request(baseUrl).post('/api/public/appointments').send(body(slots[7])).expect(201);
      const res = await request(baseUrl).post('/api/public/appointments').send(body(slots[7]));
      expect([400, 409]).toContain(res.status);
    });

    it('serializes concurrent bookings so exactly one wins', async () => {
      const attempts = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(baseUrl).post('/api/public/appointments').send(body(slots[1])),
        ),
      );
      const created = attempts.filter((r) => r.status === 201);
      const rejected = attempts.filter((r) => r.status === 400 || r.status === 409);
      expect(created).toHaveLength(1);
      expect(rejected).toHaveLength(4);
      const rows = await Appointment.count({
        where: {
          staffId: annaId,
          startsAt: new Date(slots[1].startsAt),
          status: { [Op.ne]: 'CANCELLED' },
        },
      });
      expect(rows).toBe(1);
    });

    it('frees the slot when an appointment is cancelled', async () => {
      const created = await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[2]))
        .expect(201);
      await request(baseUrl)
        .post(`/api/admin/appointments/${created.body.id}/cancel`)
        .set('Cookie', adminCookie)
        .send({ reason: 'Kunden avbokade' })
        .expect(201);
      // Same slot is bookable again after cancellation.
      await request(baseUrl).post('/api/public/appointments').send(body(slots[2])).expect(201);
    });

    it('reschedules with revalidation and releases the old slot', async () => {
      const created = await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[3]))
        .expect(201);
      const res = await request(baseUrl)
        .patch(`/api/admin/appointments/${created.body.id}/reschedule`)
        .set('Cookie', adminCookie)
        .send({ startsAt: slots[4].startsAt, staffId: annaId })
        .expect(200);
      expect(new Date(res.body.startsAt).toISOString()).toBe(new Date(slots[4].startsAt).toISOString());
      // Old time is free again.
      await request(baseUrl).post('/api/public/appointments').send(body(slots[3])).expect(201);
    });

    it('enforces status transition rules', async () => {
      const created = await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[5]))
        .expect(201);
      await request(baseUrl)
        .patch(`/api/admin/appointments/${created.body.id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'COMPLETED' })
        .expect(200);
      // COMPLETED is terminal — cannot go back to CONFIRMED.
      await request(baseUrl)
        .patch(`/api/admin/appointments/${created.body.id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'CONFIRMED' })
        .expect(400);
    });

    it('creates a manual phone booking as STAFF (201)', async () => {
      const res = await request(baseUrl)
        .post('/api/admin/appointments')
        .set('Cookie', staffCookie)
        .send(body(slots[6], { source: 'PHONE', fullName: 'Telefon Kund' }))
        .expect(201);
      expect(res.body.source).toBe('PHONE');
    });

    it('rejects a booking in the past (400)', async () => {
      await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[0], { startsAt: '2020-01-01T10:00:00.000Z' }))
        .expect(400);
    });

    it('rejects an invalid email (400)', async () => {
      await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[0], { email: 'bad-email' }))
        .expect(400);
    });

    it('rejects an empty service list (400)', async () => {
      await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[0], { serviceIds: [] }))
        .expect(400);
    });

    it('looks up a booking by reference + email, hiding it on mismatch', async () => {
      const ok = await request(baseUrl)
        .get(`/api/public/appointments/reference/${happyReference}`)
        .query({ email: CUSTOMER_EMAIL })
        .expect(200);
      expect(ok.body.bookingReference).toBe(happyReference);
      await request(baseUrl)
        .get(`/api/public/appointments/reference/${happyReference}`)
        .query({ email: 'wrong@example.com' })
        .expect(404);
    });

    it('finds the booking through the admin search filter', async () => {
      const res = await request(baseUrl)
        .get('/api/admin/appointments')
        .query({ search: happyReference })
        .set('Cookie', adminCookie)
        .expect(200);
      expect(res.body.data.some((a: { bookingReference: string }) => a.bookingReference === happyReference)).toBe(true);
    });

    it('feeds new online bookings to the admin alert endpoint but not manual ones', async () => {
      const since = new Date(Date.now() - 2000).toISOString();
      const online = await request(baseUrl)
        .post('/api/public/appointments')
        .send(body(slots[8]))
        .expect(201);

      const feed = await request(baseUrl)
        .get('/api/admin/appointments/notifications')
        .query({ since })
        .set('Cookie', adminCookie)
        .expect(200);
      const entry = feed.body.items.find((item: { id: string }) => item.id === online.body.id);
      expect(entry).toBeDefined();
      expect(entry.staffName).toBe(online.body.staff.name);
      expect(entry.customerName).toBe('Integration Kund');

      // A different day avoids colliding with the slots used above.
      const datesRes = await request(baseUrl)
        .get('/api/public/availability/dates')
        .query({ serviceIds: serviceId, staffId: annaId })
        .expect(200);
      const otherDate: string = datesRes.body.dates[datesRes.body.dates.length - 1];
      const otherSlots = await request(baseUrl)
        .get('/api/public/availability/slots')
        .query({ serviceIds: serviceId, date: otherDate, staffId: annaId })
        .expect(200);

      const manualSince = new Date(Date.now() - 1000).toISOString();
      const manual = await request(baseUrl)
        .post('/api/admin/appointments')
        .set('Cookie', adminCookie)
        .send({
          serviceIds: [serviceId],
          staffId: annaId,
          startsAt: otherSlots.body.slots[0].startsAt,
          fullName: 'Telefon Kund 2',
          email: 'telefon.kund@example.com',
          phone: '+46 70 000 00 00',
          source: 'PHONE',
        })
        .expect(201);

      const after = await request(baseUrl)
        .get('/api/admin/appointments/notifications')
        .query({ since: manualSince })
        .set('Cookie', adminCookie)
        .expect(200);
      expect(after.body.items.some((item: { id: string }) => item.id === manual.body.id)).toBe(false);

      await request(baseUrl)
        .get('/api/admin/appointments/notifications')
        .query({ since })
        .expect(401);
    });
  });

  describe('gdpr retention', () => {
    it('anonymises inactive customers and purges old operational logs', async () => {
      const db = app.locals.database as DatabaseService;
      const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

      const oldContact = await ContactMessage.create({
        name: 'Gammal Kontakt',
        email: 'gammal.kontakt@example.com',
        phone: null,
        message: 'Hej',
        handled: true,
      });
      const recentContact = await ContactMessage.create({
        name: 'Ny Kontakt',
        email: 'ny.kontakt@example.com',
        phone: null,
        message: 'Hej igen',
        handled: true,
      });
      await db.query('UPDATE `ContactMessage` SET `createdAt` = :old WHERE `id` = :id', {
        replacements: { old, id: oldContact.id },
      });

      const oldNotification = await EmailNotification.create({
        appointmentId: null,
        type: NotificationType.BOOKING_CONFIRMATION,
        status: NotificationStatus.SENT,
        toEmail: 'gammal.kontakt@example.com',
        subject: 'Bokning',
        htmlBody: '<p>Hej</p>',
        attempts: 1,
        sentAt: old,
      });
      const recentNotification = await EmailNotification.create({
        appointmentId: null,
        type: NotificationType.BOOKING_CONFIRMATION,
        status: NotificationStatus.SENT,
        toEmail: 'ny.kontakt@example.com',
        subject: 'Bokning',
        htmlBody: '<p>Hej igen</p>',
        attempts: 1,
        sentAt: new Date(),
      });
      await db.query('UPDATE `EmailNotification` SET `createdAt` = :old WHERE `id` = :id', {
        replacements: { old, id: oldNotification.id },
      });

      const inactive = await Customer.create({
        fullName: 'Inaktiv Kund',
        email: 'inaktiv.kund@example.com',
        phone: '-',
        notes: null,
        marketingConsent: false,
      });
      const subscriber = await Customer.create({
        fullName: 'Nyhetsbrev Kund',
        email: 'nyhetsbrev.kund@example.com',
        phone: '-',
        notes: null,
        marketingConsent: true,
      });
      const active = await Customer.findOne({ where: { email: CUSTOMER_EMAIL } });
      expect(active).not.toBeNull();

      const result = await (app.locals.retention as RetentionService).run();

      expect(await ContactMessage.findByPk(oldContact.id)).toBeNull();
      expect(await ContactMessage.findByPk(recentContact.id)).not.toBeNull();
      expect(await EmailNotification.findByPk(oldNotification.id)).toBeNull();
      expect(await EmailNotification.findByPk(recentNotification.id)).not.toBeNull();

      const anonymised = await Customer.findByPk(inactive.id);
      expect(anonymised?.fullName).toBe('Anonymized customer');
      expect(anonymised?.email).toBe(`anonymized-${inactive.id}@removed.local`);

      // Opted-in contacts and customers with a booking inside the window stay intact.
      expect((await Customer.findByPk(subscriber.id))?.email).toBe('nyhetsbrev.kund@example.com');
      expect((await Customer.findByPk(active!.id))?.email).toBe(CUSTOMER_EMAIL);

      expect(result.customersAnonymised).toBeGreaterThanOrEqual(1);
      expect(result.contactMessagesDeleted).toBeGreaterThanOrEqual(1);
      expect(result.notificationLogsDeleted).toBeGreaterThanOrEqual(1);
    });
  });
});