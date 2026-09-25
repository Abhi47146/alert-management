import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5000,
    fs: {
      allow: ["./", "./client", "./shared", "index.html", "./static"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || 'http://api:8000',
        changeOrigin: true,
        secure: false,
      },
      '/hls': {
        target: 'http://mediamtx:8888',
        changeOrigin: true,
      },
      // Proxy WebRTC video feeds to MediaMTX
      '/webrtc': {
        target: 'http://mediamtx:8889',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/spa",
  },

  plugins: [react()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));