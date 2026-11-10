import type { Language } from './types';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  updated: string;
  sections: LegalSection[];
}

const privacySv: LegalDocument = {
  title: 'Integritetspolicy',
  updated: 'Senast uppdaterad: 2026-11-07',
  sections: [
    {
      heading: '1. Personuppgiftsansvarig',
      paragraphs: [
        'Salongen är personuppgiftsansvarig för behandlingen av de personuppgifter du lämnar till oss via webbplatsen, bokningssystemet eller vid kontakt med oss. Har du frågor om hur vi hanterar dina uppgifter är du välkommen att kontakta oss via de kontaktuppgifter som anges på webbplatsen.',
      ],
    },
    {
      heading: '2. Vilka uppgifter vi samlar in',
      paragraphs: [
        'När du bokar en tid samlar vi in namn, e-postadress och telefonnummer samt uppgifter om bokningen (tjänst, stylist, datum och tid). Eventuella frivilliga anteckningar du lämnar, till exempel om allergier eller önskemål, sparas tillsammans med bokningen.',
        'När du använder kontaktformuläret samlar vi in namn, e-postadress, eventuellt telefonnummer och ditt meddelande.',
        'Vi samlar inte in känsliga personuppgifter om du inte själv lämnar sådana i fritextfält. Undvik därför att ange hälsouppgifter i onödan.',
      ],
    },
    {
      heading: '3. Ändamål och rättslig grund',
      paragraphs: [
        'Vi behandlar dina uppgifter för att kunna administrera och bekräfta din bokning, skicka bekräftelse och påminnelser, samt för att kunna kontakta dig vid behov av ombokning eller avbokning. Den rättsliga grunden är fullgörande av avtal (bokningen).',
        'Kontaktmeddelanden behandlas för att besvara din förfrågan, med rättslig grund berättigat intresse eller avtal beroende på ärendets art.',
        'Boknings- och betalningsunderlag sparas även för att uppfylla bokföringsmässiga skyldigheter (rättslig förpliktelse).',
      ],
    },
    {
      heading: '4. Cookies',
      paragraphs: [
        'Webbplatsen använder endast nödvändiga cookies för att sidan ska fungera, till exempel för att komma ihåg ditt språkval och ditt cookie-samtycke. Om du godkänner alla cookies kan vi även använda analyscookies för att förstå hur webbplatsen används och förbättra den.',
        'Du kan när som helst ändra eller återkalla ditt samtycke genom att rensa webbplatsens lagrade data i din webbläsare. Nödvändiga cookies kan inte stängas av eftersom de krävs för grundläggande funktioner.',
      ],
    },
    {
      heading: '5. Lagring och gallring',
      paragraphs: [
        'Vi sparar dina uppgifter endast så länge det är nödvändigt för de ändamål de samlades in för. Bokningsuppgifter gallras löpande när de inte längre behövs för administration eller reklamation, medan underlag som krävs för bokföring sparas i den tid bokföringslagen anger.',
        'Kontaktmeddelanden raderas när ärendet är avslutat och inte längre behövs.',
      ],
    },
    {
      heading: '6. Dina rättigheter',
      paragraphs: [
        'Du har rätt att begära registerutdrag över de uppgifter vi behandlar om dig, rättelse av felaktiga uppgifter, radering (“rätten att bli bortglömd”), begränsning av behandling samt dataportabilitet. Du har även rätt att invända mot behandling som grundar sig på berättigat intresse.',
        'Kontakta oss för att utöva dina rättigheter. Vi svarar inom den tid som följer av dataskyddsförordningen (GDPR).',
      ],
    },
    {
      heading: '7. Delning och överföring',
      paragraphs: [
        'Vi säljer aldrig dina personuppgifter. Uppgifter kan delas med personuppgiftsbiträden som hjälper oss att driva verksamheten, till exempel leverantörer av e-postutskick och hosting. Sådana biträden är bundna av avtal som säkerställer en skyddsnivå i enlighet med GDPR.',
        'Vi strävar efter att behandla uppgifter inom EU/EES. Om överföring utanför EU/EES sker säkerställer vi lämpliga skyddsåtgärder.',
      ],
    },
    {
      heading: '8. Klagomål',
      paragraphs: [
        'Om du anser att vi behandlar dina personuppgifter felaktigt har du rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY), som är tillsynsmyndighet i Sverige.',
      ],
    },
  ],
};

