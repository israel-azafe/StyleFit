const securityHeaders = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN"
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);

  Object.entries(securityHeaders).forEach(([name, value]) => {
    headers.set(name, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function fetchIndex(request, env) {
  const indexUrl = new URL("/index.html", request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(indexUrl, request));

  if (!assetResponse.ok) {
    return assetResponse;
  }

  const html = await assetResponse.text();
  const origin = new URL(request.url).origin;
  const socialImage = `${origin}/assets/stylefit-social.png`;
  const renderedHtml = html.replaceAll("__STYLEFIT_SOCIAL_IMAGE__", socialImage);
  const headers = new Headers(assetResponse.headers);

  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-cache");

  return new Response(renderedHtml, {
    status: assetResponse.status,
    headers
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return withSecurityHeaders(await fetchIndex(request, env));
    }

    const assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status !== 404 || !acceptsHtml) {
      return withSecurityHeaders(assetResponse);
    }

    return withSecurityHeaders(await fetchIndex(request, env));
  }
};

export default worker;
