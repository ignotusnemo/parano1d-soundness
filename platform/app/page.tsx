import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";
import { readBuiltPlatformState } from "@/lib/static-state";

export const metadata: Metadata = {
  alternates: { canonical: "/" }
};

export default function HomePage() {
  return <Dashboard initialState={readBuiltPlatformState(process.cwd())} />;
}
