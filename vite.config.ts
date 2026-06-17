import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
// `base` controls the public path the build is served from. On GitHub Pages a
// project site lives at https://<user>.github.io/<repo>/, so the CI passes
// BASE_PATH=/<repo>/. Locally it defaults to "/".
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [vue()],
});
