import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/pkce'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SCOPES = ['playlist-read-private', 'playlist-read-collaborative'].join(' ')

export function useSpotifyAuth() {
  const router = useRouter()
  const auth = useAuthStore()

  /** Kick off the PKCE login flow — redirects the browser to Spotify */
  async function login() {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()

    sessionStorage.setItem('spotify_code_verifier', verifier)
    sessionStorage.setItem('spotify_oauth_state', state)

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
      scope: SCOPES,
      state,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      show_dialog: 'true',
    })

    window.location.href = `${SPOTIFY_AUTH_URL}?${params}`
  }

  /**
   * Handle the OAuth callback.
   * Call this inside CallbackView on mount with the current route query params.
   * Returns { success: true } or { success: false, error: string }
   */
  async function handleCallback(query) {
    const { code, state, error } = query

    if (error) {
      return { success: false, error: `Spotify denied access: ${error}` }
    }

    const savedState = sessionStorage.getItem('spotify_oauth_state')
    if (!state || state !== savedState) {
      return { success: false, error: 'State mismatch — possible CSRF attack.' }
    }

    const verifier = sessionStorage.getItem('spotify_code_verifier')
    if (!verifier) {
      return { success: false, error: 'No code verifier found. Please try logging in again.' }
    }

    sessionStorage.removeItem('spotify_code_verifier')
    sessionStorage.removeItem('spotify_oauth_state')

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
      client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      code_verifier: verifier,
    })

    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return { success: false, error: data.error_description || 'Token exchange failed.' }
    }

    const data = await response.json()
    auth.setToken(data.access_token, data.expires_in)

    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    if (meRes.ok) {
      const me = await meRes.json()
      auth.setUserId(me.id)
    }

    return { success: true }
  }

  function logout() {
    auth.clearToken()
    router.push({ name: 'login' })
  }

  return { login, handleCallback, logout }
}
