export type PageMetric = {
  name: string;
  startTimeMs: number;
  durationMs: number;
  ttfbMs?: number;
  domContentLoadedMs?: number;
  loadEventEndMs?: number;
  lcpMs?: number;
};

export type ScenarioMetrics = {
  iterationId: string;
  startedAt: string;
  endedAt: string;
  pages: Record<string, PageMetric>;
  errors?: string[];
};

export type SummaryStats = {
  count: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  min: number;
  max: number;
};

export type SummaryReport = {
  byPage: Record<string, {
    durationMs: SummaryStats;
    ttfbMs?: SummaryStats;
    domContentLoadedMs?: SummaryStats;
    loadEventEndMs?: SummaryStats;
    lcpMs?: SummaryStats;
  }>;
};

