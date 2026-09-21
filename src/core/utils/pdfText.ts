/**
 * Safe WinAnsi & Unicode text sanitization for pdf-lib standard fonts
 * Prevents "WinAnsi cannot encode" runtime crashes
 */

export const sanitizeForPdf = (text: string): string => {
  if (!text) return '';

  return text
    // Normalize unicode
    .normalize('NFKD')
    // Smart quotes & apostrophes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Dashes & hyphens
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Bullets & symbols
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '* ')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Non-breaking and special spaces
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // Fractions
    .replace(/\u00BD/g, '1/2')
    .replace(/\u00BC/g, '1/4')
    .replace(/\u00BE/g, '3/4')
    // Copyright & Trade
    .replace(/\u00A9/g, '(c)')
    .replace(/\u00AE/g, '(r)')
    .replace(/\u2122/g, '(tm)')
    // Currency symbols that may break WinAnsi
    .replace(/\u20AC/g, 'EUR ')
    .replace(/\u20B9/g, 'INR ')
    .replace(/\u00A5/g, 'JPY ')
    .replace(/\u00A3/g, 'GBP ')
    // Remove any remaining non-printable or unsupported control characters (keep ASCII 32-126 and standard newlines/tabs)
    .replace(/[^\x20-\x7E\t\n\r]/g, '');
};
