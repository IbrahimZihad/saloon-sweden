import Decimal from 'decimal.js';
import { Service, ServiceCategory } from '../models';

// Sample prices/durations are placeholders — editable in the admin dashboard.
const SERVICES = [
  {
    slug: 'womens-haircut',
    category: 'haircuts',
    nameSv: 'Damklippning',
    nameEn: "Women's Haircut",
    descriptionSv: 'Klippning anpassad efter ditt hår och din stil, inklusive konsultation och styling.',
    descriptionEn: 'A cut tailored to your hair and style, including consultation and finish.',
    durationMinutes: 60,
    price: '650.00',
  },
  {
    slug: 'mens-haircut',
    category: 'haircuts',
    nameSv: 'Herrklippning',
    nameEn: "Men's Haircut",
    descriptionSv: 'Klassisk eller modern klippning med maskin och sax, inklusive tvätt.',
    descriptionEn: 'Classic or modern clipper-and-scissor cut, including wash.',
    durationMinutes: 30,
    price: '400.00',
  },
  {
    slug: 'childrens-haircut',
    category: 'haircuts',
    nameSv: 'Barnklippning',
    nameEn: "Children's Haircut",
    descriptionSv: 'Trygg och lekfull klippning för barn upp till 12 år.',
    descriptionEn: 'A safe, playful cut for children up to 12 years.',
    durationMinutes: 30,
    price: '300.00',
  },
  {
    slug: 'wash-blow-dry',
    category: 'hair-styling',
    nameSv: 'Tvätt & föning',
    nameEn: 'Hair Wash & Blow Dry',
    descriptionSv: 'Schamponering, balsam och professionell föning för ett fräscht resultat.',
    descriptionEn: 'Shampoo, conditioner and a professional blow-dry for a fresh finish.',
    durationMinutes: 45,
    price: '450.00',
  },
  {
    slug: 'hair-styling',
    category: 'hair-styling',
    nameSv: 'Styling & uppsättning',
    nameEn: 'Hair Styling',
    descriptionSv: 'Styling för fest, bröllop eller vardag — lockar, slätt eller uppsättning.',
    descriptionEn: 'Styling for events, weddings or every day — curls, straight or updo.',
    durationMinutes: 60,
    price: '550.00',
  },
  {
    slug: 'root-coloring',
    category: 'hair-coloring',
    nameSv: 'Bottenfärg',
    nameEn: 'Root Coloring',
    descriptionSv: 'Färgning av utväxten med omsorgsfullt utvald nyans som matchar din längd.',
    descriptionEn: 'Root regrowth color with a carefully matched shade.',
    durationMinutes: 90,
    price: '950.00',
  },
  {
    slug: 'full-hair-coloring',
    category: 'hair-coloring',
    nameSv: 'Helfärg',
    nameEn: 'Full Hair Coloring',
    descriptionSv: 'Genomgående färgning i hela håret för ett jämnt och levande resultat.',
    descriptionEn: 'Full-head color for an even, vibrant result.',
    durationMinutes: 120,
    price: '1500.00',
  },
  {
    slug: 'highlights',
    category: 'hair-coloring',
    nameSv: 'Slingor',
    nameEn: 'Highlights',
    descriptionSv: 'Handmålade eller folieslingor som ger djup och lyster till ditt hår.',
    descriptionEn: 'Hand-painted or foil highlights that add depth and shine.',
    durationMinutes: 150,
    price: '1800.00',
  },
  {
    slug: 'hair-treatment',
    category: 'hair-treatments',
    nameSv: 'Hårinpackning',
    nameEn: 'Hair Treatment',
    descriptionSv: 'Närande behandling som stärker och återfuktar håret på djupet.',
    descriptionEn: 'A nourishing treatment that strengthens and deeply hydrates.',
    durationMinutes: 45,
    price: '600.00',
  },
  {
    slug: 'deep-conditioning',
    category: 'hair-treatments',
    nameSv: 'Djupverkande kur',
    nameEn: 'Deep Conditioning',
    descriptionSv: 'Intensiv kur för torrt eller slitet hår — lämnar håret mjukt och glansigt.',
    descriptionEn: 'Intensive care for dry or damaged hair — soft, glossy results.',
    durationMinutes: 30,
    price: '400.00',
  },
];

export async function seedServices(): Promise<void> {
  let sortOrder = 0;
  for (const service of SERVICES) {
    sortOrder += 1;
    const { category, ...data } = service;
    const parent = await ServiceCategory.findOne({ where: { slug: category } });
    if (!parent) {
      console.warn(`[seed] Skipping service ${service.slug}: category ${category} is missing.`);
      continue;
    }
    await Service.findOrCreate({
      where: { slug: service.slug },
      defaults: {
        ...data,
        nameSv: data.nameSv.trim(),
        price: new Decimal(data.price).toFixed(2),
        sortOrder,
        categoryId: parent.id,
      },
    });
  }
  console.log(`[seed] ${SERVICES.length} sample services ready (placeholder prices in SEK).`);
}
