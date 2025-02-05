import Redis from 'ioredis';
import type { FeedMapping } from './types';
import { getChaptersForSlugs } from './api';

const REDIS_URL = import.meta.env.REDIS_URL || process.env.REDIS_URL;
let redisClient: Redis | null = null;
const DEFAULT_CACHE_TTL = 60 * 60 * 24 * 30; // 30 days
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 100;

// Improved connection handling with exponential backoff
async function createRedisClient(): Promise<Redis> {
  if (!REDIS_URL) throw new Error('REDIS_URL environment variable is not set');
  
  return new Redis(REDIS_URL, {
    retryStrategy: (times) => {
      if (times >= MAX_RETRIES) return null;
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, times), 5000);
      console.log(`Redis retry attempt ${times}, next try in ${delay}ms`);
      return delay + Math.random() * 200; // Add jitter
    },
    maxRetriesPerRequest: null,  // Allow retries for queued commands
    enableOfflineQueue: true,     // Enable command queuing
    enableReadyCheck: true,
    reconnectOnError: (err) => {
      return err.message.includes('READONLY');
    }
  });
}

// Singleton pattern with connection pooling
export async function getRedisClient(): Promise<Redis> {
  if (redisClient?.status === 'ready') {
    // Validate connection with a quick ping
    try {
      await redisClient.ping();
      return redisClient;
    } catch {
      // Fall through to reconnect
    }
  }

  console.log('Initializing new Redis connection...');
  redisClient = await createRedisClient();
  
  // Add event listeners for better monitoring
  redisClient
    .on('ready', () => console.log('Redis connection ready'))
    .on('error', (err) => console.error('Redis error:', err))
    .on('reconnecting', () => console.log('Redis reconnecting'))
    .on('end', () => console.log('Redis connection closed'));

  return redisClient;
}

// Batch operations for better performance
export async function storeFeedMappings(mappings: Array<{ feedId: string, slugs: string[], lang: string }>): Promise<void> {
  const redis = await getRedisClient();
  const pipeline = redis.pipeline();
  
  mappings.forEach(({ feedId, slugs, lang }) => {
    const mapping = {
      slugs,
      lang,
      created_at: new Date().toISOString()
    };
    pipeline.set(feedId, JSON.stringify(mapping), 'EX', DEFAULT_CACHE_TTL);
  });

  await pipeline.exec();
}

// Update warmChapterCache to prevent empty cache entries
export async function warmChapterCache(slugs: string[], lang: string): Promise<void> {
  const redis = await getRedisClient();
  const needsCache = await checkCacheStatus(slugs, lang);
  
  if (needsCache.length > 0) {
    console.log(`Pre-warming cache for ${needsCache.length} comics`);
    const pipeline = redis.pipeline();
    
    // Replace empty array with actual chapter fetching
    await Promise.all(needsCache.map(async slug => {
      try {
        const chapters = await getChaptersForSlugs([slug], lang);
        const cacheKey = `chapters:${slug}:${lang}`;
        pipeline.set(cacheKey, JSON.stringify(chapters), 'EX', 60 * 60);
      } catch (error) {
        console.error(`Failed to warm cache for ${slug}:`, error);
      }
    }));
    
    await pipeline.exec();
  }
}

// Add batch cache checking
export async function checkCacheStatus(slugs: string[], lang: string): Promise<string[]> {
  const redis = await getRedisClient();
  const pipeline = redis.pipeline();
  
  slugs.forEach(slug => {
    const cacheKey = `chapters:${slug}:${lang}`;
    pipeline.exists(cacheKey);
  });

  const results = await pipeline.exec();
  return slugs.filter((_, index) => results![index][1] === 0);
}

export async function storeFeedMapping(feedId: string, slugs: string[], lang: string): Promise<void> {
  const redis = await getRedisClient();
  const mapping = {
    slugs,
    lang,
    created_at: new Date().toISOString()
  };
  
  try {
    await redis.set(
      feedId, 
      JSON.stringify(mapping),
      'EX',
      DEFAULT_CACHE_TTL
    );
  } catch (error) {
    console.error('Error storing feed mapping:', error);
    throw new Error('Failed to store feed mapping');
  }
}

export async function getFeedMapping(feedId: string): Promise<FeedMapping | null> {
  const redis = await getRedisClient();
  
  try {
    const mapping = await redis.get(feedId);
    if (!mapping) return null;
    
    await redis.expire(feedId, DEFAULT_CACHE_TTL);
    
    const data = JSON.parse(mapping);
    return {
      slugs: data.slugs,
      lang: data.lang
    };
  } catch (error) {
    console.error('Error retrieving feed mapping:', error);
    throw new Error('Failed to retrieve feed mapping');
  }
}

// No need for manual cleanup as we're using TTL (expire)

// Warm connection on startup
(async () => {
  try {
    const client = await getRedisClient();
    await client.ping();
    console.log('Redis pre-connected successfully');
  } catch (error) {
    console.error('Redis pre-connection failed:', error);
  }
})(); 