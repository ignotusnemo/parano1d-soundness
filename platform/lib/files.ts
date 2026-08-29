import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseStrictJson } from "@/lib/strict-json";

export function readStrictJsonFile(filePath: string): unknown {
  return parseStrictJson(readFileSync(filePath, "utf8"));
}

export function jsonFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(directory, name))
    .filter((filePath) => statSync(filePath).isFile())
    .sort();
}

export function assertUnique<T>(values: T[], key: (value: T) => string, label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    const id = key(value);
    if (seen.has(id)) throw new Error(`duplicate ${label}: ${id}`);
    seen.add(id);
  }
}
