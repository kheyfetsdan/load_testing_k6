## SPA Browser Tester

Инструмент для нагрузочного тестирования и сбора метрик скорости загрузки страниц SPA.

### Цели
- Авторизация в hh.ru (ручной ввод), сохранение `storageState`.
- Прогон сценария по страницам SPA: `/`, `/search`, `/favourites`, `/my-shifts/:initialState`, `/profile`.
- Ограничение нагрузки до 5 RPS.
- Сбор метрик (duration, TTFB, DCL, Load, LCP) и сводный отчёт.

### Установка
```bash
cd /Users/romanshvetsov/py-projects/spa-browser-tester
npm i
npx playwright install --with-deps
```

### Конфигурация (.env)
```dotenv
HH_STORAGE_STATE=auth/hh.storage.json
SPA_BASE_URL=https://web-superapp.moya-smena.ru
MY_SHIFTS_INITIAL_STATE=active
MAX_RPS=5
MAX_CONCURRENCY=2
DURATION_SECONDS=60
HEADLESS=true
RESULTS_DIR=results
```

### Команды
- Авторизация в hh.ru (ручная):
```bash
npm run auth
```

- Одиночный прогон сценария и вывод метрик:
```bash
npm run scenario
```

- Нагрузочный прогон (пример на 20 секунд, RPS≤5):
```bash
DURATION_SECONDS=20 MAX_RPS=5 npm run run
```

- Генерация сводного отчёта:
```bash
npm run report -- results/metrics-<timestamp>.ndjson
```

### Результаты
- NDJSON с результатами: `results/metrics-*.ndjson`
- Сводка JSON: `results/metrics-*.summary.json`

### Примечания
- Если `HH_STORAGE_STATE` отсутствует, сценарий запустится без авторизации.
- Метрики LCP доступны не всегда, зависят от контента и браузера.
- Для снижения нагрузки на CPU используйте `MAX_CONCURRENCY` (ограничивает одновременные сценарии) и `HEADLESS=true`. Также помогает уменьшение `MAX_RPS`.

### Выполнение нагрузки страницы home 
$env:SCENARIO = "0"
$env:MAX_RPS = "5"
$env:MAX_CONCURRENCY = "5"
$env:DURATION_SECONDS = "120"
$env:PAGE_KEY = "home"
npm run run

### Выполнение нагрузки сценария. Переход на home -> search -> ожидание 1 секунда -> переход на home
$env:SCENARIO = "home-search-main"
$env:MAX_RPS = "5"
$env:MAX_CONCURRENCY = "5"
$env:DURATION_SECONDS = "120"
npm run run


