# Deploy to Cloud Run

`server.mjs` serves the built `dist/` on `$PORT` (default 8080). Cloud Run builds the image from source with buildpacks: `npm run build` runs at build time, `npm start` at run time.

## Flow

```sh
gcloud run deploy vtv --source . --region asia-southeast1 --allow-unauthenticated
```

Use a project made for the lab. Check `gcloud config get-value project` first.

## Firebase settings

Vite reads `VITE_FIREBASE_*` at build time, so they must exist in the build, not only at run time. Without `VITE_FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` the app uses the memory store and a demo user.

Provide them as build environment variables:

```sh
gcloud run deploy vtv --source . --region asia-southeast1 --allow-unauthenticated \
  --set-build-env-vars VITE_FIREBASE_API_KEY=...,VITE_FIREBASE_AUTH_DOMAIN=...,VITE_FIREBASE_PROJECT_ID=...,VITE_FIREBASE_APP_ID=...
```

Enable Anonymous sign-in in Firebase Authentication and deploy `firestore.rules`.

## Local check

```sh
npm run build && PORT=8090 node server.mjs
curl -s localhost:8090 | grep -c '<div id="app"'   # 1
```
