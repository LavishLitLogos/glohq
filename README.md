# Deckcadence52 HQ

Static, Netlify-ready HQ website for the DC52 / GLOKEY collectibles and culture ecosystem.

## Run Locally

Open `index.html` directly, or serve the folder:

```powershell
python -m http.server 4173
```

Then visit `http://localhost:4173`.

## Deploy On Netlify

Set the site base directory to this folder and publish from `.`. The included `netlify.toml` is already configured for a static deploy.

## Files

- `index.html` - page structure and content
- `styles.css` - responsive visual system
- `script.js` - active nav and service worker registration
- `manifest.webmanifest` - PWA manifest
- `sw.js` - small offline cache
- `assets/` - hero art, favicon, and official DC52/GLOKEY icon assets

## Official Icons

The supplied DC52/GLOKEY PNG icon set is preserved under `assets/icons/` and used for navigation, section headers, launchers, and platform surfaces. `clubtag.png` is used only as the ClubTag symbol at hashtag scale.
