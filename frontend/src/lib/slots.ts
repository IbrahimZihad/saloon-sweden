export interface StartAware {
  startsAt: string;
}

/** Epoch milliseconds of a slot start, or NaN when the value is unparseable. */
export function slotStartMs(slot: StartAware): number {
  return Date.parse(slot.startsAt);
}

/**
 * True when the slot starts strictly after `nowMs`.
 *
 * `startsAt` is an absolute ISO timestamp, so the comparison is independent of
 * the visitor's time zone: a slot that is still ahead at the salon is still
 * ahead on the device, as long as the device clock is correct.
 *
 * Invalid timestamps are treated as not bookable rather than "in the future".
 */
export function isSlotBookable(slot: StartAware, nowMs: number = Date.now()): boolean {
  const start = slotStartMs(slot);
  return Number.isFinite(start) && start > nowMs;
}

/**
 * Drops slots that already started according to the device clock.
 *
 * The API already applies the salon's booking notice, but the result can go
 * stale (a tab left open, a revalidated response, a slow connection). This is a
 * last line of defence so a past time can never be offered or selected.
 */
export function filterBookableSlots<T extends StartAware>(
  slots: readonly T[],
  nowMs: number = Date.now(),
): T[] {
  return slots.filter((slot) => isSlotBookable(slot, nowMs));
}
