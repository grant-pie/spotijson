/**
 * PKCE (Proof Key for Code Exchange) helpers for Spotify OAuth.
 * Spec: https://datatracker.ietf.org/doc/html/rfc7636
 */

/** Generate a cryptographically random code verifier (43–128 chars, URL-safe) */
export function generateCodeVerifier() {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/** Derive the code challenge from the verifier using S256 method */
export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

/** Generate a random state string to prevent CSRF */
export function generateState() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
