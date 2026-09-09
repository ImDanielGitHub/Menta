# Pro and Momenta commerce reference lock

This lock applies to the Pro paywall, Momenta ledger, shop, item detail and
inventory surfaces. Paper remains the canonical Menta specification; external
references contribute only the explicitly named patterns below.

## Canonical Paper boards

- File: `Menta Ground-Up Rebuild` (`01KYSFHARFSPAWEKMPKXSV4R3Y`)
- Page `A-0`: all 16 `PAY-*` artboards, from `PAY-01 — Contextual Gate`
  (`1EE-0`) through `PAY-10 — Manage Subscription` (`1MT-0`).
- Page `C-0`: all 25 `MOM-*`, `SHP-*`, `INV-*`, `TOP-*` and `ADV-*`
  artboards, from `MOM-01 — Momenta Ledger` (`71J-0`) through
  `MOM-05 — No Activity Yet` (`9QH-0`).
- Canonical roles: `#080909` canvas, `#101111` surface, `#181919` raised,
  `#2B2C2C` border, `#F8F7F1` paper, `#B88CFF` action,
  `#A78BFA` pressed, `#8DE7B7` success, `#F0C15C` warning and
  `#FF6B7A` danger. The mobile content lane is 342 points with 8/12/16
  radii. Inter is the interface face; Newsreader is reserved for editorial
  promise, milestone and ledger moments.

## Reference ingredients

- Primary style: Refero Obsidian (`f2721e99-535f-4617-a78c-8d2da8c428e1`)
  for near-black layered surfaces, restrained borders and violet used only for
  action or selected state.
- Borrowed structure: Refero Linear Changelog
  (`11d3e58a-87d7-4a9a-bbf5-720f4fd3ffc6`) for compact Inter hierarchy,
  direct divider rows and quiet density.
- Borrowed commerce hierarchy: Refero Shop
  (`99ad9095-ee38-4495-95e1-af4255b27631`) for a clear product/price/action
  scan, excluding its light and glow treatment.
- Subscription selection: [Poppy paywall](https://refero.design/screens/49fd743e-4622-4374-b908-ad9eebb7949d)
  for explicit radio selection, live loading, restore and legal recovery.
- Subscription management: [Raycast subscription details](https://refero.design/screens/1745596a-bbf2-4876-afdd-5e481012266c)
  for label/value rows and an explicit hand-off to the system subscription
  surface.
- Dark hierarchy check: [Flighty Pro](https://refero.design/screens/c9b1f091-18fa-42de-a2dd-606937ee4ff1)
  for legible dark-plan hierarchy only, not its promotional badge treatment.
- iOS plan choice: [Cosmos paywall](https://mobbin.com/screens/91d900d5-6200-436e-898a-27531589331d)
  for monthly/annual selection and a visible restore path.
- iOS management rows: [Lyft subscription management](https://mobbin.com/screens/3c6731e6-7f2f-4356-b270-79a58a95cae8)
  for readable plan, renewal and management rows.
- Receipt hierarchy: [Etsy receipt](https://mobbin.com/screens/6c94b5a9-331e-4792-88db-71825ced49c9)
  for explicit line-item and paid-state language.
- Empty ownership state: [Fuse empty inventory](https://mobbin.com/screens/e30e6910-c602-42db-878c-d002cea78119)
  for a calm empty state with one next action.

## Preserved implementation rules

1. Live App Store prices are the only prices shown for Pro and reserve packs.
2. Menta never recreates Apple's native purchase or subscription interface.
3. A StoreKit return is not a Menta entitlement, wallet credit or inventory
   receipt. Pending and unknown results explicitly block repeat purchase advice.
4. Inventory is shown only after an account-scoped ownership read succeeds.
5. Shop and inventory use direct rows with stable icon, copy and trailing lanes.
6. Loading uses layout-faithful skeleton rows. Empty, unavailable, cancelled,
   delayed and failed states remain semantically distinct.
7. Existing mascot art may be reused when it is already available in the app.
   The Paper Pro mascot fill remains reference-only until a canonical runtime
   asset is confirmed.

## Rejected patterns

- Marketing glow, decorative gradients and card-everything layouts.
- Pill-everything navigation and badges that imply a preferred value plan.
- Generic centred spinners where Paper specifies a skeleton or receipt state.
- Guessed pricing, guessed renewal dates, optimistic unlocks or optimistic
  inventory.
- Fake Apple confirmation sheets, duplicate-purchase prompts and success copy
  before the Menta entitlement or server receipt is confirmed.
