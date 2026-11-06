---
name: TypeScript 7 test harness
description: Run focused runtime checks for TypeScript modules when the installed TypeScript package no longer exposes the legacy compiler API.
---

For isolated runtime tests, compile the TypeScript source with the local `tsc` CLI into a temporary ES module directory instead of importing `transpileModule` from the `typescript` package root.

**Why:** TypeScript 7.0.2 exposes version metadata at the package root rather than the former compiler API. Importing `ModuleKind` or `transpileModule` from that entry fails even though the `tsc` CLI works.

**How to apply:** Use `tsc --ignoreConfig --noCheck` only for the focused runtime harness when unrelated Vite ambient types block standalone compilation; keep `npm run build` as the full project type check.
