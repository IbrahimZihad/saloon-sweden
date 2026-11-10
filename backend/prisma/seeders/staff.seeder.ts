import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Fictional staff profiles for development/demonstration.
const STAFF = [
  {
    slug: 'anna',
    name: 'Anna Lindqvist',
    email: 'anna@example.com',
    phone: '+46 70 000 00 01',
    jobTitle: 'Senior Hair Stylist',
    bioSv: 'Anna har över 15 års erfarenhet och älskar klassiska klippningar med en modern twist.',
    bioEn: 'Anna has over 15 years of experience and loves classic cuts with a modern twist.',
    serviceSlugs: [
      'womens-haircut',
      'mens-haircut',
      'childrens-haircut',
      'wash-blow-dry',
      'hair-styling',
      'hair-treatment',
      'deep-conditioning',
    ],
    workingHours: [
      { dayOfWeek: 0, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 1, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 2, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 3, startMinutes: 540, endMinutes: 1200 },
      { dayOfWeek: 4, startMinutes: 540, endMinutes: 1080 },
    ],
  },
  {
    slug: 'emma',
    name: 'Emma Bergström',
    email: 'emma@example.com',
    phone: '+46 70 000 00 02',
    jobTitle: 'Hair Color Specialist',
    bioSv: 'Emma är vår färgexpert och skapar allt från naturliga slingor till djärva förändringar.',
    bioEn: 'Emma is our color expert, creating everything from natural highlights to bold transformations.',
    serviceSlugs: [
      'root-coloring',
      'full-hair-coloring',
      'highlights',
      'hair-treatment',
      'deep-conditioning',
      'wash-blow-dry',
    ],
    workingHours: [
      { dayOfWeek: 0, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 1, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 2, startMinutes: 600, endMinutes: 1200 },
      { dayOfWeek: 3, startMinutes: 540, endMinutes: 1200 },
      { dayOfWeek: 4, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 5, startMinutes: 600, endMinutes: 960 },
    ],
  },
  {
    slug: 'sofia',
    name: 'Sofia Nilsson',
    email: 'sofia@example.com',
    phone: '+46 70 000 00 03',
    jobTitle: 'Hair Stylist',
    bioSv: 'Sofia brinner för styling, föning och klippningar som får dig att känna dig som dig själv — fast bättre.',
    bioEn: 'Sofia is passionate about styling, blow-dries and cuts that make you feel like yourself — only better.',
    serviceSlugs: [
      'womens-haircut',
      'mens-haircut',
      'childrens-haircut',
      'wash-blow-dry',
      'hair-styling',
      'deep-conditioning',
    ],
    workingHours: [
      { dayOfWeek: 1, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 2, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 3, startMinutes: 540, endMinutes: 1200 },
      { dayOfWeek: 4, startMinutes: 540, endMinutes: 1080 },
      { dayOfWeek: 5, startMinutes: 600, endMinutes: 960 },
    ],
  },
];

export async function seedStaff(prisma: PrismaClient): Promise<void> {
  for (const member of STAFF) {
    const { serviceSlugs, workingHours, bioSv, bioEn, ...data } = member;

    const staff = await prisma.staff.upsert({
      where: { slug: member.slug },
      update: {},
      create: { ...data, bio: bioSv, active: true },
    });

    // Optional staff login account (role STAFF) so schedule views can be tested.
    const existingUser = await prisma.user.findUnique({ where: { email: member.email } });
    if (!existingUser) {
      const passwordHash = await hash(process.env.STAFF_DEMO_PASSWORD ?? 'StaffDemo123!', 12);
      const user = await prisma.user.create({
        data: {
          email: member.email,
          name: member.name,
          passwordHash,
          role: 'STAFF',
          active: true,
        },
      });
      await prisma.staff.update({ where: { id: staff.id }, data: { userId: user.id } });
    } else if (!staff.userId) {
      await prisma.staff.update({ where: { id: staff.id }, data: { userId: existingUser.id } });
    }

    for (const slug of serviceSlugs) {
      const service = await prisma.service.findUnique({ where: { slug } });
      if (!service) continue;
      await prisma.staffService.upsert({
        where: { staffId_serviceId: { staffId: staff.id, serviceId: service.id } },
        update: {},
        create: { staffId: staff.id, serviceId: service.id },
      });
    }

    for (const hours of workingHours) {
      await prisma.staffWorkingHours.upsert({
        where: { staffId_dayOfWeek: { staffId: staff.id, dayOfWeek: hours.dayOfWeek } },
        update: {},
        create: { staffId: staff.id, ...hours },
      });
    }

    // Lunch break 13:00-14:00 on every working day (idempotent per staff/day).
    for (const hours of workingHours) {
      const existing = await prisma.staffBreak.findFirst({
        where: { staffId: staff.id, dayOfWeek: hours.dayOfWeek, startMinutes: 780, endMinutes: 840 },
      });
      if (!existing) {
        await prisma.staffBreak.create({
          data: {
            staffId: staff.id,
            dayOfWeek: hours.dayOfWeek,
            startMinutes: 780,
            endMinutes: 840,
            label: 'Lunch',
          },
        });
      }
    }
  }
  console.log(`[seed] ${STAFF.length} staff members ready with services, schedules and lunch breaks.`);
}