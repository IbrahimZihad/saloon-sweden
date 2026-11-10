import fs from 'node:fs';
import path from 'node:path';

// Loads backend/.env into process.env for authenticated e2e tests.
// Mirrors backend/test/setup-env.ts: values are consumed only inside the
// test process and are never logged or asserted upon.
export function loadBackendEnv(): void {
  const envPath = path.resolve(process.cwd(), '../backend/.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}