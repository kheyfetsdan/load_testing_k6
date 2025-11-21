import 'dotenv/config';
import { chromium, BrowserContext, Page, Request } from 'playwright';
import fs from 'fs';
import { nowIso } from './utils.js';
import type { ScenarioMetrics, PageMetric } from './types.js';

type NavTarget = {
  key: string;
  url: string;
};

function extractPerfTimings(page: Page): Promise<Partial<PageMetric>> {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const lcpEntry = (performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[])[0] as any;
    const result: any = {};
    if (nav) {
      result.ttfbMs = nav.responseStart;
      result.domContentLoadedMs = nav.domContentLoadedEventEnd;
      result.loadEventEndMs = nav.loadEventEnd;
    }
    if (lcpEntry && typeof lcpEntry.startTime === 'number') {
      result.lcpMs = lcpEntry.startTime;
    }
    return result;
  });
}

async function measureNavigation(context: BrowserContext, target: NavTarget): Promise<PageMetric> {
  const page = await context.newPage();
  const start = Date.now();

  // Перехват первого ответа для оценки TTFB в случае SPA-навигации
  let firstResponseTime: number | undefined;
  const onRequest: (req: Request) => void = (req) => {
    if (!firstResponseTime && req.resourceType() === 'document') {
      firstResponseTime = Date.now();
    }
  };
  page.on('request', onRequest);

  await page.goto(target.url, { waitUntil: 'domcontentloaded' });
  // Ждём стабилизацию сети/рендеринга для SPA (можно варьировать)
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

  const baseMetrics = await extractPerfTimings(page);
  const metric: PageMetric = {
    name: target.key,
    startTimeMs: start,
    durationMs: Date.now() - start,
    ...baseMetrics,
  };

  await page.close();
  return metric;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runScenarioOnce(browserParam?: { browser?: import('playwright').Browser }): Promise<ScenarioMetrics> {
  const baseUrl = process.env.SPA_BASE_URL || 'https://web-superapp.moya-smena.ru';
  const initialState = process.env.MY_SHIFTS_INITIAL_STATE || 'active';
  const storagePath = process.env.HH_STORAGE_STATE || 'auth/hh.storage.json';
  const headless = String(process.env.HEADLESS || 'true') !== 'false';
  const userAgent =
    process.env.USER_AGENT ||
    'SpaTesterBot/1.0 (+https://web-superapp.moya-smena.ru; contact=load-testing@moya-smena.ru)';

  const browser = browserParam?.browser || await chromium.launch({ headless });
  const context = fs.existsSync(storagePath)
    ? await browser.newContext({ storageState: storagePath, userAgent })
    : await browser.newContext({ userAgent });

  const startedAt = nowIso();
  const pages: Record<string, PageMetric> = {};
  const errors: string[] = [];

  const targetsAll: NavTarget[] = [
    { key: 'home',       url: `${baseUrl}/` },
    { key: 'search',     url: `${baseUrl}/search` },
    { key: 'favourites', url: `${baseUrl}/favourites` },
    { key: 'my-shifts',  url: `${baseUrl}/my-shifts/${encodeURIComponent(initialState)}` },
    { key: 'profile',    url: `${baseUrl}/profile` },
  ];

  const scenarioType = process.env.SCENARIO || 'all-pages';

  if (scenarioType === 'home-search-main') {
    // 🔹 Сценарий: home → search → пауза → main
    const home: NavTarget   = { key: 'home', url: `${baseUrl}/` };
    const search: NavTarget = { key: 'search', url: `${baseUrl}/search` };
    const main: NavTarget   = { key: 'main', url: `${baseUrl}/main` };

    // Старт замера сценария
    const scenarioStartMs = Date.now();

    try {
      pages[home.key] = await measureNavigation(context, home);
    } catch (e) {
      errors.push(`${home.key}: ${(e as Error).message}`);
    }

    try {
      pages[search.key] = await measureNavigation(context, search);
    } catch (e) {
      errors.push(`${search.key}: ${(e as Error).message}`);
    }

    // Пауза 1 секунда между search и main
    await delay(1000);

    try {
      pages[main.key] = await measureNavigation(context, main);
    } catch (e) {
      errors.push(`${main.key}: ${(e as Error).message}`);
    }

    // 📏 Общее время сценария home → search → пауза → main
    const scenarioDurationMs = Date.now() - scenarioStartMs;

    pages['scenario-home-search-main'] = {
      name: 'scenario-home-search-main',
      startTimeMs: scenarioStartMs,
      durationMs: scenarioDurationMs,
      // Можно не заполнять ttfb/domContentLoaded/lcp — они опциональны
    };

  } else {
    // 🔹 Старое поведение: обходим все таргеты по отдельности
const pageKey = process.env.PAGE_KEY?.trim();
  const targets: NavTarget[] = pageKey
    ? targetsAll.filter((t) => t.key === pageKey)
    : targetsAll;

  if (pageKey && targets.length === 0) {
    throw new Error(`Неизвестное значение PAGE_KEY="${pageKey}". Доступны: home, search, favourites, my-shifts, profile.`);
  }

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    try {
      pages[t.key] = await measureNavigation(context, t);
    } catch (e) {
      errors.push(`${t.key}: ${(e as Error).message}`);
    } finally {
      if (i < targets.length - 1) {
        await delay(1000);
      }
    }
  }
  }


  const endedAt = nowIso();
  await context.close();
  if (!browserParam?.browser) {
    await browser.close();
  }

  return { iterationId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, startedAt, endedAt, pages, errors: errors.length ? errors : undefined };
}

if (process.argv[1]?.includes('scenario.ts')) {
  runScenarioOnce()
    .then((m) => console.log(JSON.stringify(m, null, 2)))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

