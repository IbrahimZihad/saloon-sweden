import { Testimonial } from '../models';

const TESTIMONIALS = [
  {
    authorName: 'Karin S.',
    textSv: 'Bästa salongen jag besökt i Stockholm. Anna förstod exakt vad jag ville ha och resultatet blev fantastiskt.',
    textEn: 'The best salon I have visited in Stockholm. Anna understood exactly what I wanted and the result was fantastic.',
    rating: 5,
    sortOrder: 1,
  },
  {
    authorName: 'Johan L.',
    textSv: 'Proffsigt bemötande från första stund. Enkelt att boka online och alltid lika nöjd efter klippningen.',
    textEn: 'Professional from the first moment. Easy to book online and always happy after my cut.',
    rating: 5,
    sortOrder: 2,
  },
  {
    authorName: 'Maria E.',
    textSv: 'Emma trollar med färger! Mina slingor har aldrig sett så naturliga ut. Varmt rekommenderat.',
    textEn: 'Emma works magic with color! My highlights have never looked this natural. Highly recommended.',
    rating: 5,
    sortOrder: 3,
  },
];

export async function seedTestimonials(): Promise<void> {
  for (const testimonial of TESTIMONIALS) {
    await Testimonial.findOrCreate({
      where: { authorName: testimonial.authorName },
      defaults: testimonial,
    });
  }
  console.log(`[seed] ${TESTIMONIALS.length} sample testimonials ready (fictional).`);
}
