import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";

const BASE = process.env.PERF_BASE ?? "http://127.0.0.1:5173/";
const OUT = process.env.PERF_OUT ?? "perf-diagnose.json";
const SPEED = Number(process.env.PERF_SPEED ?? 14);
const STUTTER_MS = Number(process.env.PERF_STUTTER_MS ?? 50);

const CASES = [
  { name: "z10-world-scroll-full", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "0.75" } },
  { name: "z10-camera-scroll-full", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "0.75", scrollmode: "camera" } },
  { name: "z10-scroll-aa", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "0.75", aa: "1" } },
  { name: "z10-scroll-pixelratio2", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "0.75", pixelratio: "2" } },
  { name: "z10-no-scroll-full", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "1.125" } },
  { name: "z10-no-floor", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", nofloor: "1", cameraratio: "0.75" } },
  { name: "z10-no-obstacles", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", noobstacles: "1", cameraratio: "0.75" } },
  { name: "z10-no-floor-no-obstacles", params: { level: "zodiac-10", perfdiag: "1", nomonsters: "1", god: "1", nofloor: "1", noobstacles: "1", cameraratio: "0.75" } },
  { name: "campaign-first-room", params: { perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "0.75" } },
  { name: "z01-full", params: { level: "zodiac-01", perfdiag: "1", nomonsters: "1", god: "1", cameraratio: "0.75" } },
];

function buildUrl(params) {
  const url = new URL(BASE);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function installProbe(page) {
  await page.evaluate((stutterMs) => {
    const originalRAF = window.requestAnimationFrame;
    let lastTime = null;
    let enabled = false;
    const frames = [];

    window.requestAnimationFrame = function requestAnimationFrameProbe(callback) {
      return originalRAF.call(window, (time) => {
        if (enabled && lastTime !== null) {
          const ms = time - lastTime;
          if (ms > 0 && ms < 1000) frames.push(ms);
        }
        lastTime = time;
        callback(time);
      });
    };

    window.__perfFrameProbe = {
      reset() { frames.length = 0; lastTime = null; enabled = true; },
      stop() { enabled = false; },
      result() {
        const sorted = [...frames].sort((a, b) => b - a);
        const avg = frames.length ? frames.reduce((sum, ms) => sum + ms, 0) / frames.length : 0;
        const stutters = frames.filter((ms) => ms > stutterMs);
        return {
          frames: frames.length,
          avgMs: Number(avg.toFixed(2)),
          maxMs: Number((sorted[0] ?? 0).toFixed(2)),
          worst10: sorted.slice(0, 10).map((ms) => Number(ms.toFixed(1))),
          stutterThresholdMs: stutterMs,
          stutterCount: stutters.length,
          stutterMs: stutters.map((ms) => Number(ms.toFixed(1))),
        };
      },
    };
  }, STUTTER_MS);
}

async function runCase(browser, testCase) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const url = buildUrl(testCase.params);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__cannonballPerf), null, { timeout: 10000 });
  await installProbe(page);
  await page.evaluate(() => window.__cannonballPerf.startGame());
  await page.waitForTimeout(100);

  const route = await page.evaluate((speed) => {
    window.__perfFrameProbe.reset();
    return window.__cannonballPerf.startLongMove(speed);
  }, SPEED);

  await page.waitForFunction(() => window.__cannonballPerf.longMoveStatus().finished, null, { timeout: 30000 });
  const result = await page.evaluate(() => {
    window.__perfFrameProbe.stop();
    return {
      move: window.__cannonballPerf.longMoveStatus(),
      frames: window.__perfFrameProbe.result(),
    };
  });
  await page.close();

  return { name: testCase.name, url, route, ...result };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const testCase of CASES) {
    const result = await runCase(browser, testCase);
    results.push(result);
    console.log(`${result.name}: max=${result.frames.maxMs}ms stutters=${result.frames.stutterCount} worst=${JSON.stringify(result.frames.worst10.slice(0, 5))}`);
  }
  await browser.close();

  const report = {
    createdAt: new Date().toISOString(),
    speed: SPEED,
    stutterThresholdMs: STUTTER_MS,
    results,
  };
  await writeFile(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
