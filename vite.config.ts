import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Helper function to safely read cert files
const getCertFiles = () => {
  try {
    const certDir = path.join(
      process.env.USERPROFILE || process.env.HOME || "",
      ".office-addin-dev-certs"
    );

    const keyPath = path.join(certDir, "localhost.key");
    const certPath = path.join(certDir, "localhost.crt");

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.warn("SSL certificates not found, using HTTP for development");
  }
  return undefined;
};

export default defineConfig({
  plugins: [react()],
  base: "/addin/",
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
    https: getCertFiles(),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
