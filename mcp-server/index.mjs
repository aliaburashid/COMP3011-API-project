#!/usr/bin/env node
/**
 * FlickGallery MCP Server
 *
 * Exposes the FlickGallery API as tools for MCP-compatible AI assistants.
 * Each "tool" below maps to an API endpoint.
 *
 * Before using: Start FlickGallery with `npm start` so the API is running.
 * Add this server to your MCP client's configuration (see README for setup).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Base URL of the FlickGallery API. Override with FLICK_API_URL env var if needed.
const FLICK_API_URL = process.env.FLICK_API_URL || 'http://localhost:3000';

/**
 * Helper: fetch JSON from a FlickGallery API path.
 * Throws if the response is not OK (4xx, 5xx).
 */
async function flickFetch(path, options = {}) {
  const url = `${FLICK_API_URL}${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  // If API returned an error status, throw so the tool shows a clear error
  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText || String(res.status);
    throw new Error(`FlickGallery API ${res.status}: ${msg}`);
  }
  return data;
}

const server = new McpServer({
  name: 'flickgallery',
  version: '1.0.0',
  description: 'Access FlickGallery API – an Instagram-style social media platform with authors, posts, and hashtags.',
});

// ── Tools ──
// Each tool calls the FlickGallery API and returns JSON. MCP expects { content: [{ type, text }] }.

// Tool 1: List recent posts with optional pagination
server.registerTool(
  'flick_list_posts',
  {
    title: 'List Posts',
    description: 'Get recent posts from FlickGallery feed. Supports pagination.',
    inputSchema: {
      page: z.number().optional().describe('Page number (default 1)'),
      limit: z.number().optional().describe('Posts per page (default 10, max 50)'),
    },
  },
  async ({ page, limit }) => {
    const p = page ?? 1;
    const l = limit ?? 10;
    const data = await flickFetch(`/api/posts?page=${p}&limit=${l}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 2: Get one post by its ID
server.registerTool(
  'flick_get_post',
  {
    title: 'Get Post',
    description: 'Get a single post by ID.',
    inputSchema: {
      postId: z.string().describe('Post MongoDB ObjectId'),
    },
  },
  async ({ postId }) => {
    const data = await flickFetch(`/api/posts/${postId}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 3: Get all authors (influencers) on the platform
server.registerTool(
  'flick_list_authors',
  {
    title: 'List Authors',
    description: 'Get all authors (influencers) on FlickGallery.',
    inputSchema: {},
  },
  async () => {
    const data = await flickFetch('/api/authors');
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 4: Get one author by ID
server.registerTool(
  'flick_get_author',
  {
    title: 'Get Author',
    description: 'Get a single author by ID.',
    inputSchema: {
      authorId: z.string().describe('Author MongoDB ObjectId'),
    },
  },
  async ({ authorId }) => {
    const data = await flickFetch(`/api/authors/${authorId}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 5: Get all posts by a specific author
server.registerTool(
  'flick_get_author_posts',
  {
    title: "Get Author's Posts",
    description: 'Get all posts by a specific author.',
    inputSchema: {
      authorId: z.string().describe('Author MongoDB ObjectId'),
    },
  },
  async ({ authorId }) => {
    const data = await flickFetch(`/api/authors/${authorId}/posts`);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 6: Get all hashtags used across posts
server.registerTool(
  'flick_list_tags',
  {
    title: 'List Hashtags',
    description: 'Get all hashtags used in posts.',
    inputSchema: {},
  },
  async () => {
    const data = await flickFetch('/api/tags');
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 7: Get posts that use a given hashtag (e.g. "fashion")
server.registerTool(
  'flick_get_tag_posts',
  {
    title: 'Get Posts by Hashtag',
    description: 'Get posts that use a specific hashtag.',
    inputSchema: {
      tag: z.string().describe('Hashtag without # (e.g. fashion, travel)'),
    },
  },
  async ({ tag }) => {
    const data = await flickFetch(`/api/tags/${encodeURIComponent(tag)}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Start server ──
// Stdio = communicate via stdin/stdout (the MCP client spawns this process and talks to it)
const transport = new StdioServerTransport();
await server.connect(transport);
