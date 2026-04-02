const BASE = 'https://api.spotify.com/v1'
const MAX_RETRIES = 3

/**
 * Core fetch wrapper — attaches Bearer token, handles 401 and 429.
 * Throws a plain Error with a human-readable message on failure.
 */
async function request(endpoint, token, retries = 0) {
  const response = await fetch(`${BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 401) {
    throw new AuthError('Access token expired. Please log in again.')
  }

  if (response.status === 429) {
    if (retries >= MAX_RETRIES) throw new Error('Rate limited by Spotify. Please try again later.')
    const retryAfter = Number(response.headers.get('Retry-After') ?? 1)
    await sleep(retryAfter * 1000)
    return request(endpoint, token, retries + 1)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const reason = body.error?.reason ? ` (${body.error.reason})` : ''
    throw new Error(`${response.status}${reason}: ${body.error?.message ?? response.statusText}`)
  }

  return response.json()
}

/** Fetch every page of a paginated Spotify endpoint, returning all items. */
async function fetchAllPages(firstEndpoint, token) {
  const items = []
  let endpoint = firstEndpoint

  while (endpoint) {
    // Paginated responses come back as full URLs — strip the base for consistency.
    const path = endpoint.startsWith('http') ? endpoint.replace(BASE, '') : endpoint
    const page = await request(path, token)
    items.push(...page.items)
    endpoint = page.next ? page.next.replace(BASE, '') : null
  }

  return items
}

/**
 * Fetch all playlists for the current user.
 * Returns an array of simplified playlist objects.
 */
export async function getUserPlaylists(token) {
  const raw = await fetchAllPages('/me/playlists?limit=50', token)
  return raw.map(mapPlaylist)
}

/**
 * Fetch all tracks for a given playlist.
 * Uses GET /playlists/{id} (which embeds tracks) instead of the dedicated
 * /playlists/{id}/tracks endpoint, which is restricted in Spotify development mode.
 */
export async function getPlaylistTracks(playlistId, token) {
  const playlist = await request(`/playlists/${playlistId}`, token)
  // Spotify returns the tracks paging object under 'tracks' in the standard API,
  // but under 'items' in some configurations/regions.
  const page = playlist.tracks ?? playlist.items
  const items = [...page.items]

  // Paginate if the playlist has more than 100 tracks
  let nextUrl = page.next
  while (nextUrl) {
    const path = nextUrl.replace(BASE, '')
    const page = await request(path, token)
    items.push(...page.items)
    nextUrl = page.next
  }

  return items
    .filter((item) => (item.track?.id ?? item.item?.id ?? item.id))
    .map(mapTrack)
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapPlaylist(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    public: p.public,
    collaborative: p.collaborative,
    trackCount: p.tracks?.total ?? p.items?.total ?? 0,
    owner: { id: p.owner?.id, displayName: p.owner?.display_name },
    images: p.images ?? [],
    externalUrl: p.external_urls?.spotify ?? null,
  }
}

function mapTrack(item) {
  // Spotify returns the track under 'track', 'item', or as the object itself
  // depending on the endpoint / API version / region.
  const t = item.track ?? item.item ?? item
  return {
    addedAt: item.added_at ?? null,
    addedBy: item.added_by?.id ?? null,
    id: t.id,
    name: t.name,
    durationMs: t.duration_ms,
    explicit: t.explicit,
    popularity: t.popularity,
    previewUrl: t.preview_url,
    trackNumber: t.track_number,
    isrc: t.external_ids?.isrc ?? null,
    artists: (t.artists ?? []).map(mapArtist),
    album: t.album ? mapAlbum(t.album) : null,
  }
}

function mapArtist(a) {
  return {
    id: a.id,
    name: a.name,
  }
}

function mapAlbum(a) {
  return {
    id: a.id,
    name: a.name,
    releaseDate: a.release_date,
    totalTracks: a.total_tracks,
    albumType: a.album_type,
    images: a.images ?? [],
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
