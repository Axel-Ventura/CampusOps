export type BackendHealth = Readonly<{
  ok: true;
  service: 'dmi-controlled-backend';
  contractVersion: 1;
}>;

export async function getBackendHealth(
  baseUrl = process.env.EXPO_PUBLIC_COURSE_BACKEND_URL,
): Promise<BackendHealth> {
  if (!baseUrl) {
    throw new Error('La URL del servicio no está configurada.');
  }

  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) {
    throw new Error('No fue posible consultar el estado del servicio.');
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('ok' in payload) ||
    payload.ok !== true ||
    !('contractVersion' in payload) ||
    payload.contractVersion !== 1
  ) {
    throw new Error('Respuesta no válida del servicio.');
  }
  return payload as BackendHealth;
}