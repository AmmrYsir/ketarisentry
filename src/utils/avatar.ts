import type { UserRole } from '../types';

/**
 * Generates initial letters from a full name (e.g. "Ammar Yasir" -> "AY")
 */
export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Color themes based on user role or hash string
 */
export function getRoleColorTheme(role?: UserRole): {
  bgGradient: string;
  borderColor: string;
  textColor: string;
  bgHex: string;
  textHex: string;
} {
  switch (role) {
    case 'superadmin':
      return {
        bgGradient: 'from-purple-900 via-slate-900 to-purple-950',
        borderColor: 'border-purple-500/40',
        textColor: 'text-purple-300',
        bgHex: '#3b0764',
        textHex: '#d8b4fe',
      };
    case 'admin':
      return {
        bgGradient: 'from-emerald-900 via-slate-900 to-emerald-950',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-300',
        bgHex: '#064e3b',
        textHex: '#6ee7b7',
      };
    case 'operator':
      return {
        bgGradient: 'from-amber-900 via-slate-900 to-amber-950',
        borderColor: 'border-amber-500/40',
        textColor: 'text-amber-300',
        bgHex: '#78350f',
        textHex: '#fcd34d',
      };
    case 'viewer':
    default:
      return {
        bgGradient: 'from-indigo-900 via-slate-900 to-indigo-950',
        borderColor: 'border-indigo-500/40',
        textColor: 'text-indigo-300',
        bgHex: '#312e81',
        textHex: '#a5b4fc',
      };
  }
}

/**
 * Generates an SVG Data URL containing a sleek gradient initial badge
 */
export function generateInitialsSvgDataUrl(name: string, role?: UserRole): string {
  const initials = getInitials(name);
  const theme = getRoleColorTheme(role);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bgHex}" />
        <stop offset="100%" stop-color="#090d16" />
      </linearGradient>
    </defs>
    <rect width="128" height="128" rx="32" fill="url(#grad)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
    <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="48" fill="${theme.textHex}" dominant-baseline="middle" text-anchor="middle" letter-spacing="1">
      ${initials}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
