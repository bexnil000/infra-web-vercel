const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function ensureConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel.');
  }
}

function url(table, query = {}) {
  ensureConfig();
  const base = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(table)}`;
  const params = new URLSearchParams(query);
  return params.size ? `${base}?${params}` : base;
}

async function request(method, table, query = {}, payload, headers = {}) {
  const response = await fetch(url(table, query), {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers
    },
    body: payload ? JSON.stringify(payload) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || text || 'Error de Supabase');
  }

  return data;
}

export async function selectOne(table, filters = {}, select = '*') {
  const query = { select, limit: '1' };
  for (const [key, value] of Object.entries(filters)) query[key] = `eq.${value}`;
  const rows = await request('GET', table, query);
  return rows?.[0] || null;
}

export async function selectMany(table, filters = {}, select = '*', options = {}) {
  const query = { select };
  for (const [key, value] of Object.entries(filters)) query[key] = String(value).includes('.') ? value : `eq.${value}`;
  if (options.order) query.order = options.order;
  if (options.limit) query.limit = String(options.limit);
  return request('GET', table, query);
}

export async function insert(table, payload) {
  const rows = await request('POST', table, {}, payload, { Prefer: 'return=representation' });
  return rows?.[0] || null;
}

export async function update(table, filters, payload) {
  const query = {};
  for (const [key, value] of Object.entries(filters)) query[key] = `eq.${value}`;
  return request('PATCH', table, query, payload, { Prefer: 'return=representation' });
}

export async function remove(table, filters) {
  const query = {};
  for (const [key, value] of Object.entries(filters)) query[key] = `eq.${value}`;
  await request('DELETE', table, query);
}

