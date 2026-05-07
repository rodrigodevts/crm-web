#!/usr/bin/env node
// After `kubb generate`, prepend a type re-export to the client barrel so
// that generated hooks that import `Client / RequestConfig / ResponseErrorConfig`
// from "../client" can compile. Kubb 4.37 does not include these by default
// (barrelType: 'named' only emits named function exports). Removing this
// patch breaks pnpm typecheck for any consumer that imports a Kubb hook.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BARREL = resolve(process.cwd(), 'lib/generated/client/index.ts');
const RE_EXPORT_LINE =
  'export type { Client, RequestConfig, ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";';

const content = await readFile(BARREL, 'utf8');

if (content.includes(RE_EXPORT_LINE)) {
  // already patched — idempotent
  process.exit(0);
}

const patched = `${RE_EXPORT_LINE}\n${content}`;
await writeFile(BARREL, patched, 'utf8');
console.log('Patched lib/generated/client/index.ts with Kubb client type re-exports.');
