# Results Directory

Эта директория создана для хранения результатов нагрузочного тестирования K6.

## Что здесь будет храниться

После запуска тестов с параметром `--out` результаты будут сохранены здесь:

```bash
# JSON результаты
k6 run --out json=results/output.json ../QUICK_START_EXAMPLE.js

# Smoke test results
k6 run --env PROFILE=smoke --out json=results/smoke-test.json ../QUICK_START_EXAMPLE.js

# Load test results
k6 run --env PROFILE=load --out json=results/load-test.json ../QUICK_START_EXAMPLE.js

# Stress test results
k6 run --env PROFILE=stress --out json=results/stress-test.json ../QUICK_START_EXAMPLE.js
```

## Типы файлов

- `*.json` - Полные результаты тестирования в JSON формате
- `*.csv` - Метрики в CSV (если используется)
- `*.html` - HTML отчеты (если настроено)
- `*.txt` - Текстовые summary

## Анализ результатов

### Просмотр JSON
```bash
cat results/output.json | jq '.metrics'
```

### Основные метрики
```bash
cat results/output.json | jq '.metrics | keys'
```

### HTTP Request Duration
```bash
cat results/output.json | jq '.metrics.http_req_duration'
```

## Примечание

Эта директория добавлена в `.gitignore`, поэтому результаты тестов не будут коммититься в Git.

