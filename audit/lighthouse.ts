import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const argv = await yargs(hideBin(process.argv))
  .option("url", {
    type: "string",
    default: "https://assistjur.com.br/",
    demandOption: true,
  })
  .parse();

const url = argv.url as string;
const outDir = path.resolve("out/lighthouse");
await fs.promises.mkdir(outDir, { recursive: true });

async function run(kind: "mobile" | "desktop") {
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
    path.join(outDir, `${kind}.json`),
    JSON.stringify(lhr, null, 2),
  );
  return lhr.categories.performance.score * 100;
}

const mobileScore = await run("mobile");
const desktopScore = await run("desktop");

console.log("Lighthouse scores (Performance):", {
  mobile: mobileScore,
  desktop: desktopScore,
});
