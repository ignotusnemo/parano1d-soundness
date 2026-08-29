import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Parano1d Open Verification",
    short_name: "Parano1d Verify",
    description: "Public soundness claims, cryptanalysis and exact verification records for Parano1d.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f2",
    theme_color: "#f5f5f2",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
