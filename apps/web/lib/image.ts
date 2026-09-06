/** Utilidades de imagen del lado del cliente: captura, reducción y medición de luz. */

export const MAX_EDGE = 1800;
export const JPEG_QUALITY = 0.85;

/** Dibuja el frame actual del video en un canvas reducido al lado mayor indicado. */
export function captureFrame(video: HTMLVideoElement, maxEdge = MAX_EDGE): HTMLCanvasElement {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.min(1, maxEdge / Math.max(vw, vh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el contexto de dibujo.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = JPEG_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo codificar la imagen."))), "image/jpeg", quality);
  });
}

/** Luminancia media en [0, 255] sobre una muestra reducida del video. */
export function meanLuminance(video: HTMLVideoElement): number {
  const w = 64;
  const h = Math.max(1, Math.round((video.videoHeight / Math.max(1, video.videoWidth)) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 128;
  ctx.drawImage(video, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
  }
  return sum / (data.length / 4);
}
