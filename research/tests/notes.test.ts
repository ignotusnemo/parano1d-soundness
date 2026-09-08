import assert from "node:assert/strict";
import test from "node:test";
import { submissionManifestSchema } from "@/lib/schemas";

const manifest = (note: string) => ({ schemaVersion: 1, id: "note-test", track: "recursive-all-root-proof", contractVersion: "1.2.0", title: "Source-pinned review note", note, attribution: { mode: "human" }, payload: {} });

test("plain mathematical inequalities in notes are not confused with HTML", () => {
  const note = "Confirmed scalar gates >= 128 and conditional probability <= 0.049330348228363684. Full review: https://git.parano1d.org/ignotusnemo/parano1d-soundness/pulls/9";
  assert.equal(submissionManifestSchema.parse(manifest(note)).note, note);
  assert.equal(submissionManifestSchema.safeParse(manifest(note + " <script>alert(1)</script>")).success, false);
  assert.equal(submissionManifestSchema.safeParse(manifest(note + ' <img src=x onerror="alert(1)">')).success, false);
});
