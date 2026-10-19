export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function text(value, name, max, optional = false) {
  if (optional && (value === undefined || value === null || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpError(400, `${name} must contain 1–${max} characters.`);
  return value.trim();
}
export function points(value) {
  if (!Number.isInteger(value) || value < 1 || value > 10000) throw new HttpError(400, 'Points must be a whole number between 1 and 10,000.');
  return value;
}
export function id(value) { return text(value, 'ID', 100); }
export function entryDate(value) {
  if (!value) return new Intl.DateTimeFormat('en-CA', {timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new HttpError(400, 'Enter a valid date.');
  return value;
}
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'Cross-site requests are not allowed.');
}
export async function jsonBody(request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Send application/json.');
  const body = await request.text();
  if (body.length > 8192) throw new HttpError(413, 'Request is too large.');
  try { const value = JSON.parse(body); if (!value || Array.isArray(value) || typeof value !== 'object') throw Error(); return value; }
  catch { throw new HttpError(400, 'Invalid JSON body.'); }
}
