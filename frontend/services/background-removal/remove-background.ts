import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal-node";

export async function removeBackground(imageUrl: string): Promise<Buffer | null> {
  try {
    let source: string | ArrayBuffer;

    // @imgly/background-removal-node accepts https URLs or ArrayBuffer — not data URIs
    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:[^;]+;base64,(.+)$/);
      if (!match) return null;
      const buffer = Buffer.from(match[1], "base64");
      source = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    } else {
      source = imageUrl;
    }

    const resultBlob = await imglyRemoveBackground(source);
    return Buffer.from(await resultBlob.arrayBuffer());
  } catch (error) {
    console.error("Background removal failed:", error);
    return null;
  }
}
