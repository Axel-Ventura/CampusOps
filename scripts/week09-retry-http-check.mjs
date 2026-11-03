const BASE = 'http://127.0.0.1:4310';
const headers = {
  Authorization: 'Bearer course-valid-token',
  'X-Course-Actor': 'reporter-1',
};

async function medir(scenario) {
  const inicio = performance.now();
  const res = await fetch(`${BASE}/v1/geocoding?q=zona`, {
    headers: { ...headers, 'X-Course-Scenario': scenario },
  });
  const duracionMs = Math.round(performance.now() - inicio);
  return { status: res.status, retryAfter: res.headers.get('retry-after'), duracionMs };
}

console.log('--- Intento 1: escenario rate_limited ---');
const primero = await medir('rate_limited');
console.log(JSON.stringify(primero));

if (!primero.retryAfter) {
  console.log('El servidor no envio Retry-After');
  process.exit(1);
}

const esperaPlaneadaMs = Number(primero.retryAfter) * 1000;
console.log(`Retry-After del servidor: ${primero.retryAfter} s, espera planeada: ${esperaPlaneadaMs} ms`);

const inicioEspera = performance.now();
await new Promise((resolve) => setTimeout(resolve, esperaPlaneadaMs));
const esperaRealMs = Math.round(performance.now() - inicioEspera);
console.log(`Espera real medida: ${esperaRealMs} ms`);

console.log('--- Intento 2: escenario success ---');
const segundo = await medir('success');
console.log(JSON.stringify(segundo));