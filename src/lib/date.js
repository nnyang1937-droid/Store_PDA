export const SOON_DAYS = 10;

export function getExpiryStatus(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(dateString);
  expiry.setHours(0, 0, 0, 0);

  if (expiry.getTime() < today.getTime()) {
    return 'expired';
  }

  if (Math.round((expiry.getTime() - today.getTime()) / 86400000) <= SOON_DAYS) {
    return 'soon';
  }

  return 'fresh';
}

export function daysUntil(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(dateString);
  expiry.setHours(0, 0, 0, 0);

  return Math.round((expiry.getTime() - today.getTime()) / 86400000);
}

export function parseExpiryInput(input) {
  const digits = input.replace(/[^\d]/g, '');

  if (digits.length === 0) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  let year;
  let month;
  let day;

  if (digits.length === 4) {
    year = currentYear;
    month = parseInt(digits.slice(0, 2), 10);
    day = parseInt(digits.slice(2, 4), 10);
  } else if (digits.length === 8) {
    year = parseInt(digits.slice(0, 4), 10);
    month = parseInt(digits.slice(4, 6), 10);
    day = parseInt(digits.slice(6, 8), 10);
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

export function isValidCalendarDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
