"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BoundChart } from "@/components/bound-chart";
import type { ClaimStatus, PlatformState } from "@/lib/types";

function Status({ value }: { value: ClaimStatus | "active" | "contract-draft" | "queued" | "checking" | "ready" | "rejected" | "awaiting-review" }) {
  return <span className={`status status-${value}`}>{value.replaceAll("-", " ").toUpperCase()}</span>;
}

function shortCommit(commit: string): string {
  return commit.slice(0, 12);
}

function date(value: string): string {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function Dashboard({ initialState }: { initialState: PlatformState }) {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(`/data/state.json?refresh=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as PlatformState;
        if (!cancelled) {
          setState(next);
        }
      } catch {
        // The last verified state stays visible during a transient refresh failure.
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const claimsById = useMemo(() => new Map(state.claims.map((claim) => [claim.id, claim])), [state.claims]);
  const proofChainIds = [
    "production-profile-snapshot",
    "local-rbr-extraction",
    "adaptive-all-root-qrom",
    "sequential-ideal-qrom",
    "typed-parallel-qrom",
    "coherent-response-schedule",
    "ideal-category-one-bound",
    "current-production-correspondence",
    "production-category-one"
  ];
  const proofChain = proofChainIds.map((id) => claimsById.get(id)).filter((claim) => claim !== undefined);
  const premiseClaims = state.conclusion.premiseClaims.map((id) => claimsById.get(id)).filter((claim) => claim !== undefined);
  const additionalClaims = ["block-tiwari-fs-fri", "poseidon2b-classical-audit"]
    .map((id) => claimsById.get(id))
    .filter((claim) => claim !== undefined);
  const accepted = state.records.filter((record) => record.recordType === "accepted-submission");
  const audits = state.records.filter((record) => {
    const track = state.tracks.find((candidate) => candidate.id === record.trackId);
    return track?.kind === "audit";
  });
  return (
    <main>
      <section className="platform-intro" aria-labelledby="platform-purpose">
        <div className="platform-intro-main">
          <div className="eyebrow">OPEN CRYPTOGRAPHIC AUTORESEARCH PLATFORM</div>
          <h1 id="platform-purpose">Use any AI agent to test and improve Parano1d soundness</h1>
          <p>Choose a pinned research challenge, give its ready task to Codex, Claude, Grok or another agent, verify the submission locally and open a GitHub pull request. Accepted proofs raise a lower frontier, accepted attacks lower an upper frontier, and every contribution is attributed to both the GitHub researcher and the declared model.</p>
          <div className="intro-actions">
            <Link className="button" href="/submit">Choose a challenge</Link>
            <a className="button button-secondary" href="#frontier">View current frontier</a>
          </div>
        </div>
        <ol className="entry-steps" aria-label="How to participate">
          <li><span>1</span><div><strong>Choose a challenge</strong><p>Select a proof, attack, audit or exact reproduction with a frozen target and acceptance contract.</p></div></li>
          <li><span>2</span><div><strong>Run your agent</strong><p>One setup command creates the correct files and an agent-ready task. Work manually if preferred.</p></div></li>
          <li><span>3</span><div><strong>Sign in and submit</strong><p>GitHub identifies the researcher. CI checks passive data before automatic acceptance or expert review.</p></div></li>
        </ol>
      </section>

      <section className={`revision-pin revision-${state.conclusion.status}`} aria-label="Current accepted soundness conclusion">
        <div className="revision-conclusion">
          <div><Status value={state.conclusion.status} /><strong>{state.conclusion.title}</strong></div>
          <p>{state.conclusion.statement}</p>
          <span>Production correspondence is verified for Parano1d v1.0.4. A later production revision must renew this pin before inheriting the assessment.</span>
          {state.conclusion.blockingClaims.length > 0 ? <span>Unresolved required claims: {state.conclusion.blockingClaims.join(", ")}</span> : null}
        </div>
        <dl>
          <div>
            <dt>Certificate</dt>
            <dd><a href={`https://github.com/ignotusnemo/parano1d-soundness/commit/${state.certificateRevision}`} title={state.certificateRevision}>{shortCommit(state.certificateRevision)}</a></dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd><a href={`https://github.com/ignotusnemo/parano1d/commit/${state.productionRevision}`} title={state.productionRevision}>{shortCommit(state.productionRevision)}</a></dd>
          </div>
        </dl>
      </section>

      <section id="frontier" className="section frontier-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">PUBLIC BOUND FRONTIER</div>
            <h2>Accepted proofs and attacks move the interval</h2>
          </div>
          <p>Every point comes from the versioned accepted ledger. Researchers may work manually or run any local AI agent. Accepted records preserve the GitHub author, declared model, exact source commit and verifier result.</p>
        </div>
        <BoundChart records={state.records} />
      </section>

      <section id="bounds" className="section compact-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXECUTABLE CATEGORY 1 CERTIFICATE</div>
            <h2>Exact post-quantum result</h2>
          </div>
          <p>All NIST MAXDEPTH points are evaluated with exact integer and rational arithmetic. Floating point is descriptive only and never decides a result.</p>
        </div>
        <div className="metrics">
          {state.metrics.map((metric) => (
            <article key={metric.id} className="metric">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-unit">{metric.unit}</div>
              <div className="metric-scope">{metric.scope}</div>
              <div className="metric-kind">{metric.kind}</div>
            </article>
          ))}
        </div>
      </section>

      <section id="claims" className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">PUBLISHED PROOF CHAIN</div>
            <h2>Theorem and certificate layers</h2>
          </div>
          <p>Each layer is tied to the exact proof section, production revision and accepted evidence. The all-root theorem covers recursive ancestry without a probability multiplier for chain height.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Layer</th>
                <th>Status</th>
                <th>Established result</th>
                <th>Exact scope</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {proofChain.map((claim) => (
                <tr key={claim.id} id={`claim-${claim.id}`}>
                  <td><strong>{claim.title}</strong></td>
                  <td>
                    <Status value={claim.status} />
                  </td>
                  <td>{claim.statement}</td>
                  <td>{claim.scope}</td>
                  <td>{claim.sources.map((source) => <span className="cell-note" key={source.url}><a href={source.url}>{source.label}</a></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">DECLARED PRODUCTION PREMISES</div>
            <h2>Public attack surface</h2>
          </div>
          <p>The end-to-end result is a proved implication with these premises stated in the theorem itself. They are exposed for concrete attacks and stronger bounds, not mislabeled as missing recursive soundness work.</p>
        </div>
        <div className="table-wrap premise-table">
          <table>
            <thead><tr><th>Premise</th><th>Role in the theorem</th><th>Current concrete evidence</th><th>Active track</th></tr></thead>
            <tbody>
              {premiseClaims.map((claim) => {
                const context = claim.dependencies.filter((dependency) => dependency.role === "context").map((dependency) => claimsById.get(dependency.claimId)).filter((candidate) => candidate !== undefined);
                const track = state.tracks.find((candidate) => candidate.targetClaimId === claim.id);
                return (
                  <tr key={claim.id} id={`claim-${claim.id}`}>
                    <td><strong>{claim.title}</strong><Status value={claim.status} /></td>
                    <td>{claim.statement}</td>
                    <td>{context.map((candidate) => <span className="cell-note" key={candidate.id}><a href={`#claim-${candidate.id}`}>{candidate.title}</a>: {candidate.statement}</span>)}</td>
                    <td>{track ? <><strong>{track.title}</strong><span className="cell-note"><a href={track.contractUrl}>Read exact contract</a></span></> : "No track"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section compact-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">SEPARATE CERTIFIED ANALYSES</div>
            <h2>Additional evidence</h2>
          </div>
          <p>These results are useful evidence but are not presented as substitutes for the end-to-end post-quantum theorem.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Analysis</th><th>Status</th><th>Exact result and scope</th><th>Source</th></tr></thead>
            <tbody>
              {additionalClaims.map((claim) => (
                <tr key={claim.id} id={`claim-${claim.id}`}>
                  <td><strong>{claim.title}</strong></td>
                  <td><Status value={claim.status} /></td>
                  <td>{claim.statement}<span className="cell-note">{claim.scope}</span></td>
                  <td>{claim.sources.map((source) => <span className="cell-note" key={source.url}><a href={source.url}>{source.label}</a></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="challenges" className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">LIVE GITHUB WORKFLOW</div>
            <h2>Choose a challenge for yourself or your AI agent</h2>
          </div>
          <Link className="button" href="/submit">
            Participate
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Track</th>
                <th>Type</th>
                <th>Direction</th>
                <th>Contract</th>
                <th>Target claim</th>
                <th>Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {state.tracks
                .filter((track) => track.id !== "official-certificate")
                .map((track) => (
                  <tr key={track.id}>
                    <td>
                      <strong>{track.title}</strong>
                      <span className="cell-note">{track.description}</span>
                    </td>
                    <td>{track.kind}</td>
                    <td>{track.direction}</td>
                    <td>
                      <Status value={track.state} />
                      <span className="cell-note">v{track.contractVersion}</span>
                    </td>
                    <td>{claimsById.get(track.targetClaimId)?.title}</td>
                    <td>
                      {track.acceptance}
                      {track.contractUrl ? <span className="cell-note"><a href={track.contractUrl}>Read exact contract</a></span> : null}
                      <span className="cell-note"><Link href={`/challenges/${track.id}/`}>Open challenge and copy the agent task</Link></span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="submissions" className="section split">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">LIVE GITHUB CHECKS</div>
              <h2>Submission queue</h2>
            </div>
            <span>refreshing once per minute</span>
          </div>
          {state.pending.length === 0 ? (
            <div className="empty">No open submission pull requests.</div>
          ) : (
            <div className="record-list">
              {state.pending.map((submission) => (
                <a key={submission.id} href={submission.url} target="_blank" rel="noreferrer" className="record-row">
                  <img src={submission.avatarUrl} alt="" />
                  <span>
                    <strong>#{submission.number} {submission.title}</strong>
                    <small>{submission.authorLogin} / updated {date(submission.updatedAt)}</small>
                  </span>
                  <Status value={submission.status} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">IMMUTABLE LEDGER</div>
              <h2>Accepted submissions</h2>
            </div>
            <span>{accepted.length} public contributions</span>
          </div>
          {accepted.length === 0 ? (
            <div className="empty">No public contribution has been promoted yet. The official baseline is listed in the complete record below.</div>
          ) : (
            <div className="record-list">
              {accepted.map((record) => (
                <Link key={record.id} href={`/submissions/${record.id}`} className="record-row">
                  <img src={record.source.avatarUrl} alt="" />
                  <span>
                    <strong>{record.title}</strong>
                    <small>{record.source.authorLogin} / {record.attribution.mode === "ai-assisted" ? record.attribution.model.displayName : "Human research"} / {date(record.acceptedAt)}</small>
                  </span>
                  <Status value="verified" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="leaderboard" className="section split">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">VERIFIED CONTRIBUTIONS ONLY</div>
              <h2>Researchers</h2>
            </div>
            <span>ranked by frontier moves, then accepted work</span>
          </div>
          {state.leaderboard.length === 0 ? (
            <div className="empty">The leaderboard starts with the first accepted public contribution. Official project baselines do not count.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Researcher</th>
                    <th>Accepted</th>
                    <th>Frontier moves</th>
                    <th>Proofs</th>
                    <th>Attacks</th>
                    <th>Audits</th>
                    <th>Reproductions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.leaderboard.map((entry) => (
                    <tr key={entry.login}>
                      <td><a href={entry.url} target="_blank" rel="noreferrer">{entry.login}</a></td>
                      <td>{entry.accepted}</td>
                      <td>{entry.frontierMoves ?? 0}</td>
                      <td>{entry.proofs}</td>
                      <td>{entry.attacks}</td>
                      <td>{entry.audits}</td>
                      <td>{entry.reproductions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">SELF-DECLARED MODEL ATTRIBUTION</div>
              <h2>AI models and agents</h2>
            </div>
          </div>
          {(state.modelLeaderboard ?? []).length === 0 ? (
            <div className="empty">Model statistics start with the first accepted AI-assisted public contribution. Cryptographic validity never depends on the declared model.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Declared model</th><th>Agent</th><th>Accepted</th><th>Frontier moves</th><th>Researchers</th><th>Proofs</th><th>Attacks</th></tr></thead>
                <tbody>
                  {(state.modelLeaderboard ?? []).map((entry) => (
                    <tr key={entry.key}>
                      <td><strong>{entry.displayName}</strong><span className="cell-note">{entry.provider}/{entry.model}</span></td>
                      <td>{entry.agent ?? "Not declared"}</td>
                      <td>{entry.accepted}</td>
                      <td>{entry.frontierMoves ?? 0}</td>
                      <td>{entry.researchers}</td>
                      <td>{entry.proofs}</td>
                      <td>{entry.attacks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="section compact-section reward-strip">
        <div><div className="eyebrow">VERIFIED IMPACT</div><h2>Research rewards follow accepted contribution, not generated volume</h2></div>
        <p>Top contributors may receive Parano1d research rewards according to the verified impact of accepted work. Frontier movement, a confirmed theorem or counterexample, production findings and reproducibility are recorded separately because unlike quantities are never collapsed into one artificial score. Any funded bounty and its terms are published with the relevant challenge.</p>
      </section>

      <section className="section compact-section">
        <div className="panel">
          <div className="panel-title"><div><div className="eyebrow">SEMANTIC REVIEW</div><h2>Accepted audit findings</h2></div></div>
          {audits.length === 0 ? (
            <div className="empty">No independent public audit finding has been confirmed after the official v1.0.4 correspondence audit.</div>
          ) : (
            <div className="record-list">
              {audits.map((record) => (
                <Link key={record.id} href={`/submissions/${record.id}`} className="record-row text-only">
                  <span><strong>{record.title}</strong><small>{record.source.authorLogin} / {date(record.acceptedAt)}</small></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">COMPLETE PROVENANCE</div>
              <h2>Verification record</h2>
            </div>
            <span>{state.records.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Track</th>
                  <th>Author</th>
                  <th>Declared model</th>
                  <th>Commit</th>
                  <th>Verifier</th>
                  <th>Accepted</th>
                </tr>
              </thead>
              <tbody>
                {state.records.map((record) => (
                  <tr key={record.id}>
                    <td><Link href={`/submissions/${record.id}`}>{record.title}</Link></td>
                    <td>{record.trackId}</td>
                    <td><a href={record.source.authorUrl} target="_blank" rel="noreferrer">{record.source.authorLogin}</a></td>
                    <td>{record.attribution.mode === "ai-assisted" ? <>{record.attribution.model.displayName}<span className="cell-note">{record.attribution.model.agent ?? "Agent not declared"}</span></> : "Human"}</td>
                    <td><a href={record.source.url} target="_blank" rel="noreferrer" className="mono">{shortCommit(record.source.commit)}</a></td>
                    <td>{record.verification.verifier}</td>
                    <td>{date(record.acceptedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
