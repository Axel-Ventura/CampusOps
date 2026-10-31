
import { selectIncidentLocation } from '../course-evaluation';

export type LocationSelection = ReturnType<
  typeof selectIncidentLocation
>;

type CacheEntry = {
  value: LocationSelection;
  expiresAt: number;
};

export type GeocodingOptions = {
  baseUrl?: string;
  scenario?: string;
  timeoutMs?: number;
  cacheTtlMs?: number;
  accessToken: string;
  actorId: string;
};

const DEFAULT_URL = 'http://127.0.0.1:4310';
const DEFAULT_TIMEOUT_MS = 3000;
const DEFAULT_CACHE_TTL_MS = 60000;

const cache = new Map<string, CacheEntry>();

export function clearGeocodingCache(): void {
  cache.clear();
}

export async function lookupIncidentLocation(
  query: string,
  manualLabel: string,
  options: GeocodingOptions,
): Promise<LocationSelection> {
  const normalizedQuery = query.trim().toLowerCase();

  const baseUrl =
    options.baseUrl ??
    process.env.EXPO_PUBLIC_COURSE_BACKEND_URL ??
    DEFAULT_URL;

  const scenario = options.scenario ?? 'success';

  const ttl = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Si no hay consulta, utilizar directamente la ubicacion manual.
  if (!normalizedQuery) {
    return selectIncidentLocation(null, manualLabel);
  }

  // Sin una sesion valida no enviamos la solicitud.
  if (
    !options.accessToken.trim() ||
    !options.actorId.trim()
  ) {
    return selectIncidentLocation(null, manualLabel);
  }

  // Separar resultados por servidor, actor y escenario.
  // No se guarda el token en la clave de cache.
  const cacheKey = [
    baseUrl,
    options.actorId,
    scenario,
    normalizedQuery,
  ].join('|');

  const cached = cache.get(cacheKey);

  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Eliminar entradas caducadas.
    cache.delete(cacheKey);
  }

  // Normalizar un tiempo de espera positivo y finito.
  const safeTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    safeTimeoutMs,
  );

  try {
    const response = await fetch(
      `${baseUrl}/v1/geocoding?q=${encodeURIComponent(
        query.trim(),
      )}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${options.accessToken}`,
          'X-Course-Actor': options.actorId,
          'X-Course-Scenario': scenario,
        },
      },
    );

    // HTTP 401, 403, 429, 500, etc.:
    // conservar siempre la alternativa manual.
    if (!response.ok) {
      return selectIncidentLocation(null, manualLabel);
    }

    const payload: unknown = await response.json();

    // La validacion estricta se realiza en esta funcion.
    const selection = selectIncidentLocation(
      payload,
      manualLabel,
    );

    // Nunca guardar respuestas incompletas o invalidas.
    // Tampoco guardar alternativas manuales.
    if (
      selection.source === 'provider' &&
      Number.isFinite(ttl) &&
      ttl > 0
    ) {
      cache.set(cacheKey, {
        value: selection,
        expiresAt: Date.now() + ttl,
      });
    }

    return selection;
  } catch {
    // Timeout, desconexion, JSON malformado u otro error.
    // Nunca inventar coordenadas.
    return selectIncidentLocation(null, manualLabel);
  } finally {
    clearTimeout(timer);
  }
}
