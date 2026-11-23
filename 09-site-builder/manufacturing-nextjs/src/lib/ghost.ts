import GhostContentAPI from '@ghost/content-api';
import type { PostOrPage, PostsOrPages, Tags, Authors } from '@ghost/content-api';

const ghostApiUrl = process.env.GHOST_API_URL || 'http://localhost:2368';
const ghostContentApiKey = process.env.GHOST_CONTENT_API_KEY || '';

export const ghost = new GhostContentAPI({
  url: ghostApiUrl,
  key: ghostContentApiKey,
  version: 'v5.0',
});

export type GhostPost = PostOrPage;
export type GhostPage = PostOrPage;
export type GhostTag = Tags[0];
export type GhostAuthor = Authors[0];

export interface GhostPostWithRelations extends GhostPost {
  primary_tag?: GhostTag;
  primary_author?: GhostAuthor;
  tags?: GhostTag[];
  authors?: GhostAuthor[];
}

export interface GhostPageWithRelations extends GhostPage {
  primary_tag?: GhostTag;
  primary_author?: GhostAuthor;
  tags?: GhostTag[];
  authors?: GhostAuthor[];
}

export async function getPosts(options?: {
  limit?: number;
  page?: number;
  tag?: string;
  author?: string;
  include?: string;
  filter?: string;
  formats?: string;
}): Promise<PostsOrPages> {
  return ghost.posts.browse({
    limit: options?.limit || 10,
    page: options?.page || 1,
    include: options?.include || 'tags,authors',
    filter: options?.filter,
    formats: options?.formats || 'html,plaintext',
    ...(options?.tag && { filter: `tag:${options.tag}+${options.filter || ''}` }),
    ...(options?.author && { filter: `author:${options.author}+${options.filter || ''}` }),
  });
}

export async function getPost(slug: string): Promise<GhostPostWithRelations | null> {
  try {
    const post = await ghost.posts.read({
      slug,
      include: 'tags,authors',
      formats: 'html,plaintext',
    });
    return post as GhostPostWithRelations;
  } catch {
    return null;
  }
}

export async function getPage(slug: string): Promise<GhostPageWithRelations | null> {
  try {
    const page = await ghost.pages.read({
      slug,
      include: 'tags,authors',
      formats: 'html,plaintext',
    });
    return page as GhostPageWithRelations;
  } catch {
    return null;
  }
}

export async function getTags(options?: { limit?: number; include?: string; filter?: string }): Promise<Tags> {
  return ghost.tags.browse({
    limit: options?.limit || 'all',
    include: options?.include || 'count.posts',
    filter: options?.filter,
  });
}

export async function getAuthors(options?: { limit?: number; include?: string }): Promise<Authors> {
  return ghost.authors.browse({
    limit: options?.limit || 'all',
    include: options?.include || 'count.posts',
  });
}

export async function getSettings(): Promise<Record<string, unknown>> {
  return ghost.settings.browse();
}

export function getGhostImageUrl(image: string | undefined, size?: 's' | 'm' | 'l' | 'xl' | 'xxl'): string | undefined {
  if (!image) return undefined;
  if (image.startsWith('http')) return image;

  const baseUrl = ghostApiUrl.replace(/\/$/, '');
  const sizeSuffix = size ? `_${size}` : '';
  return `${baseUrl}/content/images/size/w1000${sizeSuffix}/${image}`;
}

export function getGhostUrl(path: string): string {
  return `${ghostApiUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}