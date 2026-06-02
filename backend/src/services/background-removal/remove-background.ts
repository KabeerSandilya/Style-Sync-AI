/**
 * Background removal service.
 *
 * Production (REMOVE_BG_API_KEY set):
 *   Uses remove.bg REST API — stateless HTTP call, works on Vercel serverless.
 *
 * Local dev (no REMOVE_BG_API_KEY):
 *   Falls back to @imgly/background-removal-node — runs ONNX model locally.
 *   This branch must NOT be reached in production (model is too large / needs
 *   a persistent filesystem for caching).
 */

// ─── remove.bg API ───────────────────────────────────────────────────────────

async function removeBackgroundViaApi(imageUrl: string): Promise<Buffer> {
  const apiKey = process.env.REMOVE_BG_API_KEY!;

  const body = new FormData();
  body.append("size", "auto");

  if (imageUrl.startsWith("data:")) {
    // Base64 data URI → Blob so the API accepts it as a file upload
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URI format");
    const [, mimeType, base64] = match;
    const bytes = Buffer.from(base64, "base64");
    const blob = new Blob([bytes], { type: mimeType });
    body.append("image_file", blob, "image");
  } else {
    body.append("image_url", imageUrl);
  }

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`remove.bg API error ${res.status}: ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

// ─── @imgly local model (dev only) ───────────────────────────────────────────

async function removeBackgroundLocally(imageUrl: string): Promise<Buffer> {
  const { removeBackground: imglyRemove } = await import(
    "@imgly/background-removal-node"
  );

  let source: string | ArrayBuffer;

  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:[^;]+;base64,(.+)$/);
    if (!match) throw new Error("Invalid data URI format");
    const buf = Buffer.from(match[1], "base64");
    source = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } else {
    source = imageUrl;
  }

  const blob = await imglyRemove(source);
  return Buffer.from(await blob.arrayBuffer());
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function removeBackground(imageUrl: string): Promise<Buffer | null> {
  try {
    if (process.env.REMOVE_BG_API_KEY) {
      return await removeBackgroundViaApi(imageUrl);
    }
    // Local dev fallback — not suitable for serverless/Vercel
    console.warn(
      "[removeBackground] REMOVE_BG_API_KEY not set — using local @imgly model. " +
        "This will not work on Vercel. Set REMOVE_BG_API_KEY for production."
    );
    return await removeBackgroundLocally(imageUrl);
  } catch (error) {
    console.error("[removeBackground] failed:", error);
    return null;
  }
}
