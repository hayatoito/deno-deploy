// Usage: deno run --allow-all run-bench.ts --browser ~/src/chrome1/src/out/Default/chrome [--port xxxx]

import {
  Browser,
  default as puppeteer,
  Page,
} from "https://deno.land/x/puppeteer@14.1.1/mod.ts";
import { parse } from "https://deno.land/std@0.141.0/flags/mod.ts";

// import { Page } from "puppeteer";

declare global {
  interface Window {
    lcpResult: number | null;
    lcpElement: any;
  }
}

// [[file:~/src/github/sxg-rs/playground/src/client/evaluated.ts::export function setupObserver() {]]
function setupPerformanceObserver() {
  window.lcpResult = null;
  // TODO: Check whether we can use npm package `web-vitals` here.
  // The `web-vitals` package not only adds the performance observer, but also
  // [handles](https://github.com/GoogleChrome/web-vitals/blob/ed70ed4b56d3f0573da7ca8ec324e630a04beaf2/src/getLCP.ts#L64-L66)
  // some user input DOM event.
  const observer = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lastEntry = entries[entries.length - 1]!;
    if (lastEntry.entryType === "largest-contentful-paint") {
      window.lcpResult = lastEntry.startTime;
      window.lcpElement = lastEntry.element;
    }
  });
  observer.observe({ type: "largest-contentful-paint", buffered: true });
}

function getPerformanceObserverResult() {
  return {
    lcpResult: window.lcpResult,
    lcpElement: window.lcpElement,
  };
}

// Measures LCP of the given URL in an existing Chrome tab (page).
async function measureLcp({
  page,
  url,
}: {
  page: Page;
  url: string;
}) {
  // await setupPage(page, emulationOptions);
  // page.goto(getSearchResultPageUrl(url, sxgOuterUrl));
  await page.evaluateOnNewDocument(setupPerformanceObserver);
  await page.goto(url, { waitUntil: "networkidle0" });

  const lcp = await page.evaluate(getPerformanceObserverResult);
  // console.log(`lcp ${lcp}`);
  console.log(lcp);
  return lcp.lcpResult;
}

// Opens a new Chrome tab (page), and measures the LCP of given URL.
async function createPageAndMeasureLcp({
  browser,
  url,
}: {
  browser: Browser;
  url: string;
}): Promise<number | null> {
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();
  await client.send("Network.clearBrowserCookies");
  await client.send("Network.clearBrowserCache");
  await client.detach();
  const lcpResult = await measureLcp({
    page,
    url,
  });
  await page.close();
  return lcpResult;
}

// from: ~/src/github/sxg-rs/playground/src/client/statistics.ts
interface EstimatedValue {
  mean: number;
  uncertainty: number;
}

function sum(values: number[]): number {
  return values.reduce((r, x) => r + x, 0);
}

// Given a set of repeated measurements, calculates mean value and error bar.
function estimateMeasurements(values: number[]): EstimatedValue {
  const mean = sum(values) / values.length;
  const stddev = Math.sqrt(
    sum(values.map((x) => (x - mean) ** 2)) / values.length,
  );
  return {
    mean,
    uncertainty: stddev / Math.sqrt(values.length - 1),
  };
}

function formatEstimatedValue(x: EstimatedValue): string {
  return `${x.mean.toFixed(0)} ± ${x.uncertainty.toFixed(0)}`;
}

// [[file:~/src/github/sxg-rs/playground/src/client/index.ts::async function statisticallyEstimateLcp({]]
async function statisticallyEstimateLcp({
  browser,
  repeatTime,
  url,
}: {
  browser: Browser;
  repeatTime: number;
  url: string;
}): Promise<EstimatedValue> {
  const values: number[] = [];
  console.log(`Measuring LCP of ${url}`);
  for (let i = 0; i < repeatTime; i += 1) {
    const current = await createPageAndMeasureLcp({
      browser,
      url,
    });

    if (repeatTime > 1) {
      console.log(`LCP ${i + 1} / ${repeatTime}: ${current?.toFixed(0)}`);
    }
    if (current !== null) {
      values.push(current);
    }
  }
  return estimateMeasurements(values);
}

async function main() {
  const args = parse(Deno.args);

  const executablePath = args.browser;
  if (!executablePath) {
    console.error("--browser [path] must be specified");
    Deno.exit(1);
  }

  const repeatTime = args.repeatTime || 100;

  const launch_options = {
    executablePath,
    args: (args._ ?? []) as string[],
  };

  console.log(`browser launch options: ${JSON.stringify(launch_options)}`);
  const browser = await puppeteer.launch(launch_options);

  // await run("basic", browser, "https://www.amazon.com/dp/B0933BVK6T/");

  const url = "https://www.amazon.com/dp/B0933BVK6T/";

  const lcp = await statisticallyEstimateLcp({
    browser,
    repeatTime,
    url,
  });

  console.log(`LCP ${formatEstimatedValue(lcp)}`);

  await browser.close();
}

await main();

// [2022-11-16 Wed] deno doesn't finish. Call exit explicitly.
Deno.exit(0);
