<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlaylistsStore } from '@/stores/playlists'
import { useAuthStore } from '@/stores/auth'
import { useSpotifyApi } from '@/composables/useSpotifyApi'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import PlaylistCard from '@/components/PlaylistCard.vue'

const router = useRouter()
const playlistsStore = usePlaylistsStore()
const authStore = useAuthStore()
const { fetchPlaylists } = useSpotifyApi()
const { logout } = useSpotifyAuth()

const search = ref('')

const filtered = computed(() => {
  let list = playlistsStore.playlists.filter((p) => p.owner.id === authStore.userId)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q))
  return list
})

const ownedCount = computed(() =>
  playlistsStore.playlists.filter((p) => p.owner.id === authStore.userId).length,
)

function selectPlaylist(playlist) {
  playlistsStore.selectPlaylist(playlist)
  router.push({ name: 'export', params: { playlistId: playlist.id } })
}

onMounted(() => {
  if (!playlistsStore.playlists.length) {
    fetchPlaylists()
  }
})
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Playlist Exporter" class="w-6 h-6 object-contain" />
          <span class="font-semibold text-sm">Playlist Exporter</span>
        </div>

        <!-- Search -->
        <div class="relative flex-1 max-w-sm">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Search playlists…"
            class="w-full bg-zinc-900 border border-zinc-700 focus:border-zinc-500 rounded-full py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
          />
        </div>

        <button
          class="text-zinc-400 hover:text-white text-sm transition-colors cursor-pointer shrink-0"
          @click="logout"
        >
          Log out
        </button>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-6 py-8">
      <!-- Error state -->
      <div
        v-if="playlistsStore.error"
        class="bg-red-950 border border-red-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-4"
      >
        <p class="text-red-300 text-sm">{{ playlistsStore.error }}</p>
        <button
          class="text-red-400 hover:text-red-200 text-sm underline underline-offset-2 shrink-0 cursor-pointer"
          @click="fetchPlaylists"
        >
          Retry
        </button>
      </div>

      <!-- Loading skeletons -->
      <div v-if="playlistsStore.loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <div v-for="n in 18" :key="n" class="flex flex-col gap-3 bg-zinc-900 rounded-xl p-4 animate-pulse">
          <div class="w-full aspect-square rounded-lg bg-zinc-800" />
          <div class="space-y-2">
            <div class="h-3 bg-zinc-800 rounded w-3/4" />
            <div class="h-3 bg-zinc-800 rounded w-1/2" />
          </div>
        </div>
      </div>

      <!-- Playlist grid -->
      <template v-else>
        <p class="text-zinc-500 text-sm mb-6">
          <template v-if="search && filtered.length !== ownedCount">
            {{ filtered.length }} of {{ ownedCount }} playlists
          </template>
          <template v-else>
            {{ ownedCount }} playlists
          </template>
        </p>

        <div
          v-if="filtered.length"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <PlaylistCard
            v-for="playlist in filtered"
            :key="playlist.id"
            :playlist="playlist"
            @click="selectPlaylist(playlist)"
          />
        </div>

        <div v-else class="text-center py-20">
          <p class="text-zinc-500">No playlists match "{{ search }}"</p>
        </div>
      </template>
    </main>
  </div>
</template>
