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

