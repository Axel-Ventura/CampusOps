
import type {
  AuthEvent,
  JsonObject,
  ParseResult,
  PermissionEvent,
  RemoteResponse,
  SyncRecord,
} from './contracts';


function pending(name: string): never {
  throw new Error(`${name} must be implemented in the assigned week`);
}

const TELEMETRY_SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'email',
  'displayname',
  'name',
  'userid',
  'reporterid',
  'technicianid',
  'assignedtechnicianid',
  'location',
  'latitude',
  'longitude',
  'photos',
  'evidence',
  'internalcomments',
  'assignmenthistory',
]);

function normalizeTelemetryKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '');
}

function redactTelemetryValue(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => redactTelemetryValue(item));
  }

  if (input !== null && typeof input === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (TELEMETRY_SENSITIVE_KEYS.has(normalizeTelemetryKey(key))) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactTelemetryValue(value);
      }
    }

    return result;
  }

  return input;
}

export function redactForTelemetry(input: unknown): unknown {
  return redactTelemetryValue(input);
}

export function parseRemoteResource(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'contract' };
  }

  const candidate = input as Record<string, unknown>;

  const id = candidate.id;
  const version = candidate.version;
  const status = candidate.status;
  const payload = candidate.payload;

  if (typeof id !== 'string' || id.trim() === '') {
    return { ok: false, error: 'contract' };
  }

  if (
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    version < 0
  ) {
    return { ok: false, error: 'contract' };
  }

  if (typeof status !== 'string' || status.trim() === '') {
    return { ok: false, error: 'contract' };
  }

  if (
    payload !== null &&
    (typeof payload !== 'object' || Array.isArray(payload))
  ) {
    return { ok: false, error: 'contract' };
  }

  return {
    ok: true,
    value: {
      id,
      version,
      status,
      payload: payload as JsonObject | null,
    },
  };
}

export function coordinateRefresh(events: readonly AuthEvent[]): Readonly<{
  status: 'anonymous' | 'authenticated';
  activeGeneration: number | null;
  refreshCalls: number;
  retriedRequestIds: readonly string[];
  persistedToken: string | null;
}> {
  let status: 'anonymous' | 'authenticated' = 'anonymous';
  let activeGeneration: number | null = null;
  let refreshCalls = 0;
  let persistedToken: string | null = null;
  let refreshPending = false;

  const waitingRequests = new Set<string>();
  const retriedRequestIds: string[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'request401': {
        if (!refreshPending) {
          refreshPending = true;
          refreshCalls += 1;
        }

        if (event.requestId) {
          waitingRequests.add(event.requestId);
        }
        break;
      }

      case 'refreshSucceeded': {
        if (
          !refreshPending ||
          !event.token ||
          event.generation === undefined
        ) {
          break;
        }

        status = 'authenticated';
        activeGeneration = event.generation;
        persistedToken = event.token;

        for (const requestId of waitingRequests) {
          if (!retriedRequestIds.includes(requestId)) {
            retriedRequestIds.push(requestId);
          }
        }

        waitingRequests.clear();
        refreshPending = false;
        break;
      }

      case 'refreshFailed': {
        status = 'anonymous';
        activeGeneration = null;
        persistedToken = null;
        waitingRequests.clear();
        refreshPending = false;
        break;
      }

      case 'logout': {
        status = 'anonymous';
        activeGeneration = null;
        persistedToken = null;
        waitingRequests.clear();
        refreshPending = false;
        break;
      }
    }
  }

  return {
    status,
    activeGeneration,
    refreshCalls,
    retriedRequestIds,
    persistedToken,
  };
}

export function resolveSync(
  base: SyncRecord,
  local: SyncRecord,
  remote: SyncRecord,
): Readonly<
  | { kind: 'merged'; fields: JsonObject }
  | { kind: 'conflict'; fields: readonly string[] }
> {
  const keys = new Set([
    ...Object.keys(base.fields),
    ...Object.keys(local.fields),
    ...Object.keys(remote.fields),
  ]);

  const merged: Record<string, unknown> = {};
  const conflicts: string[] = [];

  for (const key of keys) {
    const baseValue = base.fields[key];
    const localValue = local.fields[key];
    const remoteValue = remote.fields[key];

    const localChanged =
      JSON.stringify(localValue) !== JSON.stringify(baseValue);
    const remoteChanged =
      JSON.stringify(remoteValue) !== JSON.stringify(baseValue);

    if (
      localChanged &&
      remoteChanged &&
      JSON.stringify(localValue) !== JSON.stringify(remoteValue)
    ) {
      conflicts.push(key);
    } else if (localChanged) {
      merged[key] = localValue;
    } else {
      merged[key] = remoteValue;
    }
  }

  if (conflicts.length > 0) {
    return { kind: 'conflict', fields: conflicts.sort() };
  }

  return { kind: 'merged', fields: merged };
}

