/**
 * Code normalization utilities
 * These are pure utility functions (not server actions)
 */

/**
 * CENTRALIZED code normalization - use this everywhere!
 * Removes all whitespace, converts to uppercase, and trims
 */
export function normalizeCode(code: string): string {
  if (!code || typeof code !== 'string') return '';
  return code.replace(/\s+/g, '').toUpperCase().trim();
}
