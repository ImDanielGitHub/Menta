# Event album and recap read-model decisions

Verified for this change on 5 August 2026 against the repository's installed
versions: `@supabase/supabase-js` 2.86.0, Expo SDK 55, `expo-camera` 55.0.19,
and `expo-image-picker` 55.0.20.

## Current documentation decisions

- Supabase JavaScript 2.x RPC calls return `{ data, error }`. The app accepts a
  payload only after an exact-key DTO decoder succeeds; transport errors,
  malformed payloads, and partial media signing remain distinguishable from a
  confirmed empty result.
- Private Storage media is exposed through short-lived signed URLs. The Edge
  Function performs an exact post lookup and signs every requested path for 60
  seconds. Any missing, duplicate, mismatched, or unsigned item fails the whole
  read instead of presenting a partial album as complete.
- PostgreSQL `SECURITY DEFINER` functions use an empty `search_path`, qualify
  referenced objects, revoke default `PUBLIC` execution, and grant only the two
  caller-scoped entrypoints to `authenticated`. The internal JSON helper stays
  security-invoker because it does not cross a privilege boundary.
- Expo camera and image-picker permissions remain request-driven in their
  existing routes. This read-model change does not add a native dependency or
  Expo configuration plugin, so it stays inside the JavaScript/SQL boundary.

Documentation was read through Context7 from `/supabase/supabase`,
`/websites/postgresql_current`, and `/expo/expo/__branch__sdk-55`.

## Product and visual decisions

The locked Paper direction is a restrained Partiful-style attendee album:
direct settings/fact rows, one explicit private-media permission statement,
purpose-built empty states, and a 226 x 198 plus two 108 x 95 image composition.
Refero creation-flow evidence reinforces explicit steps and system-owned
permissions. Menta keeps the stricter contract: eligibility is server-owned,
only checked-in approved posts appear, organiser recap counts are server facts,
and durable Storage paths never reach the mobile DTO.

## Proof boundary

This source change adds contracts, migration source, Edge wiring, store state,
and production routes. It does not prove the migration is applied, an Edge
Function is deployed, private media exists, or an iOS runtime has rendered the
screens. Those require separate linked-environment and runtime evidence.
