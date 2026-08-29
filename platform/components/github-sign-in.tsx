import Link from "next/link";

interface GitHubSignInProps {
  label?: string;
  className?: string;
}

export function GitHubSignIn({ label = "Sign in with GitHub", className = "" }: GitHubSignInProps) {
  const classes = ["github-sign-in", className].filter(Boolean).join(" ");
  return <Link className={classes} href="/signin/">{label}</Link>;
}
