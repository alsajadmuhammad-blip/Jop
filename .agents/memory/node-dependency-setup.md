---
name: Node dependency setup
description: Recovery path when npm dependency installation fails in this workspace.
---

When the managed npm installer fails with an Arborist `edgesOut` error, use the existing pnpm lockfile with `pnpm install --frozen-lockfile` rather than changing dependency versions or lockfiles.

**Why:** The workspace has both npm and pnpm lockfiles, and npm 10 failed while resolving the existing dependency tree; pnpm installed the pinned versions without changing the manifests.

**How to apply:** Check that `pnpm-lock.yaml` matches `package.json`, then install from that lockfile and verify with the project build.
