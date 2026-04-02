# SpotiJSON

Export your Spotify playlists as structured JSON files. Connect your Spotify account, browse your playlists, choose exactly which fields to include, and download a clean JSON file — all in the browser with no backend.

**Live app:** https://spotijson.grantpieterse.com/

---

## Features

- **Spotify OAuth (PKCE)** — secure, no client secret, no backend required
- **Browse your playlists** — searchable grid showing only playlists you own
- **Configurable fields** — pick any combination of track, artist, and album fields
- **Live preview** — syntax-highlighted JSON preview before you download
- **Persistent auth** — stays logged in across sessions using refresh tokens
- **Fully client-side** — nothing leaves your browser

## Exportable fields

| Group | Fields |
|-------|--------|
| Track | Name, ID, Duration (ms), Explicit, Track Number, Added At, Added By, ISRC |
| Artist | Name, ID |
| Album | Name, ID, Release Date, Total Tracks, Album Type, Images |

## Tech stack

- [Vue 3](https://vuejs.org/) — Composition API, `<script setup>`
- [Vite](https://vitejs.dev/) — build tool
- [Pinia](https://pinia.vuejs.org/) — state management
- [Vue Router 4](https://router.vuejs.org/) — hash history (required for GitHub Pages)
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [Vitest](https://vitest.dev/) — unit tests

## Getting started

### Prerequisites

- Node.js 18+
- A [Spotify Developer](https://developer.spotify.com/dashboard) app with the redirect URI configured

### Environment variables

Create a `.env.local` file in the project root:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/callback
```

### Install and run

```bash
npm install
npm run dev
```

### Run tests

```bash
npm test
```

### Build for production

```bash
npm run build
```

## Deployment (GitHub Pages)

The project deploys automatically via GitHub Actions on every push to `main`.

Add the following secrets to your repository (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|--------|-------|
| `VITE_SPOTIFY_CLIENT_ID` | Your Spotify app client ID |
| `VITE_SPOTIFY_REDIRECT_URI` | `https://<username>.github.io/<repo>/callback` |

In your Spotify Developer Dashboard, add the same redirect URI to the **Redirect URIs** allowlist.

## Project structure

```
src/
├── composables/
│   ├── useExport.js        # Field config, JSON builder, download
│   ├── useSpotifyApi.js    # Vue-aware API wrapper
│   └── useSpotifyAuth.js   # PKCE OAuth flow, token refresh
├── lib/
│   ├── pkce.js             # PKCE crypto helpers
│   └── spotifyApi.js       # Spotify API calls
├── stores/
│   ├── auth.js             # Token + user state (localStorage)
│   └── playlists.js        # Playlist + track state
├── views/
│   ├── LoginView.vue
│   ├── CallbackView.vue
│   ├── PlaylistsView.vue
│   └── ExportView.vue
└── components/
    └── PlaylistCard.vue
```

## Privacy

SpotiJSON requests only read-only access to your Spotify library (`playlist-read-private`, `playlist-read-collaborative`). It cannot modify your account, library, or playback. No data is sent to any server — all processing happens in your browser. Tokens are stored in `localStorage` and cleared on logout.
