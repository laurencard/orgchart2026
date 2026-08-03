const BLOB_PATH = "org-chart/aug-2026.json";
const BLOB_API = "https://vercel.com/api/blob";
const API_VERSION = "7";

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN || "";
}

function storeHost() {
  // token shape: vercel_blob_rw_<STOREID>_<SECRET>
  const parts = token().split("_");
  const storeId = parts[3] || "";
  return `${storeId.toLowerCase()}.private.blob.vercel-storage.com`;
}

function blobObjectUrl() {
  return `https://${storeHost()}/${BLOB_PATH}`;
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
  const upstream = await fetch(blobObjectUrl(), {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (upstream.status === 404) return null;
  if (!upstream.ok) {
    const err = new Error(`blob_fetch_failed_${upstream.status}`);
    err.statusCode = upstream.status;
    throw err;
  }
  return upstream.json();
}

async function writeStoredPayload(stored) {
  const params = new URLSearchParams({ pathname: BLOB_PATH });
  const upstream = await fetch(`${BLOB_API}/?${params}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token()}`,
      "x-api-version": API_VERSION,
      "x-vercel-blob-access": "private",
      "x-add-random-suffix": "0",
      "x-allow-overwrite": "1",
      "x-content-type": "application/json",
    },
    body: JSON.stringify(stored),
  });
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    const err = new Error(`blob_put_failed_${upstream.status}${text ? `: ${text}` : ""}`);
    err.statusCode = upstream.status;
    throw err;
  }
  return upstream.json().catch(() => ({}));
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

  if (!token()) {
    send(res, 503, {
      error: "not_configured",
      message:
        "Connect Blob store nfty-org-chart-blob to this Vercel project (Storage → Projects → Production + Preview).",
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
      await writeStoredPayload(stored);
      send(res, 200, { ok: true, updated_at: stored.updated_at });
      return;
    }

    send(res, 405, { error: "method_not_allowed" });
  } catch (err) {
    console.error("org-chart api error:", err);
    send(res, 500, { error: err.message || "server_error" });
  }
};
