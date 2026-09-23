# Source and synchronisation

This is a complete app-source edition of Menta prepared for public development
and RevenueCat Shipaton's Next Gen submission. It is maintained from Menta's
private development source through a reviewed export.

`source-manifest.json` records the exact upstream commit and hashes of the
selected upstream files before public configuration overrides. The public Git
history begins with this edition. Private development history is not included.

The app routes, components, stores, business logic, native iOS source, runtime
assets, tests, and server functions are retained. The public edition substitutes
portable build configuration and documents how to create an independent backend.
It excludes customer records, tester feedback, machine configuration, store
credentials, production deployment workflows, internal reports, and historical
design evidence. RevenueCat purchasing and restoration remain part of the app.

Updates are reviewed before publication. New upstream files require explicit
review against the export policy. Source updates must pass public-boundary and
secret checks, preserve these public setup files, and keep provider integrations
optional until the operator configures their own accounts. There is no automatic
deployment to the hosted Menta app from this repository.

This edition can lag the iOS App Store app and the private development source.
`source-manifest.json` records the base export as `sourceVersion` 1.9.3 and
`sourceCommit` `89388cec2b39ec2fb52a68b0e85e9c8665055df7`. A later partial sync
refreshes selected product files from LockedInProd `a5e6a1e5871ae4baa7cce332ae1e453f9a64b1d1`
(package 1.9.5). That sync is not a full re-export. The checked-in iOS target
stays marketing version 1.9.3, build 154. The live iOS App Store build is
1.9.5, released 10 September 2026. Both require iOS 16.4. Updates published
here are reviewed exports, not an automatic deploy of the store binary or of
the private source.

