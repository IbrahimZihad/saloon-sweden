import { z } from 'zod';

export const detailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Ange ditt namn / Enter your name').max(160),
  email: z.string().trim().email('Ogiltig e-post / Invalid email').max(190),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,25}$/, 'Ogiltigt telefonnummer / Invalid phone number'),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Du måste godkänna integritetspolicyn / You must accept the privacy policy' }),
  }),
});

export type DetailsForm = z.infer<typeof detailsSchema>;