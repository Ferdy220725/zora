"use client";

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist")> | null = null;

async function getPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      return lib;
    });
  }
  return pdfjsLibPromise;
}

export async function loadPdf(url: string) {
  const pdfjsLib = await getPdfjs();
  const loadingTask = pdfjsLib.getDocument(url);
  return loadingTask.promise;
}

export async function renderPageToCanvas(
  pdf: any,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
}

// Dipakai saat upload: bikin thumbnail kecil dari halaman pertama, hasilnya base64 JPEG
export async function generateThumbnail(file: File): Promise<string> {
  const pdfjsLib = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvas = document.createElement("canvas");
  await renderPageToCanvas(pdf, 1, canvas, 0.5);
  return canvas.toDataURL("image/jpeg", 0.6);
}

export async function getPageCount(url: string): Promise<number> {
  const pdf = await loadPdf(url);
  return pdf.numPages;
}