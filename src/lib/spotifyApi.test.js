import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserPlaylists, getPlaylistTracks, AuthError } from './spotifyApi.js'

const TOKEN = 'mock-token'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stubFetch(...responses) {
  const mock = vi.fn()
  responses.forEach((data, i) => {
    const isError = typeof data === 'number'
    const status = isError ? data : 200
    mock.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: { get: () => null },
      json: () => Promise.resolve(isError ? { error: { status, message: 'Error' } } : data),
    })
  })
  vi.stubGlobal('fetch', mock)
  return mock
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const rawPlaylist = {
  id: 'p1',
  name: 'Cuddles',
  description: 'A cozy playlist',
  public: true,
  collaborative: false,
  tracks: { total: 34 },
  owner: { id: 'omegakid66', display_name: 'omegakid66' },
  images: [{ url: 'https://img.example.com/cover.jpg', width: 640, height: 640 }],
  external_urls: { spotify: 'https://open.spotify.com/playlist/p1' },
}

// PlaylistTrackObject using the standard 'track' key
const rawTrackItem = {
  added_at: '2026-03-19T16:11:41Z',
  added_by: { id: 'omegakid66' },
  is_local: false,
  track: {
    id: '7esXWPJMdlXfgho3zlwbqv',
    name: 'Magic Spells',
    duration_ms: 366866,
    explicit: false,
    popularity: 55,
    preview_url: null,
    track_number: 4,
    external_ids: { isrc: 'CAL450896204' },
    artists: [{ id: '7K3zpFXBvPcvzhj7zlGJdO', name: 'Crystal Castles' }],
    album: {
      id: '6rTfUUv8Kefr6Uo3AaecXi',
      name: 'Crystal Castles',
      release_date: '2008-03-18',
      total_tracks: 17,
      album_type: 'album',
      images: [{ url: 'https://img.example.com/album.jpg', width: 640, height: 640 }],
    },
  },
}

// New Spotify API format — track data lives under 'item' key
const rawTrackItemNewFormat = {
  ...rawTrackItem,
  track: undefined,
  item: rawTrackItem.track,
}

// ─── getUserPlaylists ────────────────────────────────────────────────────────

describe('getUserPlaylists', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('maps a playlist to the expected shape', async () => {
    stubFetch({ items: [rawPlaylist], next: null })
    const [p] = await getUserPlaylists(TOKEN)

    expect(p.id).toBe('p1')
    expect(p.name).toBe('Cuddles')
    expect(p.description).toBe('A cozy playlist')
    expect(p.public).toBe(true)
    expect(p.trackCount).toBe(34)
    expect(p.owner).toEqual({ id: 'omegakid66', displayName: 'omegakid66' })
    expect(p.images[0].url).toBe('https://img.example.com/cover.jpg')
    expect(p.externalUrl).toBe('https://open.spotify.com/playlist/p1')
  })

  it('reads trackCount from items.total when tracks is absent', async () => {
    const playlist = { ...rawPlaylist, tracks: null, items: { total: 12 } }
    stubFetch({ items: [playlist], next: null })
    const [p] = await getUserPlaylists(TOKEN)
    expect(p.trackCount).toBe(12)
  })

  it('defaults trackCount to 0 when both tracks and items are absent', async () => {
    const playlist = { ...rawPlaylist, tracks: null, items: null }
    stubFetch({ items: [playlist], next: null })
    const [p] = await getUserPlaylists(TOKEN)
    expect(p.trackCount).toBe(0)
  })

  it('paginates across multiple pages', async () => {
    const page1 = { items: [rawPlaylist], next: 'https://api.spotify.com/v1/me/playlists?offset=50' }
    const page2 = { items: [{ ...rawPlaylist, id: 'p2', name: 'Page 2' }], next: null }
    stubFetch(page1, page2)
    const playlists = await getUserPlaylists(TOKEN)
    expect(playlists).toHaveLength(2)
    expect(playlists[1].name).toBe('Page 2')
  })

  it('throws AuthError on 401', async () => {
    stubFetch(401)
    await expect(getUserPlaylists(TOKEN)).rejects.toThrow(AuthError)
  })

  it('throws on non-401 errors', async () => {
    stubFetch(500)
    await expect(getUserPlaylists(TOKEN)).rejects.toThrow('500')
  })
})

