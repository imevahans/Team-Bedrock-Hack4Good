import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Frontend port
    proxy: {
      "/api": {
        target: "https://teambedrock-hack4good-2af7420de7ed.herokuapp.com/", // Backend server
        changeOrigin: true,
      },
    },
  },
});
