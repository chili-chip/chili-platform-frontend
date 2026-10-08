import { HttpErrorResponse } from '@angular/common/http';

import { Paginated, StoreDeliveryOption, StoreOrder } from '../../core/models/platform';

export function unwrapList<T>(payload: Paginated<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : (payload.results ?? []);
}

export function productImages(product: { images?: { url: string }[]; image_url?: string } | null | undefined): string[] {
  if (!product) {
    return [];
  }
  const nested = (product.images ?? []).map((row) => row.url).filter((url) => !!url);
  if (nested.length) {
    return nested;
  }
  return product.image_url ? [product.image_url] : [];
}

export function productCover(product: { images?: { url: string }[]; image_url?: string } | null | undefined): string {
  return productImages(product)[0] || '';
}

export function productBlurb(product: {
  short_description?: string;
  description?: string;
}): string {
  return (product.short_description || product.description || '').trim();
}

function looksLikeHtml(value: string): boolean {
  const head = value.trimStart().slice(0, 240).toLowerCase();
  return (
    head.startsWith('<!') ||
    head.startsWith('<html') ||
    head.includes('<body') ||
    head.includes('<pre') ||
    head.includes('<title>')
  );
}

function readableMessage(value: string, fallback: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text || looksLikeHtml(text) || text.length > 280) {
    return fallback;
  }
  return text;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  const body = err.error;
  if (typeof body === 'string' && body.trim()) {
    return readableMessage(body, fallback);
  }
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record['detail'] === 'string') {
      return readableMessage(record['detail'], fallback);
    }
    for (const value of Object.values(record)) {
      if (typeof value === 'string' && value.trim()) {
        return readableMessage(value, fallback);
      }
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return readableMessage(value[0], fallback);
      }
    }
  }
  return fallback;
}

export function shippingSummary(order: StoreOrder): string {
  return shippingAddressLines(order).join(' · ');
}

export function shippingAddressLines(order: StoreOrder): string[] {
  const locality = [
    order.shipping_city,
    [order.shipping_state, order.shipping_postal_code].filter((part) => part?.trim()).join(' '),
  ]
    .filter((part) => part?.trim())
    .join(', ');
  return [
    order.shipping_name,
    order.shipping_line1,
    order.shipping_line2,
    locality,
    countryName(order.shipping_country),
  ].filter((part) => part?.trim());
}

export type ShippingStatus = 'awaiting_payment' | 'preparing' | 'shipped' | 'not_shipping';

const SHIPPING_LABELS: Record<ShippingStatus, string> = {
  awaiting_payment: 'Awaiting payment',
  preparing: 'Preparing to ship',
  shipped: 'Shipped',
  not_shipping: 'Not shipping',
};

export function shippingStatus(order: StoreOrder): { key: ShippingStatus; label: string } {
  const stored = order.shipping_status;
  if (stored && stored in SHIPPING_LABELS) {
    return { key: stored, label: SHIPPING_LABELS[stored] };
  }
  switch (order.status) {
    case 'fulfilled':
      return { key: 'shipped', label: SHIPPING_LABELS.shipped };
    case 'paid':
      return { key: 'preparing', label: SHIPPING_LABELS.preparing };
    case 'canceled':
    case 'failed':
      return { key: 'not_shipping', label: SHIPPING_LABELS.not_shipping };
    default:
      return { key: 'awaiting_payment', label: SHIPPING_LABELS.awaiting_payment };
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  NL: 'Netherlands',
  PL: 'Poland',
  AU: 'Australia',
};

function countryName(code: string | undefined): string {
  const trimmed = (code || '').trim().toUpperCase();
  if (!trimmed) {
    return '';
  }
  return COUNTRY_NAMES[trimmed] || trimmed;
}


/** Fee for an option given the items subtotal: free at or above `free_over_cents`. */
export function deliveryFee(option: StoreDeliveryOption, subtotalCents: number): number {
  if (option.free_over_cents !== null && subtotalCents >= option.free_over_cents) {
    return 0;
  }
  return option.price_cents;
}

/**
 * Active options every physical product allows, or null when nothing ships
 * (only digital items). Mirrors the backend rule.
 */
export function allowedDeliveryOptions(
  options: StoreDeliveryOption[],
  products: { is_digital?: boolean; delivery_options?: string[] }[],
): StoreDeliveryOption[] | null {
  const physical = products.filter((product) => !product.is_digital);
  if (!physical.length) {
    return null;
  }
  return options.filter((option) =>
    physical.every(
      (product) => !product.delivery_options?.length || product.delivery_options.includes(option.slug),
    ),
  );
}

export function deliveryWhere(option: StoreDeliveryOption): string {
  if (!option.requires_address) {
    return 'Pickup, no address needed';
  }
  if (!option.countries.length) {
    return 'Ships across the EU';
  }
  return 'Ships to ' + option.countries.map((code) => countryName(code)).join(', ');
}
