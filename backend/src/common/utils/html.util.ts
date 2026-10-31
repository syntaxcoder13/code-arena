const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text before it goes into an HTML email. Digest content comes from
 * GitHub issue titles, repository descriptions and user profiles, so anyone can
 * put markup (or a disguised phishing link) in it.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** An https URL safe to use in an href, or '#' for anything else. */
export function safeHttpsUrl(value: unknown): string {
  try {
    const url = new URL(String(value ?? ''));
    return url.protocol === 'https:' ? escapeHtml(url.href) : '#';
  } catch {
    return '#';
  }
}
