import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ["localhost"],
    // The public API stays reachable on the same origin in dev, as behind the reverse proxy.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
