export type TastingCardImage = {
  heading: string;
  title: string;
  code: string;
  facts: readonly { label: string; value: string }[];
  notesLabel: string;
  notes: string;
  footer: string;
};

export type TastingCardPalette = {
  surface: string;
  ink: string;
  muted: string;
  line: string;
};

type TextLine = {
  text: string;
  x: number;
  baseline: number;
  size: number;
  width: number;
  color: string;
};

/** Generate only on an explicit download action; all rendering stays local. */
export async function downloadTastingCard(
  card: TastingCardImage,
  fontFamily: string,
  palette: TastingCardPalette,
): Promise<void> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tasting card image rendering is unavailable.");

  const width = 1200;
  const inset = 72;
  const contentWidth = width - inset * 2;
  const family = fontFamily.trim() || '"Courier New", monospace';
  const { ink, muted } = palette;
  const lines: TextLine[] = [];
  const rules: number[] = [];
  const words = new Intl.Segmenter(undefined, { granularity: "word" });
  const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const font = (size: number) => `400 ${size}px ${family}`;

  function wrap(text: string, available: number) {
    const result: string[] = [];
    // Keep blank lines, including a final newline. A long unbroken note can
    // wrap without splitting combining marks, emoji sequences or surrogate pairs.
    for (const paragraph of text.replace(/\t/g, "    ").split(/\r\n|\r|\n/u)) {
      let line = "";
      for (const { segment } of words.segment(paragraph)) {
        if (context!.measureText(line + segment).width <= available) {
          line += segment;
          continue;
        }
        if (line) {
          result.push(line.trimEnd());
          line = "";
        }
        if (!segment.trim()) continue;
        for (const { segment: grapheme } of graphemes.segment(segment)) {
          if (line && context!.measureText(line + grapheme).width > available) {
            result.push(line);
            line = "";
          }
          line += grapheme;
        }
      }
      result.push(line.trimEnd());
    }
    return result;
  }

  function textBlock(
    text: string,
    top: number,
    size: number,
    color = ink,
    x = inset,
    available = contentWidth,
  ) {
    context!.font = font(size);
    context!.textBaseline = "alphabetic";
    let y = top;
    for (const line of wrap(text, available)) {
      const measured = context!.measureText(line);
      const ascent = Math.max(size, measured.actualBoundingBoxAscent);
      const descent = Math.max(size * 0.3, measured.actualBoundingBoxDescent);
      lines.push({
        text: line,
        x,
        baseline: y + ascent,
        size,
        color,
        width: available,
      });
      y += Math.ceil(ascent + descent + size * 0.35);
    }
    return y;
  }

  let y = textBlock("ATOMA", inset, 38);
  rules.push((y += 20));
  y += 32;
  const headingBottom = textBlock(card.heading, y, 20, muted, inset, 720);
  const codeBottom = textBlock(card.code, y, 20, ink, 840, 288);
  y = Math.max(headingBottom, codeBottom) + 20;
  y = textBlock(card.title, y, 44) + 24;
  rules.push(y);

  for (const fact of card.facts) {
    y += 24;
    const labelBottom = textBlock(fact.label, y, 20, muted, inset, 276);
    const valueBottom = textBlock(
      fact.value,
      y,
      26,
      ink,
      inset + 308,
      contentWidth - 308,
    );
    y = Math.max(labelBottom, valueBottom) + 24;
    rules.push(y);
  }

  y = textBlock(card.notesLabel, y + 32, 20, muted) + 16;
  y = textBlock(card.notes, y, 26) + 32;
  rules.push(y);
  y = textBlock(card.footer, y + 28, 18, muted);
  const height = Math.max(900, Math.ceil(y + inset));
  // Keep unusually long cards within conservative canvas memory/dimension
  // limits. Scale the complete layout instead of dropping or clipping notes.
  const scale = Math.min(
    1,
    16384 / height,
    Math.sqrt(16_000_000 / (width * height)),
  );
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.ceil(height * scale);
  context.scale(scale, scale);
  context.fillStyle = palette.surface;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = palette.line;
  context.lineWidth = 1;
  context.strokeRect(28, 28, width - 56, height - 56);
  for (const top of rules) {
    context.beginPath();
    context.moveTo(inset, top);
    context.lineTo(width - inset, top);
    context.stroke();
  }
  context.textBaseline = "alphabetic";
  for (const line of lines) {
    context.font = font(line.size);
    context.fillStyle = line.color;
    context.fillText(line.text, line.x, line.baseline, line.width);
  }

  let blob: Blob;
  try {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("The tasting card image could not be created."));
      }, "image/png");
    });
  } finally {
    canvas.width = canvas.height = 1;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "atoma-tasting-card.png";
  link.hidden = true;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Safari can consume the blob after the click handler finishes.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
