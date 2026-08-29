"use client";

import { useState } from "react";

export function CopyCommand({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    setFailed(false);
    try {
      await window.navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setFailed(true);
    }
  };
  return (
    <div className="command-block">
      <pre><code>{value}</code></pre>
      <button type="button" onClick={() => void copy()}>{copied ? "Copied" : failed ? "Select text" : "Copy"}</button>
    </div>
  );
}
