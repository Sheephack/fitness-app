import type { LocalDate } from './types';

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseLocalDate(value: string): LocalDate {
  if (!LOCAL_DATE_PATTERN.test(value)) {
    throw new Error('Invalid local date format');
  }
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    throw new Error('Invalid local date value');
  }
  return value as LocalDate;
}

export function localDateFromDate(date: Date): LocalDate {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as LocalDate;
}

export function addLocalDays(localDate: LocalDate, amount: number): LocalDate {
  const [yearText, monthText, dayText] = localDate.split('-');
  const date = new Date(
    Date.UTC(Number(yearText), Number(monthText) - 1, Number(dayText) + amount),
  );
  return `${date.getUTCFullYear().toString().padStart(4, '0')}-${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}` as LocalDate;
}

export function daysBetween(start: LocalDate, end: LocalDate): number {
  const toUtc = (value: LocalDate) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
  };
  return Math.round((toUtc(end) - toUtc(start)) / 86_400_000);
}
