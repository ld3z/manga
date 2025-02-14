import type { APIRoute } from "astro";
import { getFeedMapping } from '../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const { feedId } = params;
  
  if (!feedId) {
    return new Response("Feed ID not provided", { status: 400 });
  }

  try {
    const mapping = await getFeedMapping(feedId);
    
    if (!mapping) {
      return new Response("Feed not found", { status: 404 });
    }

    return new Response(JSON.stringify(mapping), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return new Response("Internal server error", { status: 500 });
  }
};