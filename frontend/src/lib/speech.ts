export interface SpeechVoiceLike {
  lang: string;
  localService?: boolean;
}

/**
 * Picks a Swedish voice, preferring one that runs on the device.
 *
 * Network voices (for example Chrome's "Google" voices) send the spoken text
 * to a third party. Booking alerts contain customer names, so a local voice
 * keeps that personal data on the device whenever the browser offers one.
 */
export function pickSwedishVoice<T extends SpeechVoiceLike>(
  voices: readonly T[],
): T | undefined {
  const swedish = voices.filter((voice) => /^sv([-_]|$)/i.test(voice.lang));
  return swedish.find((voice) => voice.localService) ?? swedish[0];
}

/** The Swedish phrase read aloud when a new online booking arrives. */
export function bookingAnnouncement(staffName: string): string {
  const name = staffName.trim();
  return name ? `Ny bokning med ${name}` : 'Ny bokning';
}
