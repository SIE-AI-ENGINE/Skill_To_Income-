---
name: OpenAPI integer compatibility
description: Compatibility constraint between OpenAPI numeric schemas and the generated Zod client in this workspace.
---

Use `type: number` for numeric API fields in the OpenAPI contract unless the codegen/Zod versions are upgraded together. The installed generator emitted `zod.int()` for OpenAPI `integer`, but the workspace's Zod runtime did not expose that method, causing library typecheck failures.

**Why:** Codegen succeeded but the chained workspace typecheck failed until integer fields were represented as numbers.

**How to apply:** After changing the numeric contract, run `pnpm --filter @workspace/api-spec run codegen` and then the full typecheck before using the generated hooks.