import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // nasz jedyny entrypoint – index.html
        taskpane: "index.html",
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    https: {
      key: fs.readFileSync(
        path.join(
          process.env.USERPROFILE || process.env.HOME || "",
          ".office-addin-dev-certs",
          "localhost.key"
        )
      ),
      cert: fs.readFileSync(
        path.join(
          process.env.USERPROFILE || process.env.HOME || "",
          ".office-addin-dev-certs",
          "localhost.crt"
        )
      ),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
