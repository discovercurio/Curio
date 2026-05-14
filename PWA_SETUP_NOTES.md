# PWA / Home Screen Setup Notes

This version adds the files needed for the deployed Vercel web app to be installable from a phone home screen:

- `public/manifest.json`
- `public/sw.js`
- `app/+html.tsx`
- service worker registration in `app/_layout.tsx`
- placeholder icons at `public/icon-192.png` and `public/icon-512.png`

## Replace the placeholder icons

Drop your final PNGs into `public/` using these exact filenames:

```text
public/icon-192.png
public/icon-512.png
```

Then commit and push to GitHub. Vercel will redeploy automatically.

## iPhone install

Open the Vercel URL in Safari, tap Share, then tap Add to Home Screen.

## Android install

Open the Vercel URL in Chrome, tap the menu, then choose Add to Home screen or Install app.

The app uses `display: standalone`, which removes normal browser toolbars when launched from the home screen.
