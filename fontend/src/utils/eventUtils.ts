import type {Event} from '../types';

export type EventStatus = 'upcoming' | 'active' | 'ended';

export function isEventActive(event: Event): boolean {
  const status = getEventStatus(event);
  return status === 'active';
}

export function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  if (now < start) {
    return 'upcoming';
  } else if (now > end) {
    return 'ended';
  } else {
    return 'active';
  }
}