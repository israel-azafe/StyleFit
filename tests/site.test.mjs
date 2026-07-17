import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

test("homepage contains the requested sections and separated assets", async () => {
  const html = await readFile(new URL("index.html", projectRoot), "utf8");

  assert.match(html, /<header\b/);
  assert.match(html, /<section class="hero"/);
  assert.match(html, /id="modelos"/);
  assert.match(html, /<footer\b/);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="script\.js"/);
  assert.match(html, /assets\/stylefit-hero-shirts\.png/);
});

test("styles include responsive and accessible behavior", async () => {
  const css = await readFile(new URL("styles.css", projectRoot), "utf8");

  assert.match(css, /@media \(max-width: 960px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
});

test("interactions expose accessible state", async () => {
  const script = await readFile(new URL("script.js", projectRoot), "utf8");

  assert.match(script, /aria-expanded/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /aria-hidden/);
  assert.match(script, /IntersectionObserver/);
});

test("built worker serves the homepage and resolves the social image URL", async () => {
  const { default: worker } = await import(
    new URL(`../dist/server/index.js?test=${Date.now()}`, import.meta.url)
  );

  const response = await worker.fetch(
    new Request("https://stylefit.example/", {
      headers: { accept: "text/html" }
    }),
    {
      ASSETS: {
        async fetch(request) {
          const pathname = new URL(request.url).pathname.replace(/^\/+/, "");
          const fileUrl = new URL(`../dist/client/${pathname}`, import.meta.url);

          try {
            const body = await readFile(fileUrl);
            const extension = pathname.slice(pathname.lastIndexOf("."));
            return new Response(body, {
              headers: { "Content-Type": contentTypes[extension] || "application/octet-stream" }
            });
          } catch {
            return new Response("Not found", { status: 404 });
          }
        }
      }
    }
  );

  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /^text\/html/);
  assert.match(html, /https:\/\/stylefit\.example\/assets\/stylefit-social\.png/);
  assert.doesNotMatch(html, /__STYLEFIT_SOCIAL_IMAGE__/);
});
