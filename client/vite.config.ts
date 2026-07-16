import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/FinOps",
  server: {
    proxy: {
      "/api": "https://finops-nxob.onrender.com/",
    },
  },
});
