import type { Comic } from './types';

const languages = new Set(["en", "fr", "es", "it", "pl", "tr", "ja", "zh", "sv"]);
const contentTypes = new Set(["sfw", "nsfw"]);
const urlBase = "https://api.comick.fun/chapter";  // Removed trailing slash

export async function fetchComics(language: string = 'en', contentType: string = 'sfw'): Promise<Comic[]> {
  try {
    const apiUrl = `${urlBase}?lang=${language}&page=1&order=new&accept_erotic_content=${contentType === 'nsfw'}`;
    // console.log('Fetching from:', apiUrl); // Debug log
    
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
    // console.log('API response:', data); // Debug log

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

export const availableLanguages = Array.from(languages);
export const availableContentTypes = Array.from(contentTypes);