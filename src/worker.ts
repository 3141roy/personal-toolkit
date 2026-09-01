interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// A rewrite rule at the edge appends a distinguishing query string when the
// Accept header asks for markdown, so HTML and markdown responses for the
// same URL land on separate cache entries. Without that rule this would need
// to force no-store instead, since the shared edge cache here doesn't split
// entries on the Vary header alone.

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const isPage = !url.pathname.includes('.');
    const wantsMarkdown = isPage && (request.headers.get('Accept') ?? '').includes('text/markdown');

    if (wantsMarkdown) {
      let pathname = url.pathname;
      pathname += pathname.endsWith('/') ? 'index' : '/index';

      const mdUrl = new URL(pathname + '.md', url);
      const mdResponse = await env.ASSETS.fetch(new Request(mdUrl, request));

      if (mdResponse.ok) {
        const headers = new Headers(mdResponse.headers);
        headers.set('content-type', 'text/markdown; charset=utf-8');
        headers.set('vary', 'Accept');
        return new Response(mdResponse.body, { status: 200, headers });
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (!isPage) return response;

    const headers = new Headers(response.headers);
    headers.set('vary', 'Accept');
    return new Response(response.body, { status: response.status, headers });
  },
};
