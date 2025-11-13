# Универсальный Endpoint Test

Тестирование любого endpoint одним скриптом.

## Быстрый старт

```bash
k6 run --env AUTH_TOKEN=<токен> --env ENDPOINT=<путь> endpoint_load_test.js
```

## Параметры

| Параметр | Значение | Описание |
|----------|----------|----------|
| `AUTH_TOKEN` | токен | Обязательный. Token авторизации |
| `ENDPOINT` | путь | Обязательный. Например: `/employees/me/` |
| `API_VERSION` | `v1`/`v2` | Опционально. По умолчанию `v1` |
| `PROFILE` | `profile_15`/`profile_30` | Опционально. По умолчанию `profile_15` |

## Профили

- `profile_15` → 20 VUs (sleep 1s) → ~15 RPS (7 минут)
- `profile_30` → 32 VUs (sleep 0.9s) → ~25 RPS (7 минут) **⚠️ Ограничено Rate Limiter'ом**

## Примеры запуска

```bash
# /employees/me/ (API v2) - 15 RPS
k6 run --env AUTH_TOKEN=<токен> --env ENDPOINT=/employees/me/ --env API_VERSION=v2 --env PROFILE=profile_15 endpoint_load_test.js

# /employees/me/ (API v2) - 30 RPS
k6 run --env AUTH_TOKEN=<токен> --env ENDPOINT=/employees/me/ --env API_VERSION=v2 --env PROFILE=profile_30 endpoint_load_test.js

# /employees/addresses/ - 15 RPS
k6 run --env AUTH_TOKEN=<токен> --env ENDPOINT=/employees/addresses/ --env PROFILE=profile_15 endpoint_load_test.js

# /employees/docs/ - 30 RPS
k6 run --env AUTH_TOKEN=<токен> --env ENDPOINT=/employees/docs/ --env PROFILE=profile_30 endpoint_load_test.js
```

## Примечания

- Длительность: 7 минут (1м ramp-up + 5м load + 1м ramp-down)
- **profile_30 ограничен 25 RPS** - сервер блокирует запросы (429 Too Many Requests) при более высокой нагрузке
- Для достижения >25 RPS необходимо обратиться к backend команде для увеличения лимитов Rate Limiter
- Можно тестировать любой endpoint

