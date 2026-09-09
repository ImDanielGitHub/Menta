# Contributing

Start with `docs/SETUP.md` and use a separate backend. Keep pull requests focused
on a user-visible behaviour or a concrete reliability or security improvement.
Describe the change, its reason and the checks you ran.

Run `npm run check:public`, `npm run type-check` and the relevant behavioural
tests. For a visual change, include fresh screenshots from your own test account
and remove personal information first. Never include credentials or production
customer data. Report vulnerabilities privately as described in `SECURITY.md`.

The public edition is maintained through a reviewed export. Changes to app logic
may be integrated with the main development source before the next public sync;
public configuration, licensing and setup documentation stay specific to this
edition. Contributions are provided under the repository's MIT licence, while
third-party components retain their own licences.
