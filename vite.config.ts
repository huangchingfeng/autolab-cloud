import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

const publicDir = process.env.AUTOLAB_VITE_PUBLIC_DIR
  ? path.resolve(import.meta.dirname, process.env.AUTOLAB_VITE_PUBLIC_DIR)
  : path.resolve(import.meta.dirname, "client", "public");

export default defineConfig(async ({ command }) => {
  const plugins = [react(), tailwindcss()];

  if (command === "serve") {
    const { jsxLocPlugin } = await import("@builder.io/vite-plugin-jsx-loc");
    plugins.push(jsxLocPlugin());
  }

  return {
  plugins,
  resolve: {
    alias: [
      {
        find: /^lucide-react$/,
        replacement: path.resolve(import.meta.dirname, "client", "src", "lib", "lucide-react-shim.js"),
      },
      { find: "@shared", replacement: path.resolve(import.meta.dirname, "shared") },
      { find: "@", replacement: path.resolve(import.meta.dirname, "client", "src") },
    ],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir,
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  };
});
