import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensure output is placed in the `dist` folder for Vercel
  },
  base: './',
  server: {
    port: 5173, // Frontend port for local development
    proxy: {
      "/api": {
        target: "https://teambedrock-hack4good-2af7420de7ed.herokuapp.com/", // Backend server for local development
        changeOrigin: true,
        secure: false,  // Add this if you're using an HTTPS backend during development
      },
    },
  },
});
