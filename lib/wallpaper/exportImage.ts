import { toPng } from "html-to-image";

export async function exportWallpaper(
  node: HTMLElement,
  filename: string = "jadwal-wallpaper.png"
) {
  const dataUrl = await toPng(node, {
    pixelRatio: 1, // node udah didesain 1080x2340 asli, ga perlu upscale
    cacheBust: true,
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}