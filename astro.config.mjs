import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
  integrations: [tailwind()],
  vite: {
    define: {
      'process.env.REDIS_URL': JSON.stringify(process.env.REDIS_URL)
    }
  }
});