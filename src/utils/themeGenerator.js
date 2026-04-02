/**
 * Converts HSL color values to a Hex color string.
 */
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generates an accessible, aesthetic "Website of the Day" color palette.
 */
export function generateRandomTheme() {
    // Pick a random base hue (0-359)
    const baseHue = Math.floor(Math.random() * 360);

    // Primary color: Vibrant middle-lightness
    const primaryS = Math.floor(Math.random() * 20) + 80; // 80-100%
    const primaryL = Math.floor(Math.random() * 10) + 45; // 45-55%

    // Primary light: High lightness tint of the primary color
    const primaryLightL = Math.floor(Math.random() * 10) + 75; // 75-85%

    // Secondary color: Analogous or complimentary-adjacent
    const offset = Math.random() > 0.5 ? 40 : 140;
    const secondaryH = (baseHue + offset + Math.floor(Math.random() * 40)) % 360;
    const secondaryS = Math.floor(Math.random() * 20) + 75;
    const secondaryL = Math.floor(Math.random() * 10) + 50;

    // Accent color: Complimentary or Triadic
    const accentOffset = Math.random() > 0.5 ? 180 : 220;
    const accentH = (baseHue + accentOffset + Math.floor(Math.random() * 40)) % 360;
    const accentS = Math.floor(Math.random() * 20) + 80;
    const accentL = Math.floor(Math.random() * 10) + 45;

    // Dark shade: Very dark, slightly tinted by the primary hue
    const darkS = 25;
    const darkL = Math.floor(Math.random() * 5) + 6; // 6-11%

    return {
        primary: hslToHex(baseHue, primaryS, primaryL),
        primaryLight: hslToHex(baseHue, primaryS, primaryLightL),
        secondary: hslToHex(secondaryH, secondaryS, secondaryL),
        accent: hslToHex(accentH, accentS, accentL),
        dark: hslToHex(baseHue, darkS, darkL),
    };
}

/**
 * Applies a theme object to the document's CSS variables and saves to local storage.
 */
export function applyTheme(theme) {
    const root = document.documentElement;

    if (theme.primary) root.style.setProperty('--site-brand-primary', theme.primary);
    if (theme.primaryLight) root.style.setProperty('--site-brand-primary-light', theme.primaryLight);
    if (theme.secondary) root.style.setProperty('--site-brand-secondary', theme.secondary);
    if (theme.accent) root.style.setProperty('--site-brand-accent', theme.accent);
    if (theme.dark) root.style.setProperty('--site-brand-dark', theme.dark);

    // Save to localStorage to persist across reloads
    localStorage.setItem('site-theme', JSON.stringify(theme));
}

/**
 * Loads the theme from localStorage if available.
 */
export function loadSavedTheme() {
    try {
        const saved = localStorage.getItem('site-theme');
        if (saved) {
            applyTheme(JSON.parse(saved));
        }
    } catch (e) {
        console.warn("Failed to load saved theme", e);
    }
}
