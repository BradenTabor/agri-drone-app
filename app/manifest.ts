import type { MetadataRoute } from "next";

import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.appName} — ${BRAND.name}`,
    short_name: BRAND.shortName,
    description:
      "Mobile-first tank mix and calibration records for agricultural drone operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f8f1",
    theme_color: "#2c6240",
    icons: [
      {
        src: BRAND.logoPath,
        sizes: "408x612",
        type: "image/png",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
