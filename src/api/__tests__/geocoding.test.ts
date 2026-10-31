
import {
  clearGeocodingCache,
  lookupIncidentLocation,
} from '../geocoding';

const options = {
  baseUrl: 'http://127.0.0.1:4310',
  accessToken: 'course-valid-token',
  actorId: 'reporter-1',
};

const originalFetch = global.fetch;

beforeEach(() => {
  clearGeocodingCache();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.useRealTimers();
  jest.restoreAllMocks();
  clearGeocodingCache();
});

describe('Semana 09: adaptador de geocodificacion', () => {
  test('acepta coordenadas validas y envia autorizacion', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        label: 'Edificio de prueba A',
        latitude: 0,
        longitude: 0,
      }),
    });

    global.fetch = mockFetch as typeof fetch;

    const result = await lookupIncidentLocation(
      'Zona de prueba',
      'Edificio manual',
      options,
    );

    expect(result).toEqual({
      source: 'provider',
      label: 'Edificio de prueba A',
      latitude: 0,
      longitude: 0,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const requestOptions = mockFetch.mock.calls[0][1];

    expect(requestOptions.headers).toMatchObject({
      Authorization: 'Bearer course-valid-token',
      'X-Course-Actor': 'reporter-1',
      'X-Course-Scenario': 'success',
    });
  });

  test('utiliza ubicacion manual ante HTTP 429', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
    });

    global.fetch = mockFetch as typeof fetch;

    const result = await lookupIncidentLocation(
      'Zona de prueba',
      'Edificio manual',
      { ...options, scenario: 'rate_limited' },
    );

    expect(result).toEqual({
      source: 'manual',
      label: 'Edificio manual',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('rechaza coordenadas invalidas sin inventar otras', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        label: 'Zona ficticia',
        latitude: 999,
        longitude: null,
      }),
    });

    global.fetch = mockFetch as typeof fetch;

    const result = await lookupIncidentLocation(
      'Zona de prueba',
      'Edificio manual',
      { ...options, scenario: 'invalid_coordinates' },
    );

    expect(result).toEqual({
      source: 'manual',
      label: 'Edificio manual',
    });
  });

  test('reutiliza una respuesta valida desde cache', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        label: 'Edificio de prueba A',
        latitude: 0,
        longitude: 0,
      }),
    });

    global.fetch = mockFetch as typeof fetch;

    const first = await lookupIncidentLocation(
      'Zona de prueba',
      'Edificio manual',
      options,
    );

    const second = await lookupIncidentLocation(
      '  zona de PRUEBA  ',
      'Edificio manual',
      options,
    );

    expect(first).toEqual(second);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('utiliza ubicacion manual si vence el timeout', async () => {
    jest.useFakeTimers();

    const mockFetch = jest.fn().mockImplementation(
      (_url: string, requestOptions: RequestInit) =>
        new Promise((_resolve, reject) => {
          requestOptions.signal?.addEventListener('abort', () => {
            reject(new Error('Request aborted'));
          });
        }),
    );

    global.fetch = mockFetch as typeof fetch;

    const resultPromise = lookupIncidentLocation(
      'Zona de prueba',
      'Edificio manual',
      { ...options, timeoutMs: 100 },
    );

    await jest.advanceTimersByTimeAsync(100);

    await expect(resultPromise).resolves.toEqual({
      source: 'manual',
      label: 'Edificio manual',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
