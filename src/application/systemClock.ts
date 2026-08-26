import type { Clock } from './ports';
import { localDateFromDate } from '@/domain/localDate';

export class SystemClock implements Clock {
  now() {
    const date = new Date();
    return { utc: date.toISOString(), localDate: localDateFromDate(date) };
  }
}
