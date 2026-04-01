<script setup>
defineProps({
  playlist: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <button
    class="group flex flex-col gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 text-left transition-all duration-150 cursor-pointer w-full"
  >
    <!-- Cover art -->
    <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 shrink-0">
      <img
        v-if="playlist.images.length"
        :src="playlist.images[0].url"
        :alt="playlist.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-10 h-10 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
          />
        </svg>
      </div>
    </div>

    <!-- Info -->
    <div class="min-w-0 w-full">
      <p class="text-white font-medium text-sm truncate">{{ playlist.name }}</p>
      <p class="text-zinc-400 text-xs mt-0.5">
        {{ playlist.trackCount }} {{ playlist.trackCount === 1 ? 'track' : 'tracks' }}
      </p>
      <p v-if="playlist.description" class="text-zinc-500 text-xs mt-1 line-clamp-2" v-html="playlist.description" />
    </div>
  </button>
</template>
