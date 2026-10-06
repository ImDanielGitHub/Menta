# Where this code comes from

This is the public source edition of Menta. It contains the mobile app, runtime
artwork, tests, native iOS code, widgets and server functions. You can build it
with your own Supabase backend and provider accounts.

## Current source

The app source is updated to version **1.9.9**.
`source-manifest.json` records the exact upstream commit and a SHA-256 hash for
each selected file before public configuration changes. Each `publicSha256`
records its actual public bytes; `npm run check:public` verifies those hashes.

This updates the previous public 1.9.7 snapshot. It includes the newer onboarding,
Today and You screens, Pro journey, Momenta top-ups, shop, invitations, widget
support, icon and language fixes, light/dark appearance, Menta Check, smart
reminders and the activity inbox. It also includes the current free-plan
paywall, trial-credit reconciliation, proof media reuse and deletion recovery fixes. Source inclusion does not establish that every
feature has been tested on a device in this edition.

The tracking update uses confirmed receipts and local deduplication across normal
retries and recovery. Proof content and receipt identifiers are not added to the
`Proof Submitted` event properties. This does not establish provider delivery.

The 1.9.9 sync adds localized receipts and actions, media consent, proof and
sign-in recovery, startup and appearance fixes, and group access and subscription
authority hardening. New forward migrations contain schema and authorization
changes only; they do not apply to a hosted backend automatically.

## What is different here

The public app has its own example bundle identifiers, no Apple signing team
and no connection to the official Expo update project. Purchases, social login,
ads, analytics and remote notifications need your own provider configuration.
The code for those features is retained.
Store update and review links are also blank until you provide your own app
listing. The public build cannot direct users to the hosted app's store page.

The database starts from a data-free public baseline. Later migrations add
invite expiry after account deletion, the timezone-name cache and the profile
month summary, weekday check-in schedules, Menta Check and the current proof/review fixes.
Worker and evidence-retention schedules are deliberately not installed by the
public forward migrations; configure them for your own backend. The earlier
production-only notification schedule migration is omitted because it modifies
jobs that a new installation does not have.
[The setup guide](docs/SETUP.md#remote-notifications-and-scheduled-work)
explains how to configure your own scheduled work.

Customer records, private Git history, tester feedback, signing credentials,
machine settings, internal reports, design archives and production deployment
workflows are excluded. Original legal and contact links remain references to
Menta; replace them before distributing your own service.

## How updates work

Updates are reviewed before publication. New files are checked against the
public export policy. Database changes are brought across as reviewed forward
migrations, rather than replaying the private project's historical migrations.

Public installation instructions, licences, configuration and safety checks are
maintained separately so that a sync preserves them. Updates must pass the public
boundary check, secret scan, type check and relevant tests. Native builds and
device testing are separate checks; a JavaScript bundle alone does not prove them.

This repository does not automatically deploy to the hosted Menta service or
publish to the app stores.
