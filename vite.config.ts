import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    fs: {
      allow: ["./", "./client", "./shared", "index.html", "./static", "./node_modules"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    
    proxy: {
      "/api": {
        target: "http://192.168.75.249:8000",
        changeOrigin: true,
        secure: false,
      },
      "/static": {
        target: "http://192.168.75.249:8000",
        changeOrigin: true,
        secure: false,
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
