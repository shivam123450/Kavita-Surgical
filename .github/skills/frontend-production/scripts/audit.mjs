#!/usr/bin/env node
// Pattern-based audit of a frontend codebase against the frontend-production skill.
// Each hit is a place to look, not proof of a bug.
//
// Usage: node audit.mjs [dir ...] [--all] [--json] [--include-tests] [--strict]
//   dir              folders to scan (default: src)
//   --all            list every location (default: 5 per rule, to keep output short)
//   --json           machine-readable output
//   --include-tests  also scan *.test.*, *.spec.*, stories, e2e/
//   --strict         exit 1 when any "must" rule has a hit (for CI)
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const roots = args.filter((a) => !a.startsWith("--"));
if (!roots.length) roots.push("src");
const SHOW = flags.has("--all") ? Infinity : 5;

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", ".nuxt", ".svelte-kit", "dist", "build", "out", "coverage",
  ".turbo", ".vercel", "storybook-static", "playwright-report", "test-results", "generated",
]);
const CODE = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte", ".astro", ".html"]);
const STYLE = new Set([".css", ".scss", ".sass", ".less"]);
const TS = new Set([".ts", ".tsx"]);
const TEST = /(\.|-)(test|spec|stories)\.[^.]+$|(^|[\\/])(e2e|__tests__|__mocks__)([\\/]|$)/;
const COMMENT = /^\s*(\/\/|\/\*|\*|\{\s*\/\*|<!--)/;
const OK = /audit-ok/;

// kind: which files a rule reads. line: matched per line. block: matched across the whole file.
// needs/unlessFile: file-level gates. unlessNear: skip when the next line matches (fallback pairs).
const RULES = [
  { id: "zoom-disabled", sev: "must", ref: "mobile-touch.md", kind: "code",
    msg: "Zoom disabled (maximum-scale / user-scalable). Remove it; fix iOS focus zoom with 16px fields",
    line: /maximum-scale|maximumScale\s*:|user-scalable\s*=\s*["']?(no|0)|userScalable\s*:\s*false/i },
  { id: "html-from-data", sev: "must", ref: "security.md", kind: "code",
    msg: "HTML injected into the DOM. Sanitize (DOMPurify) or use a sandboxed iframe (a constant script written in code is fine)",
    line: /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|document\.write\(|insertAdjacentHTML\(|\bv-html=|\{@html\b/,
    unlessContext: /__html:\s*[A-Z][A-Z0-9_]*\s*\}/ },
  { id: "code-from-data", sev: "must", ref: "security.md", kind: "code",
    msg: "Code built from strings (eval, new Function, string timers)",
    line: /\beval\(|new Function\(|set(Timeout|Interval)\(\s*["'`]/ },
  { id: "javascript-url", sev: "must", ref: "security.md", kind: "code",
    msg: "javascript: URL",
    line: /href\s*=\s*\{?\s*["'`]javascript:/i },
  { id: "token-in-storage", sev: "must", ref: "security.md", kind: "code",
    msg: "Token or secret written to web storage. Use HttpOnly cookies",
    line: /(local|session)Storage\.setItem\(\s*["'`][^"'`]*(token|jwt|secret|password|auth)/i },
  { id: "blank-without-rel", sev: "must", ref: "security.md", kind: "code",
    msg: 'target="_blank" without rel="noopener noreferrer"',
    block: /<a\b(?:=>|[^>])*?target\s*=\s*\{?\s*["']_blank["']\s*\}?(?:=>|[^>])*>/g, unlessMatch: /\brel\s*=/ },
  { id: "positive-tabindex", sev: "must", ref: "accessibility.md", kind: "code",
    msg: "Positive tabIndex breaks focus order. Use 0 or -1",
    line: /tabIndex\s*=\s*\{?\s*["']?[1-9]/i },
  { id: "img-without-alt", sev: "must", ref: "accessibility.md", kind: "code",
    msg: 'Image without alt (alt="" if decorative)',
    block: /<(img|Image)\b(?:=>|[^>])*>/g, unlessMatch: /\balt\s*=|\{\s*\.\.\./ },
  { id: "autofocus", sev: "review", ref: "mobile-touch.md", kind: "code",
    msg: "autoFocus opens the phone keyboard and loses to focus traps. Focus in an Effect when the pointer isn't coarse, or use the library's initial focus",
    line: /(?<![-\w])autofocus\b(?!\s*=\s*\{\s*false\s*\})/i },
  { id: "vh-without-fallback", sev: "review", ref: "mobile-touch.md", kind: "both",
    msg: "100vh is wrong on phones. Follow it with an svh/dvh line",
    line: /\b100vh\b/, unlessNear: /\b\d+(svh|dvh|lvh)\b/ },
  { id: "h-screen", sev: "review", ref: "mobile-touch.md", kind: "code",
    msg: "Tailwind h-screen/min-h-screen is 100vh. Prefer h-svh/min-h-svh (or dvh)",
    line: /\b(min-|max-)?h-screen\b/ },
  { id: "paste-blocked", sev: "review", ref: "forms.md", kind: "code",
    msg: "Paste appears to be blocked. Never block paste",
    line: /(onPaste|["']paste["'])[^\n]*preventDefault/ },
  { id: "clickable-non-control", sev: "review", ref: "accessibility.md", kind: "code",
    msg: "onClick on a div/span/li/td/tr. Use a button or link, or make it a mouse shortcut for one",
    block: /<(div|span|li|td|tr)\b(?:=>|[^>])*?\sonClick\s*=(?:=>|[^>])*>/g, unlessMatch: /\brole\s*=|aria-hidden/ },
  { id: "outline-removed", sev: "review", ref: "accessibility.md", kind: "both",
    msg: "Outline removed. Make sure a visible :focus-visible style replaces it",
    line: /outline\s*:\s*(none|0)\b|\boutline-none\b/ },
  { id: "transition-all", sev: "review", ref: "performance.md", kind: "both",
    msg: "transition: all. List the properties (transform, opacity)",
    line: /transition(-property)?\s*:\s*all\b|\btransition-all\b/ },
  { id: "listener-no-cleanup", sev: "review", ref: "memory.md", kind: "code",
    msg: "addEventListener with no removeEventListener or signal in this file",
    line: /\.addEventListener\(/, unlessFile: /removeEventListener\(|\bsignal\b|once\s*:\s*true/,
    needsFile: /useEffect|useLayoutEffect|onMounted|onMount\(|componentDidMount|ngOnInit/ },
  { id: "interval-no-clear", sev: "review", ref: "memory.md", kind: "code",
    msg: "setInterval with no clearInterval in this file",
    line: /\bsetInterval\(/, unlessFile: /clearInterval\(/ },
  { id: "observer-no-disconnect", sev: "review", ref: "memory.md", kind: "code",
    msg: "Observer with no disconnect() in this file",
    line: /new (Resize|Intersection|Mutation|Performance)Observer\(/, unlessFile: /\.disconnect\(/ },
  { id: "connection-no-close", sev: "review", ref: "memory.md", kind: "code",
    msg: "WebSocket/EventSource/BroadcastChannel/Worker with no close() or terminate() in this file",
    line: /new (WebSocket|EventSource|BroadcastChannel|Worker|SharedWorker)\(/, unlessFile: /\.close\(|\.terminate\(/ },
  { id: "object-url-not-revoked", sev: "review", ref: "memory.md", kind: "code",
    msg: "URL.createObjectURL with no revokeObjectURL in this file",
    line: /URL\.createObjectURL\(/, unlessFile: /URL\.revokeObjectURL\(/ },
  { id: "index-key", sev: "review", ref: "performance.md", kind: "code",
    msg: "Array index as key. Use the record's id for lists that can change (fine for fixed placeholders)",
    line: /key=\{\s*(i|idx|index|j)\s*\}|key=\{`\$\{\s*(i|idx|index)\s*\}`\}/,
    unlessContext: /Array\.from\(\s*\{\s*length|\bArray\(\s*\d+\s*\)|\(\s*_\w*\s*,\s*(i|idx|index|j)\s*\)/ },
  { id: "float-money", sev: "review", ref: "app-types/banking-payments.md", kind: "code",
    msg: "Floating-point maths near a money field. Use minor units or a decimal library",
    line: /\b(parseFloat|toFixed)\(/, alsoLine: /amount|price|balance|total|cost|fee|tax/i },
  { id: "any-type", sev: "review", ref: "react-patterns.md", kind: "ts",
    msg: "any. Use unknown and narrow it",
    line: /:\s*any\b(?!\w)|\bas\s+any\b|<any>|\bany\[\]/ },
  { id: "suppression", sev: "review", ref: "testing-and-delivery.md", kind: "code", inComments: true,
    msg: "Lint or type check suppressed. Fix the code or change the rule with a reason",
    line: /@ts-ignore|@ts-expect-error|@ts-nocheck|eslint-disable/ },
  { id: "console-log", sev: "review", ref: "memory.md", kind: "code",
    msg: "console.log/debug in committed code (can leak data and retain objects)",
    line: /\bconsole\.(log|debug)\(/ },
];

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) yield* walk(p); }
    else if (e.isFile()) yield p;
  }
}

function applies(rule, ext) {
  if (rule.kind === "code") return CODE.has(ext);
  if (rule.kind === "ts") return TS.has(ext);
  if (rule.kind === "both") return CODE.has(ext) || STYLE.has(ext);
  return false;
}

const hits = new Map(RULES.map((r) => [r.id, []]));
let scanned = 0;
const cwd = process.cwd();

for (const root of roots) {
  if (!existsSync(root)) { console.error(`Not found: ${root}`); continue; }
  const files = statSync(root).isDirectory() ? walk(root) : [root];
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!CODE.has(ext) && !STYLE.has(ext)) continue;
    if (!flags.has("--include-tests") && TEST.test(file)) continue;
    if (/\.d\.ts$|\.min\.(js|css)$/.test(file)) continue;
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }
    if (text.length > 2_000_000) continue;
    scanned++;
    const rel = relative(cwd, file).replaceAll("\\", "/");
    const lines = text.split(/\r?\n/);

    for (const rule of RULES) {
      if (!applies(rule, ext)) continue;
      if (rule.unlessFile && rule.unlessFile.test(text)) continue;
      if (rule.needsFile && !rule.needsFile.test(text)) continue;
      const out = hits.get(rule.id);
      if (rule.block) {
        for (const m of text.matchAll(rule.block)) {
          if (rule.unlessMatch && rule.unlessMatch.test(m[0])) continue;
          const lineNo = text.slice(0, m.index).split("\n").length;
          if (COMMENT.test(lines[lineNo - 1] ?? "") || OK.test(lines[lineNo - 1] ?? "") || OK.test(lines[lineNo - 2] ?? "")) continue;
          out.push(`${rel}:${lineNo}`);
        }
        continue;
      }
      lines.forEach((ln, i) => {
        if (!rule.inComments && COMMENT.test(ln)) return;
        if (!rule.line.test(ln)) return;
        if (rule.alsoLine && !rule.alsoLine.test(ln)) return;
        if (rule.unlessNear && (rule.unlessNear.test(ln) || rule.unlessNear.test(lines[i + 1] ?? ""))) return;
        if (rule.unlessContext && [lines[i - 2], lines[i - 1], ln].some((l) => l && rule.unlessContext.test(l))) return;
        if (OK.test(ln) || OK.test(lines[i - 1] ?? "")) return;
        out.push(`${rel}:${i + 1}`);
      });
    }
  }
}

const findings = RULES
  .map((r) => ({ rule: r.id, severity: r.sev, ref: `references/${r.ref}`, message: r.msg, count: hits.get(r.id).length, locations: hits.get(r.id) }))
  .filter((f) => f.count > 0)
  .sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === "must" ? -1 : 1));

const must = findings.filter((f) => f.severity === "must");

if (flags.has("--json")) {
  console.log(JSON.stringify({ scanned, roots, findings }, null, 2));
} else {
  console.log(`frontend-production audit: ${scanned} files scanned in ${roots.join(", ")}`);
  if (!findings.length) console.log("No hits. (A clean run is not proof the code is correct.)");
  for (const f of findings) {
    console.log(`\n${f.severity.toUpperCase()}  ${f.rule} (${f.count})  ${f.message}\n  see ${f.ref}`);
    for (const loc of f.locations.slice(0, SHOW)) console.log(`  ${loc}`);
    if (f.count > SHOW) console.log(`  … ${f.count - SHOW} more (--all to list)`);
  }
  const reviewCount = findings.length - must.length;
  console.log(`\n${must.length} must-fix rule(s), ${reviewCount} review rule(s). Hits are places to look, not proof of a bug.`);
}

if (!scanned) { console.error("No files scanned: pass the folders that hold the UI code (e.g. src, app, components)."); process.exit(2); }
if (flags.has("--strict") && must.length) process.exit(1);