const privacyEn: LegalDocument = {
  title: 'Privacy policy',
  updated: 'Last updated: 2026-11-07',
  sections: [
    {
      heading: '1. Data controller',
      paragraphs: [
        'The salon is the data controller for the personal data you provide via the website, the booking system or when contacting us. If you have questions about how we handle your data, please contact us using the details on the website.',
      ],
    },
    {
      heading: '2. Data we collect',
      paragraphs: [
        'When you book an appointment we collect your name, email address and phone number, together with booking details (service, stylist, date and time). Any optional notes you provide, for example about allergies or preferences, are stored with the booking.',
        'When you use the contact form we collect your name, email address, optional phone number and your message.',
        'We do not collect special-category data unless you provide it yourself in free-text fields. Please avoid entering health information unnecessarily.',
      ],
    },
    {
      heading: '3. Purpose and legal basis',
      paragraphs: [
        'We process your data to administer and confirm your booking, send confirmations and reminders, and to contact you if a reschedule or cancellation is needed. The legal basis is performance of a contract (the booking).',
        'Contact messages are processed to answer your enquiry, based on legitimate interest or contract depending on the nature of the matter.',
        'Booking and payment records are also retained to comply with accounting obligations (legal obligation).',
      ],
    },
    {
      heading: '4. Cookies',
      paragraphs: [
        'The website uses only essential cookies required for it to function, for example to remember your language choice and cookie consent. If you accept all cookies we may also use analytics cookies to understand how the site is used and improve it.',
        'You can change or withdraw your consent at any time by clearing the site’s stored data in your browser. Essential cookies cannot be disabled as they are required for basic functionality.',
      ],
    },
    {
      heading: '5. Retention',
      paragraphs: [
        'We keep your data only as long as necessary for the purposes it was collected for. Booking data is routinely deleted when no longer needed for administration or claims, while records required for accounting are kept for the period prescribed by bookkeeping law.',
        'Contact messages are deleted once the matter is closed and no longer needed.',
      ],
    },
    {
      heading: '6. Your rights',
      paragraphs: [
        'You have the right to request an extract of the data we process about you, rectification of inaccurate data, erasure (the “right to be forgotten”), restriction of processing and data portability. You also have the right to object to processing based on legitimate interest.',
        'Contact us to exercise your rights. We respond within the timeframe set by the General Data Protection Regulation (GDPR).',
      ],
    },
    {
      heading: '7. Sharing and transfers',
      paragraphs: [
        'We never sell your personal data. Data may be shared with processors that help us run the business, such as email-delivery and hosting providers. Such processors are bound by contracts ensuring a level of protection compliant with the GDPR.',
        'We aim to process data within the EU/EEA. If a transfer outside the EU/EEA occurs we ensure appropriate safeguards.',
      ],
    },
    {
      heading: '8. Complaints',
      paragraphs: [
        'If you believe we process your personal data incorrectly you have the right to lodge a complaint with the Swedish Authority for Privacy Protection (IMY), the supervisory authority in Sweden.',
      ],
    },
  ],
};

