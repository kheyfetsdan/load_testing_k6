import fs from 'fs';
import path from 'path';
import { percentile, writeJson } from './utils.js';
import type { SummaryReport, SummaryStats } from './types.js';

function summarize(values: number[]): SummaryStats {
  if (values.length === 0) {
    return { count: 0, avg: 0, p50: 0, p90: 0, p95: 0, min: 0, max: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg: sum / sorted.length,
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Укажите путь к NDJSON с результатами, например: results/metrics-123.ndjson');
    process.exit(2);
  }

  const content = fs.readFileSync(input, 'utf-8').trim().split('\n');
  const byPage: Record<string, Record<string, number[]>> = {};

  for (const line of content) {
    if (!line) continue;
    let obj: any;
    try { obj = JSON.parse(line); } catch { continue; }
    const pages = obj?.pages || {};
    for (const [rawKey, metric] of Object.entries<any>(pages)) {
      const key = rawKey === 'home' ? 'main' : rawKey;
      byPage[key] = byPage[key] || {};
      const push = (name: string, v?: number) => {
        if (typeof v === 'number' && Number.isFinite(v)) {
          (byPage[key][name] = byPage[key][name] || []).push(v);
        }
      };
      push('durationMs', metric.durationMs);
      push('ttfbMs', metric.ttfbMs);
      push('domContentLoadedMs', metric.domContentLoadedMs);
      push('loadEventEndMs', metric.loadEventEndMs);
      push('lcpMs', metric.lcpMs);
    }
  }

  const report: SummaryReport = { byPage: {} };
  for (const [page, fields] of Object.entries(byPage)) {
    const entry: any = {};
    for (const [name, arr] of Object.entries(fields)) {
      entry[name] = summarize(arr as number[]);
    }
    report.byPage[page] = entry;
  }

  const outPath = path.join(path.dirname(input), path.basename(input).replace(/\.ndjson$/, '.summary.json'));
  writeJson(outPath, report);
  console.log(`Сводный отчёт записан в ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

