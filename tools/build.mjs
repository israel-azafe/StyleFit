import { access, copyFile, cp, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(projectRoot, "dist");
const clientRoot = resolve(outputRoot, "client");
const serverRoot = resolve(outputRoot, "server");

const requiredFiles = [
  "index.html",
  "styles.css",
  "script.js",
  "assets/stylefit-hero-shirts.png",
  "assets/stylefit-social.png",
  "worker/index.js",
  ".openai/hosting.json"
];

for (const file of requiredFiles) {
  await access(resolve(projectRoot, file));
}

const [html, css, script] = await Promise.all([
  readFile(resolve(projectRoot, "index.html"), "utf8"),
  readFile(resolve(projectRoot, "styles.css"), "utf8"),
  readFile(resolve(projectRoot, "script.js"), "utf8")
]);

const checks = [
  [html.includes("<section class=\"hero\""), "hero"],
  [html.includes("id=\"modelos\""), "products section"],
  [html.includes("<footer"), "footer"],
  [html.includes("styles.css"), "stylesheet reference"],
  [html.includes("script.js"), "script reference"],
  [css.includes("@media (max-width: 560px)"), "mobile styles"],
  [css.includes("prefers-reduced-motion"), "reduced-motion styles"],
  [script.includes("setMenuState"), "responsive navigation"],
  [script.includes("dataset.shirtColor"), "product color interaction"]
];

const failedChecks = checks.filter(([passed]) => !passed).map(([, label]) => label);

if (failedChecks.length > 0) {
  throw new Error(`Build validation failed: ${failedChecks.join(", ")}`);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(resolve(clientRoot, "assets"), { recursive: true });
await mkdir(serverRoot, { recursive: true });

await Promise.all([
  copyFile(resolve(projectRoot, "index.html"), resolve(clientRoot, "index.html")),
  copyFile(resolve(projectRoot, "styles.css"), resolve(clientRoot, "styles.css")),
  copyFile(resolve(projectRoot, "script.js"), resolve(clientRoot, "script.js")),
  cp(resolve(projectRoot, "assets"), resolve(clientRoot, "assets"), { recursive: true }),
  copyFile(resolve(projectRoot, "worker/index.js"), resolve(serverRoot, "index.js"))
]);

console.log("StyleFit build complete: dist/client and dist/server");
