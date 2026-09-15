const BASE = '/api/fleet';

async function handle(res) {
  let body = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    const err = new Error(body?.message || body?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.payload = body;
    throw err;
  }
  return body;
}

export async function fetchFleet(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(qs ? `${BASE}?${qs}` : BASE);
  return handle(res);
}

export async function reroute(id, { destination, replacementDriver }) {
  const res = await fetch(`${BASE}/${id}/reroute`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination, replacementDriver }),
  });
  return handle(res);
}

export async function bulkAction(ids, action) {
  const res = await fetch(`${BASE}/bulk-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, action }),
  });
  return handle(res);
}
