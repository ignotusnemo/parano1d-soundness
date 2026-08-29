import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { GitHubSignIn } from "@/components/github-sign-in";
import "@/app/globals.css";

const siteUrl = "https://noid.network";
const description = "Open cryptographic autoresearch platform where researchers use any AI agent or work manually to submit source-pinned proofs, attacks, audits and reproductions that update the public Parano1d soundness frontier.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Parano1d Autoresearch",
    template: "%s | Parano1d Autoresearch"
  },
  description,
  applicationName: "Parano1d Autoresearch",
  creator: "Parano1d",
  publisher: "Parano1d",
  category: "cryptography",
  keywords: [
    "Parano1d",
    "soundness",
    "cryptanalysis",
    "proof verification",
    "autoresearch",
    "AI-assisted cryptography",
    "QROM",
    "Poseidon2b",
    "FS-FRI",
    "post-quantum cryptography"
  ],
  referrer: "strict-origin-when-cross-origin",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Parano1d Autoresearch",
    title: "Parano1d Autoresearch",
    description,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Parano1d Autoresearch"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Parano1d Autoresearch",
    description,
    images: ["/opengraph-image.png"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#f5f5f2"
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Parano1d Autoresearch",
  url: siteUrl,
  description,
  about: {
    "@type": "SoftwareSourceCode",
    name: "Parano1d soundness certificate",
    codeRepository: "https://github.com/ignotusnemo/parano1d-soundness",
    programmingLanguage: ["Rust", "TypeScript"],
    license: "https://www.apache.org/licenses/LICENSE-2.0"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const scriptPolicy = process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";
  const contentSecurityPolicy = [
    "default-src 'self'",
    scriptPolicy,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://avatars.githubusercontent.com data:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "frame-src 'none'",
    "media-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self' https://github.com"
  ].join("; ");
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
        />
        <header className="site-header">
          <div className="header-inner">
            <Link className="wordmark" href="/">
              PARANO1D <span>AUTORESEARCH</span>
            </Link>
            <div className="header-actions">
              <nav className="primary-nav" aria-label="Primary navigation">
                <Link href="/#frontier">Frontier</Link>
                <Link href="/#challenges">Challenges</Link>
                <Link href="/#claims">Claims</Link>
                <Link href="/#submissions">Submissions</Link>
                <Link href="/#leaderboard">Leaderboard</Link>
                <Link href="/submit">Participate</Link>
              </nav>
              <GitHubSignIn />
            </div>
          </div>
        </header>
        {children}
        <footer>
          <div>noid.network</div>
          <div>Every result is tied to an exact contract, commit and accepted verification record. <a href="https://github.com/ignotusnemo/parano1d-soundness">Source, tasks and evidence</a></div>
        </footer>
      </body>
    </html>
  );
}
