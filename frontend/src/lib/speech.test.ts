import { describe, expect, it } from 'vitest';
import { bookingAnnouncement, pickSwedishVoice } from './speech';

describe('pickSwedishVoice', () => {
  it('returns undefined when there are no voices', () => {
    expect(pickSwedishVoice([])).toBeUndefined();
  });

  it('ignores voices that are not Swedish', () => {
    expect(
      pickSwedishVoice([
        { lang: 'en-US', localService: true },
        { lang: 'de-DE', localService: true },
      ]),
    ).toBeUndefined();
  });

  it('prefers a local Swedish voice over a network voice', () => {
    const network = { lang: 'sv-SE', localService: false };
    const local = { lang: 'sv-SE', localService: true };
    expect(pickSwedishVoice([network, local])).toBe(local);
  });

  it('falls back to the first Swedish voice when none is local', () => {
    const first = { lang: 'sv-SE', localService: false };
    const second = { lang: 'sv-FI', localService: false };
    expect(pickSwedishVoice([first, second])).toBe(first);
  });

  it('accepts locale tags with an underscore', () => {
    const voice = { lang: 'sv_SE', localService: true };
    expect(pickSwedishVoice([{ lang: 'en-GB' }, voice])).toBe(voice);
  });
});

describe('bookingAnnouncement', () => {
  it('names the stylist in Swedish', () => {
    expect(bookingAnnouncement('Anna Lindqvist')).toBe('Ny bokning med Anna Lindqvist');
  });

  it('trims whitespace and handles a missing name', () => {
    expect(bookingAnnouncement('  Anna  ')).toBe('Ny bokning med Anna');
    expect(bookingAnnouncement('   ')).toBe('Ny bokning');
  });
});
