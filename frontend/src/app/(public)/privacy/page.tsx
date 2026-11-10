import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Integritetspolicy',
  description: 'Så hanterar vi dina personuppgifter — integritetspolicy enligt GDPR.',
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}