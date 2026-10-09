/**
 * Cliente HTTP para la API REST del concesionario.
 * Traduce el formato ErrorResponse de la API en excepciones tipadas.
 */

export class ApiError extends Error {
  constructor(message, status = 0, details = [], body = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.body = body;
  }

  get isNetwork() {
    return this.status === 0;
  }
}

function notificar(online) {
  window.dispatchEvent(new CustomEvent('api:status', { detail: online }));
}

async function request(method, path, body) {
  const options = {
    method,
    headers: { Accept: 'application/json' },
  };
  if (body !== undefined && body !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, options);
  } catch (e) {
    notificar(false);
    throw new ApiError('No se pudo conectar con la API. Verifica que el servidor esté ejecutándose.', 0);
  }

  notificar(true);

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && data.message) || `Error ${response.status} ${response.statusText}`;
    const details = (data && Array.isArray(data.details)) ? data.details : [];
    throw new ApiError(message, response.status, details, data);
  }

  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
