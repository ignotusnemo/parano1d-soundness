import assert from "node:assert/strict";
import test from "node:test";
import { parseStrictJson } from "@/lib/strict-json";
import { submissionManifestSchema } from "@/lib/schemas";

test("strict JSON rejects duplicate keys", () => {
  assert.throws(() => parseStrictJson('{"claim":"one","claim":"two"}'), /duplicate object key/);
});

test("strict JSON rejects floating point metrics", () => {
  assert.throws(() => parseStrictJson('{"bits":173.2}'), /exact metrics must be strings/);
});

test("strict JSON accepts exact decimal strings", () => {
  const value = parseStrictJson('{"bits":"173.273866314232","schemaVersion":1}') as Record<
    string,
    unknown
  >;
  assert.equal(value.bits, "173.273866314232");
  assert.equal(value.schemaVersion, 1);
});

test("strict JSON rejects non-standard Unicode whitespace", () => {
  assert.throws(() => parseStrictJson('{\u00a0"value":1}'), /object key must be a string/u);
});

test("model attribution accepts real provider model identifiers without treating them as paths", () => {
  const manifest = submissionManifestSchema.parse({
    schemaVersion: 1,
    id: "model-id-check",
    track: "test-track",
    contractVersion: "1.0.0",
    title: "Model identifier check",
    note: "This source-pinned test manifest verifies realistic public model identifier syntax.",
    attribution: { mode: "ai-assisted", model: { provider: "google", model: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro" } },
    payload: {}
  });
  assert.equal(manifest.attribution.mode === "ai-assisted" ? manifest.attribution.model.model : "", "gemini-2.5-pro");
});
