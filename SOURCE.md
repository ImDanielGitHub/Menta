# Where this code comes from

This is the public source edition of Menta. It contains the mobile app, runtime
artwork, tests, native iOS code, widgets and server functions. You can build it
with your own Supabase backend and provider accounts.

## Current source

The app source is updated to version **1.9.6**.
`source-manifest.json` records the exact upstream commit and a SHA-256 hash for
each selected file before public configuration changes.

This replaces the earlier partial 1.9.5 update. It includes the newer onboarding,
Today and You screens, Pro journey, Momenta top-ups, shop, invitations, widget
support, icon and language fixes. Source inclusion does not establish that every
feature has been tested on a device in this edition.

## What is different here

The public app has its own example bundle identifiers, no Apple signing team
and no connection to the official Expo update project. Purchases, social login,
ads, analytics and remote notifications need your own provider configuration.
The code for those features is retained.
Store update and review links are also blank until you provide your own app
listing. The public build cannot direct users to the hosted app's store page.

The database starts from a data-free public baseline. Later migrations add
invite expiry after account deletion, the timezone-name cache and the profile
month summary, and weekday check-in schedules. The production-only notification schedule migration is omitted
because it modifies jobs that a new installation does not have.
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
