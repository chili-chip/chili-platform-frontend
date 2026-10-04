import { HttpErrorResponse } from '@angular/common/http';

export function formatMoney(cents: number, currency = 'eur'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function formatPrice(cents: number, currency = 'eur'): string {
  if (cents <= 0) {
    return 'Free';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function dollarsToCents(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }
  const [whole, frac = ''] = text.split('.');
  return Number(whole) * 100 + Number((frac + '00').slice(0, 2));
}

export function marketError(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error;
    if (typeof body === 'string' && body.trim()) {
      return body.trim();
    }
    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record['detail'] === 'string') {
        return record['detail'];
      }
      for (const value of Object.values(record)) {
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0];
        }
      }
    }
  }
  return fallback;
}
