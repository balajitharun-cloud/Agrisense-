import { fetch as undiciFetch, ProxyAgent } from 'undici';

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function httpFetch(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await undiciFetch(url, { ...options, signal: controller.signal, dispatcher });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJson(url, options = {}, timeoutMs = 8000) {
  const res = await httpFetch(url, options, timeoutMs);
  if (!res.ok) throw new HttpError(res.status, `Request failed: ${res.status} ${url}`);
  return res.json();
}
