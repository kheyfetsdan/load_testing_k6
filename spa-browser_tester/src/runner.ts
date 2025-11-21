import 'dotenv/config';
import path from 'path';
import { readEnvNumber, ensureDir, appendJsonLine, nowIso } from './utils.js';
import { runScenarioOnce } from './scenario.js';
import { chromium, Browser } from 'playwright';

type Job = () => Promise<void>;

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  const maxRps = readEnvNumber('MAX_RPS', 5);
  const durationSeconds = readEnvNumber('DURATION_SECONDS', 60);
  const maxConcurrency = readEnvNumber('MAX_CONCURRENCY', Math.max(1, maxRps));
  const resultsDir = process.env.RESULTS_DIR || 'results';
  const outFile = path.join(resultsDir, `metrics-${Date.now()}.ndjson`);
  ensureDir(resultsDir);

  console.log(`Старт нагрузочного прогона: ${nowIso()} | RPS<=${maxRps} | concurrency<=${maxConcurrency} | duration=${durationSeconds}s`);

  const endAt = Date.now() + durationSeconds * 1000;
  const intervalMs = Math.ceil(1000 / Math.max(1, maxRps));
  let inFlight = 0;
  let launched = 0;
  let sharedBrowser: Browser | undefined;

  const launchJob: Job = async () => {
    inFlight++;
    try {
      if (!sharedBrowser) {
        sharedBrowser = await chromium.launch({ headless: true });
      }
      const metrics = await runScenarioOnce({ browser: sharedBrowser });
      appendJsonLine(outFile, metrics);
    } catch (e) {
      appendJsonLine(outFile, { error: (e as Error).message, at: nowIso() });
    } finally {
      inFlight--;
    }
  };

  while (Date.now() < endAt) {
    // Ограничиваем конкуренцию
    if (inFlight >= maxConcurrency) {
      await sleep(10);
      continue;
    }
    // Ограничиваем порождаемые задания равномерным шагом
    void launchJob();
    launched++;
    await sleep(intervalMs);
  }

  // Дожидаемся завершения
  while (inFlight > 0) {
    await sleep(50);
  }

  console.log(`Завершено. Запущено сценариев: ${launched}. Результаты: ${outFile}`);

  if (sharedBrowser) {
    await sharedBrowser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

