import rss from "@astrojs/rss";
import { getChaptersForSlugs, isValidLanguage } from "../../../lib/api";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, url }) => {
  const slugs = params.slugs?.split(',') || [];
  const lang = url.searchParams.get('lang') || 'en';
  
  if (slugs.length === 0) {
    return new Response("No slugs provided", { status: 400 });
  }

  if (!isValidLanguage(lang)) {
    return new Response("Invalid language", { status: 400 });
  }

  console.log('Processing RSS request for slugs:', slugs, 'in language:', lang);
  const chapters = await getChaptersForSlugs(slugs, lang);

  if (chapters.length === 0) {
    console.log('No chapters found for any of the provided slugs');
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
      description: `New chapter available: Chapter ${chapter.chap}`,
    })),
  });
}; 