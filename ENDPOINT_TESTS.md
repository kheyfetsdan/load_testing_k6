# Individual Endpoint Load Tests

Три отдельных нагрузочных теста для индивидуальных endpoint'ов.

## Тесты

### 1. employees_me_load.js
Endpoint: `/employees/me/` (API v2)

```bash
# 15 RPS (20 VUs, 5 минут)
k6 run --env PROFILE=profile_15 employees_me_load.js

# 30 RPS (28 VUs, 5 минут)
k6 run --env PROFILE=profile_30 employees_me_load.js
```

### 2. employees_addresses_load.js
Endpoint: `/employees/addresses/`

```bash
# 15 RPS (20 VUs, 5 минут)
k6 run --env PROFILE=profile_15 employees_addresses_load.js

# 30 RPS (28 VUs, 5 минут)
k6 run --env PROFILE=profile_30 employees_addresses_load.js
```

### 3. employees_docs_load.js
Endpoint: `/employees/docs/`

```bash
# 15 RPS (20 VUs, 5 минут)
k6 run --env PROFILE=profile_15 employees_docs_load.js

# 30 RPS (28 VUs, 5 минут)
k6 run --env PROFILE=profile_30 employees_docs_load.js
```

## Примечания

- Все тесты требуют AUTH_TOKEN в переменных окружения
- profile_30 использует 28 VUs (не 40) чтобы избежать Rate Limiter (429 ошибки)
- Длительность теста: 7 минут (1м ramp-up + 5м load + 1м ramp-down)

