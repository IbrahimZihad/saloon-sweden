import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginated, skipTake } from '../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...skipTake(page, limit),
        include: {
          _count: { select: { appointments: true } },
          appointments: {
            where: { status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] } },
            orderBy: { startsAt: 'desc' },
            take: 1,
            select: { startsAt: true, status: true },
          },
        },
      }),
    ]);

    const data = customers.map((customer) => ({
      ...customer,
      appointmentCount: customer._count.appointments,
      isReturning: customer._count.appointments > 1,
      lastAppointment: customer.appointments[0] ?? null,
      _count: undefined,
      appointments: undefined,
    }));
    return paginated(data, total, page, limit);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startsAt: 'desc' },
          include: {
            staff: { select: { id: true, name: true } },
            services: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  /** GDPR: machine-readable export of everything held about a customer. */
  async exportData(id: string) {
    const customer = await this.findOne(id);
    return {
      exportedAt: new Date().toISOString(),
      customer: {
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        createdAt: customer.createdAt,
      },
      appointments: customer.appointments.map((appointment) => ({
        bookingReference: appointment.bookingReference,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        source: appointment.source,
        staffName: appointment.staff.name,
        services: appointment.services.map((s) => ({
          name: s.serviceNameSv,
          durationMinutes: s.durationMinutes,
          price: s.price,
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
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.updateMany({
        where: { customerId: id },
        data: { customerNotes: null, internalNotes: null },
      });
      await tx.emailNotification.updateMany({
        where: { appointment: { customerId: id } },
        data: { toEmail: 'anonymized@removed.local', htmlBody: '', lastError: null },
      });
      await tx.customer.update({
        where: { id },
        data: {
          fullName: 'Anonymized customer',
          email: `anonymized-${id}@removed.local`,
          phone: '-',
          notes: null,
          marketingConsent: false,
        },
      });
    });
    return { message: 'Customer personal data has been erased' };
  }
}