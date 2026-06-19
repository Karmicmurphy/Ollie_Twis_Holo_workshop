const DEFAULT_MODEL = "@cf/openai/gpt-oss-20b";
const WORKSHOP_AGENT_MODEL = "@cf/zai-org/glm-5.2";

const BASE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: BASE_HEADERS
  });
}

function safeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && typeof m.content === "string")
    .slice(-24)
    .map((m) => ({
      role: ["system", "user", "assistant"].includes(m.role) ? m.role : "user",
      content: m.content.slice(0, 8000)
    }));
}

function textFromAiResult(result) {
  if (!result) return "";
  if (typeof result.response === "string") return result.response;
  if (typeof result.text === "string") return result.text;
  if (typeof result.result === "string") return result.result;
  if (result.choices && result.choices[0]?.message?.content) return result.choices[0].message.content;
  return "";
}

function errorMessage(error) {
  if (!error) return "Unknown Cloudflare AI error.";
  if (typeof error.message === "string") return error.message;
  return String(error);
}

export async function onRequestPost(context) {
  const env = context.env || {};

  if (!env.AI) {
    return json({
      ok: false,
      error: "Workers AI binding missing. Add a Workers AI binding named AI in Cloudflare Pages settings, then redeploy the Pages project."
    }, 503);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: "Expected JSON request body." }, 400);
  }

  const messages = safeMessages(body.messages);
  if (!messages.length) {
    return json({ ok: false, error: "No messages supplied." }, 400);
  }

  const model = typeof body.model === "string" && body.model.startsWith("@cf/")
    ? body.model
    : (env.TWIS_CF_AI_MODEL || DEFAULT_MODEL);

  try {
    const result = await env.AI.run(model, {
      messages,
      temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
      max_tokens: typeof body.max_tokens === "number" ? Math.min(body.max_tokens, 1200) : 800
    });

    const text = textFromAiResult(result) || "No text returned from Cloudflare AI.";

    return json({
      ok: true,
      id: "twis-cf-ai-" + Date.now(),
      object: "chat.completion",
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop"
        }
      ],
      text
    });
  } catch (error) {
    return json({
      ok: false,
      error: "Cloudflare AI call failed: " + errorMessage(error),
      model
    }, 502);
  }
}

export async function onRequestGet(context) {
  const hasBinding = Boolean(context.env?.AI);
  return json({
    ok: true,
    endpoint: "/api/ai/chat",
    method: "POST",
    bindingRequired: "AI",
    bindingPresent: hasBinding,
    defaultModel: context.env?.TWIS_CF_AI_MODEL || DEFAULT_MODEL,
    optionalWorkshopAgentModel: context.env?.TWIS_CF_AGENT_MODEL || WORKSHOP_AGENT_MODEL,
    deprecatedPreviousDefault: "@cf/meta/llama-3.1-8b-instruct",
    status: hasBinding ? "ready-to-probe" : "binding-missing"
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400"
    }
  });
}