const termsSv: LegalDocument = {
  title: 'Allmänna villkor',
  updated: 'Senast uppdaterad: 2026-11-07',
  sections: [
    {
      heading: '1. Bokning',
      paragraphs: [
        'Bokning sker via webbplatsens onlinebokning eller via telefon. En bokning är bindande när den bekräftats och du fått en bokningsreferens. Uppge alltid korrekt kontaktinformation så att vi kan nå dig.',
        'Du ansvarar för att de uppgifter du lämnar är riktiga. Bokningen avser den tjänst, stylist och tid som anges i bekräftelsen.',
      ],
    },
    {
      heading: '2. Priser och betalning',
      paragraphs: [
        'Alla priser anges i svenska kronor (SEK) inklusive moms. Slutligt pris kan justeras om behandlingens omfattning ändras i samråd med dig på plats.',
        'Betalning sker i salongen om inget annat avtalats. Vi förbehåller oss rätten att ändra priser; vid bokningstillfället gällande pris gäller för din bokning.',
      ],
    },
    {
      heading: '3. Avbokning och ombokning',
      paragraphs: [
        'Avbokning eller ombokning bör ske senast 24 timmar före bokad tid via telefon eller e-post. Vid sen avbokning eller uteblivet besök kan vi debitera en avgift motsvarande en del av behandlingens pris.',
        'Avbokade tider frigörs automatiskt i bokningssystemet och blir tillgängliga för andra kunder.',
      ],
    },
    {
      heading: '4. Förseningar',
      paragraphs: [
        'Kom i god tid före din bokning. Vid försening kan behandlingens längd behöva kortas för att inte påverka efterföljande kunder, eller så kan bokningen behöva bokas om.',
      ],
    },
    {
      heading: '5. Ansvar',
      paragraphs: [
        'Vi utför alla behandlingar med yrkesmässig omsorg. Informera alltid din stylist om allergier, känslighet eller tidigare reaktioner innan behandling påbörjas.',
        'Vi ansvarar inte för resultat som avviker från önskemål när dessa inte tydligt kommunicerats, eller för skador som uppstår till följd av felaktiga eller undanhållna uppgifter från kund.',
      ],
    },
    {
      heading: '6. Ändringar och tillämplig lag',
      paragraphs: [
        'Vi kan uppdatera dessa villkor. Den version som publiceras på webbplatsen vid bokningstillfället gäller. Svensk lag tillämpas på dessa villkor.',
      ],
    },
  ],
};

const termsEn: LegalDocument = {
  title: 'Terms & conditions',
  updated: 'Last updated: 2026-11-07',
  sections: [
    {
      heading: '1. Booking',
      paragraphs: [
        'Bookings are made via the website’s online booking or by phone. A booking is binding once confirmed and you have received a booking reference. Always provide correct contact information so we can reach you.',
        'You are responsible for the accuracy of the information you provide. The booking covers the service, stylist and time stated in the confirmation.',
      ],
    },
    {
      heading: '2. Prices and payment',
      paragraphs: [
        'All prices are in Swedish kronor (SEK) including VAT. The final price may be adjusted if the scope of the treatment changes in consultation with you on site.',
        'Payment is made at the salon unless otherwise agreed. We reserve the right to change prices; the price in effect at the time of booking applies to your booking.',
      ],
    },
    {
      heading: '3. Cancellation and rescheduling',
      paragraphs: [
        'Cancellation or rescheduling should be made no later than 24 hours before the booked time, by phone or email. For late cancellation or a no-show we may charge a fee corresponding to part of the treatment price.',
        'Cancelled times are automatically released in the booking system and become available to other clients.',
      ],
    },
    {
      heading: '4. Late arrival',
      paragraphs: [
        'Please arrive in good time before your booking. If you are late the treatment length may need to be shortened so as not to affect subsequent clients, or the booking may need to be rescheduled.',
      ],
    },
    {
      heading: '5. Liability',
      paragraphs: [
        'We perform all treatments with professional care. Always inform your stylist of allergies, sensitivities or previous reactions before a treatment begins.',
        'We are not liable for results that differ from wishes that were not clearly communicated, or for damage arising from incorrect or withheld information from the client.',
      ],
    },
    {
      heading: '6. Changes and governing law',
      paragraphs: [
        'We may update these terms. The version published on the website at the time of booking applies. Swedish law governs these terms.',
      ],
    },
  ],
};

export const legalDocuments: Record<'privacy' | 'terms', Record<Language, LegalDocument>> = {
  privacy: { sv: privacySv, en: privacyEn },
  terms: { sv: termsSv, en: termsEn },
};