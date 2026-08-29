import type { Metadata } from "next";
import { derivePlatformState } from "@/lib/derive";

const repository = "https://github.com/ignotusnemo/parano1d-soundness";

export const metadata: Metadata = {
  title: "Participate",
  description: "Submit reproducible proofs, attacks, audits and certificate reproductions to the Parano1d public verification record.",
  alternates: { canonical: "/submit/" }
};

export default function SubmitPage() {
  const state = derivePlatformState(process.cwd());
  const active = state.tracks.filter((track) => track.state === "active" && track.id !== "official-certificate");
  const drafts = state.tracks.filter((track) => track.state === "contract-draft");
  return (
    <main className="detail-page">
      <div className="eyebrow">GITHUB-IDENTIFIED PUBLIC RESEARCH</div>
      <h1>Participate</h1>
      <p className="detail-note">Every submission is a GitHub pull request. The verifier takes the author, commit and pull request number from the trusted GitHub event, never from user-controlled JSON.</p>
      <section className="panel prose-panel">
        <h2>Submission process</h2>
        <ol>
          <li>Fork the repository and create one new directory under <code>platform/submissions/</code>.</li>
          <li>Use the exact active track contract. A pull request may add only that submission directory.</li>
          <li>The trusted workflow reads only the permitted submission data, then checks paths, strict JSON, source pins and the track-specific verifier without executing submitted code.</li>
          <li>An accepted result is verified again after merge. The trusted promotion step assigns its fixed effects, appends an immutable ledger record and rebuilds the public state.</li>
        </ol>
        <p><a className="button" href={`${repository}/blob/main/platform/docs/SUBMIT.md`}>Open submission instructions on GitHub</a></p>
      </section>
      <section className="section compact-section">
        <div className="section-heading"><div><div className="eyebrow">ACCEPTING NOW</div><h2>Active contracts</h2></div></div>
        <div className="track-grid">
          {active.map((track) => (
            <article className="panel" key={track.id}>
              <h3>{track.title}</h3>
              <p>{track.description}</p>
              <dl className="facts"><div><dt>Type</dt><dd>{track.kind}</dd></div><div><dt>Direction</dt><dd>{track.direction}</dd></div><div><dt>Contract</dt><dd>{track.contractVersion}</dd></div></dl>
            </article>
          ))}
        </div>
      </section>
      <section className="section compact-section">
        <div className="section-heading"><div><div className="eyebrow">NOT YET ACCEPTING</div><h2>Contracts being formalized</h2></div></div>
        <div className="track-grid">
          {drafts.map((track) => (
            <article className="panel" key={track.id}>
              <h3>{track.title}</h3>
              <p>{track.description}</p>
              <p className="cell-note">{track.acceptance}</p>
              {track.contractUrl ? <p><a href={track.contractUrl}>Read draft contract</a></p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
