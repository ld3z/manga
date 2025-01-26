import type { Comic, Genre } from './types';

const languageMap = {
  "en": "English",
  "fr": "French",
  "es": "Spanish",
  "it": "Italian",
  "pl": "Polish",
  "tr": "Turkish",
  "ja": "Japanese",
  "zh": "Chinese",
  "sv": "Swedish",
  "ar": "Arabic",
  "de": "German"
} as const;

const languages = new Set(Object.keys(languageMap));
const contentTypes = new Set(["sfw", "nsfw"]);
const urlBase = "https://api.comick.fun/chapter";

let genreCache: Genre[] = [];

const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = RETRY_COUNT): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ComicReader/1.0)',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function fetchGenres(): Promise<Genre[]> {
  if (genreCache.length > 0) return genreCache;

  try {
    const response = await fetchWithRetry('https://api.comick.fun/genre');
    genreCache = await response.json();
    return genreCache;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

export function getGenreNames(genreIds: number[], genres: Genre[]): string[] {
  return genreIds
    .map(id => genres.find(g => g.id === id)?.name ?? '')
    .filter(name => name !== '');
}

export async function fetchComics(language: string = 'en', contentType: string = 'sfw', page: number = 1): Promise<Comic[]> {
  try {
    const apiUrl = `${urlBase}?lang=${language}&page=${page}&order=new&accept_erotic_content=${contentType === 'nsfw'}`;
    const response = await fetchWithRetry(apiUrl);
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Unexpected API response format:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching comics:', error);
    return [];
  }
}

export function isValidLanguage(lang: string): boolean {
  return languages.has(lang);
}

export function isValidContentType(type: string): boolean {
  return contentTypes.has(type);
}

export function getLanguageName(code: string): string {
  return languageMap[code as keyof typeof languageMap] || code.toUpperCase();
}

export const availableLanguages = Array.from(languages);
export const availableContentTypes = Array.from(contentTypes);
export { languageMap };

interface ComicDetail {
  comic: {
    hid: string;
    title: string;
    slug: string;
  };
}

interface ChapterDetail {
  id: string;
  chap: string;
  title: string;
  updated_at: string;
  md_comics: {
    title: string;
    slug: string;
    md_covers?: {
      b2key: string;
    }[];
  };
}

interface ChapterParams {
  limit?: number;
  lang?: string;
}

export async function getComicBySlug(slug: string): Promise<ComicDetail | null> {
  try {
    const response = await fetchWithRetry(`https://api.comick.fun/comic/${slug}`);
    const data = await response.json();
    
    if (!data?.comic?.hid) {
      console.error(`Invalid comic data for slug ${slug}:`, data);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching comic ${slug}:`, error);
    return null;
  }
}

export async function getChaptersByHid(
  hid: string,
  slug: string,
  params: ChapterParams = { limit: 15, lang: 'en' }
): Promise<ChapterDetail[]> {
  try {
    const queryParams = new URLSearchParams({
      limit: params.limit?.toString() || '15',
      lang: params.lang || 'en',
      ordering: '-created_at'
    });
    
    // Fetch comic details including cover
    const comicResponse = await fetchWithRetry(
      `https://api.comick.fun/comic/${hid}`
    );
    const comicData = await comicResponse.json();
    const comicTitle = comicData?.comic?.title || 'Unknown Comic';
    const covers = comicData?.comic?.md_covers || [];
    
    const response = await fetchWithRetry(
      `https://api.comick.fun/comic/${hid}/chapters?${queryParams}`
    );
    const data = await response.json();
    
    if (!data?.chapters || !Array.isArray(data.chapters)) {
      console.error(`Invalid chapters data for hid ${hid}:`, data);
      return [];
    }

    console.log('Processing chapters for comic:', comicTitle);
    
    const chapters = data.chapters
      .filter(chapter => {
        const isValid = chapter && 
               chapter.chap &&
               chapter.hid &&
               (chapter.publish_at || chapter.created_at || chapter.updated_at);
        return isValid;
      })
      .map(chapter => ({
        id: chapter.hid,
        chap: chapter.chap,
        title: chapter.title || `Chapter ${chapter.chap}`,
        updated_at: chapter.publish_at || chapter.created_at || chapter.updated_at,
        md_comics: {
          title: comicTitle,
          slug: slug,
          md_covers: covers // Add covers to the response
        }
      }));

    console.log(`Successfully processed ${chapters.length} chapters for ${comicTitle}`);
    return chapters;
  } catch (error) {
    console.error(`Error fetching chapters for hid ${hid}:`, error);
    return [];
  }
}

export async function getChaptersForSlugs(
  slugs: string[], 
  lang: string = 'en'
): Promise<ChapterDetail[]> {
  console.log(`Fetching chapters for slugs:`, slugs, `in language: ${lang}`);
  const chapters: ChapterDetail[] = [];
  
  for (const slug of slugs) {
    console.log(`Processing slug: ${slug}`);
    const comicDetail = await getComicBySlug(slug);
    
    if (!comicDetail) {
      console.error(`Failed to get comic details for slug: ${slug}`);
      continue;
    }
    
    if (!comicDetail.comic?.hid) {
      console.error(`No HID found for slug ${slug}`, comicDetail);
      continue;
    }
    
    console.log(`Found HID ${comicDetail.comic.hid} for slug ${slug}`);
    const comicChapters = await getChaptersByHid(
      comicDetail.comic.hid,
      slug,
      {
        limit: 15,
        lang: lang
      }
    );
    console.log(`Found ${comicChapters.length} chapters for ${slug}`);
    
    if (comicChapters.length > 0) {
      chapters.push(...comicChapters);
    }
  }
  
  // Sort by chapter number (descending) first, then by date
  const sortedChapters = chapters.sort((a, b) => {
    // Convert chapter numbers to floats for proper numerical sorting
    const chapA = parseFloat(a.chap);
    const chapB = parseFloat(b.chap);
    
    if (chapB !== chapA) {
      return chapB - chapA; // Sort by chapter number first
    }
    
    // If chapters are the same, sort by date
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  
  console.log(`Total chapters found: ${sortedChapters.length}`);
  return sortedChapters;
}