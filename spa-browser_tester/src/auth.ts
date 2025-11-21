import 'dotenv/config';
import { chromium } from 'playwright';
import path from 'path';
import readline from 'readline';
import { ensureDir } from './utils.js';

function waitForEnter(message: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const headless = String(process.env.HEADLESS || 'true') !== 'false';
  const storagePath = process.env.HH_STORAGE_STATE || 'auth/hh.storage.json';

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Откроется страница hh.ru. Введите логин и пароль вручную.');
  await page.goto('https://hh.ru/', { waitUntil: 'domcontentloaded' });

  // Даем пользователю время завершить авторизацию.
  // По окончании нужно вернуться в терминал и нажать Enter.
  await waitForEnter('После успешной авторизации вернитесь в терминал и нажмите Enter...');

  // Дополнительная проверка: ищем любой признак авторизации,
  // но не считаем это обязательным (получим предупреждение).
  try {
    await page.waitForSelector('a[data-qa=\"mainmenu_applicantProfile\"], [data-qa=\"account-menu\"]', { timeout: 10_000 });
  } catch {
    console.warn('Предупреждение: не удалось автоматически найти элемент профиля. Если вы уверены, что залогинены, продолжим сохранение.');
  }

  ensureDir(path.dirname(storagePath));
  await context.storageState({ path: storagePath });
  console.log(`Состояние сессии сохранено в ${storagePath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

