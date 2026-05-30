import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agri Drone Operations Platform",
    short_name: "AgriDrone",
    description:
      "Mobile-first tank mix and calibration records for agricultural drone operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f8f1",
    theme_color: "#2c6240",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
