# Install your own Menta app

These steps run Menta with a backend you control. The backend stores accounts,
promises and proof. You do not need access to the official Menta service.

For a first run, use email sign-in and a local backend. Leave purchases, ads,
social sign-in and remote notifications off until the app is working.

## 1. Install the tools

| Tool                        | What it does                          | Install it                                                                                                                                        |
| --------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Git                         | Downloads the source code             | [Git downloads](https://git-scm.com/downloads)                                                                                                    |
| Node.js 22.23.2             | Runs the development tools            | [nvm for macOS/Linux](https://github.com/nvm-sh/nvm#installing-and-updating) or [Node.js](https://nodejs.org/en/download)                         |
| npm 11.19.1                 | Installs the JavaScript packages      | Run `npm install --global npm@11.19.1` after selecting Node                                                                                       |
| Docker                      | Runs the local backend services       | [Docker Desktop](https://www.docker.com/products/docker-desktop/)                                                                                 |
| Supabase CLI                | Starts and manages that backend       | [Supabase installation instructions](https://supabase.com/docs/guides/local-development/cli/getting-started)                                      |
| Xcode, for iOS              | Builds the iPhone/iPad app on a Mac   | [Expo's iOS setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=simulated&mode=development-build)         |
| Android Studio, for Android | Provides the Android SDK and emulator | [Expo's Android setup guide](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=simulated&mode=development-build) |

You only need the native tools for the platform you want to run. For iOS,
complete Xcode's first-launch setup, install an iOS simulator runtime and
CocoaPods. For Android, complete Android Studio's SDK setup and create an emulator.

Open Docker and wait until its engine is running. Allow room for its database
and service images as well as your native build. Free space on the host does
not necessarily mean Docker's virtual disk has free space.

Expo Go does not include all the native modules used by Menta. The commands
below build a development app containing those modules.

## 2. Download the project

Run these commands in a terminal:

```sh
git clone https://github.com/ImDanielGitHub/Menta.git
cd Menta
nvm install
nvm use
npm install --global npm@11.19.1
node --version
npm --version
npm ci
cp .env.example .env.local
cp .env.server.example .env.server
```

The version commands should report `v22.23.2` and `11.19.1`. If you do not use
nvm, install and select Node.js 22.23.2 yourself, then skip the two nvm commands.
On Windows, use your Node version manager and PowerShell's `Copy-Item` to copy
the example files.

Keep the terminal in the `Menta` folder for the rest of this guide.
`npm ci` installs the exact package versions in the lockfile and applies the
included dependency patches.

## 3. Start the backend

With Docker running, enter:

```sh
supabase start
supabase status
```

The repository already has a Supabase configuration; do not run `supabase init`.
The first start downloads the service images and creates a local database.
Supabase applies the migrations in filename order, then `supabase/seed.sql`.
The seed adds the shop catalogue, settings and empty storage buckets. It adds
no accounts, promises, proof or purchases.

Open `.env.local` in your editor and fill in these two values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

Replace `your-local-anon-key` with the **anon key** shown by `supabase status`.
Use the JWT-format anon key for this setup: the functions use JWT verification.
Never use the service-role key or a secret key in the app.

Choose the URL that matches where the app will run:

| Where the app runs                 | Supabase URL                        |
| ---------------------------------- | ----------------------------------- |
| iOS Simulator on the same Mac      | `http://127.0.0.1:55321`            |
| Android Studio emulator            | `http://10.0.2.2:55321`             |
| Physical phone on the same network | `http://YOUR_COMPUTER_LAN_IP:55321` |

For a phone, replace `YOUR_COMPUTER_LAN_IP` with the computer's address on your
Wi-Fi network. Your firewall must allow the connection. A tunnel for Expo's
development server does not also tunnel Supabase.

The local services use these addresses:

- Database dashboard (Studio): `http://localhost:55323`
- Test email inbox: `http://localhost:55324`
- App API: `http://localhost:55321`
- PostgreSQL database port: `55322`

Leave optional provider values blank and their enable switches off for now.

## 4. Start the server functions

Server functions handle actions that need trusted server-side checks.
Open a second terminal in the same `Menta` folder and run:

```sh
supabase functions serve --env-file .env.server
```

Leave this terminal running. The CLI supplies the local Supabase credentials
to these functions. The example file lists additional secrets for optional
features; do not put those secrets in `.env.local` or an `EXPO_PUBLIC_*` value.

Do not turn off JWT verification for all functions. The RevenueCat webhook
has its own exception and checks a separate webhook secret.

## 5. Build and open the app

In the first terminal, run one command:

```sh
npm run ios
# or
npm run android
```

For Android, start your emulator first or connect a device with USB debugging
enabled. The command builds and installs the app, opens it and starts the
development server. The first native build can take a while.

Create an account with email and a password of at least 12 characters.
Email confirmation is enabled. Open the test inbox at
`http://localhost:55324`, find the confirmation message and follow its link.
For a physical phone, open a reachable confirmation link on that phone.
After confirmation, return to the app and sign in. If the confirmation link
opens the browser without returning to the app, try signing in again after
confirming; check the callback settings below if the session still fails.

A useful first check is to create a personal promise and submit proof. Then
create a second test account to try an invitation and review. Purchases and
remote notifications will need their own setup.

For later sessions:

```sh
supabase start
# In a separate terminal:
supabase functions serve --env-file .env.server
# In another terminal:
npm start
```

Use the installed development app to connect to the server. Rebuild with
`npm run ios` or `npm run android` after changing native dependencies or native
configuration. Restart the development server after changing `.env.local`.

## 6. Run on a physical phone

Installing your own build is sometimes called sideloading. It installs an app
you compiled; this repository does not provide a signed download.

**iPhone/iPad:** connect the device to your Mac, trust it and enable Developer
Mode. Configure your Apple signing team, unique app and extension identifiers,
and the widget App Group in Xcode. Then run:

```sh
npm run ios -- --device
```

**Android:** enable Developer options and USB debugging, connect the phone,
accept the USB prompt, then run:

```sh
npm run android -- --device
```

Use the phone's backend URL from step 3. See
[Expo's local build guide](https://docs.expo.dev/guides/local-app-development/)
for platform-specific device requirements.

### iOS signing and widgets

The public defaults are `org.example.menta` for the app,
`org.example.menta.streakwidgets` for the widget and
`group.org.example.menta.widgets` for their shared App Group.
Before signing a device build, replace them with identifiers registered to you.

Update the app configuration, native Xcode targets and entitlements, and
`plugins/with-menta-streak-widget.js` together. The app's
`ExpoWidgetsAppGroupIdentifier` in `Info.plist` must match the widget's group.
The retained OneSignal extension needs its own identifier and signing setup
if you use it. Apple capabilities can affect which developer account is needed.

The native project is still named `LockedInPro`. Open
`ios/LockedInPro.xcworkspace` after CocoaPods has installed the dependencies.
That historical folder name is not an account you need access to.

The repository contains custom native files and a widget target. Do not run
`expo prebuild --clean` casually: it regenerates the native project and can
remove custom work. Expo updates are disabled by default.

The app supports the `menta`, `lockedin` and `lockedinprod` URL schemes.
Installing another app with the same schemes can send login links to the wrong
app. If you change them, update the callback code and Auth redirect URLs too.

## Use a hosted development backend instead

A hosted Supabase project avoids running Docker and makes phone networking
easier. Use a **new, empty project** for this installation.

1. Create the project in Supabase.
2. In its SQL editor, run every file in `supabase/migrations/` in filename
   order, starting with the baseline. Then run `supabase/seed.sql`.
3. Put that project's HTTPS URL and legacy anon JWT key in `.env.local`.
4. Deploy the functions in `supabase/functions/` using the Supabase CLI.
   Select your new project's reference explicitly:
   `supabase functions deploy --project-ref YOUR_PROJECT_REF`.
5. Add the secrets needed by the functions you use, following
   `.env.server.example`. For example:
   `supabase secrets set --env-file .env.server --project-ref YOUR_PROJECT_REF`.
   Fill in only your own values first.
6. Configure Auth redirect URLs including `menta://auth/callback` and
   `menta://password-recovery/callback`. Set a site URL you control and
   configure email delivery and confirmation for your test users.

The baseline creates a fresh application schema. It is not an upgrade script
for a different existing app. Local `supabase/config.toml` settings do not
automatically change the hosted project's dashboard settings.

## Optional services

### Purchases and restoring purchases

1. Create a RevenueCat project and connect the store apps registered to you.
2. Add the public SDK keys to `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` and
   `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`. Never put a secret API key in
   an `EXPO_PUBLIC_*` variable.
3. Create the `pro_access` entitlement and attach your subscription products.
   Set up weekly, monthly and annual packages in the current offering.
4. For Momenta packs, configure the credit packages
   (`credits_small`, `credits_medium`, `credits_large`) and replace the sample
   product IDs in `public.rc_credit_mappings` with your own products.
5. Deploy `revenuecat-webhook`. Set a strong `REVENUECAT_WEBHOOK_AUTH` secret
   and use the same value as the Authorization header in RevenueCat's webhook
   configuration. Point the webhook at your Supabase project's
   `/functions/v1/revenuecat-webhook` URL.
6. Test a sandbox purchase and a restore. Check that the webhook updates the
   account's Pro access or Momenta balance on the server.

### Apple and Google sign-in

Register your own OAuth clients and configure the provider in Supabase.
Add the client values from `.env.example` and enable the corresponding login
switch in the app configuration. The public defaults disable social sign-in;
email sign-in is the starting path. Apple login also needs its native capability
and signing configuration.

### Remote notifications and scheduled work

Set up your own Expo project or OneSignal app, plus the required server
credentials, before enabling remote notifications. The public app does not use
Menta's notification accounts.

The backend source includes maintenance, notification scheduling and delivery.
It does not install production cron jobs. Configure your own scheduler to call
`daily-maintenance`, `challenge-notification-scheduler` and
`notification-processor` as needed. For timely review notifications, run the
challenge scheduler every five minutes and the processor one minute later.
Use the handlers' required authentication; never create an unauthenticated job.

Maintenance uses an `x-maintenance-secret` header matching
`DAILY_MAINTENANCE_SECRET`. The database worker wake-up path expects Vault
entries named `project_url`, `anon_key` and `daily_maintenance_secret` in your
own project. No production job commands or Vault values are included.

### Ads, analytics and error reporting

Ads are off by default and the native configuration uses Google's sample app
IDs. Configure your own ad units and verified server reward handling before
enabling rewarded ads. The app credits rewards only after server confirmation.

Sentry, Amplitude, PostHog and Meta are optional. Configure your own accounts
if you need them; none is required for an initial email sign-in and promise.
Replace the original legal and contact links with your own policies before
distributing your fork.

### Your own app store pages

If you publish a fork, set `EXPO_PUBLIC_IOS_STORE_URL` or
`EXPO_PUBLIC_ANDROID_STORE_URL` to your own app listing before enabling an app
update policy. Set `EXPO_PUBLIC_IOS_STORE_ID` or
`EXPO_PUBLIC_ANDROID_STORE_PACKAGE` to enable the "Leave a review" link in
Settings. The public defaults leave these links empty so your build never
sends someone to the official Menta listing.

## Troubleshooting

| Problem                                        | What to check                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `nvm: command not found`                       | Install nvm and reopen the terminal, or install Node 22.23.2 directly.                               |
| `EBADENGINE` or npm version error              | Run `nvm use`, then install npm 11.19.1. Check both versions before `npm ci`.                        |
| Supabase cannot connect to Docker              | Open Docker Desktop and wait for its engine to finish starting.                                      |
| Docker reports no space left                   | Check Docker's disk usage and disk limit. Preserve existing projects and volumes when freeing space. |
| App cannot reach the backend                   | Check the URL for your simulator/device, the running Supabase services and your firewall.            |
| Missing Supabase configuration                 | Fill in both values in `.env.local` and restart the development server.                              |
| Confirmation email is missing                  | Open the local test inbox, or check SMTP configuration for a hosted project.                         |
| Link opens another Menta installation          | Check the shared URL schemes and the Auth redirect URL.                                              |
| Expo Go reports a missing native module        | Install a development build with `npm run ios` or `npm run android`.                                 |
| Xcode reports signing or App Group errors      | Check the app, widget and notification extension targets use your own identifiers and signing team.  |
| Native module is missing after an update       | Run `npm ci` and rebuild the native app. Restarting Metro alone is insufficient.                     |
| Purchases, ads or social login are unavailable | Complete the relevant optional provider setup; source code alone does not connect those accounts.    |

To stop the local backend, run `supabase stop`. Stop the function server and
Expo server with Ctrl+C in their terminals. To erase and rebuild **this
disposable local database**, run `supabase db reset --local`. This removes its
test accounts and content.

## Check the installation

```sh
npm run check:public
npm run type-check
npm run test:core
npm run export:ios
```

The export command checks that the iOS JavaScript and assets can be bundled.
It does not compile the native app or prove that sign-in, purchases or device
notifications work. Test those in your own development build.

The wider test collection includes checks for release tools and historical
migrations that are excluded from this public repository. Public CI runs the
portable core suite. Add relevant behavioural tests for changes you make.

The setup uses a data-free baseline followed by forward migrations. Future
schema changes belong in new migration files. After updating PostgreSQL or its
timezone data, refresh the timezone catalogue with
`select private.refresh_timezone_names_v1();` using an authorised database
administrator, then compare it with `pg_catalog.pg_timezone_names`.
