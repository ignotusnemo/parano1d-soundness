import type { Metadata } from "next";
import { CopyCommand } from "@/components/copy-command";
import { GitHubSignIn } from "@/components/github-sign-in";
import { derivePlatformState } from "@/lib/derive";

const repository = "https://github.com/ignotusnemo/parano1d-soundness";
const firstCommand = `git clone https://github.com/ignotusnemo/parano1d-soundness.git
cd parano1d-soundness/platform
npm ci
npm run challenge -- list`;

export const metadata: Metadata = {
  title: "Participate",
  description: "Choose a Parano1d cryptographic challenge, give its ready task to any AI agent, verify the result locally and submit source-pinned research through GitHub.",
  alternates: { canonical: "/submit/" }
};

function setupCommand(trackId: string): string {
  return `npm run challenge -- setup --track ${trackId} --id my-result-id --model-provider openai --model-id gpt-5 --model-name "GPT-5" --agent Codex`;
}

export default function SubmitPage() {
  const state = derivePlatformState(process.cwd());
  const active = state.tracks.filter((track) => track.state === "active" && track.id !== "official-certificate");
  return (
    <main className="detail-page participate-page">
      <div className="eyebrow">START HERE</div>
      <h1>Choose a challenge and give it to your AI agent</h1>
      <p className="detail-note">Use Codex, Claude Code, Grok or any other local agent, or work manually. Parano1d never receives your model account or API key. You submit only a report, optional passive artifact and attribution metadata through a GitHub pull request.</p>

      <section className="account-strip" id="github-account">
        <div><div className="eyebrow">CONTRIBUTOR ACCOUNT</div><strong>Sign in with GitHub when you are ready to submit</strong><p>No separate registration is required. Your GitHub identity receives the review history, accepted contribution and leaderboard credit.</p></div>
        <GitHubSignIn />
      </section>

      <section className="panel start-panel">
        <div className="section-heading">
          <div><div className="eyebrow">FOUR STEPS</div><h2>From an empty directory to accepted research</h2></div>
          <p>An accepted result becomes an immutable ledger record, updates the relevant frontier or claim and is credited to the GitHub researcher and declared primary model.</p>
        </div>
        <ol className="participation-steps">
          <li><span>1</span><div><strong>Clone and list challenges</strong><p>Install only the locked platform dependencies and inspect the currently active tasks.</p></div></li>
          <li><span>2</span><div><strong>Create one workspace</strong><p>The setup command creates the correct manifest, report template, source pins and model attribution.</p></div></li>
          <li><span>3</span><div><strong>Give the task to your agent</strong><p>Each challenge includes one exact <code>AGENT_TASK.md</code> describing the target, useful results and evidence requirements.</p></div></li>
          <li><span>4</span><div><strong>Sign in and submit</strong><p>GitHub identifies the researcher. CI checks passive data, then cryptographic claims enter the stated expert review.</p></div></li>
        </ol>
        <CopyCommand value={firstCommand} />
        <p className="cell-note">For research without AI, use <code>--human</code> instead of the four model options. Model attribution is self-declared public metadata and never changes whether a proof or attack is valid.</p>
      </section>

      <section className="section compact-section" id="active-challenges">
        <div className="section-heading"><div><div className="eyebrow">ACCEPTING NOW</div><h2>Active challenges</h2></div><p>Pick the task that matches the result you want to produce. Do not merge quantities from different games or resource models.</p></div>
        <div className="track-grid challenge-grid">
          {active.map((track) => {
            const review = track.validator === "certificate-reproduction" ? "Automatic machine check" : `Passive checks plus ${track.reviewPolicy?.minimumApprovals ?? 0} GitHub approvals`;
            return (
              <article className="panel challenge-card" key={track.id}>
                <div className="challenge-card-heading"><div><div className="eyebrow">{track.kind.toUpperCase()} / {track.direction.toUpperCase()}</div><h3>{track.title}</h3></div><span className="status status-active">ACTIVE</span></div>
                <p>{track.description}</p>
                <dl className="facts">
                  <div><dt>Target claim</dt><dd>{state.claims.find((claim) => claim.id === track.targetClaimId)?.title}</dd></div>
                  <div><dt>Decision</dt><dd>{review}</dd></div>
                  <div><dt>Contract</dt><dd>v{track.contractVersion}</dd></div>
                </dl>
                <div className="challenge-links"><a href={`/challenges/${track.id}/`}>Open challenge and copy task</a>{track.contractUrl ? <a href={track.contractUrl}>Read exact contract</a> : null}</div>
                <CopyCommand value={setupCommand(track.id)} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="section split submission-explainer">
        <article className="panel prose-panel">
          <div className="eyebrow">WHAT THE AGENT PRODUCES</div>
          <h2>Submission files</h2>
          <p><code>submission.json</code> selects the contract, pins the exact production and certificate revisions, records the self-declared model and commits to every included file digest.</p>
          <p><code>report.md</code> contains the claimed result, method, production mapping, reproduction commands, limitations and primary sources.</p>
          <p><code>artifact.json</code> is optional passive structured evidence for a witness, trail, circuit or counterexample. Executables and contributor-controlled CI are never accepted.</p>
        </article>
        <article className="panel prose-panel">
          <div className="eyebrow">WHAT HAPPENS NEXT</div>
          <h2>Verification and credit</h2>
          <p>The pull request author is read from the trusted GitHub event. A protected workflow checks the allowed paths, strict JSON, source pins and digests without checking out or executing contributor code.</p>
          <p>A deterministic reproduction can be accepted automatically. A theorem, attack or audit remains <code>pending-review</code> until the contract's named reviewers confirm its semantics. Only then can it change a claim, bound or leaderboard.</p>
        </article>
      </section>

      <section className="section compact-section panel prose-panel final-submit-link">
        <h2>Complete reference</h2>
        <p>The repository instructions specify the directory boundary, exact commands, security model and promotion process.</p>
        <p><a className="button" href={`${repository}/blob/main/platform/docs/SUBMIT.md`}>Open full submission instructions on GitHub</a></p>
      </section>
    </main>
  );
}
