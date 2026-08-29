import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { derivePlatformState } from "@/lib/derive";
import { fetchPendingSubmissions } from "@/lib/github";

async function main(): Promise<void> {
  const root = process.cwd();
  const state = derivePlatformState(root);
  state.pending = await fetchPendingSubmissions();
  const destination = path.join(root, "public/data/state.json");
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(state, null, 2)}\n`, { flag: "w" });
  process.stdout.write(`wrote ${destination}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
