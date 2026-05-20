// Calcula relativa luminância simplificada (sRGB linear → coeficientes BT.709).
// Não é WCAG-completo (sem gamma correction), mas suficiente pra escolher texto
// branco vs preto em cima de cores arbitrárias de tag.
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3 && /^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0]! + clean[0]!, 16);
    const g = parseInt(clean[1]! + clean[1]!, 16);
    const b = parseInt(clean[2]! + clean[2]!, 16);
    return { r, g, b };
  }
  if (clean.length === 6 && /^[0-9a-fA-F]{6}$/.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return null;
}

export function contrastTextColor(hex: string): 'white' | 'black' {
  const rgb = parseHex(hex);
  if (!rgb) return 'black';
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return lum < 0.5 ? 'white' : 'black';
}
