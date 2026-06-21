import { toPng } from "html-to-image";
import { Outfit } from "@/types";

export async function exportOutfitAsPng(
  outfit: Outfit,
  node: HTMLElement
): Promise<void> {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    width: 1200,
    height: 675,
  });

  const link = document.createElement("a");
  link.download = `${outfit.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`;
  link.href = dataUrl;
  link.click();
}
