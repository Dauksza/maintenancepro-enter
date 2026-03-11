/**
 * Input sanitization utilities for XSS prevention.
 *
 * These helpers use the browser's native HTML parsing to strip tags and
 * decode entities, so they work without any third-party dependency.
 */

/**
 * Strip all HTML tags from a string, returning only the plain-text content.
 * Use this before storing or rendering any user-supplied free-text value.
 */
export function sanitizeText(input: string): string {
  if (!input) return ''
  const div = document.createElement('div')
  div.innerHTML = input
  return div.textContent || div.innerText || ''
}

/**
 * Escape special HTML characters so that a value can be safely embedded
 * inside HTML attribute values or text nodes.
 */
export function escapeHtml(input: string): string {
  if (!input) return ''
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Truncate a string to a maximum byte-safe length after sanitizing.
 * Useful for enforcing field-length limits before persistence.
 */
export function sanitizeAndTruncate(input: string, maxLength: number): string {
  return sanitizeText(input).slice(0, maxLength)
}

/**
 * Validate that a string is a safe URL (http or https only).
 * Returns the original URL if valid, or an empty string otherwise.
 */
export function sanitizeUrl(input: string): string {
  if (!input) return ''
  try {
    const url = new URL(input)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return input
    }
  } catch {
    // not a valid URL
  }
  return ''
}

/**
 * Sanitize an object's string fields recursively.
 * Useful for cleaning form payloads before they are persisted.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const value = obj[key]
    if (typeof value === 'string') {
      result[key] = sanitizeText(value)
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result as T
}
