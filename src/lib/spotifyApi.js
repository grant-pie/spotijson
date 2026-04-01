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
    throw new Error(body.error?.message ?? `Spotify API error ${response.status}`)
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
 * Returns an array of track objects.
 */
export async function getPlaylistTracks(playlistId, token) {
  const raw = await fetchAllPages(
    `/playlists/${playlistId}/tracks?limit=100&fields=next,items(added_at,added_by.id,track(id,name,duration_ms,explicit,popularity,preview_url,track_number,external_ids,artists(id,name,genres,popularity,followers),album(id,name,release_date,total_tracks,album_type,images)))`,
    token,
  )
  return raw.filter((item) => item.track && item.track.id).map(mapTrack)
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapPlaylist(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    public: p.public,
    collaborative: p.collaborative,
    trackCount: p.tracks?.total ?? 0,
    owner: { id: p.owner?.id, displayName: p.owner?.display_name },
    images: p.images ?? [],
    externalUrl: p.external_urls?.spotify ?? null,
  }
}

function mapTrack(item) {
  const t = item.track
  return {
    addedAt: item.added_at,
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
    genres: a.genres ?? [],
    popularity: a.popularity ?? null,
    followers: a.followers?.total ?? null,
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
