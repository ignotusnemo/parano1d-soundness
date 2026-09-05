import path from "node:path";
import { existsSync, readdirSync } from "node:fs";
import type { ClaimDefinition, EvidenceRecord, TrackDefinition } from "@/lib/types";
import { claimSchema, evidenceRecordSchema, trackSchema } from "@/lib/schemas";
import { assertUnique, jsonFiles, readStrictJsonFile } from "@/lib/files";

export interface Catalog {
  claims: ClaimDefinition[];
  tracks: TrackDefinition[];
  records: EvidenceRecord[];
}

export function loadCatalog(root: string): Catalog {
  const claims = claimSchema.array().parse(readStrictJsonFile(path.join(root, "catalog/claims.json")));
  const tracks = jsonFiles(path.join(root, "catalog/tracks")).map((filePath) =>
    trackSchema.parse(readStrictJsonFile(filePath))
  );
  const recordFiles = [
    ...jsonFiles(path.join(root, "evidence/official")),
    ...(existsSync(path.join(root, "ledger/accepted")) ? jsonFiles(path.join(root, "ledger/accepted")) : [])
  ];
  const records = recordFiles.map((filePath) => evidenceRecordSchema.parse(readStrictJsonFile(filePath)));

  assertUnique(claims, (claim) => claim.id, "claim id");
  assertUnique(tracks, (track) => track.id, "track id");
  assertUnique(records, (record) => record.id, "evidence record id");

  const claimIds = new Set(claims.map((claim) => claim.id));
  const trackIds = new Set(tracks.map((track) => track.id));
  for (const claim of claims) {
    for (const dependency of claim.dependencies) {
      if (!claimIds.has(dependency.claimId)) {
        throw new Error(`claim ${claim.id} has unknown dependency ${dependency.claimId}`);
      }
    }
  }
  for (const track of tracks) {
    if (!claimIds.has(track.targetClaimId)) {
      throw new Error(`track ${track.id} has unknown target claim ${track.targetClaimId}`);
    }
  }
  for (const record of records) {
    if (!trackIds.has(record.trackId)) throw new Error(`record ${record.id} has unknown track ${record.trackId}`);
    for (const effect of record.effects) {
      if (!claimIds.has(effect.claimId)) {
        throw new Error(`record ${record.id} has unknown effect claim ${effect.claimId}`);
      }
    }
  }

  return { claims, tracks, records };
}

export function loadTrack(root: string, id: string): TrackDefinition {
  const catalog = loadCatalog(root);
  const track = catalog.tracks.find((candidate) => candidate.id === id);
  if (!track) throw new Error(`unknown track ${id}`);
  return track;
}

/** Archived contracts are available only for explicit accepted-ledger replay. */
export function loadVerificationTrack(root: string, id: string, version: string, allowLegacy: boolean): TrackDefinition {
  const current = loadTrack(root, id);
  if (!allowLegacy || current.contractVersion === version) return current;
  const archiveRoot = path.join(root, "catalog/archive");
  if (!existsSync(archiveRoot)) return current;
  const candidates = readdirSync(archiveRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => jsonFiles(path.join(archiveRoot, entry.name)))
    .map((filePath) => trackSchema.parse(readStrictJsonFile(filePath)))
    .filter((track) => track.id === id && (track.contractVersion === version || (track.legacyContractVersions ?? []).includes(version)));
  if (candidates.length > 1) throw new Error(`ambiguous archived contract ${id} v${version}`);
  return candidates[0] ?? current;
}
