"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ClaimStatus, PlatformState } from "@/lib/types";
import { BoundChart } from "@/components/bound-chart";

function Status({ value }: { value: ClaimStatus | "active" | "contract-draft" | "queued" | "checking" | "ready" | "rejected" }) {
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
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(`/data/state.json?refresh=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as PlatformState;
        if (!cancelled) {
          setState(next);
          setLastRefresh(new Date());
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
  const accepted = state.records.filter((record) => record.recordType === "accepted-submission");
  const audits = state.records.filter((record) => {
    const track = state.tracks.find((candidate) => candidate.id === record.trackId);
    return track?.kind === "audit";
  });

  return (
    <main>
      <section className="state-bar" aria-labelledby="current-conclusion">
        <div>
          <div className="eyebrow">CURRENT END-TO-END CONCLUSION</div>
          <h1 id="current-conclusion">{state.conclusion.title}</h1>
          <p>{state.conclusion.statement}</p>
          <div className="blocker-list" aria-label="Unresolved obligations">
            <span>UNRESOLVED</span>
            {state.conclusion.blockingClaims.map((claimId) => (
              <a key={claimId} href={`#claim-${claimId}`}>
                {claimsById.get(claimId)?.title ?? claimId}
              </a>
            ))}
          </div>
        </div>
        <div className="state-status">
          <Status value={state.conclusion.status} />
          <span>Last state refresh {lastRefresh.toISOString().slice(11, 19)} UTC</span>
        </div>
      </section>

      <section className="revision-pin">
        <div>
          <strong>Production correspondence verified for Parano1d v1.0.4.</strong>
          <span>A later production revision must renew this pin before inheriting the assessment.</span>
        </div>
        <dl>
          <div>
            <dt>Certificate</dt>
            <dd>{shortCommit(state.certificateRevision)}</dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>{shortCommit(state.productionRevision)}</dd>
          </div>
        </dl>
      </section>

      <section id="bounds" className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">EXACT CURRENT RECORD</div>
            <h2>Bounds</h2>
          </div>
          <p>Each number keeps its own game and direction. Values from different games are not ranked against each other.</p>
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
        <div className="panel chart-panel">
          <div className="panel-title">
            <div>
              <h3>Conditional ideal Category 1 history</h3>
              <p>Accepted records only. This is not an unconditional production claim.</p>
            </div>
            <span>bits of logical gate-depth</span>
          </div>
          <BoundChart records={state.records} />
        </div>
      </section>

      <section id="claims" className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">DEPENDENCY-AWARE</div>
            <h2>Claims and obligations</h2>
          </div>
          <p>An accepted result changes only the claim named by its frozen contract. Derived conclusions are recalculated from required dependencies.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Status</th>
                <th>Exact scope</th>
                <th>Required dependencies</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {state.claims.map((claim) => (
                <tr key={claim.id} id={`claim-${claim.id}`}>
                  <td>
                    <strong>{claim.title}</strong>
                    <span className="cell-note">{claim.statement}</span>
                  </td>
                  <td>
                    <Status value={claim.status} />
                  </td>
                  <td>{claim.scope}</td>
                  <td>
                    {claim.dependencies.filter((dependency) => dependency.role === "required").length === 0
                      ? "None"
                      : claim.dependencies
                          .filter((dependency) => dependency.role === "required")
                          .map((dependency) => claimsById.get(dependency.claimId)?.title ?? dependency.claimId)
                          .join(", ")}
                  </td>
                  <td>{claim.evidenceIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FROZEN VERIFICATION CONTRACTS</div>
            <h2>Research tracks</h2>
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
                    <small>{record.source.authorLogin} / {date(record.acceptedAt)}</small>
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
              <h2>Leaderboard</h2>
            </div>
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
              <div className="eyebrow">SEMANTIC REVIEW</div>
              <h2>Audit ledger</h2>
            </div>
          </div>
          {audits.length === 0 ? (
            <div className="empty">No independent public audit finding has been confirmed after the official v1.0.4 correspondence audit.</div>
          ) : (
            <div className="record-list">
              {audits.map((record) => (
                <Link key={record.id} href={`/submissions/${record.id}`} className="record-row text-only">
                  <span>
                    <strong>{record.title}</strong>
                    <small>{record.source.authorLogin} / {date(record.acceptedAt)}</small>
                  </span>
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
