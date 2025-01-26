import rss from "@astrojs/rss";
import { getChaptersForSlugs, isValidLanguage } from "../../lib/api";
import { getFeedMapping } from "../../lib/db";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  const feedId = params.feedId?.replace('.xml', '');
  
  if (!feedId) {
    return new Response("Feed ID not provided", { status: 400 });
  }

  const mapping = await getFeedMapping(feedId);
  
  if (!mapping) {
    return new Response("Feed not found", { status: 404 });
  }

  const { slugs, lang } = mapping;

  if (!isValidLanguage(lang)) {
    return new Response("Invalid language", { status: 400 });
  }

  const chapters = await getChaptersForSlugs(slugs, lang);

  if (chapters.length === 0) {
    return new Response("No chapters found for the provided comics", { status: 404 });
  }

  return rss({
    title: `ComicK - Custom Feed (${lang.toUpperCase()})`,
    description: `Custom RSS feed for selected comics: ${slugs.join(', ')}`,
    site: "https://github.com/ld3z/manga-rss",
    items: chapters.map((chapter) => ({
      title: `${chapter.md_comics.title} - Chapter ${chapter.chap}`,
      link: `https://comick.io/comic/${chapter.md_comics.slug}`,
      pubDate: new Date(chapter.updated_at),
      description: `
        <div>
          ${
            chapter.md_comics.md_covers?.[0]
              ? `<img src="https://meo.comick.pictures/${chapter.md_comics.md_covers[0].b2key}" 
                  alt="Cover" style="max-width: 300px; margin-bottom: 1rem;" />`
              : ""
          }
          <p>New chapter available: Chapter ${chapter.chap}</p>
        </div>
      `,
    })),
  });
}; 