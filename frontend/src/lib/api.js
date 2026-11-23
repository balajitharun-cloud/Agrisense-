import { fetchStaticSnapshot } from './staticApi.js';

const READ_ONLY_PATHS = ['/auth/', '/account/', '/voice/tts', '/translate'];

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  let liveError;
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.ok && data !== null) return data;
    liveError = Object.assign(
      new Error((data && data.error) || `Request failed (${res.status})`),
      { status: res.status }
    );
    if (res.ok) throw liveError;
  } catch (err) {
    liveError = err && err.status !== undefined
      ? err
      : Object.assign(new Error('Network unreachable — showing whatever is cached or simulated.'), { status: 0 });
  }
  if (method === 'GET') {
    try {
      return await fetchStaticSnapshot(path);
    } catch {
      throw liveError;
    }
  }
  if (READ_ONLY_PATHS.some((p) => path.startsWith(p))) {
    throw Object.assign(
      new Error('This hosted demo is read-only — accounts, voice and translation need the running server build (npm start).'),
      { status: 501 }
    );
  }
  throw liveError;
}

export const apiGet = (path, token) => request(path, { token });
export const apiPost = (path, body, token) => request(path, { method: 'POST', body, token });
export const apiPatch = (path, body, token) => request(path, { method: 'PATCH', body, token });
