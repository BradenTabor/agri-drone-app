import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertSupabaseTargetSafe,
  resolveE2eTestMode,
} from "./lib/supabase-project-guard";

function loadEnvFile(relativePath: string): void {
  const filePath = resolve(process.cwd(), relativePath);
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalE2eEnv(): void {
  loadEnvFile(".env.local");
  loadEnvFile(".env.e2e.local");
}

export default async function globalSetup(): Promise<void> {
  loadLocalE2eEnv();

  const mode = resolveE2eTestMode();
  const ci = process.env.CI === "true";

  assertSupabaseTargetSafe({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    mode,
    ci,
  });
}
