import { json, method } from './_lib/http.js';
import { clearSessionCookie } from './_lib/auth.js';

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  return json(res, 200, { ok: true }, [clearSessionCookie()]);
}


