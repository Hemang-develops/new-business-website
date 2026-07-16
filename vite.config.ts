import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPackageName = (id: string) => {
  const nodeModulesPath = id.split("node_modules/")[1];
  if (!nodeModulesPath) {
    return "";
  }

  const parts = nodeModulesPath.split("/");
  if (parts[0]?.startsWith("@")) {
    return `${parts[0]}/${parts[1]}`;
  }

  return parts[0] || "";
};

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      'react',
      'react-dom',
      'react-router-dom',   // add if using react-router
    ],
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { target: "19" }],
        ],
      },
    }),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          const packageName = getPackageName(id);

          if (
            [
              "react",
              "react-dom",
              "react-router",
              "react-router-dom",
              "scheduler",
            ].includes(packageName)
          ) {
            return "vendor-react";
          }

          if (packageName.startsWith("@supabase/")) {
            return "vendor-supabase";
          }

          if (packageName === "gsap" || packageName === "@gsap/react") {
            return "vendor-gsap";
          }

          if (packageName.startsWith("@tiptap/") || packageName.startsWith("prosemirror-")) {
            return "vendor-editor";
          }

          if (packageName.startsWith("@calcom/")) {
            return "vendor-booking";
          }

          if (packageName.startsWith("@dnd-kit/") || packageName.startsWith("@tanstack/")) {
            return "vendor-admin";
          }

          if (packageName === "recharts" || packageName.startsWith("d3-") || packageName === "victory-vendor" || packageName === "react-smooth") {
            return "vendor-charts";
          }

          if (packageName === "dotted-map" || packageName === "proj4" || packageName.startsWith("@turf/")) {
            return "vendor-map";
          }

          if (packageName === "zod") {
            return "vendor-zod";
          }

          if (packageName === "framer-motion" || packageName === "motion-dom" || packageName === "motion-utils") {
            return "vendor-motion";
          }

          if (packageName === "lodash" || packageName === "lodash.throttle") {
            return "vendor-lodash";
          }

          if (packageName === "lucide-react" || packageName.startsWith("@radix-ui/") || packageName.startsWith("@floating-ui/") || packageName.startsWith("@material-tailwind/")) {
            return "vendor-ui";
          }

          return undefined;
        },
      },
    },
  },
})
