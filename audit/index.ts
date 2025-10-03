import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";
import ora from "ora";
import chalk from "chalk";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import prettier from "prettier";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { z } from "zod";
import { createRequire } from "module";
import { JSDOM } from "jsdom";

const argv = await yargs(hideBin(process.argv))
  .option("url", {
    type: "string",
    default: "https://assistjur.com.br/",
    demandOption: true,
  })
  .parse();

const url = argv.url as string;

const outDir = path.resolve("out");
const fixesDir = path.join(outDir, "fixes");
const lhDir = path.join(outDir, "lighthouse");
await fs.promises.mkdir(fixesDir, { recursive: true });
await fs.promises.mkdir(lhDir, { recursive: true });

const spinner = ora(`Fetching ${url}`).start();

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
if ((await page.content()).trim().length === 0) {
  await page.reload();
  await page.waitForLoadState("load");
}
const snapshot = await page.content();
await fs.promises.writeFile(
  path.join(outDir, "snapshot.html"),
  snapshot,
  "utf-8",
);

const head = await page.evaluate(() => ({
  title: document.title || null,
  description:
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") || null,
  robots:
    document.querySelector('meta[name="robots"]')?.getAttribute("content") ||
    null,
  canonical:
    document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
    null,
  lang: document.documentElement.getAttribute("lang") || null,
  viewport:
    document.querySelector('meta[name="viewport"]')?.getAttribute("content") ||
    null,
  og: {
    title:
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content") || null,
    description:
      document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content") || null,
    image:
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content") || null,
    type:
      document
        .querySelector('meta[property="og:type"]')
        ?.getAttribute("content") || null,
    url:
      document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute("content") || null,
  },
  twitter: {
    card:
      document
        .querySelector('meta[name="twitter:card"]')
        ?.getAttribute("content") || null,
    title:
      document
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute("content") || null,
    description:
      document
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute("content") || null,
    image:
      document
        .querySelector('meta[name="twitter:image"]')
        ?.getAttribute("content") || null,
  },
}));

const headings = await page.$$eval("h1,h2,h3,h4,h5,h6", (els) =>
  els.map((e) => ({ tag: e.tagName, text: e.textContent?.trim() })),
);
const imagesWithoutAlt = await page.$$eval("img", (imgs) =>
  imgs
    .filter((i) => !i.getAttribute("alt") || i.getAttribute("alt") === "")
    .map((i) => i.getAttribute("src") || ""),
);
const links = await page.$$eval("a[href]", (as) =>
  as.map((a) => (a as HTMLAnchorElement).href),
);

const linkStatuses = await Promise.all(
  links.map(async (href) => {
    try {
      const res = await fetch(href, { method: "HEAD" });
      return { href, status: res.status };
    } catch (e) {
      return { href, status: "error" };
    }
  }),
);
const brokenLinks = linkStatuses.filter((l) =>
  typeof l.status === "number" ? l.status >= 400 : true,
);

const require = createRequire(import.meta.url);
await page.addScriptTag({ path: require.resolve("axe-core") });
const axe = await page.evaluate(async () => await (window as any).axe.run());
await fs.promises.writeFile(
  path.join(outDir, "axe.json"),
  JSON.stringify(axe, null, 2),
);

await browser.close();
spinner.succeed(`Page analysed`);

const dom = new JSDOM(snapshot);
const h1Count = dom.window.document.querySelectorAll("h1").length;

