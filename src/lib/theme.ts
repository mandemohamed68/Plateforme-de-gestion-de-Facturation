/**
 * Color and Theming Utilities for Dynamic White-Label Branding
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  sidebarBg: string;
  isDarkSidebar: boolean;
  sidebarText: string;
  sidebarTextMuted: string;
  sidebarBorder: string;
  sidebarHoverBg: string;
  activeNavBg: string;
  activeNavText: string;
  buttonGradient: string;
  accentText: string;
  badgeBg: string;
}

/**
 * Determines whether a given hex color is perceived as dark
 */
export function isDarkColor(hex: string): boolean {
  try {
    const { r, g, b } = hexToRgb(hex);
    // YIQ formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 140;
  } catch {
    return false;
  }
}

/**
 * Converts hex to RGB components
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== 'string') {
    return { r: 2, g: 132, b: 199 };
  }
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) {
    return { r: 2, g: 132, b: 199 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Darkens a hex color by a given factor (0 to 1)
 */
export function darkenHex(hex: string, factor: number = 0.6): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const newR = Math.round(Math.max(0, Math.min(255, r * (1 - factor))));
    const newG = Math.round(Math.max(0, Math.min(255, g * (1 - factor))));
    const newB = Math.round(Math.max(0, Math.min(255, b * (1 - factor))));
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  } catch (e) {
    return '#090d16';
  }
}

/**
 * Lightens a hex color by a given factor (0 to 1)
 */
export function lightenHex(hex: string, factor: number = 0.3): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    const newR = Math.round(Math.min(255, r + (255 - r) * factor));
    const newG = Math.round(Math.min(255, g + (255 - g) * factor));
    const newB = Math.round(Math.min(255, b + (255 - b) * factor));
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  } catch (e) {
    return typeof hex === 'string' ? hex : '#0284c7';
  }
}

/**
 * Resolves comprehensive theme styling from company settings or color strings
 */
export function getAppTheme(
  primaryColorOrCompany?: any,
  customSidebarColor?: string
): ThemeColors {
  let rawPrimary: string | undefined;
  let rawSidebar: string | undefined = customSidebarColor;

  let rawSecondary: string | undefined;

  if (primaryColorOrCompany && typeof primaryColorOrCompany === 'object') {
    rawPrimary = primaryColorOrCompany.primary_color || primaryColorOrCompany.primaryColor;
    rawSecondary = primaryColorOrCompany.secondary_color || primaryColorOrCompany.secondaryColor;
    rawSidebar = rawSidebar || primaryColorOrCompany.sidebar_color || primaryColorOrCompany.sidebarColor;
  } else if (typeof primaryColorOrCompany === 'string') {
    rawPrimary = primaryColorOrCompany;
  }

  const primary = (rawPrimary && typeof rawPrimary === 'string' && rawPrimary.trim())
    ? rawPrimary.trim()
    : '#0f172a';

  const secondary = (rawSecondary && typeof rawSecondary === 'string' && rawSecondary.trim())
    ? rawSecondary.trim()
    : '#10b981';
  
  let sidebarBg = (rawSidebar && typeof rawSidebar === 'string' && rawSidebar.trim())
    ? rawSidebar.trim()
    : undefined;

  if (!sidebarBg) {
    sidebarBg = '#ffffff';
  }

  const isDarkSidebar = isDarkColor(sidebarBg);

  const sidebarText = isDarkSidebar ? '#f8fafc' : '#0f172a';
  const sidebarTextMuted = isDarkSidebar ? '#94a3b8' : '#64748b';
  const sidebarBorder = isDarkSidebar ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const sidebarHoverBg = isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9';
  const activeNavBg = isDarkSidebar ? 'rgba(255, 255, 255, 0.16)' : lightenHex(primary, 0.92);
  const activeNavText = isDarkSidebar ? '#ffffff' : primary;

  return {
    primary,
    secondary,
    sidebarBg,
    isDarkSidebar,
    sidebarText,
    sidebarTextMuted,
    sidebarBorder,
    sidebarHoverBg,
    activeNavBg,
    activeNavText,
    buttonGradient: `linear-gradient(135deg, ${primary}, ${darkenHex(primary, 0.2)})`,
    accentText: primary,
    badgeBg: isDarkSidebar ? 'rgba(255, 255, 255, 0.2)' : lightenHex(primary, 0.88),
  };
}
