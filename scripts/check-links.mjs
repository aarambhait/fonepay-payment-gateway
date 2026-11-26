import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const BASE = "/fonepay-payment-gateway";
const ORIGIN = "http://local.test";

const listHtml = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listHtml(path);
    return path.endsWith(".html") ? [path] : [];
  });

const pageUrl = (file) => {
  const route = relative(DIST, file).replace(/index\.html$/, "").replace(/\\/g, "/");
  return `${ORIGIN}${BASE}/${route}`;
};

const targetFile = (pathname) => {
  const local = decodeURIComponent(pathname.slice(BASE.length)).replace(/^\//, "");
  const candidates = [join(DIST, local), join(DIST, local, "index.html")];
  return candidates.find((path) => existsSync(path) && statSync(path).isFile());
};

const idsCache = new Map();
const hasId = (file, id) => {
  if (!idsCache.has(file)) idsCache.set(file, readFileSync(file, "utf8"));
  return new RegExp(`id=["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(idsCache.get(file));
};

const problems = [];
for (const file of listHtml(DIST)) {
  const html = readFileSync(file, "utf8");
  for (const [, href] of html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
    if (/^(mailto:|tel:|viber:|javascript:)/.test(href)) continue;
    const url = new URL(href.replaceAll("&amp;", "&"), pageUrl(file));
    if (url.origin !== ORIGIN) continue;
    if (!url.pathname.startsWith(BASE)) {
      problems.push(`${file}: ${href} escapes the site base path`);
      continue;
    }
    const target = targetFile(url.pathname);
    if (!target) problems.push(`${file}: broken link ${href}`);
    else if (url.hash && !hasId(target, url.hash.slice(1))) problems.push(`${file}: missing anchor ${href}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Checked ${listHtml(DIST).length} pages: all internal links and anchors resolve.`);
