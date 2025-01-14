import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import betterImageService from 'astro-better-image-service';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [betterImageService()],
});