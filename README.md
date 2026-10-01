# Menta

Menta helps people do what they said they were going to do. Create a promise,
choose what counts as proof, and invite people to support you or review it.

This repository contains the mobile app and the code for running your own
backend: the service that stores accounts, promises and proof. The code is
available under the MIT licence. Your installation uses your own accounts and
data.

## Try Menta

- **Use the published app:** download [Menta from the App Store](https://apps.apple.com/app/id6747362646).
  This is the hosted service. It does not test a build from this repository.
- **Run the source code:** follow the steps below and the [installation guide](docs/SETUP.md).
  You will need a computer, native app development tools and a Supabase backend.
  See the [judge quickstart](docs/JUDGING.md) for the free test path, premium
  access requirements, and building a standalone Android APK. There is no
  verified current APK or IPA published with this source snapshot.

## Install and run the code

Start with the [installation guide](docs/SETUP.md#1-install-the-tools) if you have
not used Node.js, Xcode, Android Studio or Supabase before. Expo Go cannot run
this app; you will build a development version for your simulator or device.

With Git and [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) installed,
open a terminal and run:

```sh
git clone https://github.com/ImDanielGitHub/Menta.git
cd Menta
nvm install
nvm use
npm install --global npm@11.19.1
npm ci
cp .env.example .env.local
cp .env.server.example .env.server
```

The project uses **Node.js 22.23.2 and npm 11.19.1**. On Windows, install the same
Node version using your preferred version manager; `nvm` above is for macOS/Linux.
Use `Copy-Item` in PowerShell in place of `cp` if needed.

Next, [start your local Supabase backend and fill in two settings](docs/SETUP.md#3-start-the-backend).
Then build the app:

```sh
npm run ios       # macOS with Xcode
# or
npm run android   # Android Studio with an emulator or connected device
```

These commands build, install and open the app, and start its development server.
On later visits, run `npm start` to use an already installed development build.
The guide covers [physical phones](docs/SETUP.md#6-run-on-a-physical-phone),
[common problems](docs/SETUP.md#troubleshooting) and optional services.

## What you can work on

- Promises, including weekday check-in schedules, proof uploads, peer review,
  groups and invitations.
- Onboarding, Today, the You profile calendar and streaks.
- Momenta rewards, the shop, inventory and top-up screens.
- Pro subscriptions, purchases and restoring purchases with RevenueCat.
- Events, notifications, account settings, reporting and account deletion.
- iOS home-screen widgets, tablet layouts and translated app text.

Email sign-in and the core app use your Supabase project. Purchases, social
sign-in, ads and remote notifications need additional provider setup. These
services are not connected to the official Menta accounts. See the
[setup guide](docs/SETUP.md#optional-services) for what to configure.

## Check your changes

```sh
npm run check:public
npm run type-check
npm run test:core
npm run test:judge
```

`check:public` checks that the repository keeps independent configuration and
does not include recognised private files or credentials. Type checking catches
TypeScript errors. The core tests cover proof status and purchase helpers.
The judge regression suite covers proof/deletion recovery, reminders, the inbox,
the free paywall and Menta Check contracts. Some inherited broad-suite contract
tests still reference private historical migrations or production-only release
files absent from this edition; they are not a self-hosted database smoke test.
Run the relevant additional tests when changing other features.

## About this version

This update brings the app source to **1.9.7**, including the latest shipped
proof, deletion, free-plan and reminder fixes. [SOURCE.md](SOURCE.md) describes
what is included and how updates work; `source-manifest.json` records the exact
source revision. A source update does not publish an App Store build.

Menta uses Expo, React Native, TypeScript, Supabase and RevenueCat. The original
public edition was prepared for RevenueCat Shipaton 2026.

See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute,
[SECURITY.md](SECURITY.md) to report a vulnerability privately, and
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for dependency and artwork
notices. The [MIT licence](LICENSE) covers original Menta code; it does not grant
rights to provider brands or the Menta trademark.
