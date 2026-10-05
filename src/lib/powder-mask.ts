// The fallback uses the same pigment boundary as the particle renderer. The
// original photograph remains intact; only a browser-local alpha mask is made.
const powderMasks = new Map<string, Promise<string | null>>();
export function powderMask(source: string): Promise<string | null> {
  const cached = powderMasks.get(source);
  if (cached) return cached;
  const pending = (async () => {
    const photograph = new window.Image();
    photograph.decoding = "async";
    photograph.src = source;
    await photograph.decode();
    const scale = Math.min(1, 720 / photograph.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(photograph.naturalWidth * scale);
    canvas.height = Math.round(photograph.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(photograph, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = pixels;
    for (let offset = 0; offset < data.length; offset += 4) {
      const r = data[offset]!;
      const g = data[offset + 1]!;
      const b = data[offset + 2]!;
      const pigment = g - r > 3 && g - b > 9 && g > b * 1.16;
      data[offset] = data[offset + 1] = data[offset + 2] = 255;
      data[offset + 3] = pigment ? 255 : 0;
    }
    context.putImageData(pixels, 0, 0);
    const result = canvas.toDataURL("image/png");
    canvas.width = canvas.height = 1;
    return result;
  })().catch(() => null);
  powderMasks.set(source, pending);
  return pending;
}
