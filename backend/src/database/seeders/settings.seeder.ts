import { BusinessSettings } from '../models';

export async function seedSettings(): Promise<void> {
  const existing = await BusinessSettings.findByPk('singleton');
  if (existing) {
    console.log('[seed] Business settings already exist — left untouched.');
    return;
  }

  await BusinessSettings.create({
    id: 'singleton',
    salonName: 'Min Salong',
    descriptionSv:
      'En premium salong i hjärtat av stan. Vi kombinerar skandinavisk enkelhet med hantverk i världsklass — välkommen till en stund för dig själv.',
    descriptionEn:
      'A premium salon in the heart of the city. We combine Scandinavian simplicity with world-class craftsmanship — welcome to a moment just for you.',
    // Demo contact details — replace via Admin → Settings before going live.
    address: 'Storgatan 1',
    postalCode: '111 22',
    city: 'Stockholm',
    country: 'Sweden',
    phone: '+46 8 123 45 67',
    email: 'hello@minsalong.se',
    mapEmbedUrl: null,
    instagramUrl: null,
    facebookUrl: null,
    tiktokUrl: null,
    currency: 'SEK',
    timezone: 'Europe/Stockholm',
    defaultLanguage: 'sv',
    secondaryLanguage: 'en',
    appointmentIntervalMinutes: 15,
    minBookingNoticeMinutes: 120,
    maxAdvanceBookingDays: 60,
    pendingReservesTime: true,
    cancellationPolicySv:
      'Avbokning ska ske senast 24 timmar innan din bokade tid. Vid sen avbokning eller uteblivet besök kan vi debitera 50 % av behandlingens pris.',
    cancellationPolicyEn:
      'Please cancel at least 24 hours before your appointment. Late cancellations or no-shows may be charged 50% of the service price.',
  });
  console.log('[seed] Created default business settings (demo contact details — replace before going live).');
}
