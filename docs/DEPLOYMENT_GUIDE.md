# VyaparMarg Deployment Guide

VyaparMarg uses one shared backend and separate public delivery targets.

| Component | Recommended host | Output |
|---|---|---|
| Supabase database/auth | Supabase | Hosted PostgreSQL, Auth, REST |
| FastAPI backend | Render | Public HTTPS API |
| Web app | Vercel | Public HTTPS web app |
| Android app | Expo EAS + Google Play | APK for testing, AAB for Play Store |
| Browser extension | Chrome Web Store | Published Manifest V3 package |

## 1. Prepare Supabase

1. Activate or recreate the Supabase project and confirm its hostname resolves.
2. Apply the SQL migrations from `supabase/migrations/` in filename order.
3. Add at least one test user through Authentication -> Users.
4. Set the app's public publishable key in the web and mobile environments.
5. Never expose `SUPABASE_SERVICE_ROLE_KEY` to Vercel, Vite, Expo, or the extension.

## 2. Deploy FastAPI to Render

The repository includes `Dockerfile` and `render.yaml`.

In Render:

1. Create a Web Service from this repository.
2. Select Docker as the runtime.
3. Set `SUPABASE_URL` to the active project URL.
4. Set `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY`.
5. Set `CORS_ALLOWED_ORIGINS` to the exact Vercel origin, for example
   `https://vyaparmarg.vercel.app`.
6. Do not set `SUPABASE_SERVICE_ROLE_KEY` unless a server-only worker needs it.
7. Deploy and verify `https://YOUR-API-ON-RENDER/api/v1/health`.

## 3. Deploy the web app to Vercel

Deploy `apps/mobile` as the Vercel project root.

Set build environment variables:

```text
VITE_API_BASE_URL=https://YOUR-API-ON-RENDER/api/v1
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLISHABLE-KEY
```

The included `vercel.json` handles Vite SPA routing.

## 4. Build Android with Expo EAS

Set the Expo environment variables in EAS, then run:

```powershell
npm install --global eas-cli
cd apps/mobile-native
eas login
eas build:configure
eas build --platform android --profile preview
eas build --platform android --profile production
```

Set real `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values in EAS environment variables.
Use the APK preview for testing and the app-bundle production profile for Google Play.

## 5. Package the browser extension

Build and ZIP `apps/extension`:

```powershell
pnpm --filter @vyaparmarg/extension build
Compress-Archive apps\extension\* vyaparmarg-extension.zip -Force
```

Before publishing, add the exact HTTPS API host to `manifest.json` host
permissions if the extension makes direct API requests. The extension must never
receive or store passwords, OTPs, CAPTCHA answers, or service-role credentials.

## 6. Post-deployment verification

Run in this order:

1. API `/api/v1/health` returns 200.
2. Supabase Auth accepts a test account.
3. Web app signs in and creates a business profile.
4. Recommendations and application saving return 200.
5. Android preview signs in against the hosted API.
6. Extension loads unpacked from the ZIP and only matches allowlisted portals.
