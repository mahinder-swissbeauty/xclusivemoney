import { defineConfig } from "vite";
import shopify from "vite-plugin-shopify";
import { resolve } from "node:path";
import { watch } from "chokidar";
import fs from "fs-extra";
import react from '@vitejs/plugin-react'

if (process.env.NODE_ENV == "development") {
  watch("resources/*").on("all", (event, path) => {
    let newPath = path.replace("resources", "assets");
    switch (event) {
      case "add":
        fs.copy(path, newPath);
        console.log("\x1b[32m", `[chokidar] adding file ${path}`);
        return;
      case "change":
        fs.copy(path, newPath);
        console.log("\x1b[32m", `[chokidar] changing file ${path}`);
        return;
      case "unlink":
        fs.remove(newPath);
        console.log("\x1b[32m", `[chokidar] removing file ${path}`);
        return;
      default:
        console.log(
          "\x1b[31m",
          `[chokidar] Unhandled event fired ${event} - ${path}`
        );
    }
  });
}


export default defineConfig({
  server: {
    watch: {},
    host: false,
    port: 3000,
  },
  publicDir: "public",
  resolve: {
    alias: {
      "@fonts": resolve("frontend/fonts"),
      "@modules": resolve("frontend/modules"),
    },
  },
  plugins: [shopify(), react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      external: /^lit/,
    },
  },
});

