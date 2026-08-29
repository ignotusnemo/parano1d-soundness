import { deriveResearchState } from "@/lib/derive";

const state = deriveResearchState(process.cwd());
process.stdout.write(`${JSON.stringify(state)}\n`);