export function deduplicateOperations<
  T extends Readonly<{ operationId: string }>
>(operations: readonly T[]): readonly T[] {
  const seen = new Set<string>();

  return operations.filter((operation) => {
    if (seen.has(operation.operationId)) {
      return false;
    }

    seen.add(operation.operationId);
    return true;
  });
}

// SEMANA 9: REINTENTOS SEGUROS

const BASE_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 30000;
const MAX_RETRY_ATTEMPTS = 4;

export function planRetry(input: Readonly<{
  method: 'GET' | 'POST';
  status: number | 'timeout';
  attempt: number;
  retryAfterMs?: number;
  idempotencyKey?: string;
}>): Readonly<{
  retry: boolean;
  delayMs: number;
  requiresStableIdempotencyKey: boolean;
}> {
  const {
    method,
    status,
    attempt,
    retryAfterMs,
    idempotencyKey,
  } = input;

  const hasStableKey =
    typeof idempotencyKey === 'string' &&
    idempotencyKey.trim().length > 0;

  // Nunca repetir POST sin una identidad estable.
  if (method === 'POST' && !hasStableKey) {
    return {
      retry: false,
      delayMs: 0,
      requiresStableIdempotencyKey: true,
    };
  }

  // El intento 4 es el limite: no hay otro reintento.
  if (
    !Number.isInteger(attempt) ||
    attempt < 1 ||
    attempt >= MAX_RETRY_ATTEMPTS
  ) {
    return {
      retry: false,
      delayMs: 0,
      requiresStableIdempotencyKey: false,
    };
  }

  // Solo se reintentan fallos temporales.
  const retryable =
    status === 'timeout' ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504;

  if (!retryable) {
    return {
      retry: false,
      delayMs: 0,
      requiresStableIdempotencyKey: false,
    };
  }

  // Espera progresiva con limite configurable.
  const progressiveDelay = Math.min(
    MAX_RETRY_DELAY_MS,
    BASE_RETRY_DELAY_MS * 2 ** (attempt - 1),
  );

  // Retry-After valido tiene prioridad.
  const hasValidRetryAfter =
    typeof retryAfterMs === 'number' &&
    Number.isFinite(retryAfterMs) &&
    retryAfterMs >= 0;

  const delayMs = hasValidRetryAfter
    ? Math.ceil(retryAfterMs)
    : progressiveDelay;

  return {
    retry: true,
    delayMs,
    requiresStableIdempotencyKey: false,
  };
}

export function reduceRemoteResponses(_input: Readonly<{
  activeRequestId: string;
  responses: readonly RemoteResponse[];
}>): Readonly<{
  state: 'success' | 'error' | 'loading';
  value?: unknown;
  error?: string;
}> {
  return pending('reduceRemoteResponses');
}

export function reducePermissionLifecycle(
  _events: readonly PermissionEvent[],
): Readonly<{
  status: 'available' | 'denied' | 'blocked';
  resourceActive: boolean;
}> {
  return pending('reducePermissionLifecycle');
}

// SEMANA 9: UBICACION DEL PROVEEDOR O ALTERNATIVA MANUAL

export function selectIncidentLocation(
  provider: unknown,
  manualLabel: string,
): Readonly<{
  source: 'provider' | 'manual';
  label: string;
  latitude?: number;
  longitude?: number;
}> {
  if (
    typeof provider === 'object' &&
    provider !== null &&
    !Array.isArray(provider)
  ) {
    const location = provider as Record<string, unknown>;

    const validLabel =
      typeof location.label === 'string' &&
      location.label.trim().length > 0;

    const validLatitude =
      typeof location.latitude === 'number' &&
      Number.isFinite(location.latitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90;

    const validLongitude =
      typeof location.longitude === 'number' &&
      Number.isFinite(location.longitude) &&
      location.longitude >= -180 &&
      location.longitude <= 180;

    if (validLabel && validLatitude && validLongitude) {
      return {
        source: 'provider',
        label: location.label as string,
        latitude: location.latitude as number,
        longitude: location.longitude as number,
      };
    }
  }

  // Si el proveedor falla, conservar la ubicacion manual.
  // No inventar coordenadas.
  return {
    source: 'manual',
    label: manualLabel,
  };
}
