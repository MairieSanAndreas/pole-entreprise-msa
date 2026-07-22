import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base relatif "./" => compatible GitHub Pages (site de projet) + HashRouter,
// sans avoir à coder en dur le nom du dépôt.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
