import Redis from 'ioredis';
import type { FeedMapping } from './types';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL!);

export async function storeFeedMapping(feedId: string, slugs: string[], lang: string): Promise<void> {
  const mapping = {
    slugs,
    lang,
    created_at: new Date().toISOString()
  };
  
  // Store with 30 day expiration
  await redis.set(
    feedId, 
    JSON.stringify(mapping),
    'EX',
    60 * 60 * 24 * 30 // 30 days in seconds
  );
}

export async function getFeedMapping(feedId: string): Promise<FeedMapping | null> {
  const mapping = await redis.get(feedId);
  if (!mapping) return null;
  
  const data = JSON.parse(mapping);
  return {
    slugs: data.slugs,
    lang: data.lang
  };
}

// No need for manual cleanup as we're using TTL (expire) 