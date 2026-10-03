---
name: Readable JSX branches
description: Keep nested page sections readable when editing complex conditional JSX.
---

Keep JSX branches with nested lists and empty states in multiline form rather than compressing them into one long line.

**Why:** A missing closing brace in compact JSX made the TypeScript parser report the error at a later closing element, obscuring the actual mismatch.

**How to apply:** When editing a dense conditional section, format that branch across multiple lines and run the project build before continuing.