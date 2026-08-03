const { put, get } = require("@vercel/blob");

const BLOB_PATH = "org-chart/aug-2026.json";

function hasBlobCredentials() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  // OIDC auth (default for newly connected Blob stores)
  if (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) return true;
  return false;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body != null) {
    if (typeof req.body === "string") {
      return req.body ? JSON.parse(req.body) : null;
    }
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

async function readStoredPayload() {
  const result = await get(BLOB_PATH, { access: "private", useCache: false });
  if (!result || result.statusCode === 404) return null;
  if (result.statusCode !== 200) {
    const err = new Error(`blob_get_failed_${result.statusCode}`);
    err.statusCode = result.statusCode;
    throw err;
  }
  // Prefer stream → text for JSON; fall back to result fields if present.
  if (result.stream) {
    const text = await new Response(result.stream).text();
    return text ? JSON.parse(text) : null;
  }
  if (typeof result.body === "string") return JSON.parse(result.body);
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!hasBlobCredentials()) {
    send(res, 503, {
      error: "not_configured",
      message:
        "Connect Blob store nfty-org-chart-blob to this Vercel project (Storage → connect for Production + Preview).",
    });
    return;
  }

  try {
    if (req.method === "GET") {
      const data = await readStoredPayload();
      if (!data) {
        send(res, 404, { error: "not_found" });
        return;
      }
      send(res, 200, data);
      return;
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      if (!body || body.payload == null) {
        send(res, 400, { error: "payload_required" });
        return;
      }
      const stored = {
        id: "aug-2026",
        payload: body.payload,
        updated_at: new Date().toISOString(),
      };
      await put(BLOB_PATH, JSON.stringify(stored), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      send(res, 200, { ok: true, updated_at: stored.updated_at });
      return;
    }

    send(res, 405, { error: "method_not_allowed" });
  } catch (err) {
    console.error("org-chart api error:", err);
    send(res, 500, { error: err.message || "server_error" });
  }
};
