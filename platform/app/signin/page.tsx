import type { Metadata } from "next";
import Link from "next/link";

const forkUrl = "https://github.com/ignotusnemo/parano1d-soundness/fork";

export const metadata: Metadata = {
  title: "Sign in with GitHub",
  description: "Use a GitHub account as your verified Parano1d Autoresearch contributor identity.",
  alternates: { canonical: "/signin/" }
};

export default function SignInPage() {
  return (
    <main className="detail-page signin-page">
      <Link className="back-link" href="/">Back to the public frontier</Link>
      <div className="eyebrow">CONTRIBUTOR IDENTITY</div>
      <h1>Sign in with GitHub</h1>
      <p className="detail-note">There is no separate registration, username or password. GitHub supplies your identity, and your first accepted submission creates your contributor profile automatically.</p>

      <section className="panel signin-panel">
        <div>
          <h2>One account for submissions, review history and credit</h2>
          <p>Each submission is credited to the GitHub account that opened the pull request. The AI provider, model and agent are listed separately for that result.</p>
          <p>Authentication, the fork and the pull request stay on GitHub. No GitHub token, password or private model credential is sent to noid.network.</p>
        </div>
        <div className="signin-action">
          <a className="github-sign-in" href={forkUrl}>Continue with GitHub</a>
          <small>GitHub asks you to sign in if needed, then opens the fork flow.</small>
        </div>
      </section>

      <section className="signin-facts" aria-label="Account behavior">
        <article><strong>No separate registration</strong><p>Your GitHub account becomes the contributor profile with its first accepted submission.</p></article>
        <article><strong>Verified attribution</strong><p>The researcher identity comes from the trusted pull request event and cannot be typed into a submission.</p></article>
        <article><strong>Public credit</strong><p>Accepted work appears under your GitHub profile and the declared AI model in the leaderboards.</p></article>
      </section>
    </main>
  );
}
