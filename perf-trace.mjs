import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const URL = process.env.PERF_URL ?? "http://127.0.0.1:5173/?level=zodiac-10&perfdiag=1&nomonsters=1&god=1&cameraratio=0.75";
const OUT = process.env.PERF_TRACE_OUT ?? "perf-trace.json";
const SPEED = Number(process.env.PERF_SPEED ?? 14);

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const client = await page.context().newCDPSession(page);
  const chunks = [];

  client.on("Tracing.dataCollected", (event) => {
    chunks.push(...event.value);
  });

  const tracingComplete = new Promise((resolve) => {
    client.on("Tracing.tracingComplete", resolve);
  });

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__cannonballPerf), null, { timeout: 10000 });
  await page.evaluate(() => window.__cannonballPerf.startGame());
  await page.waitForTimeout(100);

  await client.send("Tracing.start", {
    transferMode: "ReportEvents",
    categories: [
      "devtools.timeline",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.frame",
      "disabled-by-default-v8.cpu_profiler",
      "toplevel",
      "blink",
      "gpu",
    ].join(","),
  });

  await page.evaluate((speed) => window.__cannonballPerf.startLongMove(speed), SPEED);
  await page.waitForFunction(() => window.__cannonballPerf.longMoveStatus().finished, null, { timeout: 30000 });
  const move = await page.evaluate(() => window.__cannonballPerf.longMoveStatus());

  await client.send("Tracing.end");
  await tracingComplete;
  await writeFile(OUT, JSON.stringify({ traceEvents: chunks, metadata: { url: URL, speed: SPEED, move } }), "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(`moveElapsed=${move.elapsedMs}ms distance=${move.distanceTraveled}m events=${chunks.length}`);

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