async function runLighthouse(kind: "mobile" | "desktop") {
  const chrome = await launch({ chromeFlags: ["--headless"] });
  const opts = {
    port: chrome.port,
    output: "json",
    logLevel: "silent",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  } as any;
  const config = {
    extends: "lighthouse:default",
    settings: {
      formFactor: kind,
      screenEmulation:
        kind === "mobile"
          ? {
              mobile: true,
              width: 360,
              height: 640,
              deviceScaleFactor: 2,
              disabled: false,
            }
          : {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
    },
  };
  const result = await lighthouse(url, opts, config);
  await chrome.kill();
  const lhr = result.lhr;
  await fs.promises.writeFile(
    path.join(lhDir, `${kind}.json`),
    JSON.stringify(lhr, null, 2),
  );
  return {
    performance: lhr.categories.performance.score * 100,
    accessibility: lhr.categories.accessibility.score * 100,
    bestPractices: lhr.categories["best-practices"].score * 100,
    seo: lhr.categories.seo.score * 100,
    lcp: lhr.audits["largest-contentful-paint"]?.numericValue,
    cls: lhr.audits["cumulative-layout-shift"]?.numericValue,
    inp:
      lhr.audits["interaction-to-next-paint"]?.numericValue ??
      lhr.audits["experimental-interaction-to-next-paint"]?.numericValue,
  };
}

const lighthouseResults = {
  mobile: await runLighthouse("mobile"),
  desktop: await runLighthouse("desktop"),
};

const robotsUrl = new URL("/robots.txt", url).href;
const sitemapUrl = new URL("/sitemap.xml", url).href;
const robotsRes = await fetch(robotsUrl);
const sitemapRes = await fetch(sitemapUrl);
let robotsFound = robotsRes.ok;
let sitemapFound = sitemapRes.ok;
if (!robotsFound) {
  const robotsContent = `User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap.xml", url).href}\n`;
  await fs.promises.writeFile(path.join(fixesDir, "robots.txt"), robotsContent);
}
let parsedSitemap: any = null;
if (sitemapFound) {
  const text = await sitemapRes.text();
  try {
    parsedSitemap = new XMLParser().parse(text);
  } catch (e) {
    sitemapFound = false;
  }
}
if (!sitemapFound) {
  const date = new Date().toISOString();
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${url}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`;
  await fs.promises.writeFile(
    path.join(fixesDir, "sitemap.xml"),
    sitemapContent,
  );
}

const headFixParts: string[] = [];
if (!head.viewport)
  headFixParts.push(
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
  );
if (!head.canonical)
  headFixParts.push(`<link rel="canonical" href="${url}" />`);
if (!head.description)
  headFixParts.push('<meta name="description" content="" />');
if (!head.og.title)
  headFixParts.push('<meta property="og:title" content="" />');
if (!head.og.description)
  headFixParts.push('<meta property="og:description" content="" />');
if (!head.og.image)
  headFixParts.push(
    '<meta property="og:image" content="https://assistjur.com.br/og-image.jpg" />',
  );
if (!head.og.type)
  headFixParts.push('<meta property="og:type" content="website" />');
if (!head.og.url)
  headFixParts.push(`<meta property="og:url" content="${url}" />`);
if (!head.twitter.card)
  headFixParts.push(
    '<meta name="twitter:card" content="summary_large_image" />',
  );
if (!head.twitter.title)
  headFixParts.push('<meta name="twitter:title" content="" />');
if (!head.twitter.description)
  headFixParts.push('<meta name="twitter:description" content="" />');
if (!head.twitter.image)
  headFixParts.push(
    '<meta name="twitter:image" content="https://assistjur.com.br/og-image.jpg" />',
  );
const headFix = prettier.format(headFixParts.join("\n"), { parser: "html" });
await fs.promises.writeFile(path.join(fixesDir, "head.html"), headFix);

const auditData = {
  url,
  head,
  headings,
  h1Unique: h1Count === 1,
  imagesWithoutAlt,
  brokenLinks,
  lighthouse: lighthouseResults,
  axe: { violations: axe.violations },
  robots: { found: robotsFound, status: robotsRes.status },
  sitemap: { found: sitemapFound, status: sitemapRes.status },
};

const AuditSchema = z.object({
  url: z.string().url(),
  head: z.any(),
  headings: z.array(z.object({ tag: z.string(), text: z.string().nullable() })),
  h1Unique: z.boolean(),
  imagesWithoutAlt: z.array(z.string()),
  brokenLinks: z.array(z.object({ href: z.string(), status: z.any() })),
  lighthouse: z.object({
    mobile: z.any(),
    desktop: z.any(),
  }),
  axe: z.object({ violations: z.any() }),
  robots: z.object({ found: z.boolean(), status: z.number().nullable() }),
  sitemap: z.object({ found: z.boolean(), status: z.number().nullable() }),
});

AuditSchema.parse(auditData);

await fs.promises.writeFile(
  path.join(outDir, "audit.json"),
  JSON.stringify(auditData, null, 2),
);

const topAxe = axe.violations
  .slice(0, 10)
  .map((v: any) => `- ${v.id}: ${v.help}`)
  .join("\n");
const md = `# Web Audit for ${url}\n\n## Lighthouse Scores\n\n| Device | Performance | Accessibility | Best Practices | SEO |\n| --- | --- | --- | --- | --- |\n| Mobile | ${lighthouseResults.mobile.performance} | ${lighthouseResults.mobile.accessibility} | ${lighthouseResults.mobile.bestPractices} | ${lighthouseResults.mobile.seo} |\n| Desktop | ${lighthouseResults.desktop.performance} | ${lighthouseResults.desktop.accessibility} | ${lighthouseResults.desktop.bestPractices} | ${lighthouseResults.desktop.seo} |\n\n## Accessibility (top issues)\n${topAxe}\n\n## Broken Links\n${brokenLinks.map((b) => `- ${b.href} (${b.status})`).join("\n")}\n`;

await fs.promises.writeFile(path.join(outDir, "audit.md"), md);

console.log(chalk.green(`Audit complete. Files written to ${outDir}`));
