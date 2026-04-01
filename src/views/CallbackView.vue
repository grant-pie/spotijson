<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'

const router = useRouter()
const { handleCallback } = useSpotifyAuth()

const errorMessage = ref(null)

onMounted(async () => {
  // With hash routing, Spotify appends params before the '#', e.g:
  // /spotijson/?code=...&state=...#/callback
  // route.query is empty in this case — read from window.location.search instead.
  const params = Object.fromEntries(new URLSearchParams(window.location.search))
  const result = await handleCallback(params)

  if (result.success) {
    router.replace({ name: 'playlists' })
  } else {
    errorMessage.value = result.error
  }
})
</script>

<template>
  <div class="min-h-screen bg-black flex items-center justify-center p-6">
    <!-- Loading state -->
    <div v-if="!errorMessage" class="text-center space-y-4">
      <svg
        class="w-10 h-10 text-[#1DB954] animate-spin mx-auto"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p class="text-zinc-400 text-sm">Connecting to Spotify…</p>
    </div>

    <!-- Error state -->
    <div v-else class="max-w-sm w-full text-center space-y-6">
      <div class="bg-red-950 border border-red-800 rounded-2xl p-6 space-y-3">
        <p class="text-red-400 font-semibold">Authentication failed</p>
        <p class="text-red-300 text-sm">{{ errorMessage }}</p>
      </div>
      <button
        class="text-[#1DB954] hover:text-[#1ed760] text-sm underline underline-offset-2 transition-colors cursor-pointer"
        @click="$router.push({ name: 'login' })"
      >
        Back to login
      </button>
    </div>
  </div>
</template>
