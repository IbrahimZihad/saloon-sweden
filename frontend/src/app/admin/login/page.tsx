'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import { authApi, ApiError } from '@/lib/api';

export default function AdminLoginPage() {
  const { user, loading, login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace('/admin');
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inloggningen misslyckades.');
      setBusy(false);
    }
  };

  const sendForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setForgotMsg(null);
    try {
      const res = await authApi.forgotPassword(email);
      setForgotMsg(res.message ?? 'Om kontot finns skickas en återställningslänk till din e-post.');
    } catch {
      setForgotMsg('Om kontot finns skickas en återställningslänk till din e-post.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center border border-gold/40 bg-ivory text-gold-dark">
            <Lock size={22} strokeWidth={1.4} />
          </span>
          <h1 className="mt-6 font-serif text-4xl text-ink">Personalinloggning</h1>
          <p className="mt-2 text-sm text-stone">Logga in för att hantera bokningar och innehåll.</p>
        </div>

        <div className="border border-line bg-ivory p-8">
          {forgot ? (
            <form onSubmit={sendForgot} className="space-y-5">
              <div>
                <label className="field-label" htmlFor="f-email">E-post</label>
                <input id="f-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {forgotMsg && <p className="text-sm text-stone">{forgotMsg}</p>}
              <button type="submit" disabled={busy} className="btn btn-primary w-full">
                {busy && <Loader2 size={15} className="animate-spin" />}
                Skicka återställningslänk
              </button>
              <button type="button" onClick={() => setForgot(false)} className="btn btn-ghost w-full">
                Tillbaka till inloggning
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="field-label" htmlFor="email">E-post</label>
                <input id="email" type="email" required autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="field-label" htmlFor="password">Lösenord</label>
                <input id="password" type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="field-error">{error}</p>}
              <button type="submit" disabled={busy} className="btn btn-primary w-full">
                {busy && <Loader2 size={15} className="animate-spin" />}
                Logga in
              </button>
              <button type="button" onClick={() => setForgot(true)} className="btn btn-ghost w-full !text-xs">
                Glömt lösenord?
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-stone-light">
          <Link href="/" className="link-underline">Tillbaka till webbplatsen</Link>
        </p>
      </div>
    </div>
  );
}