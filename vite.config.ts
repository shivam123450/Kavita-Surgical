import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "require-cloudflare-supabase-config",
      configResolved(config) {
        if (config.command !== "build" || config.mode !== "cloudflare") return;
        if (
          !config.env.VITE_SUPABASE_URL?.trim() ||
          !(config.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || config.env.VITE_SUPABASE_ANON_KEY?.trim())
        ) {
          throw new Error(
            "Cloudflare build requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) as build variables.",
          );
        }
      },
    },
  ],
});
