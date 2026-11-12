import { NotFoundException } from '../common/http-exceptions';
import { Op, WhereOptions, fn, col } from 'sequelize';
import { DatabaseService } from '../database/database.service';
import {
  Appointment,
  AppointmentService,
  Customer,
  EmailNotification,
  Staff,
} from '../database/models';
import { paginated } from '../common/dto/pagination.dto';

export class CustomersService {
  constructor(private readonly database: DatabaseService) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const where: WhereOptions = search
      ? {
          [Op.or]: [
            { fullName: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    const { rows, count } = await Customer.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const ids = rows.map((customer) => customer.id);

    const [countRows, lastRows] = await Promise.all([
      ids.length
        ? (Appointment.findAll({
            attributes: ['customerId', [fn('COUNT', col('id')), 'count']],
            where: { customerId: { [Op.in]: ids } },
            group: ['customerId'],
            raw: true,
          }) as unknown as Promise<Array<{ customerId: string; count: string | number }>>)
        : Promise.resolve([]),
      ids.length
        ? Appointment.findAll({
            where: {
              customerId: { [Op.in]: ids },
              status: { [Op.in]: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
            },
            attributes: ['customerId', 'startsAt', 'status'],
            order: [['startsAt', 'DESC']],
          })
        : Promise.resolve([]),
    ]);

    const countMap = new Map(countRows.map((row) => [row.customerId, Number(row.count)]));
    const lastMap = new Map<string, { startsAt: Date; status: string }>();
    for (const appointment of lastRows) {
      if (!lastMap.has(appointment.customerId)) {
        lastMap.set(appointment.customerId, {
          startsAt: appointment.startsAt,
          status: appointment.status,
        });
      }
    }

    const data = rows.map((customer) => {
      const plain = customer.get({ plain: true }) as Record<string, unknown>;
      const appointmentCount = countMap.get(customer.id) ?? 0;
      return {
        ...plain,
        appointmentCount,
        isReturning: appointmentCount > 1,
        lastAppointment: lastMap.get(customer.id) ?? null,
      };
    });

    return paginated(data, count, page, limit);
  }

  async findOne(id: string) {
    const customer = await Customer.findByPk(id, {
      include: [
        {
          model: Appointment,
          as: 'appointments',
          include: [
            { model: Staff, as: 'staff', attributes: ['id', 'name'] },
            { model: AppointmentService, as: 'services' },
          ],
          order: [['startsAt', 'DESC']],
        },
      ],
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /** GDPR: machine-readable export of everything held about a customer. */
  async exportData(id: string) {
    const customer = await this.findOne(id);
    const plain = customer.get({ plain: true }) as {
      fullName: string;
      email: string;
      phone: string;
      notes: string | null;
      createdAt: Date;
      appointments?: Array<{
        bookingReference: string;
        startsAt: Date;
        endsAt: Date;
        status: string;
        source: string;
        staff?: { name: string };
        services?: Array<{ serviceNameSv: string; durationMinutes: number; price: string }>;
        totalPrice: string;
        customerNotes: string | null;
      }>;
    };

    return {
      exportedAt: new Date().toISOString(),
      customer: {
        fullName: plain.fullName,
        email: plain.email,
        phone: plain.phone,
        notes: plain.notes,
        createdAt: plain.createdAt,
      },
      appointments: (plain.appointments ?? []).map((appointment) => ({
        bookingReference: appointment.bookingReference,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        source: appointment.source,
        staffName: appointment.staff?.name,
        services: (appointment.services ?? []).map((service) => ({
          name: service.serviceNameSv,
          durationMinutes: service.durationMinutes,
          price: service.price,
        })),
        totalPrice: appointment.totalPrice,
        customerNotes: appointment.customerNotes,
      })),
    };
  }

  /**
   * GDPR erasure: anonymizes the customer and scrubs personal data from
   * appointment notes. Appointment rows are kept (with anonymized customer)
   * because they are financial records; the link to a natural person is removed.
   */
  async erase(id: string): Promise<{ message: string }> {
    const customer = await Customer.findByPk(id);
    if (!customer) throw new NotFoundException('Customer not found');

    await this.database.transaction(async (transaction) => {
      const appointments = await Appointment.findAll({
        where: { customerId: id },
        attributes: ['id'],
        transaction,
      });
      const appointmentIds = appointments.map((appointment) => appointment.id);

      await Appointment.update(
        { customerNotes: null, internalNotes: null },
        { where: { customerId: id }, transaction },
      );
      if (appointmentIds.length) {
        await EmailNotification.update(
          { toEmail: 'anonymized@removed.local', htmlBody: '', lastError: null },
          { where: { appointmentId: { [Op.in]: appointmentIds } }, transaction },
        );
      }
      await customer.update(
        {
          fullName: 'Anonymized customer',
          email: `anonymized-${id}@removed.local`,
          phone: '-',
          notes: null,
          marketingConsent: false,
        },
        { transaction },
      );
    });
    return { message: 'Customer personal data has been erased' };
  }
}
