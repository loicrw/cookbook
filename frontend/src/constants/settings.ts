/**
 * The letter sizes offered in Settings, as multipliers applied to font sizes.
 * The stored `fontSizeLevel` is an index into this list, and the default sits
 * in the middle so the slider can be moved either way from it.
 */
export const FONT_SIZE_LEVELS = [
  { label: "Smallest", scale: 0.8 },
  { label: "Smaller", scale: 0.9 },
  { label: "Default", scale: 1 },
  { label: "Larger", scale: 1.2 },
  { label: "Largest", scale: 1.4 },
];

export const DEFAULT_FONT_SIZE_LEVEL = 2;

/**
 * Up to data format v4 the list started at "Small" and the default was index 1,
 * so a stored level has to be moved along to keep the size the user chose.
 */
export function migrateFontSizeLevel(level: number): number {
  const moved = [1, 2, 3, 4, 4];
  return moved[level] ?? DEFAULT_FONT_SIZE_LEVEL;
}
