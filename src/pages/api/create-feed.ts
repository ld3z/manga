import type { APIRoute } from "astro";
import { createHash } from 'crypto';

// In-memory storage (replace with database in production)
const feedMappings = new Map<string, { slugs: string[], lang: string }>();

export const POST: APIRoute = async ({ request }) => {
  try {
    const { slugs, lang } = await request.json();

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return new Response("Invalid slugs array", { status: 400 });
    }

    // Create a unique hash based on slugs and language
    const dataString = `${slugs.sort().join(',')}:${lang}`;
    const hash = createHash('md5').update(dataString).digest('hex').slice(0, 8);

    // Store the mapping
    feedMappings.set(hash, { slugs, lang });

    return new Response(JSON.stringify({ feedId: hash }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response("Invalid request", { status: 400 });
  }
};

// Export the mappings for use in other files
export { feedMappings }; 