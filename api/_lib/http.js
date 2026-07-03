export function json(res, status, body, cookies = []) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8' };
  if (cookies.length) headers['Set-Cookie'] = cookies;
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

export function method(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    json(res, 405, { ok: false, message: 'Metodo no permitido.' });
    return false;
  }
  return true;
}

export async function body(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const error = new Error('JSON inválido.');
    error.statusCode = 400;
    throw error;
  }
}

export function publicUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

