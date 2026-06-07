const PENDING_BUY_NOW_INTENT_KEY = 'pending_buy_now_intent_v1';

export type PendingBuyNowIntent = {
  productId: number;
  quantity: number;
  selections?: Record<string, string>;
  variationId?: number;
  redirectTo?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeSelections(input: unknown): Record<string, string> | undefined {
  if (!isRecord(input)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizePath(path: unknown): string | undefined {
  if (typeof path !== 'string') return undefined;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return undefined;
  return trimmed;
}

function sanitizeIntent(raw: unknown): PendingBuyNowIntent | null {
  if (!isRecord(raw)) return null;
  const productId = Number(raw.productId);
  const quantity = Number(raw.quantity);
  if (!Number.isFinite(productId) || productId < 1) return null;
  if (!Number.isFinite(quantity) || quantity < 1) return null;
  const maybeVariationId = raw.variationId;
  const variationId =
    maybeVariationId == null
      ? undefined
      : Number.isFinite(Number(maybeVariationId)) && Number(maybeVariationId) >= 1
        ? Math.trunc(Number(maybeVariationId))
        : undefined;
  return {
    productId: Math.trunc(productId),
    quantity: Math.trunc(quantity),
    selections: sanitizeSelections(raw.selections),
    variationId,
    redirectTo: sanitizePath(raw.redirectTo),
  };
}

export function savePendingBuyNowIntent(intent: PendingBuyNowIntent): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PENDING_BUY_NOW_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // no-op if storage is unavailable
  }
}

export function consumePendingBuyNowIntent(): PendingBuyNowIntent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_BUY_NOW_INTENT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_BUY_NOW_INTENT_KEY);
    return sanitizeIntent(JSON.parse(raw));
  } catch {
    return null;
  }
}
