// Named-color dictionary used to translate custom HEX colors into the
// closest color name for prompt output. Image generators understand
// color names far better than raw HEX codes.
// Reference values are representative swatches for each name; the 20
// palette colors reuse the exact swatch values from ColorPicker.tsx so
// a custom color identical to a palette swatch maps to the palette name.
export const namedColors: ReadonlyArray<readonly [name: string, hex: string]> = [
  ["black", "#000000"], ["jet black", "#0A0A0A"], ["charcoal gray", "#36454F"],
  ["gray", "#808080"], ["silver", "#C0C0C0"], ["white", "#FFFFFF"],
  ["pearl white", "#F8F6F0"], ["ivory", "#FFFFF0"], ["cream", "#FFFDD0"],
  ["beige", "#D8C3A5"], ["tan", "#D2B48C"], ["brown", "#8B4513"],
  ["dark brown", "#5C3317"], ["copper", "#B87333"], ["bronze", "#CD7F32"],
  ["red", "#DC2626"], ["crimson", "#DC143C"], ["scarlet", "#FF2400"],
  ["dark red", "#8B0000"], ["maroon", "#800000"], ["wine red", "#722F37"],
  ["burgundy", "#800020"], ["pink", "#F472B6"], ["hot pink", "#FF69B4"],
  ["rose pink", "#FF66A3"], ["coral pink", "#F88379"], ["pale pink", "#FADADD"],
  ["magenta", "#FF00FF"], ["purple", "#9333EA"], ["violet", "#8F00FF"],
  ["deep purple", "#4A148C"], ["royal purple", "#7851A9"], ["lavender", "#C4B5FD"],
  ["blue", "#2563EB"], ["royal blue", "#4169E1"], ["navy", "#1E3A5F"],
  ["sky blue", "#87CEEB"], ["light blue", "#ADD8E6"], ["cyan", "#00FFFF"],
  ["teal", "#008080"], ["turquoise", "#40E0D0"],
  ["green", "#16A34A"], ["emerald green", "#50C878"], ["dark green", "#006400"],
  ["olive green", "#808000"], ["lime green", "#32CD32"], ["mint green", "#A7F3D0"],
  ["yellow", "#FACC15"], ["mustard yellow", "#E1AD01"], ["gold", "#D4AF37"],
  ["orange", "#F97316"], ["dark orange", "#FF8C00"], ["peach", "#FFDAB9"],
] as const;

type Lab = { l: number; a: number; b: number };

function hexToLab(hex: string): Lab {
  const h = hex.replace(/^#/, "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lr = linear(r), lg = linear(g), lb = linear(b);
  // sRGB D65
  let x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  let y = (lr * 0.2126 + lg * 0.7152 + lb * 0.0722) / 1.0;
  let z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x); y = f(y); z = f(z);
  return { l: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

const labCache = new Map<string, Lab>();
function labOf(hex: string): Lab {
  const key = hex.toUpperCase();
  let lab = labCache.get(key);
  if (!lab) { lab = hexToLab(key); labCache.set(key, lab); }
  return lab;
}

/** Return the name of the dictionary color closest (CIE76 ΔE) to the given HEX. */
export function nearestColorName(hex: string): string {
  const target = labOf(hex);
  let best = namedColors[0][0];
  let bestDistance = Infinity;
  for (const [name, ref] of namedColors) {
    const lab = labOf(ref);
    const d = (lab.l - target.l) ** 2 + (lab.a - target.a) ** 2 + (lab.b - target.b) ** 2;
    if (d < bestDistance) { bestDistance = d; best = name; }
  }
  return best;
}

/**
 * The color string to embed in a generated prompt:
 * "指定なし" stays empty, palette names pass through unchanged,
 * and custom HEX codes become the nearest color name.
 */
export function promptColorName(color: string): string {
  if (color === "指定なし") return "";
  return color.startsWith("#") ? nearestColorName(color) : color;
}
