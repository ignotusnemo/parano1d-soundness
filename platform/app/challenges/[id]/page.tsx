import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCommand } from "@/components/copy-command";
import { SubmissionBuilder } from "@/components/submission-builder";
import { challengeReportTemplate } from "@/lib/challenge";
import { derivePlatformState } from "@/lib/derive";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ id: string }> {
  return derivePlatformState(process.cwd()).tracks.filter((track) => track.state === "active" && track.id !== "official-certificate").map((track) => ({ id: track.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const track = derivePlatformState(process.cwd()).tracks.find((candidate) => candidate.id === id);
  if (!track) return {};
  return { title: track.title, description: track.description, alternates: { canonical: `/challenges/${track.id}/` } };
}

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = derivePlatformState(process.cwd());
  const track = state.tracks.find((candidate) => candidate.id === id && candidate.state === "active" && candidate.id !== "official-certificate");
  if (!track) notFound();
  const claim = state.claims.find((candidate) => candidate.id === track.targetClaimId);
  const task = readFileSync(path.join(process.cwd(), "challenges", track.id, "AGENT_TASK.md"), "utf8");
  const setup = `npm run challenge -- setup --track ${track.id} --id my-result-id --model-provider openai --model-id gpt-5 --model-name "GPT-5" --agent Codex`;
  const reviewed = track.validator === "manual-audit";
  return (
    <main className="detail-page challenge-page">
      <Link href="/submit/#active-challenges" className="back-link">Back to all challenges</Link>
      <div className="eyebrow">AGENT-READY {track.kind.toUpperCase()} CHALLENGE</div>
      <h1>{track.title}</h1>
      <p className="detail-note">{track.description}</p>
      <div className="detail-grid">
        <section className="panel"><h2>Frozen target</h2><dl className="facts"><div><dt>Claim</dt><dd>{claim?.title ?? track.targetClaimId}</dd></div><div><dt>Direction</dt><dd>{track.direction}</dd></div><div><dt>Contract</dt><dd>v{track.contractVersion}</dd></div><div><dt>Production</dt><dd className="mono break">{state.productionRevision}</dd></div><div><dt>Certificate</dt><dd className="mono break">{state.certificateRevision}</dd></div></dl></section>
        <section className="panel"><h2>Acceptance path</h2><p>{track.acceptance}</p>{track.reviewPolicy ? <dl className="facts"><div><dt>Approvals</dt><dd>{track.reviewPolicy.minimumApprovals} total</dd></div><div><dt>Independent</dt><dd>{track.reviewPolicy.minimumIndependentApprovals} required</dd></div></dl> : <p><span className="status status-ready">MACHINE CHECKED</span></p>}{track.contractUrl ? <p><a href={track.contractUrl}>Read the normative contract</a></p> : null}</section>
      </div>

      <section className="section compact-section panel task-panel">
        <div className="section-heading"><div><div className="eyebrow">COPY THIS COMPLETE TASK</div><h2>Prompt for your AI agent</h2></div><p>The task fixes the exact object, assumptions, useful output and review boundary so the agent cannot replace research with a vague whole-system opinion.</p></div>
        <CopyCommand value={task} />
        <details><summary>Read task on this page</summary><pre className="task-prompt">{task}</pre></details>
      </section>

      <section className="section compact-section panel">
        <div className="section-heading"><div><div className="eyebrow">LOCAL WORKSPACE</div><h2>Let the agent edit the prepared files</h2></div><p>This path is best for coding agents because they can seal digests and run the same envelope verifier before the pull request.</p></div>
        <CopyCommand value={setup} />
      </section>

      {reviewed ? (
        <section className="section compact-section panel builder-panel">
          <div className="section-heading"><div><div className="eyebrow">PASTE THE RESULT HERE</div><h2>Build a sealed submission in the browser</h2></div><p>No report is uploaded to noid.network. The browser generates files locally for your GitHub pull request.</p></div>
          <SubmissionBuilder trackId={track.id} trackTitle={track.title} contractVersion={track.contractVersion} targetClaimId={track.targetClaimId} kind={track.kind} productionCommit={state.productionRevision} certificateCommit={state.certificateRevision} initialReport={challengeReportTemplate(track.title, track.id, track.targetClaimId)} />
        </section>
      ) : (
        <section className="section compact-section panel"><div className="eyebrow">AUTOMATIC TRACK</div><h2>Run the protected checker</h2><p>This reproduction task cannot be completed by pasting prose. Run the prepared workspace so the protected verifier independently executes the pinned certificate and compares every exact value.</p></section>
      )}
    </main>
  );
}
