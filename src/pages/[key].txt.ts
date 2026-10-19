import type { APIRoute, GetStaticPaths } from 'astro';

const key = import.meta.env.INDEXNOW_KEY ?? process.env.INDEXNOW_KEY ?? '';

export const getStaticPaths: GetStaticPaths = () => {
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) return [];
  return [{ params: { key } }];
};

export const GET: APIRoute = () =>
  new Response(key, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
