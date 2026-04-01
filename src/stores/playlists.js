import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlaylistsStore = defineStore('playlists', () => {
  const playlists = ref([])
  const selectedPlaylist = ref(null)
  const tracks = ref([])
  const loading = ref(false)
  const error = ref(null)

  function setPlaylists(data) {
    playlists.value = data
  }

  function selectPlaylist(playlist) {
    selectedPlaylist.value = playlist
    tracks.value = []
  }

  function setTracks(data) {
    tracks.value = data
  }

  function setLoading(val) {
    loading.value = val
  }

  function setError(msg) {
    error.value = msg
  }

  function reset() {
    playlists.value = []
    selectedPlaylist.value = null
    tracks.value = []
    loading.value = false
    error.value = null
  }

  return {
    playlists,
    selectedPlaylist,
    tracks,
    loading,
    error,
    setPlaylists,
    selectPlaylist,
    setTracks,
    setLoading,
    setError,
    reset,
  }
})
