// Colour for a brand mark: near-black marks (Next.js etc.) follow the text colour so they show in dark mode.
export type Tool = { name?: string; icon?: { path: string; hex: string }; mono?: string; hex?: string };

export function brandColor(t: Tool): string {
  const hex = (t.icon?.hex ?? t.hex ?? '888888').replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18 ? 'var(--text)' : `#${hex}`;
}
