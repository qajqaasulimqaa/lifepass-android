// Parses a scanned / deep-linked LifePass check-in payload into a venue id.
//
// Faithful port of lifepass-ios Services/WalkInQRParser.swift (itself a port
// of the web canonical parser apps/web/src/components/customer/walk-in-qr-parser.ts)
// so the Android in-app scanner AND the `/scan` App Link accept EXACTLY what
// the printed posters use. See the monorepo docs/08_QR_CODE.md for the contract.
//
// Accepted forms:
//   - Canonical URL:  https://lifepass.is/scan?v=<uuid>   (the printed form)
//   - Legacy JSON:    {"type":"venue_checkin","id":"<uuid>"}
//   - Fragment JSON:  https://lifepass.is/scan#%7B...%7D   (LifePass scanners)
//   - Bare UUID:      <uuid>                                (manual fallback)
//
// The venue id must be an RFC 4122 v1–v5 UUID. Business decisions (eligibility,
// pricing, caps) are never trusted from the QR — only the venue id is extracted
// and everything else defers to the API.

// RFC 4122 v1–v5 (version nibble 1-5, variant nibble 8/9/a/b).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Mirrors WalkInQRParser.prodHosts.
const PROD_HOSTS = new Set([
  'lifepass.is',
  'www.lifepass.is',
  'app.lifepass.is',
  'staging.lifepass.is',
]);

export function isVenueUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// Mirror the Swift `selfHost()` allowance: also trust the configured API host
// (covers preview / staging-pointed builds).
function apiHost(): string | null {
  const base = process.env.EXPO_PUBLIC_LIFEPASS_API_URL;
  if (!base) return null;
  try {
    return new URL(base).host.toLowerCase();
  } catch {
    return null;
  }
}

function isTrustedHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (PROD_HOSTS.has(lower)) return true;
  if (apiHost() === lower) return true;
  return false;
}

export type WalkInQrResult =
  | { ok: true; venueId: string }
  | {
      ok: false;
      reason: 'empty' | 'wrong_type' | 'untrusted_host' | 'invalid_uuid' | 'invalid_payload';
    };

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function venueIdFromJson(text: string): WalkInQrResult {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid_payload' };
  }
  if (!obj || typeof obj !== 'object') return { ok: false, reason: 'invalid_payload' };
  const rec = obj as Record<string, unknown>;
  // booking_checkin and any other type are not customer walk-in codes.
  if (typeof rec.type === 'string' && rec.type !== 'venue_checkin') {
    return { ok: false, reason: 'wrong_type' };
  }
  const id = rec.id;
  if (typeof id !== 'string') return { ok: false, reason: 'invalid_payload' };
  if (!isVenueUuid(id)) return { ok: false, reason: 'invalid_uuid' };
  return { ok: true, venueId: id };
}

function tryUrl(input: string): WalkInQrResult | null {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  if (!isTrustedHost(u.host)) return { ok: false, reason: 'untrusted_host' };

  const v = u.searchParams.get('v');
  if (v) {
    if (!isVenueUuid(v)) return { ok: false, reason: 'invalid_uuid' };
    return { ok: true, venueId: v };
  }

  // Fragment may carry the legacy JSON form, e.g. `#%7B...%7D`.
  const frag = u.hash.startsWith('#') ? u.hash.slice(1) : u.hash;
  if (frag) {
    return venueIdFromJson(safeDecode(frag));
  }

  return { ok: false, reason: 'invalid_payload' };
}

export function parseWalkInQr(input: string): WalkInQrResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  if (/^https?:\/\//i.test(trimmed)) {
    const urlResult = tryUrl(trimmed);
    if (urlResult) return urlResult;
  }

  if (trimmed.startsWith('{')) {
    return venueIdFromJson(trimmed);
  }

  if (isVenueUuid(trimmed)) {
    return { ok: true, venueId: trimmed };
  }

  return { ok: false, reason: 'invalid_payload' };
}

/** Convenience: the venue id, or null when the payload isn't a valid code. */
export function venueIdFromScan(input: string): string | null {
  const r = parseWalkInQr(input);
  return r.ok ? r.venueId : null;
}
