// Server-side transport for SoTeach's private tutoring API.
// Do not import this module from a Client Component or expose credentials in
// NEXT_PUBLIC_ variables. Route-level learner authorization is a separate gate.
const ACTIONS = Object.freeze({
  begin: ['POST', 'begin'],
  input: ['POST', 'input'],
  session: ['GET', 'session'],
  diagnosis: ['GET', 'diagnosis'],
  profile: ['GET', 'profile'],
  access: ['GET', 'access'],
});

export class SoTeachUnavailable extends Error {
  constructor() { super('Tutoring service is temporarily unavailable'); this.name = 'SoTeachUnavailable'; }
}
export class SoTeachResponseError extends Error {
  constructor(status) { super('Tutoring request could not be completed'); this.name = 'SoTeachResponseError'; this.status = status; }
}

export async function requestSoTeach({ learner, action, guardianToken, body, fetchImpl = fetch, env = process.env }) {
  const config = ACTIONS[action];
  if (!config) throw new TypeError('Unsupported tutoring action');
  if (typeof learner !== 'string' || !learner || learner.length > 128 || /[\x00-\x1f]/.test(learner)) throw new TypeError('Invalid learner ID');
  if (typeof guardianToken !== 'string' || !guardianToken.trim()) throw new TypeError('Guardian authorization required');
  const base = env.SOTEACH_PRIVATE_URL;
  const secret = env.SOTEACH_SERVICE_TOKEN;
  if (!base || !secret || secret.length < 32) throw new SoTeachUnavailable();
  let url;
  try {
    const origin = new URL(base);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') throw new Error('unsafe URL');
    url = new URL('/learners/' + encodeURIComponent(learner) + '/' + config[1], origin);
  } catch { throw new SoTeachUnavailable(); }
  const [method] = config;
  if (method === 'GET' && body !== undefined) throw new TypeError('GET cannot include body');
  const payload = method === 'POST' ? JSON.stringify(body ?? {}) : undefined;
  if (payload && payload.length > 16384) throw new TypeError('Tutoring input exceeds size limit');
  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers: {
        'X-SoTeach-Service-Token': secret,
        'Authorization': 'Bearer ' + guardianToken,
        'Accept': 'application/json',
        ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      },
      body: payload,
      signal: AbortSignal.timeout(12000),
      cache: 'no-store',
      redirect: 'error',
    });
  } catch { throw new SoTeachUnavailable(); }
  if (!response.ok) {
    if (response.status >= 500) throw new SoTeachUnavailable();
    throw new SoTeachResponseError(response.status);
  }
  if (!(response.headers.get('content-type') ?? '').includes('application/json')) throw new SoTeachUnavailable();
  const raw = await response.text();
  if (raw.length > 65536) throw new SoTeachUnavailable();
  try { return JSON.parse(raw); } catch { throw new SoTeachUnavailable(); }
}
