import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { derivePlatformState } from "@/lib/derive";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ id: string }> {
  return derivePlatformState(process.cwd()).records.map((record) => ({ id: record.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const record = derivePlatformState(process.cwd()).records.find((candidate) => candidate.id === id);
  if (!record) return {};
  return {
    title: record.title,
    description: record.note,
    alternates: { canonical: `/submissions/${record.id}/` },
    openGraph: {
      type: "article",
      url: `/submissions/${record.id}/`,
      title: record.title,
      description: record.note,
      publishedTime: record.acceptedAt,
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "Parano1d Autoresearch"
        }
      ]
    }
  };
}

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = derivePlatformState(process.cwd());
  const record = state.records.find((candidate) => candidate.id === id);
  if (!record) notFound();
  const track = state.tracks.find((candidate) => candidate.id === record.trackId);
  return (
    <main className="detail-page">
      <Link href="/#submissions" className="back-link">Back to verification record</Link>
      <div className="eyebrow">{record.recordType.replaceAll("-", " ").toUpperCase()}</div>
      <h1>{record.title}</h1>
      <p className="detail-note">{record.note}</p>
      <div className="detail-grid">
        <section className="panel">
          <h2>Source</h2>
          <dl className="facts">
            <div><dt>Track</dt><dd>{track?.title ?? record.trackId}</dd></div>
            <div><dt>GitHub author</dt><dd><a href={record.source.authorUrl}>{record.source.authorLogin}</a></dd></div>
            <div><dt>Research mode</dt><dd>{record.attribution.mode === "ai-assisted" ? "AI-assisted" : "Human"}</dd></div>
            {record.attribution.mode === "ai-assisted" ? <><div><dt>Declared model</dt><dd>{record.attribution.model.displayName}<span className="cell-note">{record.attribution.model.provider}/{record.attribution.model.model}</span></dd></div><div><dt>Agent</dt><dd>{record.attribution.model.agent ?? "Not declared"}</dd></div></> : null}
            <div><dt>Repository</dt><dd>{record.source.repository}</dd></div>
            {record.source.pullRequest ? <div><dt>Pull request</dt><dd><a href={record.source.url}>#{record.source.pullRequest}</a></dd></div> : null}
            <div><dt>Commit</dt><dd><a href={`https://github.com/${record.source.repository}/commit/${record.source.commit}`} className="mono">{record.source.commit}</a></dd></div>
            <div><dt>Accepted</dt><dd>{new Date(record.acceptedAt).toISOString()}</dd></div>
          </dl>
        </section>
        <section className="panel">
          <h2>Verification</h2>
          <dl className="facts">
            <div><dt>Verifier</dt><dd>{record.verification.verifier}</dd></div>
            <div><dt>Version</dt><dd className="mono">{record.verification.verifierVersion}</dd></div>
            <div><dt>Status</dt><dd><span className="status status-verified">ACCEPTED</span></dd></div>
            <div><dt>Result digest</dt><dd className="mono break">{record.verification.resultDigest}</dd></div>
            {record.verification.verifier.includes("github-review") ? <div><dt>Review decision</dt><dd><a href={`https://github.com/ignotusnemo/parano1d-soundness/blob/main/platform/reviews/accepted/${record.id}.json`}>Open approvals and effects</a></dd></div> : null}
          </dl>
        </section>
      </div>
      <section className="panel">
        <h2>Exact effects</h2>
        <p>These effects are assigned by the frozen track contract, not by the submission manifest.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Claim</th><th>Status</th><th>Metric</th><th>Value</th><th>Scope</th></tr></thead>
            <tbody>
              {record.effects.flatMap((effect) =>
                effect.metrics.length === 0 ? (
                  <tr key={`${effect.claimId}-status`}><td>{effect.claimId}</td><td>{effect.status}</td><td>None</td><td>None</td><td>Status evidence only</td></tr>
                ) : effect.metrics.map((metric) => (
                  <tr key={`${effect.claimId}-${metric.id}`}><td>{effect.claimId}</td><td>{effect.status}</td><td>{metric.label}</td><td className="mono">{metric.value} {metric.unit}</td><td>{metric.scope}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
