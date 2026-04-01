import { useAuthStore } from '@/stores/auth'
import { usePlaylistsStore } from '@/stores/playlists'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import { getUserPlaylists, getPlaylistTracks, AuthError } from '@/lib/spotifyApi'

export function useSpotifyApi() {
  const auth = useAuthStore()
  const playlists = usePlaylistsStore()
  const { logout } = useSpotifyAuth()

  async function fetchPlaylists() {
    playlists.setLoading(true)
    playlists.setError(null)
    try {
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
      const data = await getPlaylistTracks(playlistId, auth.accessToken)
      playlists.setTracks(data)
    } catch (err) {
      if (err instanceof AuthError) return logout()
      playlists.setError(err.message)
    } finally {
      playlists.setLoading(false)
    }
  }

  return { fetchPlaylists, fetchTracks }
}
