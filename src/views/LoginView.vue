<script setup>
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const { login } = useSpotifyAuth()
const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  if (auth.isAuthenticated) {
    router.replace({ name: 'playlists' })
  }
})
</script>

<template>
  <div class="min-h-screen bg-black flex items-center justify-center p-6">
    <div class="max-w-md w-full text-center space-y-8">
      <!-- Logo mark -->
      <div class="flex items-center justify-center gap-3">
        <svg class="w-10 h-10 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
          />
        </svg>
        <h1 class="text-white text-2xl font-bold tracking-tight">Playlist Exporter</h1>
      </div>

      <!-- Card -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
        <div class="space-y-2">
          <h2 class="text-white text-xl font-semibold">Export your Spotify playlists</h2>
          <p class="text-zinc-400 text-sm leading-relaxed">
            Connect your Spotify account to browse your playlists and export them as JSON — choose
            exactly which track, artist, and album fields to include.
          </p>
        </div>

        <ul class="text-left space-y-2 text-sm text-zinc-400">
          <li class="flex items-center gap-2">
            <span class="text-[#1DB954]">✓</span> Browse all your playlists
          </li>
          <li class="flex items-center gap-2">
            <span class="text-[#1DB954]">✓</span> Pick which fields to export
          </li>
          <li class="flex items-center gap-2">
            <span class="text-[#1DB954]">✓</span> Download as a clean JSON file
          </li>
          <li class="flex items-center gap-2">
            <span class="text-[#1DB954]">✓</span> Read-only access — we never modify your data
          </li>
        </ul>

        <button
          class="w-full flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] active:scale-[0.98] text-black font-semibold py-3 px-6 rounded-full transition-all duration-150 cursor-pointer"
          @click="login"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
            />
          </svg>
          Connect with Spotify
        </button>
      </div>

      <p class="text-zinc-600 text-xs">
        Uses read-only Spotify scopes. Your credentials are never stored on any server.
      </p>
    </div>
  </div>
</template>
