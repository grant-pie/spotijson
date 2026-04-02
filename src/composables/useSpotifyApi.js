import { useAuthStore } from '@/stores/auth'
import { usePlaylistsStore } from '@/stores/playlists'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import { getPlaylist, getUserPlaylists, getPlaylistTracks, AuthError } from '@/lib/spotifyApi'

export function useSpotifyApi() {
  const auth = useAuthStore()
  const playlists = usePlaylistsStore()
  const { logout, refreshAccessToken } = useSpotifyAuth()

  async function ensureFreshToken() {
    if (auth.isExpired && auth.refreshToken) {
      const ok = await refreshAccessToken()
      if (!ok) { logout(); return false }
    }
    return true
  }

  async function fetchPlaylist(playlistId) {
    try {
      if (!await ensureFreshToken()) return null
      const data = await getPlaylist(playlistId, auth.accessToken)
      playlists.selectPlaylist(data)
      return data
    } catch (err) {
      if (err instanceof AuthError) { logout(); return null }
      playlists.setError(err.message)
      return null
    }
  }

  async function fetchPlaylists() {
    playlists.setLoading(true)
    playlists.setError(null)
    try {
      if (!await ensureFreshToken()) return
      const data = await getUserPlaylists(auth.accessToken)
      playlists.setPlaylists(data)
    } catch (err) {
      if (err instanceof AuthError) return logout()
      playlists.setError(err.message)
    } finally {
      playlists.setLoading(false)
    }
  }

  async function fetchTracks(playlistId) {
    playlists.setLoading(true)
    playlists.setError(null)
    try {
      if (!await ensureFreshToken()) return
      const data = await getPlaylistTracks(playlistId, auth.accessToken)
      playlists.setTracks(data)
    } catch (err) {
      if (err instanceof AuthError) return logout()
      playlists.setError(err.message)
    } finally {
      playlists.setLoading(false)
    }
  }

  return { fetchPlaylist, fetchPlaylists, fetchTracks }
}
