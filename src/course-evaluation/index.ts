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

export function redactForTelemetry(_input: unknown): unknown {
  return pending('redactForTelemetry');
}

export function parseRemoteResource(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'contract' };
  }

  const record = input as Record<string, unknown>;
  const { id, version, status, payload } = record;

  // 1. ID: string no vacío
  if (typeof id !== 'string' || id.trim() === '') {
    return { ok: false, error: 'contract' };
  }

  // 2. Version: entero no negativo (>= 0)
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    return { ok: false, error: 'contract' };
  }

  // 3. Status: string no vacío
  if (typeof status !== 'string' || status.trim() === '') {
    return { ok: false, error: 'contract' };
  }

  // 4. Payload: objeto o null (ignora campos adicionales del sobre)
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

export function coordinateRefresh(_events: readonly AuthEvent[]): Readonly<{
  status: 'anonymous' | 'authenticated';
  activeGeneration: number | null;
  refreshCalls: number;
  retriedRequestIds: readonly string[];
  persistedToken: string | null;
}> {
  return pending('coordinateRefresh');
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