// ─── getPlaylistTracks ───────────────────────────────────────────────────────

describe('getPlaylistTracks', () => {
  beforeEach(() => vi.restoreAllMocks())

  function playlistResponse(items, next = null) {
    return { id: 'p1', name: 'Cuddles', tracks: { items, next, total: items.length } }
  }

  it('maps a track using the standard track key', async () => {
    stubFetch(playlistResponse([rawTrackItem]))
    const [t] = await getPlaylistTracks('p1', TOKEN)

    expect(t.id).toBe('7esXWPJMdlXfgho3zlwbqv')
    expect(t.name).toBe('Magic Spells')
    expect(t.durationMs).toBe(366866)
    expect(t.explicit).toBe(false)
    expect(t.isrc).toBe('CAL450896204')
    expect(t.addedAt).toBe('2026-03-19T16:11:41Z')
    expect(t.addedBy).toBe('omegakid66')
  })

  it('maps a track using the new item key format', async () => {
    stubFetch(playlistResponse([rawTrackItemNewFormat]))
    const [t] = await getPlaylistTracks('p1', TOKEN)
    expect(t.id).toBe('7esXWPJMdlXfgho3zlwbqv')
    expect(t.name).toBe('Magic Spells')
  })

  it('maps artist fields correctly', async () => {
    stubFetch(playlistResponse([rawTrackItem]))
    const [t] = await getPlaylistTracks('p1', TOKEN)
    expect(t.artists).toHaveLength(1)
    expect(t.artists[0]).toEqual({ id: '7K3zpFXBvPcvzhj7zlGJdO', name: 'Crystal Castles' })
  })

  it('maps album fields correctly', async () => {
    stubFetch(playlistResponse([rawTrackItem]))
    const [t] = await getPlaylistTracks('p1', TOKEN)
    expect(t.album.id).toBe('6rTfUUv8Kefr6Uo3AaecXi')
    expect(t.album.name).toBe('Crystal Castles')
    expect(t.album.releaseDate).toBe('2008-03-18')
    expect(t.album.totalTracks).toBe(17)
    expect(t.album.albumType).toBe('album')
  })

  it('filters out null and id-less items', async () => {
    const nullItem = { added_at: null, added_by: null, track: null }
    stubFetch(playlistResponse([rawTrackItem, nullItem, rawTrackItem]))
    const tracks = await getPlaylistTracks('p1', TOKEN)
    expect(tracks).toHaveLength(2)
  })

  it('reads tracks from playlist.items when tracks key is absent', async () => {
    const response = { id: 'p1', name: 'Cuddles', items: { items: [rawTrackItem], next: null } }
    stubFetch(response)
    const tracks = await getPlaylistTracks('p1', TOKEN)
    expect(tracks).toHaveLength(1)
  })

  it('paginates when next URL is present', async () => {
    const secondTrack = { ...rawTrackItem, track: { ...rawTrackItem.track, id: 'track2', name: 'Crimewave' } }
    const firstResponse = playlistResponse([rawTrackItem], 'https://api.spotify.com/v1/next')
    const secondResponse = { items: [secondTrack], next: null }

    stubFetch(firstResponse, secondResponse)
    const tracks = await getPlaylistTracks('p1', TOKEN)
    expect(tracks).toHaveLength(2)
    expect(tracks[1].name).toBe('Crimewave')
  })

  it('throws AuthError on 401', async () => {
    stubFetch(401)
    await expect(getPlaylistTracks('p1', TOKEN)).rejects.toThrow(AuthError)
  })
})
