<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlaylistsStore } from '@/stores/playlists'
import { useSpotifyApi } from '@/composables/useSpotifyApi'
import {
  FIELD_GROUPS,
  loadSavedSelections,
  saveSelections,
  buildExportPayload,
  downloadJson,
  highlightJson,
} from '@/composables/useExport'

const route = useRoute()
const router = useRouter()
const playlistsStore = usePlaylistsStore()
const { fetchTracks } = useSpotifyApi()

const copied = ref(false)
const drawerOpen = ref(false)

// ─── Field selection state ────────────────────────────────────────────────

const selections = reactive(loadSavedSelections())
watch(selections, saveSelections, { deep: true })

function toggleField(group, field) {
  const idx = selections[group].indexOf(field)
  if (idx === -1) selections[group].push(field)
  else selections[group].splice(idx, 1)
}

function isSelected(group, field) {
  return selections[group].includes(field)
}

function allSelected(group) {
  const g = FIELD_GROUPS.find((g) => g.key === group)
  return g.fields.every((f) => selections[group].includes(f.key))
}

function toggleAll(group) {
  const g = FIELD_GROUPS.find((g) => g.key === group)
  if (allSelected(group)) selections[group] = []
  else selections[group] = g.fields.map((f) => f.key)
}

// ─── Playlist + tracks ───────────────────────────────────────────────────

const playlist = computed(() => playlistsStore.selectedPlaylist)

onMounted(async () => {
  if (!playlist.value) {
    router.replace({ name: 'playlists' })
    return
  }
  if (!playlistsStore.tracks.length) {
    await fetchTracks(route.params.playlistId)
  }
})

// ─── Export payload ──────────────────────────────────────────────────────

const payload = computed(() => {
  if (!playlist.value || !playlistsStore.tracks.length) return null
  return buildExportPayload(playlist.value, playlistsStore.tracks, selections)
})

const previewJson = computed(() => {
  if (!payload.value) return ''
  const preview = {
    ...payload.value,
    tracks: payload.value.tracks.slice(0, 3),
  }
  return JSON.stringify(preview, null, 2)
})

const highlightedPreview = computed(() => highlightJson(previewJson.value))

function handleDownload() {
  if (!payload.value) return
  const name = playlist.value.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  downloadJson(payload.value, name)
}

async function handleCopy() {
  if (!payload.value) return
  await navigator.clipboard.writeText(JSON.stringify(payload.value, null, 2))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div v-if="playlist" class="min-h-screen bg-black text-white flex flex-col">

    <!-- Header -->
    <header class="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center gap-4">
        <button
          class="text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          @click="router.push({ name: 'playlists' })"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <!-- Playlist info -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <img
            v-if="playlist.images.length"
            :src="playlist.images[0].url"
            :alt="playlist.name"
            class="w-10 h-10 rounded object-cover shrink-0"
          />
          <div class="min-w-0">
            <p class="font-semibold text-sm truncate">{{ playlist.name }}</p>
            <p class="text-zinc-400 text-xs">{{ playlistsStore.tracks.length || playlist.trackCount }} tracks</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0">
          <!-- Fields toggle — mobile only -->
          <button
            class="md:hidden flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium px-4 py-2 rounded-full transition-colors cursor-pointer"
            @click="drawerOpen = true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h12M3 18h6" />
            </svg>
            Fields
          </button>
          <button
            class="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-sm font-medium px-4 py-2 rounded-full transition-colors cursor-pointer"
            :disabled="!payload"
            @click="handleCopy"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>

          <button
            class="flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black text-sm font-semibold px-4 py-2 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!payload"
            @click="handleDownload"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Download JSON
          </button>
        </div>
      </div>
    </header>

    <!-- Backdrop (mobile) -->
    <transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 z-30 bg-black/60 md:hidden"
        @click="drawerOpen = false"
      />
    </transition>

    <!-- Body -->
    <div class="flex flex-1 max-w-7xl mx-auto w-full px-6 py-6 gap-6">

      <!-- Left: field selector (sidebar on md+, drawer on mobile) -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-72 bg-zinc-950 overflow-y-auto px-4 py-6 space-y-4 transition-transform duration-300 md:static md:w-64 md:bg-transparent md:p-0 md:translate-x-0"
        :class="drawerOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex items-center justify-between md:block">
          <p class="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Export fields</p>
          <button
            class="md:hidden text-zinc-400 hover:text-white transition-colors cursor-pointer"
            @click="drawerOpen = false"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          v-for="group in FIELD_GROUPS"
          :key="group.key"
          class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
        >
          <!-- Group header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span class="text-sm font-medium text-white">{{ group.label }}</span>
            <button
              class="text-xs text-zinc-400 hover:text-[#1DB954] transition-colors cursor-pointer"
              @click="toggleAll(group.key)"
            >
              {{ allSelected(group.key) ? 'None' : 'All' }}
            </button>
          </div>

          <!-- Fields -->
          <div class="px-4 py-3 space-y-2">
            <label
              v-for="field in group.fields"
              :key="field.key"
              class="flex items-center gap-3 cursor-pointer group"
            >
              <div
                class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                :class="isSelected(group.key, field.key)
                  ? 'bg-[#1DB954] border-[#1DB954]'
                  : 'border-zinc-600 group-hover:border-zinc-400'"
                @click="toggleField(group.key, field.key)"
              >
                <svg
                  v-if="isSelected(group.key, field.key)"
                  class="w-2.5 h-2.5 text-black"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span
                class="text-sm transition-colors"
                :class="isSelected(group.key, field.key) ? 'text-white' : 'text-zinc-400'"
              >
                {{ field.label }}
              </span>
            </label>
          </div>
        </div>
      </aside>

      <!-- Right: JSON preview -->
      <div class="flex-1 min-w-0 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <p class="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Preview</p>
          <p v-if="payload" class="text-xs text-zinc-500">
            Showing first 3 of {{ payload.trackCount }} tracks
          </p>
        </div>

        <!-- Loading state -->
        <div
          v-if="playlistsStore.loading"
          class="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center"
        >
          <div class="flex items-center gap-3 text-zinc-500">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span class="text-sm">Fetching tracks…</span>
          </div>
        </div>

        <!-- Error state -->
        <div
          v-else-if="playlistsStore.error"
          class="flex-1 bg-red-950 border border-red-800 rounded-xl flex items-center justify-center"
        >
          <p class="text-red-300 text-sm">{{ playlistsStore.error }}</p>
        </div>

        <!-- JSON -->
        <div
          v-else-if="payload"
          class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-auto"
        >
          <pre
            class="p-5 text-xs leading-relaxed font-mono text-zinc-300 whitespace-pre"
            v-html="highlightedPreview"
          />
          <div
            v-if="payload.trackCount > 3"
            class="px-5 pb-4 text-xs text-zinc-600 font-mono"
          >
            // … {{ payload.trackCount - 3 }} more tracks in the downloaded file
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
