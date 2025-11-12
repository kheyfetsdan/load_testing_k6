# Universal Endpoint Load Test

Универсальный скрипт для нагрузочного тестирования любого endpoint.

## Использование

```bash
k6 run --env ENDPOINT=<путь> --env API_VERSION=<версия> --env PROFILE=<профиль> endpoint_load_test.js
```

### Параметры

- **ENDPOINT** (обязательный) - путь endpoint'а (например: `/employees/me/`)
- **API_VERSION** (опциональный) - версия API (`v1` или `v2`, по умолчанию `v1`)
- **PROFILE** (опциональный) - профиль нагрузки (`profile_15` или `profile_30`, по умолчанию `profile_15`)

### Профили

- **profile_15**: 20 VUs → ~15 RPS (5 минут)
- **profile_30**: 28 VUs → ~30 RPS (5 минут)

## Примеры

### /employees/me/ (API v2)

```bash
# 15 RPS
k6 run --env ENDPOINT=/employees/me/ --env API_VERSION=v2 --env PROFILE=profile_15 endpoint_load_test.js

# 30 RPS
k6 run --env ENDPOINT=/employees/me/ --env API_VERSION=v2 --env PROFILE=profile_30 endpoint_load_test.js
```

### /employees/addresses/

```bash
# 15 RPS
k6 run --env ENDPOINT=/employees/addresses/ --env PROFILE=profile_15 endpoint_load_test.js

# 30 RPS
k6 run --env ENDPOINT=/employees/addresses/ --env PROFILE=profile_30 endpoint_load_test.js
```

### /employees/docs/

```bash
# 15 RPS
k6 run --env ENDPOINT=/employees/docs/ --env PROFILE=profile_15 endpoint_load_test.js

# 30 RPS
k6 run --env ENDPOINT=/employees/docs/ --env PROFILE=profile_30 endpoint_load_test.js
```

## Примечания

- Требуется AUTH_TOKEN в переменных окружения
- profile_30 использует 28 VUs (не 40) чтобы избежать Rate Limiter (429 ошибки)
- Длительность теста: 7 минут (1м ramp-up + 5м load + 1м ramp-down)
- Можно тестировать любой endpoint, передав его через параметр ENDPOINT

