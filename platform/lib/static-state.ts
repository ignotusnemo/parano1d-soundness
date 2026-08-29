import { readFileSync } from "node:fs";
import path from "node:path";
import type { PlatformState } from "@/lib/types";

export function readBuiltPlatformState(root: string): PlatformState {
  return JSON.parse(readFileSync(path.join(root, "public/data/state.json"), "utf8")) as PlatformState;
}
