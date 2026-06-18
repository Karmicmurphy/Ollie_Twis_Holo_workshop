const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: JSON_HEADERS });
}

function corsHeaders(origin = '*') {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400'
  };
}

async function safeJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) return null;
  const text = await request.text();
  if (text.length > 64_000) throw new Error('request body too large');
  return JSON.parse(text || '{}');
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });

  if (url.pathname === '/api/health') {
    return json({
      ok: true,
      name: 'Twis Holo Remote Hull',
      mode: env.TWIS_REMOTE_HULL_MODE || 'public-shell',
      localFirst: true,
      cloudOptional: true,
      aiEnabled: env.TWIS_ALLOW_AI === 'true',
      remoteWriteEnabled: env.TWIS_ALLOW_REMOTE_WRITE === 'true'
    });
  }

  if (url.pathname === '/api/capabilities') {
    return json({
      capabilities: [
        'static-workshop-shell',
        'health-check',
        'read-only-hull-status',
        'future-capsule-inbox',
        'future-receipt-mirror',
        'future-light-ai-helper'
      ],
      blockedByDefault: [
        'canon-approval',
        'source-delete',
        'publish',
        'spend-money',
        'shell-execution',
        'secret-access',
        'remote-private-archive-scan'
      ]
    });
  }

  if (url.pathname === '/api/inbox' && request.method === 'POST') {
    if (env.TWIS_ALLOW_REMOTE_WRITE !== 'true') {
      return json({ ok: false, error: 'remote inbox writes disabled by default' }, 403);
    }
    const body = await safeJson(request);
    return json({ ok: true, accepted: true, bodyPreview: body ? Object.keys(body) : [] });
  }

  if (url.pathname === '/api/ai/summarize' && request.method === 'POST') {
    if (env.TWIS_ALLOW_AI !== 'true') {
      return json({ ok: false, error: 'remote AI helper disabled by default' }, 403);
    }
    return json({ ok: false, error: 'AI binding not wired yet; keep this disabled until receipts and budget gates exist' }, 501);
  }

  return json({ ok: false, error: 'not found' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return handleApi(request, env);
      return env.ASSETS.fetch(request);
    } catch (err) {
      return json({ ok: false, error: err && err.message ? err.message : 'remote hull error' }, 500);
    }
  }
};
