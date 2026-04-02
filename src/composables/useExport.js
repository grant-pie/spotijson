export const FIELD_GROUPS = [
  {
    key: 'track',
    label: 'Track',
    fields: [
      { key: 'name', label: 'Name', default: true },
      { key: 'id', label: 'ID', default: false },
      { key: 'durationMs', label: 'Duration (ms)', default: true },
      { key: 'explicit', label: 'Explicit', default: false },
      { key: 'trackNumber', label: 'Track Number', default: false },
      { key: 'addedAt', label: 'Added At', default: false },
      { key: 'addedBy', label: 'Added By', default: false },
      { key: 'isrc', label: 'ISRC', default: false },
    ],
  },
  {
    key: 'artist',
    label: 'Artist',
    fields: [
      { key: 'name', label: 'Name', default: true },
      { key: 'id', label: 'ID', default: false },
    ],
  },
  {
    key: 'album',
    label: 'Album',
    fields: [
      { key: 'name', label: 'Name', default: true },
      { key: 'id', label: 'ID', default: false },
      { key: 'releaseDate', label: 'Release Date', default: true },
      { key: 'totalTracks', label: 'Total Tracks', default: false },
      { key: 'albumType', label: 'Album Type', default: false },
      { key: 'images', label: 'Images', default: false },
    ],
  },
]

const STORAGE_KEY = 'spotify_export_fields'

/** Load persisted field selections, falling back to defaults. */
export function loadSavedSelections() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore
  }
  return Object.fromEntries(
    FIELD_GROUPS.map((g) => [g.key, g.fields.filter((f) => f.default).map((f) => f.key)]),
  )
}

/** Persist field selections to localStorage. */
export function saveSelections(selections) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selections))
}

/**
 * Build the export JSON payload from tracks and selected fields.
 * selections = { track: ['name', 'id', ...], artist: [...], album: [...] }
 */
export function buildExportPayload(playlist, tracks, selections) {
  const { track: trackFields, artist: artistFields, album: albumFields } = selections

  const items = tracks.map((t) => {
    const row = {}

    for (const field of trackFields) {
      if (field in t) row[field] = t[field]
    }

    if (artistFields.length && t.artists?.length) {
      row.artists = t.artists.map((a) => {
        const artist = {}
        for (const field of artistFields) {
          if (field in a) artist[field] = a[field]
        }
        return artist
      })
    }

    if (albumFields.length && t.album) {
      const album = {}
      for (const field of albumFields) {
        if (field in t.album) album[field] = t.album[field]
      }
      row.album = album
    }

    return row
  })

  return {
    exportedAt: new Date().toISOString(),
    playlist: { id: playlist.id, name: playlist.name },
    trackCount: tracks.length,
    tracks: items,
  }
}

/** Trigger a JSON file download in the browser. */
export function downloadJson(payload, filename) {
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Syntax-highlight a JSON string into HTML. No dependencies. */
export function highlightJson(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="json-key">${match}</span>`
            : `<span class="json-string">${match}</span>`
        }
        if (/true|false/.test(match)) return `<span class="json-bool">${match}</span>`
        if (/null/.test(match)) return `<span class="json-null">${match}</span>`
        return `<span class="json-number">${match}</span>`
      },
    )
}
