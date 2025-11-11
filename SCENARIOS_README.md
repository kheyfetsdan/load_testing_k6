# Отдельные сценарии нагрузочного тестирования

Три отдельных K6 скрипта для изолированного тестирования каждого сценария.

## 1. User Profile Load Test

**Файл:** `user_profile_load.js`

**Что тестирует:** Загрузка профиля пользователя
- app-config
- employees/me
- employees/me/addresses
- employees/me/docs

**Профили:**
- `profile_30` - 40 VUs → ~30 RPS
- `profile_50` - 70 VUs → ~50 RPS

**Запуск:**
```bash
k6 run --env PROFILE=profile_30 user_profile_load.js
k6 run --env PROFILE=profile_50 user_profile_load.js
```

**С сохранением результатов:**
```bash
k6 run --env PROFILE=profile_30 --out json=results/user-profile-30-$(date +%Y%m%d-%H%M%S).json user_profile_load.js
k6 run --env PROFILE=profile_50 --out json=results/user-profile-50-$(date +%Y%m%d-%H%M%S).json user_profile_load.js
```

---

## 2. Search Shifts Load Test

**Файл:** `search_shifts_load.js`

**Что тестирует:** Поиск открытых смен
- shifts/open/quick-filters
- shifts/open/days-counters
- shifts/open (today)
- shifts/open (tomorrow)

**Профили:**
- `profile_30` - 50 VUs → ~30 RPS
- `profile_50` - 85 VUs → ~50 RPS

**Запуск:**
```bash
k6 run --env PROFILE=profile_30 search_shifts_load.js
k6 run --env PROFILE=profile_50 search_shifts_load.js
```

**С сохранением результатов:**
```bash
k6 run --env PROFILE=profile_30 --out json=results/search-shifts-30-$(date +%Y%m%d-%H%M%S).json search_shifts_load.js
k6 run --env PROFILE=profile_50 --out json=results/search-shifts-50-$(date +%Y%m%d-%H%M%S).json search_shifts_load.js
```

---

## 3. Static Resources Load Test

**Файл:** `static_resources_load.js`

**Что тестирует:** Загрузка статических ресурсов
- main.dart.js
- flutter_bootstrap.js
- manifest.json
- FontManifest.json
- canvaskit.js

**Профили:**
- `profile_30` - 15 VUs → ~30 RPS
- `profile_50` - 25 VUs → ~50 RPS

**Запуск:**
```bash
k6 run --env PROFILE=profile_30 static_resources_load.js
k6 run --env PROFILE=profile_50 static_resources_load.js
```

**С сохранением результатов:**
```bash
k6 run --env PROFILE=profile_30 --out json=results/static-resources-30-$(date +%Y%m%d-%H%M%S).json static_resources_load.js
k6 run --env PROFILE=profile_50 --out json=results/static-resources-50-$(date +%Y%m%d-%H%M%S).json static_resources_load.js
```

---

## Сравнение нагрузки

| Сценарий | Профиль 30 RPS | Профиль 50 RPS | Запросов на итерацию |
|----------|----------------|----------------|----------------------|
| User Profile | 40 VUs | 70 VUs | 4 запроса |
| Search Shifts | 50 VUs | 85 VUs | 4 запроса |
| Static Resources | 15 VUs | 25 VUs | 5 запросов (batch) |

## Кастомный токен авторизации

```bash
k6 run --env PROFILE=profile_30 -e AUTH_TOKEN="Token YOUR_TOKEN" user_profile_load.js
k6 run --env PROFILE=profile_30 -e AUTH_TOKEN="Token YOUR_TOKEN" search_shifts_load.js
```

Статические ресурсы не требуют авторизации.

