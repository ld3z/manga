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
  "sv": "Swedish"
} as const;

const languages = new Set(Object.keys(languageMap));
const contentTypes = new Set(["sfw", "nsfw"]);
const urlBase = "https://api.comick.fun/chapter";

let genreCache: Genre[] = [];

export async function fetchGenres(): Promise<Genre[]> {
  if (genreCache.length > 0) return genreCache;

  try {
    const response = await fetch('https://api.comick.fun/genre');
    if (!response.ok) throw new Error(`Failed to fetch genres: ${response.status}`);
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

export async function fetchComics(language: string = 'en', contentType: string = 'sfw'): Promise<Comic[]> {
  try {
    const apiUrl = `${urlBase}?lang=${language}&page=1&order=new&accept_erotic_content=${contentType === 'nsfw'}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ComicReader/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

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