import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Allmänna villkor',
  description: 'Allmänna villkor för bokning, avbokning, priser och betalning.',
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}