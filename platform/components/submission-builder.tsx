"use client";

import { useMemo, useState } from "react";
import { parseStrictJson } from "@/lib/strict-json";

interface SubmissionBuilderProps {
  trackId: string;
  trackTitle: string;
  contractVersion: string;
  targetClaimId: string;
  kind: "proof" | "attack" | "audit" | "reproduction";
  productionCommit: string;
  certificateCommit: string;
  initialReport: string;
}

interface GeneratedFiles {
  manifest: string;
  report: string;
  artifact?: string;
}

const MAXIMUM_SUBMISSION_BYTES = 1_048_576;

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function SubmissionBuilder(props: SubmissionBuilderProps) {
  const [submissionId, setSubmissionId] = useState("");
  const [mode, setMode] = useState<"ai-assisted" | "human">("ai-assisted");
  const [provider, setProvider] = useState("openai");
  const [modelId, setModelId] = useState("gpt-5");
  const [modelName, setModelName] = useState("GPT-5");
  const [agent, setAgent] = useState("Codex");
  const [finding, setFinding] = useState(props.kind === "attack" ? "challenges" : "supports");
  const [report, setReport] = useState(props.initialReport);
  const [artifact, setArtifact] = useState("");
  const [generated, setGenerated] = useState<GeneratedFiles>();
  const [error, setError] = useState<string>();
  const [copiedFile, setCopiedFile] = useState<string>();
  const validId = useMemo(() => /^[a-z0-9][a-z0-9-]{2,79}$/u.test(submissionId), [submissionId]);

  const generate = async () => {
    setError(undefined);
    setGenerated(undefined);
    if (!validId) {
      setError("Submission ID must use 3 to 80 lowercase letters, digits or hyphens.");
      return;
    }
    if (report.trim().length < 200) {
      setError("The report is too short to contain a reviewable result.");
      return;
    }
    const providerIdentifier = /^[a-z0-9][a-z0-9.-]{1,79}$/u;
    const modelIdentifier = /^[A-Za-z0-9][A-Za-z0-9._:/-]{1,119}$/u;
    const publicName = /^[^\u0000-\u001f<>]{2,80}$/u;
    if (mode === "ai-assisted" && (!providerIdentifier.test(provider) || !modelIdentifier.test(modelId) || !publicName.test(modelName) || (agent.length > 0 && !publicName.test(agent)))) {
      setError("Declare the primary provider, model and agent used for the research.");
      return;
    }
    let artifactDigest: string | undefined;
    if (artifact.trim()) {
      try {
        parseStrictJson(artifact);
      } catch (artifactError) {
        setError(`artifact.json must use strict passive JSON: ${artifactError instanceof Error ? artifactError.message : String(artifactError)}`);
        return;
      }
      artifactDigest = await sha256(artifact);
    }
    const reportDigest = await sha256(report);
    const attribution = mode === "human"
      ? { mode: "human" }
      : { mode: "ai-assisted", model: { provider, model: modelId, displayName: modelName, ...(agent ? { agent } : {}) } };
    const payload = {
      productionCommit: props.productionCommit,
      certificateCommit: props.certificateCommit,
      reportPath: "report.md",
      reportSha256: reportDigest,
      ...(artifactDigest ? { artifactPath: "artifact.json", artifactSha256: artifactDigest } : {}),
      affectedClaimId: props.targetClaimId,
      finding
    };
    const manifest = {
      schemaVersion: 1,
      id: submissionId,
      track: props.trackId,
      contractVersion: props.contractVersion,
      title: `${props.trackTitle}: ${submissionId}`,
      note: "Source-pinned research submission prepared against the active contract. The claimed result, method, reproduction instructions and limitations are recorded in report.md.",
      attribution,
      payload
    };
    const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
    const totalBytes = new TextEncoder().encode(manifestText).byteLength
      + new TextEncoder().encode(report).byteLength
      + (artifactDigest ? new TextEncoder().encode(artifact).byteLength : 0);
    if (totalBytes > MAXIMUM_SUBMISSION_BYTES) {
      setError("The combined passive submission exceeds the 1 MiB contract limit.");
      return;
    }
    setGenerated({ manifest: manifestText, report, ...(artifactDigest ? { artifact } : {}) });
  };

  const copyFile = async (name: string, content: string) => {
    try {
      await window.navigator.clipboard.writeText(content);
      setCopiedFile(name);
      window.setTimeout(() => setCopiedFile(undefined), 1600);
    } catch {
      setError(`Could not copy ${name}. Download the file instead.`);
    }
  };

  return (
    <div className="submission-builder">
      <div className="builder-grid">
        <label><span>Submission ID</span><input value={submissionId} onChange={(event) => setSubmissionId(event.target.value)} placeholder="my-poseidon-result" /></label>
        <label><span>Research mode</span><select value={mode} onChange={(event) => setMode(event.target.value as "ai-assisted" | "human")}><option value="ai-assisted">AI-assisted</option><option value="human">Human only</option></select></label>
        {mode === "ai-assisted" ? <>
          <label><span>Provider</span><input value={provider} onChange={(event) => setProvider(event.target.value)} /></label>
          <label><span>Model ID</span><input value={modelId} onChange={(event) => setModelId(event.target.value)} /></label>
          <label><span>Public model name</span><input value={modelName} onChange={(event) => setModelName(event.target.value)} /></label>
          <label><span>Agent or harness</span><input value={agent} onChange={(event) => setAgent(event.target.value)} /></label>
        </> : null}
        <label><span>Claimed effect</span><select value={finding} onChange={(event) => setFinding(event.target.value)}><option value="supports">Supports or strengthens</option><option value="challenges">Challenges or attacks</option><option value="inconclusive">Inconclusive, discussion only</option></select></label>
      </div>
      {finding === "inconclusive" ? <div className="builder-notice">An inconclusive pull request can receive public review, but it cannot enter the accepted ledger or leaderboards.</div> : null}
      <label className="builder-text"><span>Paste the complete research result into report.md</span><textarea value={report} onChange={(event) => setReport(event.target.value)} rows={22} /></label>
      <label className="builder-text"><span>Optional passive artifact.json</span><textarea value={artifact} onChange={(event) => setArtifact(event.target.value)} rows={8} placeholder={'{\n  "schemaVersion": 1,\n  "kind": "witness",\n  "data": {}\n}'} /></label>
      {error ? <div className="builder-error">{error}</div> : null}
      <button type="button" className="button" onClick={() => void generate()}>Generate sealed submission files</button>
      {generated ? (
        <div className="builder-result">
          <strong>Files are sealed and ready for the directory <code>platform/submissions/{submissionId}/</code>.</strong>
          <div>
            <button type="button" onClick={() => download("submission.json", generated.manifest, "application/json")}>Download submission.json</button>
            <button type="button" onClick={() => void copyFile("submission.json", generated.manifest)}>{copiedFile === "submission.json" ? "Copied submission.json" : "Copy submission.json"}</button>
            <button type="button" onClick={() => download("report.md", generated.report, "text/markdown")}>Download report.md</button>
            <button type="button" onClick={() => void copyFile("report.md", generated.report)}>{copiedFile === "report.md" ? "Copied report.md" : "Copy report.md"}</button>
            {generated.artifact ? <><button type="button" onClick={() => download("artifact.json", generated.artifact!, "application/json")}>Download artifact.json</button><button type="button" onClick={() => void copyFile("artifact.json", generated.artifact!)}>{copiedFile === "artifact.json" ? "Copied artifact.json" : "Copy artifact.json"}</button></> : null}
          </div>
          <p>Place these files in one new directory in your fork, run the local verifier if possible, then open a pull request containing only that directory.</p>
          <a className="github-sign-in" href="/signin/">Continue with GitHub</a>
        </div>
      ) : null}
    </div>
  );
}
