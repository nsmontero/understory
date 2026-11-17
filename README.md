# Understory — white-label audio tour demo

A mobile-first web app for self-guided audio tours. This build ships with a
Stanley Park bike tour. No backend, no login, no payments.

```bash
npm install
npm run dev     # local preview
npm run build   # production build
```

## Screens
Welcome → Map (live location or Preview mode) → Stop (audio + transcript) → Finish → booking placeholders.

- **Live location:** within the park's `triggerRadiusMeters` (40 m) of a stop, a chime plays and the stop's audio starts. Each stop plays automatically once; tap a pin or the progress bar to replay.
- **Preview mode:** the toggle at the top of the map simulates riding the route and triggers each stop in order. If location permission is denied the app switches to Preview mode automatically.

## Adding a park
Everything about a park lives in one JSON file in `src/content/`. No park
details are written into the components.

1. Copy `src/content/stanley-park.json` to `src/content/<your-park>.json`.
2. Change `id`, `name`, `tagline`, `colors`, `map`, `route` (lat/lng points in riding order),
   `stops`, and `partners`. Each stop needs `id`, `title`, `coords`, `audio` and `script`
   in `en` and `fr`.
3. Pick which park the app shows by setting `VITE_PARK_ID=<your-park>` in a `.env` file.
   Without it, the first park file (alphabetically) is used.

Colours in the JSON drive the whole theme, so the app is branded for the park.

## Adding audio
Put MP3s at `public/audio/<stop-id>-<lang>.mp3`, e.g. `public/audio/lost-lagoon-en.mp3`.
Until a file exists, the app reads the script aloud with the device's built-in voice.

The final scripts are in `/scripts/<stop-id>-<lang>.txt`, ready for recording or
text-to-speech. All scripts are marked **DRAFT, pending historian review**.

## Stop coordinates (Stanley Park)
Checked against OpenStreetMap (Nominatim search, Nov 2026):

| Stop | Coordinates | Source |
|---|---|---|
| Lost Lagoon | 49.2950, -123.1365 | OSM "Lost Lagoon" (49.2956, -123.1407); point moved to the east-shore path so riders pass within 40 m |
| The Seawall | 49.2963, -123.1325 | Approximate: start of the seawall by Coal Harbour, read from the OSM "Stanley Park Seawall" path |
| Lumbermen's Arch | 49.3025, -123.1305 | OSM "Lumberman's Arch" (49.30255, -123.13049) |
| S.S. Beaver wreck, Prospect Point | 49.3140, -123.1414 | OSM "Prospect Point Lighthouse" (49.31401, -123.14144); the wreck site itself is not mapped |
| The Hollow Tree | 49.3069, -123.1536 | OSM "Hollow Tree" (49.30692, -123.15362) |

The route line is hand-drawn between these points and is approximate.
