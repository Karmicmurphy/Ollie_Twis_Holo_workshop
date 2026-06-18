const VERSION = "1.1.0";

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Twis-Holo-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
}

function authorized(request, env) {
  if (!env.REMOTE_WRITE_TOKEN) return true;
  const header = request.headers.get("X-Twis-Holo-Token") || "";
  const auth = request.headers.get("Authorization") || "";
  return header === env.REMOTE_WRITE_TOKEN || auth === `Bearer ${env.REMOTE_WRITE_TOKEN}`;
}

export class ProjectRoom {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.endsWith("/state")) {
      return Response.json(await this.state.storage.get("project") || {});
    }
    if (request.method === "POST" && url.pathname.endsWith("/state")) {
      if (!authorized(request, this.env)) return Response.json({ error: "unauthorized" }, { status: 401 });
      const update = await request.json();
      const current = await this.state.storage.get("project") || {};
      const next = {
        ...current,
        ...update,
        authoritative: false,
        updatedAt: new Date().toISOString()
      };
      await this.state.storage.put("project", next);
      return Response.json({ ok: true, project: next });
    }
    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(env);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "twis-holo-remote", version: VERSION, authoritative: false }, { headers: cors });
    }

    if (url.pathname === "/capabilities") {
      return Response.json({
        name: "Twis Holo Cloudflare Remote Hull",
        version: VERSION,
        authoritative: false,
        storage: ["sqlite-backed-durable-object"],
        endpoints: ["/health", "/capabilities", "/projects/:id/state"],
        security: {
          writeTokenSupported: true,
          tokenRequiredWhenREMOTE_WRITE_TOKENIsSet: true,
          allowedOriginEnv: "ALLOWED_ORIGIN",
          localWorkshopRemainsSourceOfTruth: true
        }
      }, { headers: cors });
    }

    const m = url.pathname.match(/^\/projects\/([^/]+)\/state$/);
    if (m) {
      const id = env.PROJECT_ROOM.idFromName(m[1]);
      const resp = await env.PROJECT_ROOM.get(id).fetch(request);
      const headers = new Headers(resp.headers);
      Object.entries(cors).forEach(([k, v]) => headers.set(k, v));
      return new Response(resp.body, { status: resp.status, headers });
    }

    return new Response("Twis Holo remote hull", { headers: cors });
  }
};
