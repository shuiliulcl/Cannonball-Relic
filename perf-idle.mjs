import { chromium } from "playwright";

const URL = process.env.PERF_URL ?? "http://127.0.0.1:5173/?level=zodiac-10&perfdiag=1&nomonsters=1&god=1&cameraratio=0.75";
const DURATION_MS = Number(process.env.PERF_DURATION_MS ?? 5500);
const STUTTER_MS = Number(process.env.PERF_STUTTER_MS ?? 50);

async function main() {
  const browser = await chromium.launch({ headless: process.env.PERF_HEADLESS === "1" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.__cannonballPerf), null, { timeout: 10000 });

  await page.evaluate((stutterMs) => {
    const originalRAF = window.requestAnimationFrame;
    let lastTime = null;
    const frames = [];
    window.requestAnimationFrame = function requestAnimationFrameProbe(callback) {
      return originalRAF.call(window, (time) => {
        if (lastTime !== null) {
          const ms = time - lastTime;
          if (ms > 0 && ms < 1000) frames.push(ms);
        }
        lastTime = time;
        callback(time);
      });
    };
    window.__idleProbeResult = () => {
      const sorted = [...frames].sort((a, b) => b - a);
      const avg = frames.length ? frames.reduce((sum, ms) => sum + ms, 0) / frames.length : 0;
      const stutters = frames.filter((ms) => ms > stutterMs);
      return {
        frames: frames.length,
        avgMs: Number(avg.toFixed(2)),
        maxMs: Number((sorted[0] ?? 0).toFixed(2)),
        stutterCount: stutters.length,
        worst10: sorted.slice(0, 10).map((ms) => Number(ms.toFixed(1))),
      };
    };
  }, STUTTER_MS);

  await page.evaluate(() => window.__cannonballPerf.startGame());
  await page.waitForTimeout(DURATION_MS);
  const result = await page.evaluate(() => window.__idleProbeResult());
  console.log(`url=${URL}`);
  console.log(`duration=${DURATION_MS}ms frames=${result.frames} avg=${result.avgMs}ms max=${result.maxMs}ms stutters=${result.stutterCount}`);
  console.log(`worst10=${JSON.stringify(result.worst10)}`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
