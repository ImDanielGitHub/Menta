# Menta

**Menta helps people do what they said they were going to do.**

Create a promise, decide what counts as proof, and follow through with people
who can support you or review it. Menta brings promises, groups, events, proof,
fair review and recovery into one mobile app.

This is the public, scrubbed app-source edition for **RevenueCat Shipaton 2026 —
Next Gen**. It contains the real application and its backend source, with
independent setup instructions. It does not contain customer data, private Git
history, production keys, or the release pipeline for the hosted service.

## What is included

- Email, Apple and Google sign-in; onboarding and account settings.
- Personal and shared promises, invitations, proof submission and peer review.
- Groups, accountability roles, recovery, streaks and progress.
- Events, check-in, media, organiser review and recaps.
- Momenta rewards, the shop, inventory and server-authorised purchases.
- RevenueCat subscriptions, purchases, entitlement reconciliation and restore.
- Notification preferences and optional Expo/OneSignal delivery.
- Reporting, blocking, privacy controls and account deletion.
- App routes, shared components, native iOS source, runtime artwork, tests,
  Supabase schema and Edge Functions.

## Run it

Use Node.js **20.19.4**, npm, and the platform's native development tools.
The app uses native modules and requires a development build; Expo Go is not
sufficient.

```sh
git clone https://github.com/ImDanielGitHub/Menta.git
cd Menta
nvm use
npm ci
cp .env.example .env.local
```

Follow **[the complete setup guide](docs/SETUP.md)** to start an independent
Supabase backend and fill in your own public configuration. Then:

```sh
npm run ios       # macOS + Xcode
# or
npm run android  # Android SDK + emulator/device
```

For an existing development build, use `npm start`. Provider features are
available in the source and become usable when you configure your own
RevenueCat, OAuth, ads and notification accounts. They are not backed by the
production Menta accounts in this repository.

## RevenueCat and judging

The purchase integration lives in `lib/paywall/revenuecat.ts`, the purchase and
restore screens, and `supabase/functions/revenuecat-webhook/`. The setup guide
describes the SDK keys, entitlement, products and webhook configuration.

The app is built with Expo, React Native, TypeScript, Supabase and RevenueCat.
The lockfile pins the dependency graph. `source-manifest.json` identifies the
upstream source revision represented by this edition.

For the submission, use this repository link together with the demo video and
the other assets required by the current competition rules. This repository
does not by itself assert submission or competition eligibility.

## Checks

```sh
npm run check:public
npm run type-check
npm run test:core
```

The wider upstream test collection is included for developers. Some suites
describe the private release infrastructure and require that infrastructure;
the public CI checks the portable app and the public configuration boundary.

## Licence and contributions

Original Menta code is available under the **MIT licence**. See
[third-party notices](THIRD_PARTY_NOTICES.md) for fonts, dependencies and brands,
[SOURCE.md](SOURCE.md) for the export boundary, and [SECURITY.md](SECURITY.md)
for private vulnerability reporting.

Bug reports and contributions are welcome. Keep credentials, customer records
and private screenshots out of public issues and pull requests.
