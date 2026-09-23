# Set up an independent Menta app

This guide runs the full app against your own backend. It does not connect to
Menta's production database or give access to its signing, telemetry or billing
accounts. Keep each provider's public client configuration separate from its
server credentials.

## Ways to try Menta

These three are often treated as the same test. They are not.

### Download this edition

This is the open-source path. It tests this repository, not the App Store app.

Clone, or download a ZIP of `main` from GitHub (Code → Download ZIP) and unzip
it. A ZIP has no Git history. `npm ci` still uses the lockfile. The unzipped
folder is `Menta-main`. Prefer `git clone` if you want later pulls.

```sh
git clone https://github.com/ImDanielGitHub/Menta.git
cd Menta
nvm use
npm ci
```

Then continue with [Local backend](#local-backend) or a
[new hosted Supabase project](#new-hosted-supabase-project). Copy
`.env.example` to `.env.local` and fill in your own public configuration.
Build with `npm run ios` or `npm run android`.

A successful run is a development build you compiled, talking to the Supabase
project in your `.env.local`. It does not use Menta's production database,
signing or billing accounts.

### Sideload a build

Expo Go cannot run this app. Sideload here means installing a binary you
built, on a simulator or a device, without the App Store.

**Simulator or USB device (the usual path)**

`npm run ios` is `expo run:ios`. `npm run android` is `expo run:android`. Both
compile a development build and install it. The first native build compiles
dependencies and takes a while.

- iOS Simulator: macOS with Xcode, then `npm run ios`.
- Android emulator: Android Studio/SDK, then `npm run android`.
- A USB-connected iPhone: `npm run ios -- --device`. Turn on Developer Mode on
  the phone. Xcode asks for your own Apple signing team. This project ships
  with bundle ID `org.example.menta` and no team ID. Keep that bundle ID in
  this public edition. If your own signing profile needs a different
  identifier, change it only in your fork, as described under
  [Native app configuration](#native-app-configuration).
- A USB-connected Android device: enable USB debugging, then
  `npm run android -- --device`.

After that client is installed, `npm start` attaches Metro to it
(`expo start --dev-client`).

**Optional EAS development or preview build**

This repository has no `eas.json`, Expo project ID or signing credentials. If
you create your own Expo project and EAS configuration, a development or
preview build can produce an IPA or APK for you to install (Xcode's Devices
window, Apple Configurator, `adb install`, or the link EAS gives you). Do not
reuse the official Menta app's Expo project ID or signing credentials. Point
that build at your own Supabase and RevenueCat configuration if the binary
should exercise this edition's independent setup.

### App Store, for partial product testing

The live App Store app is
[Menta: Proof & Progress](https://apps.apple.com/us/app/menta-proof-progress/id6747362646).
The seller is Daniel Aneke / Aneke Digital Apps. The store binary has
historically used the bundle ID `com.anekedigitalapps.lockedin`. That is not
the portable ID in this repository (`org.example.menta`).

That app is the hosted production product. It is a practical way to exercise
real UX, sign-in, groups, proof and purchases against the production backends.

It is not this open-source edition. Installing it does not show that this
repository builds, does not configure your own Supabase or RevenueCat project,
and does not prove the independent setup in this guide. For Shipaton Next Gen,
the source, your own backend and RevenueCat still matter. Treat the store app
as partial product testing only.

This repository's public source is `sourceVersion` 1.9.3
(`source-manifest.json`). The App Store build is newer (about 1.9.5), so
behaviour can differ. See [SOURCE.md](../SOURCE.md).

## Prerequisites

- Node.js 20.19.4 and npm (`nvm use`).
- Xcode and CocoaPods on macOS for iOS; Android Studio/SDK for Android.
- The Supabase CLI and Docker for a local backend, or a new Supabase project.
- A native development build. Expo Go cannot run all of this app's modules.

Install the app dependencies with `npm ci`. The package lock and dependency
patches are included. The checked-in `ios/` source retains Menta's native App
Intents and home-screen actions. Do not use `expo prebuild --clean` without
preserving those custom native files.

## Local backend

From this repository:

```sh
supabase start
```

On a clean local project, Supabase applies
`supabase/migrations/20260910000000_public_baseline.sql` and `supabase/seed.sql`.
The baseline contains the application schema, RPCs, grants, RLS, triggers and
storage policies. The seed contains the catalogue, legal-version metadata,
notification templates, economy configuration, product mappings and empty
storage buckets. It contains **no users, promises, proof, purchases or customer
records**. Supabase's Auth and Storage schemas are supplied by Supabase itself.

This edition uses ports 55321 (API), 55322 (database), 55323 (Studio) and 55324
(local email inbox) to reduce collisions with other local projects.

```sh
cp .env.example .env.local
cp .env.server.example .env.server
```

Read your **local publishable/anon client key** from `supabase status` or local
Studio and put it into `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Keep the
service-role key out of the app. The CLI supplies the local Supabase service
credentials to Edge Functions automatically.

For an Android emulator, use `http://10.0.2.2:55321` as the Supabase URL. For a
physical phone, use your computer's reachable LAN address instead of localhost.
Use a hosted development project when local device networking is inconvenient.

Email confirmation is enabled. Open the confirmation message in the local email
inbox at `http://localhost:55324`. Use the app callback URL in the confirmation
flow. A physical-device flow needs a reachable URL and correctly registered
scheme. You can also create disposable local users in Studio while testing.

Start the Edge Functions in a second terminal:

```sh
supabase functions serve --env-file .env.server
```

Do not pass `--no-verify-jwt` for all functions. Only the RevenueCat webhook
disables gateway JWT verification; its handler requires the separate webhook
secret. All user-owned actions must retain their caller checks.

To reset this **disposable local project only**, use `supabase db reset --local`.
Never use that command against a shared or production database.

## New hosted Supabase project

Create a fresh project and apply the baseline migration followed by the seed
through the SQL editor or a migration workflow scoped to that new project.
The baseline is for an empty application schema; it is not an upgrade script
for an existing deployment. Set the public URL and publishable/anon key for the
new project in `.env.local`.

Deploy the functions from `supabase/functions/` and configure the server secrets
shown in `.env.server.example`. The public edition excludes the production
test-helper and legacy operational endpoints. Set Auth's site and redirect URLs
for your app, including `menta://auth/callback` and
`menta://password-recovery/callback`.

The baseline closes the retired waitlist and feature-request tables, restricts
group edits to user-editable columns and keeps welcome-bonus receipts
server-owned. Every application table has RLS enabled. Before hosting for real
users, configure email confirmation, CAPTCHA, password security, API rate
limits, resource budgets and billing alerts in your provider dashboard.
Local `config.toml` does not apply those hosted dashboard settings automatically.

## Native app configuration

The portable default bundle/package ID is `org.example.menta`, with no Apple
team or production Expo project attached. Use your own registered identifiers
and signing team for physical-device or store builds. Update both `app.json`
and the native Xcode target configuration when changing an existing native
project. The native target and folder may retain the historical `LockedInPro`
build name; that is not a production credential or required store identity.

Expo production updates are disabled in both the app config and native plist.
Link your own Expo project if you want updates or push notifications. Do not
reuse the official Menta app's project ID or signing credentials.

```sh
npm run ios
# or
npm run android
```

The `menta`, `lockedin` and `lockedinprod` callback schemes remain for source
compatibility. Avoid installing multiple apps that claim the same schemes on
one test device, or change the schemes and corresponding callback handling in
your fork together.

## RevenueCat purchases and restoration

1. Create your own RevenueCat project and add the iOS/Android apps corresponding
   to your own store identifiers.
2. Put the **public SDK keys** in
   `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` and
   `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`. Do not put a RevenueCat secret API
   key into an `EXPO_PUBLIC_*` variable.
3. Configure the `pro_access` entitlement. The existing compatibility reader
   also accepts `Pro` and `pro`, but `pro_access` is the canonical setup.
4. Attach weekly, monthly and annual subscription packages to the current
   offering. The app selects RevenueCat package types first. Its legacy
   product-ID fallbacks remain in source for compatibility.
5. If using consumable Momenta packs, configure the credit offering/packages
   (`credits_small`, `credits_medium`, `credits_large`) and replace the sample
   product IDs in `public.rc_credit_mappings` with your own store products.
6. Deploy `revenuecat-webhook`. Generate a strong, separate webhook secret and
   configure the same value in RevenueCat's webhook Authorization header and
   the Edge Function's `REVENUECAT_WEBHOOK_AUTH` secret. The URL is your own
   Supabase project's `/functions/v1/revenuecat-webhook` endpoint.
7. Use your platform's sandbox purchase flow and test both purchase and restore.
   Confirm the server entitlement/receipt after the webhook. SDK-only purchase
   success does not establish the server's Pro or wallet state.

No purchase access from the hosted Menta service is included with this source.
The app handles missing or unavailable provider configuration; complete setup
is required to exercise purchases. The student submission can be assessed from
the source and demo, but should still demonstrate the intended RevenueCat flow.

## Optional providers and scheduled work

- Apple/Google login is disabled by default. Register your own OAuth clients,
  configure them in Supabase and the app, then enable the matching flags.
- Expo/OneSignal notification code is retained. Configure your own Expo project
  or OneSignal app and server credentials before enabling delivery. Schedule
  `daily-maintenance` with a secret `x-maintenance-secret` header; the same secret
  must be available to the scheduler and notification processor. Vault values
  used by the RPC worker wake-up path are `project_url`, `anon_key` and
  `daily_maintenance_secret`, and must be created in your own project. No cron
  jobs or decrypted vault values are copied from production.
- Ads use Google's documented sample native app IDs in the portable build and
  are disabled by default. Add your own configuration and verified server-side
  reward handling before enabling rewarded ads.
- Sentry, Amplitude, PostHog and Meta integrations remain available but contain
  no production keys in the public app config. They are optional for judging.
- Replace legal/contact links and document URLs with your own policies before
  distributing a fork. The reference metadata identifies the original Menta
  policy versions; it is not a legal policy for somebody else's deployment.

## Verification and limits

```sh
npm run check:public
npm run type-check
npm run test:core
npm run export:ios
```

The public export retains the upstream behavioural tests. Some broader suites
refer to private release tooling and historical operational documents that are
intentionally excluded. Run the relevant portable suites when changing app
behaviour; do not treat those excluded operational checks as runtime proof.

The schema is a data-free catalogue export of the backend contracts at the
source checkpoint, followed by public-install hardening. It is versioned as a
fresh baseline so developers do not need to replay the private project's
historical resets and repairs. Future schema changes belong in new migrations.
