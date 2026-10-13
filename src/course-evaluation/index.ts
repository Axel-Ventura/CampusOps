import type {
  AuthEvent,
  JsonObject,
  ParseResult,
  PermissionEvent,
  RemoteResponse,
  SyncRecord,
} from './contracts';
import type { IncidentLocation } from '../campusops/contracts';

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

  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    return { ok: false, error: 'contract' };
  }

  if (typeof status !== 'string' || status.trim() === '') {
    return { ok: false, error: 'contract' };
  }

  if (payload !== null && (typeof payload !== 'object' || Array.isArray(payload))) {
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

  let inFlightGeneration: number | null = null;
  const pendingRequestIds: string[] = [];
  const retriedRequestIds: string[] = [];

  for (const event of events) {
    switch (event.type) {
      case 'request401': {
        const reqGen = event.generation ?? activeGeneration ?? 0;

        // Si no hay renovación en curso para esta generación, inicia una llamada
        if (inFlightGeneration === null || inFlightGeneration !== reqGen) {
          inFlightGeneration = reqGen;
          refreshCalls++;
        }

        // Cada solicitud se encola como máximo una vez
        if (event.requestId && !pendingRequestIds.includes(event.requestId)) {
          pendingRequestIds.push(event.requestId);
        }
        break;
      }

      case 'refreshSucceeded': {
        const newGen = event.generation ?? 1;
        const newToken = event.token ?? null;

        // Descarta respuestas obsoletas (boundary condition)
        if (activeGeneration === null || newGen > activeGeneration) {
          activeGeneration = newGen;
          persistedToken = newToken;
          status = 'authenticated';

          // Reintentar las solicitudes pendientes exactamente una vez
          for (const reqId of pendingRequestIds) {
            if (!retriedRequestIds.includes(reqId)) {
              retriedRequestIds.push(reqId);
            }
          }
          pendingRequestIds.length = 0;
        }

        inFlightGeneration = null;
        break;
      }

      case 'refreshFailed': {
        inFlightGeneration = null;
        pendingRequestIds.length = 0;
        status = 'anonymous';
        activeGeneration = null;
        persistedToken = null;
        break;
      }

      case 'logout': {
        inFlightGeneration = null;
        pendingRequestIds.length = 0;
        status = 'anonymous';
        activeGeneration = null;
        persistedToken = null;
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
  _base: SyncRecord,
  _local: SyncRecord,
  _remote: SyncRecord,
): Readonly<{ kind: 'merged'; fields: JsonObject } | { kind: 'conflict'; fields: readonly string[] }> {
  return pending('resolveSync');
}

export function deduplicateOperations<T extends Readonly<{ operationId: string }>>(
  _operations: readonly T[],
): readonly T[] {
  return pending('deduplicateOperations');
}

export function planRetry(_input: Readonly<{
  method: 'GET' | 'POST';
  status: number | 'timeout';
  attempt: number;
  retryAfterMs?: number;
  idempotencyKey?: string;
}>): Readonly<{ retry: boolean; delayMs: number; requiresStableIdempotencyKey: boolean }> {
  return pending('planRetry');
}

export function reduceRemoteResponses(_input: Readonly<{
  activeRequestId: string;
  responses: readonly RemoteResponse[];
}>): Readonly<{ state: 'success' | 'error' | 'loading'; value?: unknown; error?: string }> {
  return pending('reduceRemoteResponses');
}

export function reducePermissionLifecycle(
  _events: readonly PermissionEvent[],
): Readonly<{ status: 'available' | 'denied' | 'blocked'; resourceActive: boolean }> {
  return pending('reducePermissionLifecycle');
}

/** Week 09: see docs/CAMPUSOPS_API.md; this is not a completed solution. */
export function selectIncidentLocation(_provider: unknown, _manualLabel: string): IncidentLocation {
  return pending('selectIncidentLocation');
}