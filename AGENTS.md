# Working on Menta

This is the public, scrubbed edition of Menta. Preserve the app's behaviour and
keep its configuration independent of the hosted production service.

- Never add credentials, customer records, private operational reports, or
  production deployment connections. Public SDK keys must still be supplied
  through the user's own environment rather than checked-in defaults.
- Keep user data behind Supabase grants, RLS, and server-authorised functions.
- Preserve the separation between client configuration and server secrets.
- Preserve the full app source and runtime assets. Do not replace working
  features with mocks or remove features to make an export pass.
- Keep third-party notices with bundled third-party assets.
- Validate changes with `npm run check:public`, `npm run type-check`, and the
  relevant existing behavioural tests. Do not use a production database for tests.
- See `SOURCE.md` for the synchronisation boundary and `docs/SETUP.md` for setup.

