# Test Menta

Choose the hosted app to evaluate the submitted service, or the source edition
to evaluate a backend you control. The public source has independent bundle IDs
and no production Expo, Supabase or payment connections.

## Hosted iOS app: quickest test

1. Download [Menta from the App Store](https://apps.apple.com/us/app/id6747362646)
   on a supported iPhone or iPad. Use the store's current OS requirements.
2. Create your own account using email, confirm the email if prompted, and
   complete onboarding. Do not use or share another person's credentials.
3. Choose **Continue with free** when offered. Create a personal promise such
   as "Read ten pages" and choose a concrete proof rule. Use peer review for
   this first free-plan walkthrough; Menta Check requires Pro or eligible access.
4. Submit a photo, video or text proof allowed by that promise. Open the receipt
   and return to Today. For a peer-review walkthrough, invite a second consenting
   tester, have them sign in with their own account, then approve the proof.
5. Open the Today bell to inspect Activity. In notification settings, inspect
   Smart reminders, the usual reminder time and Advanced options. Change the
   appearance in Settings. On iOS, follow the Home Widget setup instructions.
6. Inspect the Momenta wallet and shop. The first personal promise is free;
   later creations cost 30 Momenta. Free accounts can create four promises per
   server calendar month and have three active promises at once. Pro lifts
   capacity caps but does not waive Momenta action costs.

The first five steps do not require a subscription purchase. Store prices,
currency and introductory eligibility vary; read the store sheet before any
purchase. A paid introductory week is not a free premium trial.

### Premium testing

Judge access to all premium features needs a verified free trial or promo code
supplied privately in the submission's judge instructions. No judge credentials,
code or premium grant is included in this repository. If those instructions do
not provide working free access, premium judging is still blocked: do not buy a
subscription simply to complete the walkthrough.

After redeeming eligible, organizer-provided access, inspect the Pro journey,
restoration and Menta Check with its explicit proof-disclosure consent. Confirm
access on the server before testing premium actions. Do not bypass receipt,
consent or authorization checks. The optional automated reviewer uses external
providers; its result is not guaranteed by a screenshot or source test.

### Advertising

Free accounts may see an automatic break after every second new proof, subject
to consent, provider availability, daily limits and cooldown. The proof is saved
before the ad; breaks do not add Momenta. Pro suppresses required breaks.
Optional rewarded ads add Momenta only after verified provider/server receipts.
Availability on a particular device has not been established by this source.

Never click live ads to test monetization. Judge APKs and self-hosted development
should use [Google's official test ad units or registered test devices](https://developers.google.com/admob/android/test-ads).
Test impressions and revenue events are not production traction.

## Run the public source with your own backend

Follow [SETUP.md](SETUP.md) for the pinned Node/npm versions, Supabase,
email confirmation, Edge Functions and device networking. Run `npm ci`, copy
both environment templates, start your own backend and fill in its public URL
and anon key. Leave provider integrations off until separately configured.
Never put service-role, provider or signing secrets in the app.

Use `npm run android` or `npm run ios` to build a native development app;
Expo Go is insufficient. Repeat the free-plan walkthrough above using accounts
you create on your own backend. Purchases, Menta Check, reward ads, social login,
remote notifications and background schedules each need their own provider
configuration. A checkout does not connect them to the hosted Menta service.

The source snapshot is pinned in [source-manifest.json](../source-manifest.json).
For reproducibility, pin the public Git commit reviewed for the submission
rather than following a moving branch. This checkout is source evidence;
it does not establish device QA or premium access on the hosted app.

## Build a standalone Android APK locally

There is currently no verified, current judge APK linked by this repository.
An older APK or an Android App Bundle (`.aab`) is not a replacement: an AAB
cannot be sideloaded directly. See [Expo's APK guide](https://docs.expo.dev/build-reference/apk/).

On a machine with Android Studio's SDK, NDK, build tools, the required Java
version and sufficient disk space, complete the self-hosted setup first.
Point `.env.local` at a backend reachable from the intended phone, not a
computer-only loopback address, and use that backend's public anon key.
Then, from the repository root:

```sh
npm ci
npx expo prebuild --platform android --no-install
cd android
./gradlew :app:assembleRelease
# Windows: gradlew.bat :app:assembleRelease
```

The generated project normally writes
`android/app/build/outputs/apk/release/app-release.apk`. This release variant
includes the JavaScript bundle and does not need a Metro development server;
it still requires the configured backend and internet or LAN connectivity.
Generated development signing is suitable only for a test installation, not
an official store release. Keep private signing material outside Git.

Before distributing any APK, verify its actual package/version, supported
Android versions and ABIs, signing certificate, backend, source commit and
SHA-256 checksum. Test it on a physical Android device. Do not label a binary
"current" because its filename or OTA channel looks current. Do not claim that
a public-source build uses the hosted service or purchases unless those have
actually been configured and verified.

For an approved, verified APK:

1. Download it from the exact reviewed artifact link in the judge instructions.
   Check its version/source/checksum against the accompanying artifact record.
2. Allow installation from that browser or file manager when Android prompts,
   install the APK, then turn that permission off again.
3. Open Menta, create your own account, and follow the applicable free/premium
   paths above. Backend-specific accounts are not interchangeable.
4. Alternatively, connect an authorized device and use `adb install PATH.apk`.
   A package/signature conflict needs resolution before installation; do not
   uninstall a judge's existing app or erase its data without their consent.

An APK is supplementary submission evidence, not a qualifying public store
release. [Shipaton's submission guide](https://www.shipaton.com/blog/how-to-submit-your-app-for-shipaton)
explains the store and free-premium-access requirements and the public-source
exception for Next Gen. The reviewed APK link and testing notes can be supplied
in the submission's additional judge notes. No release asset is published by a
source synchronization PR.
