import { describe, it, expect, beforeEach } from 'vitest'
import { buildExportPayload, loadSavedSelections, saveSelections, FIELD_GROUPS } from './useExport.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const playlist = { id: 'p1', name: 'Test Playlist' }

const track = {
  addedAt: '2024-01-01T00:00:00Z',
  addedBy: 'user1',
  id: 'track1',
  name: 'Magic Spells',
  durationMs: 200000,
  explicit: false,
  popularity: 80,
  previewUrl: 'https://preview.example.com/track1',
  trackNumber: 4,
  isrc: 'USABC1234567',
  artists: [{ id: 'artist1', name: 'Crystal Castles' }],
  album: {
    id: 'album1',
    name: 'Crystal Castles',
    releaseDate: '2008-03-18',
    totalTracks: 17,
    albumType: 'album',
    images: [{ url: 'https://img.example.com/cover.jpg', width: 640, height: 640 }],
  },
}

const allFields = {
  track: ['name', 'id', 'durationMs', 'explicit', 'popularity', 'previewUrl', 'trackNumber', 'addedAt', 'addedBy', 'isrc'],
  artist: ['name', 'id'],
  album: ['name', 'id', 'releaseDate', 'totalTracks', 'albumType', 'images'],
}

// ─── buildExportPayload ──────────────────────────────────────────────────────

describe('buildExportPayload', () => {
  describe('metadata', () => {
    it('includes playlist id and name', () => {
      const { playlist: p } = buildExportPayload(playlist, [track], allFields)
      expect(p.id).toBe('p1')
      expect(p.name).toBe('Test Playlist')
    })

    it('includes correct track count', () => {
      const payload = buildExportPayload(playlist, [track, track], allFields)
      expect(payload.trackCount).toBe(2)
    })

    it('includes exportedAt ISO timestamp', () => {
      const { exportedAt } = buildExportPayload(playlist, [], allFields)
      expect(() => new Date(exportedAt)).not.toThrow()
      expect(new Date(exportedAt).toISOString()).toBe(exportedAt)
    })
  })

  describe('track field filtering', () => {
    it('only includes selected track fields', () => {
      const { tracks } = buildExportPayload(playlist, [track], {
        track: ['name', 'durationMs'],
        artist: [],
        album: [],
      })
      expect(tracks[0].name).toBe('Magic Spells')
      expect(tracks[0].durationMs).toBe(200000)
      expect(tracks[0].explicit).toBeUndefined()
      expect(tracks[0].popularity).toBeUndefined()
    })

    it('includes all track fields when all selected', () => {
      const { tracks } = buildExportPayload(playlist, [track], allFields)
      expect(tracks[0].name).toBe('Magic Spells')
      expect(tracks[0].id).toBe('track1')
      expect(tracks[0].isrc).toBe('USABC1234567')
      expect(tracks[0].addedAt).toBe('2024-01-01T00:00:00Z')
    })

    it('produces empty track objects when no track fields selected', () => {
      const { tracks } = buildExportPayload(playlist, [track], {
        track: [],
        artist: [],
        album: [],
      })
      expect(Object.keys(tracks[0])).toHaveLength(0)
    })
  })

  describe('artist field filtering', () => {
    it('omits artists key entirely when no artist fields selected', () => {
      const { tracks } = buildExportPayload(playlist, [track], {
        track: ['name'],
        artist: [],
        album: [],
      })
      expect(tracks[0].artists).toBeUndefined()
    })

    it('includes artists with only selected fields', () => {
      const { tracks } = buildExportPayload(playlist, [track], {
        track: [],
        artist: ['name'],
        album: [],
      })
      expect(tracks[0].artists[0].name).toBe('Crystal Castles')
      expect(tracks[0].artists[0].id).toBeUndefined()
    })

    it('maps all artists on a track', () => {
      const multiArtistTrack = {
        ...track,
        artists: [
          { id: 'a1', name: 'Artist One' },
          { id: 'a2', name: 'Artist Two' },
        ],
      }
      const { tracks } = buildExportPayload(playlist, [multiArtistTrack], {
        track: [],
        artist: ['name'],
        album: [],
      })
      expect(tracks[0].artists).toHaveLength(2)
      expect(tracks[0].artists[1].name).toBe('Artist Two')
    })
  })

  describe('album field filtering', () => {
    it('omits album key entirely when no album fields selected', () => {
      const { tracks } = buildExportPayload(playlist, [track], {
        track: ['name'],
        artist: [],
        album: [],
      })
      expect(tracks[0].album).toBeUndefined()
    })

    it('includes album with only selected fields', () => {
      const { tracks } = buildExportPayload(playlist, [track], {
        track: [],
        artist: [],
        album: ['name', 'releaseDate'],
      })
      expect(tracks[0].album.name).toBe('Crystal Castles')
      expect(tracks[0].album.releaseDate).toBe('2008-03-18')
      expect(tracks[0].album.totalTracks).toBeUndefined()
      expect(tracks[0].album.albumType).toBeUndefined()
    })
  })

  describe('multiple tracks', () => {
    it('processes all tracks in order', () => {
      const second = { ...track, id: 'track2', name: 'Crimewave' }
      const { tracks } = buildExportPayload(playlist, [track, second], {
        track: ['name'],
        artist: [],
        album: [],
      })
      expect(tracks).toHaveLength(2)
      expect(tracks[0].name).toBe('Magic Spells')
      expect(tracks[1].name).toBe('Crimewave')
    })
  })
})

// ─── localStorage persistence ────────────────────────────────────────────────

describe('loadSavedSelections', () => {
  beforeEach(() => localStorage.clear())

  it('returns default selections when localStorage is empty', () => {
    const selections = loadSavedSelections()
    const expectedTrackDefaults = FIELD_GROUPS.find((g) => g.key === 'track')
      .fields.filter((f) => f.default)
      .map((f) => f.key)
    expect(selections.track).toEqual(expectedTrackDefaults)
  })

  it('returns a key for every field group', () => {
    const selections = loadSavedSelections()
    for (const group of FIELD_GROUPS) {
      expect(selections).toHaveProperty(group.key)
    }
  })

  it('restores previously saved selections', () => {
    const saved = { track: ['name', 'id'], artist: ['name'], album: [] }
    localStorage.setItem('spotify_export_fields', JSON.stringify(saved))
    expect(loadSavedSelections()).toEqual(saved)
  })

  it('falls back to defaults when localStorage value is corrupt', () => {
    localStorage.setItem('spotify_export_fields', 'not valid json{{{')
    const selections = loadSavedSelections()
    expect(selections).toHaveProperty('track')
    expect(Array.isArray(selections.track)).toBe(true)
  })
})

describe('saveSelections', () => {
  beforeEach(() => localStorage.clear())

  it('persists selections that can be round-tripped', () => {
    const selections = { track: ['name', 'isrc'], artist: ['id'], album: ['releaseDate'] }
    saveSelections(selections)
    expect(loadSavedSelections()).toEqual(selections)
  })

  it('overwrites previously saved selections', () => {
    saveSelections({ track: ['name'], artist: [], album: [] })
    saveSelections({ track: ['id'], artist: ['name'], album: ['name'] })
    expect(loadSavedSelections().track).toEqual(['id'])
  })
})
