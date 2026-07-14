const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

const DEFAULT_MODEL = '@cf/openai/gpt-oss-20b';
const WORKSHOP_AGENT_MODEL = '@cf/zai-org/glm-5.2';

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

async function safeJson(request, maxBytes = 64_000) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) return null;
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('request body too large');
  return JSON.parse(text || '{}');
}

function safeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === 'string')
    .slice(-24)
    .map((m) => ({
      role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
      content: m.content.slice(0, 8000)
    }));
}

function textFromAiResult(result) {
  if (!result) return '';
  if (typeof result.response === 'string') return result.response;
  if (typeof result.text === 'string') return result.text;
  if (typeof result.result === 'string') return result.result;
  if (result.choices && result.choices[0]?.message?.content) return result.choices[0].message.content;
  return '';
}

function errorMessage(error) {
  if (!error) return 'Unknown Cloudflare AI error.';
  if (typeof error.message === 'string') return error.message;
  return String(error);
}

async function handleAiChat(request, env) {
  if (request.method === 'GET') {
    const hasBinding = Boolean(env.AI);
    return json({
      ok: true,
      endpoint: '/api/ai/chat',
      method: 'POST',
      bindingRequired: 'AI',
      bindingPresent: hasBinding,
      defaultModel: env.TWIS_CF_AI_MODEL || DEFAULT_MODEL,
      optionalWorkshopAgentModel: env.TWIS_CF_AGENT_MODEL || WORKSHOP_AGENT_MODEL,
      status: hasBinding ? 'ready-to-probe' : 'binding-missing',
      localFirst: true,
      cloudRole: 'away-mode field kit, not private authority'
    });
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);

  if (env.TWIS_ALLOW_AI !== 'true') {
    return json({ ok: false, error: 'Cloudflare AI is disabled. Set TWIS_ALLOW_AI=true only after cost/privacy review.' }, 403);
  }

  if (!env.AI) {
    return json({ ok: false, error: 'Workers AI binding missing. Add a binding named AI, then redeploy.' }, 503);
  }

  let body;
  try {
    body = await safeJson(request, 96_000);
  } catch (err) {
    return json({ ok: false, error: 'Bad JSON request: ' + errorMessage(err) }, 400);
  }

  const messages = safeMessages(body?.messages);
  if (!messages.length) return json({ ok: false, error: 'No messages supplied.' }, 400);

  const requestedModel = typeof body.model === 'string' && body.model.startsWith('@cf/')
    ? body.model
    : (env.TWIS_CF_AI_MODEL || DEFAULT_MODEL);

  try {
    const result = await env.AI.run(requestedModel, {
      messages,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      max_tokens: typeof body.max_tokens === 'number' ? Math.min(body.max_tokens, 1200) : 800
    });

    const text = textFromAiResult(result) || 'No text returned from Cloudflare AI.';
    return json({
      ok: true,
      id: 'twis-cf-ai-' + Date.now(),
      object: 'chat.completion',
      model: requestedModel,
      choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      text
    });
  } catch (error) {
    return json({ ok: false, error: 'Cloudflare AI call failed: ' + errorMessage(error), model: requestedModel }, 502);
  }
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
        'cloudflare-ai-chat-when-enabled',
        'future-capsule-inbox',
        'future-receipt-mirror'
      ],
      endpoints: ['/api/health', '/api/capabilities', '/api/ai/chat', '/api/inbox'],
      blockedByDefault: [
        'canon-approval',
        'source-delete',
        'publish',
        'spend-money',
        'shell-execution',
        'secret-access',
        'remote-private-archive-scan'
      ],
      gates: {
        ai: 'disabled unless TWIS_ALLOW_AI=true and AI binding exists',
        remoteWrite: 'disabled unless TWIS_ALLOW_REMOTE_WRITE=true',
        localAuthority: 'local PC and local SQLite remain source of truth'
      }
    });
  }

  if (url.pathname === '/api/ai/chat') return handleAiChat(request, env);

  if (url.pathname === '/api/inbox' && request.method === 'POST') {
    if (env.TWIS_ALLOW_REMOTE_WRITE !== 'true') {
      return json({ ok: false, error: 'remote inbox writes disabled by default' }, 403);
    }
    const body = await safeJson(request);
    return json({ ok: true, accepted: true, bodyPreview: body ? Object.keys(body) : [] });
  }

  if (url.pathname === '/api/ai/summarize' && request.method === 'POST') {
    return json({ ok: false, error: 'Use /api/ai/chat. Summarize is intentionally disabled until receipt and budget gates exist.' }, 501);
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