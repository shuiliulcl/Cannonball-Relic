import { chromium } from "playwright";

const URL = process.env.PERF_URL ?? "http://127.0.0.1:5173/?level=zodiac-10&perfdiag=1&nomonsters=1&god=1&cameraratio=0.75";
const SPEED = Number(process.env.PERF_SPEED ?? 14);
const STUTTER_MS = Number(process.env.PERF_STUTTER_MS ?? 50);
const SCREENSHOT = process.env.PERF_SCREENSHOT ?? "perf-longmove.png";
const HEADLESS = process.env.PERF_HEADLESS === "1";
const BROWSER_ARGS = (process.env.PERF_BROWSER_ARGS ?? "").split(/\s+/).filter(Boolean);

async function waitForPerfApi(page) {
  await page.waitForFunction(() => Boolean(window.__cannonballPerf), null, { timeout: 10000 });
}

async function installFrameProbe(page) {
  await page.evaluate((stutterMs) => {
    const previousProbe = window.__perfFrameProbe;
    if (previousProbe?.restore) previousProbe.restore();

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
      reset() {
        frames.length = 0;
        lastTime = null;
        enabled = true;
      },
      stop() {
        enabled = false;
      },
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
      restore() {
        window.requestAnimationFrame = originalRAF;
      },
    };
  }, STUTTER_MS);
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS, args: BROWSER_ARGS });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await waitForPerfApi(page);
  await installFrameProbe(page);

  await page.evaluate(() => window.__cannonballPerf.startGame());
  await page.waitForTimeout(100);

  const route = await page.evaluate((speed) => {
    window.__perfFrameProbe.reset();
    return window.__cannonballPerf.startLongMove(speed);
  }, SPEED);

  console.log("Long-move perf test started");
  console.log(`url=${URL}`);
  console.log(`headless=${HEADLESS} args=${JSON.stringify(BROWSER_ARGS)}`);
  console.log(`speed=${route.speed}`);
  console.log(`waypoints=${route.waypoints.map((p) => `(${p.x.toFixed(1)},${p.z.toFixed(1)})`).join(" -> ")}`);

  await page.waitForFunction(() => window.__cannonballPerf.longMoveStatus().finished, null, { timeout: 30000 });

  const result = await page.evaluate(() => {
    window.__perfFrameProbe.stop();
    return {
      move: window.__cannonballPerf.longMoveStatus(),
      frames: window.__perfFrameProbe.result(),
      diagnostics: window.__cannonballPerf.diagnostics(),
    };
  });

  await page.screenshot({ path: SCREENSHOT, fullPage: false });

  console.log("\n=== Long-Move Performance Results ===");
  console.log(`moveElapsed=${result.move.elapsedMs}ms  distance=${result.move.distanceTraveled}m`);
  console.log(`frames=${result.frames.frames}  avg=${result.frames.avgMs}ms  max=${result.frames.maxMs}ms`);
  console.log(`stutters(>${result.frames.stutterThresholdMs}ms)=${result.frames.stutterCount}`);
  console.log(`worst10=${JSON.stringify(result.frames.worst10)}`);
  console.log(`stutterValues=${JSON.stringify(result.frames.stutterMs)}`);
  console.log("\n=== Slowest Instrumented Frames ===");
  for (const frame of result.diagnostics.slice().sort((a, b) => b.frameMs - a.frameMs).slice(0, 8)) {
    console.log(
      `frame=${frame.frameMs}ms update=${frame.updateMs} sync=${frame.syncMs} effects=${frame.effectsMs} render=${frame.renderMs} ` +
      `draw=${frame.renderer.calls} tri=${frame.renderer.triangles} syncParts=${JSON.stringify(frame.syncParts)}`,
    );
  }
  console.log(`screenshot=${SCREENSHOT}`);

  await page.waitForTimeout(500);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
