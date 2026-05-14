# Curio — GitHub + Vercel Setup

This project is an Expo Router / React Native Web app. You do **not** upload one `index.html` file manually. Instead, Vercel builds the TSX app into a static `dist/` folder and hosts that output.

## Recommended flow

```text
GitHub = your source code
Vercel = the public web app people open on their phones
```

## 1. Upload this project to GitHub

Create a new GitHub repo, then upload the contents of this folder to the repo root.

The repo should have files like this at the top level:

```text
app/
components/
assets/
package.json
app.config.js
vercel.json
```

Do **not** upload the outer zip folder as a nested folder unless you want the repo root to be that nested folder.

## 2. Test locally first, if you can

From the project folder:

```bash
npm ci
npm run typecheck
npm run build:web
```

If the build works, you should see a new folder:

```text
dist/
```

That is the generated website output. You generally do not commit `dist/` to GitHub when using Vercel.

## 3. Import the GitHub repo into Vercel

1. Go to Vercel.
2. Choose **Add New Project**.
3. Import the GitHub repo.
4. Vercel should read `vercel.json` automatically.

Use these settings if Vercel asks:

```text
Framework Preset: Other
Install Command: npm ci
Build Command: npm run build:web
Output Directory: dist
```

## 4. Environment variables

For this Vercel setup, leave the GitHub Pages base path blank. You usually do **not** need to add this variable at all:

```text
EXPO_PUBLIC_BASE_PATH
```

If Vercel asks or you previously added it, set it to blank.

Important: do not put private API keys directly into public Expo variables. Anything named `EXPO_PUBLIC_*` can be visible in the browser bundle.

## 5. Deploy

After import, Vercel will build and deploy the app. You will get a URL like:

```text
https://your-project-name.vercel.app/
```

Every time you push to GitHub, Vercel will automatically rebuild and redeploy.

## 6. Phone testing

Open the Vercel URL on your phone. This is the easiest way to let others test without installing Expo Go.

## 7. Later: PWA/app-like install

Once the visual experience feels good, add the PWA layer:

- `manifest.json`
- app icons
- mobile theme/status bar settings
- service worker/offline caching

That is a later polish step. First, get the web build live and shareable.
