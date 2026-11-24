'use client';

import { useEffect, useMemo, useState } from 'react';
import { deviceTimeZone, visitorBusinessHours, type VisitorHoursRow } from './timezone';
import type { BusinessHours } from './types';

export interface VisitorHoursResult {
  /** Opening hours with clock times rendered in the visitor's zone. */
  rows: VisitorHoursRow[];
  /** The zone the times are rendered in (visitor's after mount). */
  visitorTz: string;
  salonTz: string;
  /** True when the visitor is in the salon's own zone (no note needed). */
  sameZone: boolean;
}

/**
 * Renders the salon's weekly schedule in the visitor's time zone.
 *
 * The server render uses the salon zone (it cannot know the visitor's), and
 * the client switches to the device zone after mount, so there is no hydration
 * mismatch. The salon's schedule itself is never changed.
 */
export function useVisitorHours(hours: BusinessHours[], salonTz: string): VisitorHoursResult {
  const [zone, setZone] = useState<string | null>(null);

  useEffect(() => {
    setZone(deviceTimeZone());
  }, []);

  const visitorTz = zone ?? salonTz;
  const rows = useMemo(
    () => visitorBusinessHours(hours, new Date(), salonTz, visitorTz),
    [hours, salonTz, visitorTz],
  );

  return { rows, visitorTz, salonTz, sameZone: visitorTz === salonTz };
}
