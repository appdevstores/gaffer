// §2 avatarSeed → local avatar renderer.
// Gaffer is offline-first, so avatars are rendered locally from the seed (a
// Dicebear-style hex string). The palette is derived deterministically from the
// seed so a given player always renders identically on every device.

const PALETTE = [
  '#2563EB', '#7C3AED', '#DB2777', '#EA580C',
  '#059669', '#D97706', '#0891B2', '#DC2626',
  '#4F46E5', '#16A34A', '#9333EA', '#E11D48',
];

export function avatarColor(seed: string): string {
  if (!seed) return PALETTE[0];
  const hash = parseInt(seed.slice(0, 8), 16) || 0;
  return PALETTE[hash % PALETTE.length];
}

export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
