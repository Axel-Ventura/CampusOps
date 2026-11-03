import { planRetry } from '../src/course-evaluation';

type Case = {
  id: string;
  input: Parameters<typeof planRetry>[0];
  expectedRetry: boolean;
  expectedDelayMs?: number;
};

const cases: Case[] = [
  { id: 'retry-get-rate-limit', input: { method: 'GET', status: 429, attempt: 1, retryAfterMs: 800 }, expectedRetry: true, expectedDelayMs: 800 },
  { id: 'retry-get-timeout-first-attempt', input: { method: 'GET', status: 'timeout', attempt: 1 }, expectedRetry: true },
  { id: 'retry-get-timeout-attempt-4', input: { method: 'GET', status: 'timeout', attempt: 4 }, expectedRetry: false },
  { id: 'retry-post-without-key', input: { method: 'POST', status: 503, attempt: 1 }, expectedRetry: false },
  { id: 'retry-post-timeout-stable-key', input: { method: 'POST', status: 'timeout', attempt: 1, idempotencyKey: 'week09-op-1' }, expectedRetry: true },
  { id: 'retry-get-400-no-retry', input: { method: 'GET', status: 400, attempt: 1 }, expectedRetry: false },
  { id: 'retry-get-rate-limit-server-1s', input: { method: 'GET', status: 429, attempt: 1, retryAfterMs: 1000 }, expectedRetry: true, expectedDelayMs: 1000 },
];

describe('Week 09 - decisiones de planRetry', () => {
  test.each(cases)('$id', ({ id, input, expectedRetry, expectedDelayMs }) => {
    const result = planRetry(input);
    console.log(JSON.stringify({ id, input, result }));
    expect(result.retry).toBe(expectedRetry);
    if (expectedDelayMs !== undefined) {
      expect(result.delayMs).toBe(expectedDelayMs);
    }
  });
});