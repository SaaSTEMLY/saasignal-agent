/**
 * Fetches live content from the SaaSignal API and writes it to the repo.
 * Uses If-None-Match with cached ETags to skip unchanged content.
 *
 * Usage: bun run saasignal-agent/scripts/sync.ts
 */

import path from "node:path";

const API_BASE = "https://api.saasignal.saastemly.com";
const AGENT_DIR = path.resolve(import.meta.dir, "..");
const ETAG_CACHE_PATH = path.join(AGENT_DIR, "scripts/.etag-cache.json");

const SKILL_FRONTMATTER = `---
description: Operate the SaaSignal serverless infrastructure API — KV, Channels, Jobs, Storage, AI, Logistics, Delivery — via MCP, REST, SDK, or CLI
disable-model-invocation: true
---

`;

type ETagCache = Record<string, string>;

async function loadETagCache(): Promise<ETagCache> {
  try {
    const file = Bun.file(ETAG_CACHE_PATH);
    if (await file.exists()) {
      return JSON.parse(await file.text());
    }
  } catch {
    // ignore
  }
  return {};
}

async function saveETagCache(cache: ETagCache): Promise<void> {
  await Bun.write(ETAG_CACHE_PATH, JSON.stringify(cache, null, 2) + "\n");
}

async function fetchWithETag(
  url: string,
  etag: string | undefined,
): Promise<{ status: number; text: string; etag: string | null }> {
  const headers: Record<string, string> = {};
  if (etag) headers["If-None-Match"] = etag;

  const res = await fetch(url, { headers });
  return {
    status: res.status,
    text: res.status === 304 ? "" : await res.text(),
    etag: res.headers.get("etag"),
  };
}

async function main() {
  const cache = await loadETagCache();
  let changed = false;

  // 1. Fetch agent skill
  const skillUrl = `${API_BASE}/skills/saasignal`;
  console.log(`Fetching ${skillUrl}...`);
  const skillRes = await fetchWithETag(skillUrl, cache[skillUrl]);

  if (skillRes.status === 200) {
    // Root SKILL.md (skills.sh entry point) — no frontmatter
    await Bun.write(path.join(AGENT_DIR, "SKILL.md"), skillRes.text);

    // Plugin SKILL.md — with YAML frontmatter
    await Bun.write(
      path.join(AGENT_DIR, "plugins/saasignal/skills/saasignal/SKILL.md"),
      SKILL_FRONTMATTER + skillRes.text,
    );

    if (skillRes.etag) cache[skillUrl] = skillRes.etag;
    changed = true;
    console.log("  Updated SKILL.md");
  } else if (skillRes.status === 304) {
    console.log("  Not modified (304)");
  } else {
    console.error(`  Unexpected status: ${skillRes.status}`);
  }

  // 2. Fetch llms-full.txt
  const llmsUrl = `${API_BASE}/llms-full.txt`;
  console.log(`Fetching ${llmsUrl}...`);
  const llmsRes = await fetchWithETag(llmsUrl, cache[llmsUrl]);

  if (llmsRes.status === 200) {
    await Bun.write(path.join(AGENT_DIR, "references/llms-full.txt"), llmsRes.text);
    if (llmsRes.etag) cache[llmsUrl] = llmsRes.etag;
    changed = true;
    console.log("  Updated references/llms-full.txt");
  } else if (llmsRes.status === 304) {
    console.log("  Not modified (304)");
  } else {
    console.error(`  Unexpected status: ${llmsRes.status}`);
  }

  await saveETagCache(cache);

  if (changed) {
    console.log("\nContent updated. Commit and push if running in CI.");
  } else {
    console.log("\nNo changes detected.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
