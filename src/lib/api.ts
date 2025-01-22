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