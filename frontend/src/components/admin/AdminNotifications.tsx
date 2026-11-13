'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Bell, BellOff, X } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { DEFAULT_TZ, formatLocalTime } from '@/lib/format';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { BookingNotification } from '@/lib/types';

const POLL_INTERVAL_MS = 10_000;
const TOAST_LIFETIME_MS = 20_000;
const MAX_VISIBLE_TOASTS = 4;
const SOUND_STORAGE_KEY = 'salon-admin-announcements';

function swedishVoice(): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith('sv'));
}

/** Reads out a booking in Swedish through the device speakers. */
function announce(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'sv-SE';
  utterance.rate = 0.95;
  const voice = swedishVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

/**
 * Live booking alerts for the admin panel.
 *
 * Polls the lightweight `/admin/appointments/notifications` feed, shows a toast
 * for every new online booking and reads "Ny bokning med {stylist}" aloud.
 * Sound can be muted; the preference is remembered per browser.
 */
export function AdminNotifications() {
  const { lang } = useLanguage();
  const [soundOn, setSoundOn] = useState(true);
  const [toasts, setToasts] = useState<BookingNotification[]>([]);

  const soundRef = useRef(true);
  const cursorRef = useRef(new Date().toISOString());
  const seenRef = useRef(new Set<string>());
  const timersRef = useRef<number[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(SOUND_STORAGE_KEY) === 'off') {
      soundRef.current = false;
      setSoundOn(false);
    }
    // Chrome populates the voice list asynchronously; touching it early warms it up.
    window.speechSynthesis?.getVoices();
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    window.localStorage.setItem(SOUND_STORAGE_KEY, next ? 'on' : 'off');

    if (next) {
      // A click is a user gesture, which lets the browser unlock speech output.
      announce('Röstmeddelanden är påslagna');
    } else {
      window.speechSynthesis?.cancel();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await adminApi.bookingNotifications(cursorRef.current);
        if (cancelled) return;

        const fresh = data.items.filter((item) => !seenRef.current.has(item.id));
        for (const item of fresh) {
          if (seenRef.current.size > 500) {
            const oldest = seenRef.current.values().next().value;
            if (oldest) seenRef.current.delete(oldest);
          }
          seenRef.current.add(item.id);
        }

        const lastCreatedAt = data.items.at(-1)?.createdAt;
        const nextCursor =
          lastCreatedAt && lastCreatedAt > data.serverTime ? lastCreatedAt : data.serverTime;
        if (nextCursor > cursorRef.current) cursorRef.current = nextCursor;

        if (fresh.length === 0) return;

        // Cap the burst so a rush of bookings does not flood the screen or voice.
        const visible = fresh.slice(-3).reverse();
        setToasts((current) => [...visible, ...current].slice(0, MAX_VISIBLE_TOASTS));

        for (const item of visible) {
          const timer = window.setTimeout(() => dismiss(item.id), TOAST_LIFETIME_MS);
          timersRef.current.push(timer);
        }

        if (soundRef.current) {
          for (const item of visible) {
            announce(`Ny bokning med ${item.staffName}`);
          }
        }
      } catch {
        // Polling failures are transient (offline, deploy in progress); retry next tick.
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];
    };
  }, [dismiss]);

  return (
    <>
      <div
        className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-3"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto border-l-2 border-gold bg-white p-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-dark">
                  {lang === 'en' ? 'New booking' : 'Ny bokning'}
                </p>
                <p className="mt-1 font-serif text-xl text-ink">{item.staffName}</p>
                <p className="mt-1 text-sm text-stone">
                  {item.customerName} · {formatLocalTime(item.startsAt, DEFAULT_TZ, lang)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                aria-label={lang === 'en' ? 'Dismiss' : 'Stäng'}
                className="text-stone-light transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <Link
              href="/admin/appointments"
              onClick={() => dismiss(item.id)}
              className="mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-gold-dark transition-colors hover:text-ink"
            >
              {lang === 'en' ? 'View appointments' : 'Visa bokningar'}
              <ArrowRight size={13} />
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={soundOn}
        title={
          soundOn
            ? lang === 'en'
              ? 'Mute booking announcements'
              : 'Stäng av röstmeddelanden'
            : lang === 'en'
              ? 'Enable booking announcements'
              : 'Slå på röstmeddelanden'
        }
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] text-ivory shadow-lg transition-colors hover:bg-ink"
      >
        {soundOn ? <Bell size={15} strokeWidth={1.5} /> : <BellOff size={15} strokeWidth={1.5} />}
        {soundOn
          ? lang === 'en'
            ? 'Sound on'
            : 'Ljud på'
          : lang === 'en'
            ? 'Sound off'
            : 'Ljud av'}
      </button>
    </>
  );
}
