import assert from "node:assert/strict";
import test from "node:test";
import { parseStrictJson } from "@/lib/strict-json";

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
