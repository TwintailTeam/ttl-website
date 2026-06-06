# ttl-website

The marketing site for [Twintail Launcher](https://github.com/TwintailTeam/TwintailLauncher) — a free,
open-source, multi-platform launcher for your anime games.

## Stack

This is a fully static, dependency-free site (no build step, no framework):

- `index.html` — landing page
- `privacy.html` — privacy policy (served at `/privacy`)
- `assets/css/style.css` — custom design system (dark theme, violet/fuchsia accent)
- `assets/js/main.js` — nav, mobile menu, OS-aware download button, download tabs,
  copy-to-clipboard, FAQ accordion, screenshot lightbox, scroll-reveal
- `assets/images/` — logo, hero background, optimized launcher screenshots

## Running locally

The repository ships static files only; it does not include a web server. Serve the
folder with anything that hosts static files, for example:

```bash
# Python
python -m http.server 5173

# Node
npx serve .
```

For production, serve the static files behind a reverse proxy (e.g. nginx) and map
`/privacy` to `privacy.html`.

## Notes

- No external CSS/JS frameworks or font CDNs are loaded — fitting the project's
  privacy-first, zero-telemetry stance.
- Screenshots in `assets/images/screenshots/` are downscaled/compressed JPEGs sourced
  from the launcher repository.
