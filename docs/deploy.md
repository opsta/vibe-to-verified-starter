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

Where the values come from (verified on a fresh project, 2026-10-28):

1. Add Firebase to your project in the Firebase console (https://console.firebase.google.com, "Add project", pick the existing Google Cloud project). The command `firebase projects:addfirebase` fails with HTTP 403 for some accounts (for example Google Workspace accounts that never accepted the Firebase terms); the console does the same thing and asks you to accept them.
2. Firestore database: Native mode, region `asia-southeast1`.
3. Authentication: Sign-in method: enable Anonymous.
4. Project settings, Your apps: add a Web app. Copy `apiKey`, `authDomain`, `projectId`, `appId` from the config it shows.
5. Deploy the rules: `firebase deploy --only firestore:rules --project <id>` (run in the repo root; needs `firebase login`).

Then run the deploy command above with the four values. The build takes about 2 minutes (a first deploy also creates the Artifact Registry repository `cloud-run-source-deploy`).

## Local check

```sh
npm run build && PORT=8090 node server.mjs
curl -s localhost:8090 | grep -c '<div id="app"'   # 1
```

## Check the live service

```sh
curl -s -o /dev/null -w '%{http_code}\n' <Service URL>   # 200
```

The Service URL looks like `https://vtv-<project-number>.asia-southeast1.run.app`. Open it: you should see the questions list and be able to ask and upvote once per question. Cost: Cloud Run scales to zero (min instances 0), so an idle service costs nothing. Delete it after the lab: `gcloud run services delete vtv --region asia-southeast1 --project <id>`.
