import { readFile } from "node:fs/promises";

const TRACE = process.env.PERF_TRACE_IN ?? "perf-trace.json";
const MIN_MS = Number(process.env.PERF_MIN_MS ?? 8);
const TOP = Number(process.env.PERF_TOP ?? 40);

function classify(event) {
  const name = event.name ?? "";
  const cat = event.cat ?? "";
  const thread = event.__thread ?? "";
  if (/ThreadPool_RunTask/.test(name)) return "threadpool";
  if (/GpuVSyncThread/.test(thread)) return "gpu-vsync";
  if (/v8|V8|EvaluateScript|FunctionCall|RunTask|TimerFire|EventDispatch/.test(name) || /v8/.test(cat)) return "js";
  if (/Layout|RecalculateStyles|Paint|Composite|UpdateLayer|PrePaint|HitTest/.test(name)) return "layout-paint";
  if (/DrawFrame|BeginFrame|FireAnimationFrame|RequestAnimationFrame|AnimationFrame/.test(name)) return "frame";
  if (/WebGL|GL|Gpu|GPU|Raster|Texture|Shader|Program/.test(name) || /gpu|cc|viz/.test(cat)) return "gpu-compositor";
  if (/MinorGC|MajorGC|GC/.test(name)) return "gc";
  return "other";
}

function eventMs(event) {
  return typeof event.dur === "number" ? event.dur / 1000 : 0;
}

function location(event) {
  const data = event.args?.data ?? {};
  const stack = data.stackTrace ?? data.stack ?? event.args?.beginData?.stackTrace;
  const top = Array.isArray(stack) ? stack[0] : undefined;
  if (top?.url) return `${top.url}:${top.lineNumber ?? "?"}:${top.columnNumber ?? "?"}`;
  if (data.url) return `${data.url}:${data.lineNumber ?? "?"}`;
  return "";
}

const raw = JSON.parse(await readFile(TRACE, "utf8"));
const events = raw.traceEvents ?? raw;
const processNames = new Map();
const threadNames = new Map();
for (const event of events) {
  if (event.ph !== "M") continue;
  if (event.name === "process_name") processNames.set(event.pid, event.args?.name ?? "");
  if (event.name === "thread_name") threadNames.set(`${event.pid}:${event.tid}`, event.args?.name ?? "");
}
const complete = events
  .filter((event) => event.ph === "X" && eventMs(event) >= MIN_MS)
  .map((event) => {
    const thread = threadNames.get(`${event.pid}:${event.tid}`) ?? "";
    return {
      name: event.name,
      cat: event.cat,
      ms: Number(eventMs(event).toFixed(2)),
      pid: event.pid,
      tid: event.tid,
      cls: classify({ ...event, __thread: thread }),
      loc: location(event),
      process: processNames.get(event.pid) ?? "",
      thread,
    };
  })
  .sort((a, b) => b.ms - a.ms);

const summary = new Map();
for (const event of complete) {
  const current = summary.get(event.cls) ?? { count: 0, totalMs: 0, maxMs: 0 };
  current.count += 1;
  current.totalMs += event.ms;
  current.maxMs = Math.max(current.maxMs, event.ms);
  summary.set(event.cls, current);
}

console.log(`Trace: ${TRACE}`);
console.log(`Events >= ${MIN_MS}ms: ${complete.length}`);
console.log("\n=== By Class ===");
for (const [cls, item] of [...summary.entries()].sort((a, b) => b[1].totalMs - a[1].totalMs)) {
  console.log(`${cls.padEnd(14)} count=${String(item.count).padStart(4)} total=${item.totalMs.toFixed(1)}ms max=${item.maxMs.toFixed(1)}ms`);
}

console.log(`\n=== Top ${TOP} Events ===`);
for (const event of complete.slice(0, TOP)) {
  const loc = event.loc ? ` ${event.loc}` : "";
  const thread = event.thread || `${event.pid}:${event.tid}`;
  console.log(`${String(event.ms).padStart(7)}ms  ${event.cls.padEnd(14)} ${thread} ${event.name}${loc}`);
}

console.log("\n=== By Thread ===");
const byThread = new Map();
for (const event of complete) {
  const key = event.thread || `${event.pid}:${event.tid}`;
  const current = byThread.get(key) ?? { count: 0, totalMs: 0, maxMs: 0 };
  current.count += 1;
  current.totalMs += event.ms;
  current.maxMs = Math.max(current.maxMs, event.ms);
  byThread.set(key, current);
}
for (const [thread, item] of [...byThread.entries()].sort((a, b) => b[1].totalMs - a[1].totalMs).slice(0, 20)) {
  console.log(`${thread.padEnd(48)} count=${String(item.count).padStart(4)} total=${item.totalMs.toFixed(1)}ms max=${item.maxMs.toFixed(1)}ms`);
}

console.log("\n=== Renderer Main Thread Events ===");
for (const event of complete.filter((item) => /CrRendererMain|RendererMain|CrBrowserMain/.test(item.thread)).slice(0, TOP)) {
  const loc = event.loc ? ` ${event.loc}` : "";
  console.log(`${String(event.ms).padStart(7)}ms  ${event.thread} ${event.name}${loc}`);
}
