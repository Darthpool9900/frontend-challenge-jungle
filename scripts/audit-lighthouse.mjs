import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baseURL = process.env.AUDIT_BASE_URL || "http://127.0.0.1:4173";
const output = "lighthouse-reports";
mkdirSync(output, { recursive: true });

const median = (values) => {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
};

const results = [];

for (const target of [
  { route: "/", name: "home" },
  { route: "/nft/nft-001", name: "detail" },
]) {
  for (const profile of ["mobile", "desktop"]) {
    const readings = [];

    for (let run = 1; run <= 3; run++) {
      const prefix = join(output, `${target.name}-${profile}-${run}`);
      const url = new URL(target.route, baseURL).toString();
      const args = [
        "--yes",
        "lighthouse@12",
        url,
        "--quiet",
        "--chrome-flags=--headless --no-sandbox",
        "--only-categories=performance,accessibility,best-practices,seo",
        "--output=json",
        "--output=html",
        `--output-path=${prefix}`,
      ];

      if (profile === "desktop") {
        args.push("--preset=desktop");
      }

      console.log(`Auditando ${target.name} ${profile} — execução ${run}/3`);
      const result = spawnSync("npx", args, {
        stdio: "inherit",
        shell: process.platform === "win32",
      });

      if (result.status !== 0) {
        throw new Error(
          `Lighthouse falhou para ${prefix}. Confirme que npm run preview está ativo.`,
        );
      }

      const report = JSON.parse(readFileSync(`${prefix}.report.json`, "utf8"));
      const score = (key) =>
        Math.round((report.categories[key]?.score ?? 0) * 100);
      const numeric = (key) => report.audits[key]?.numericValue ?? null;

      readings.push({
        performance: score("performance"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        seo: score("seo"),
        lcpMs: numeric("largest-contentful-paint"),
        cls: numeric("cumulative-layout-shift"),
        tbtMs: numeric("total-blocking-time"),
      });
    }

    const summary = Object.fromEntries(
      Object.keys(readings[0]).map((key) => [
        key,
        median(
          readings.map((entry) => entry[key]).filter((value) => value !== null),
        ),
      ]),
    );

    results.push({
      page: target.name,
      profile,
      median: summary,
      runs: readings,
    });
  }
}

writeFileSync(
  join(output, "summary.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      baseURL,
      nodeVersion: process.version,
      lighthousePackage: "lighthouse@12",
      results,
    },
    null,
    2,
  ),
);

console.table(
  results.map(({ page, profile, median: m }) => ({
    page,
    profile,
    perf: m.performance,
    a11y: m.accessibility,
    practices: m.bestPractices,
    seo: m.seo,
  })),
);
