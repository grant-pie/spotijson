<script setup>
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'

const { logout } = useSpotifyAuth()
</script>

<template>
  <div class="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
    <p class="text-white text-xl">Authenticated! Playlists coming in Phase 5.</p>
    <button
      class="text-sm text-zinc-400 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
      @click="logout"
    >
      Log out
    </button>
  </div>
</template>
