# Task Prompt: Нагрузочное тестирование web-superapp.moya-smena.ru с помощью K6

## Цель
Провести нагрузочное тестирование веб-приложения с Client-Side Rendering (CSR) для оценки производительности backend API и статических ресурсов.

## Целевой сервис
- **URL**: https://web-superapp.moya-smena.ru/
- **Архитектура**: Client-Side Rendering (CSR) на базе Flutter Web
- **Backend API**: https://platform.moya-smena.ru/api/superapp/v1/

## Инструмент тестирования
**K6** (https://k6.io/)

## Источник данных
HAR-файл с записанными запросами: `har/requests_for_load_testing.har`

## Требования к реализации

### 1. Backend API Endpoints для нагрузочного тестирования

Выбрать следующие критичные API endpoints для имитации пользовательского сценария:

#### Приоритет 1 - Критичные endpoints:
- `GET /api/superapp/v1/employees/me/` - получение данных текущего пользователя
- `GET /api/superapp/v1/shifts/open/?end_date={date}&start_date={date}&page=1&ordering=is_recommended&lat={lat}&lon={lon}` - поиск открытых смен
- `GET /api/superapp/v1/shifts/open/days-counters/?end_date={date}&start_date={date}&lat={lat}&lon={lon}&page=1&page_size=38` - счетчики смен по дням

#### Приоритет 2 - Дополнительные endpoints:
- `GET /api/superapp/v1/app-config/` - конфигурация приложения
- `GET /api/superapp/v1/employees/me/addresses/` - адреса пользователя
- `GET /api/superapp/v1/employees/me/docs/` - документы пользователя
- `GET /api/superapp/v1/doc_types/` - типы документов
- `GET /api/superapp/v1/shifts/open/quick-filters/?end_date={date}&start_date={date}&lat={lat}&lon={lon}` - быстрые фильтры

### 2. Статические ресурсы для тестирования

Выбрать следующие группы статических ресурсов:

#### JavaScript бандлы (критичные):
- `GET /main.dart.js` - основной JavaScript бандл приложения
- `GET /flutter_bootstrap.js` - bootstrap скрипт Flutter

#### WebAssembly модули:
- `GET /canvaskit/chromium/canvaskit.js` - CanvasKit JavaScript
- `GET /canvaskit/chromium/canvaskit.wasm` - CanvasKit WebAssembly

#### Конфигурационные файлы:
- `GET /manifest.json` - Web App Manifest
- `GET /assets/FontManifest.json` - манифест шрифтов

#### Шрифты (выборочно):
- `GET /assets/assets/fonts/onest/Onest-Regular.ttf` - основной шрифт
- `GET /assets/fonts/MaterialIcons-Regular.otf` - иконки Material

#### Иконки (выборочно 2-3 примера):
- `GET /assets/assets/icons/dashboard_tabs/home.svg`
- `GET /assets/assets/icons/pin.svg`

#### CDN ресурсы (опционально):
- `GET https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm` - Lottie анимации

### 3. HTTP заголовки

Оставить только необходимые заголовки для каждого типа запроса:

#### Для API запросов:
```
Accept: application/json
Content-Type: application/json (для POST/PUT)
User-Agent: k6-load-test
Authorization: Bearer {token} (если требуется)
```

#### Для статических ресурсов:
```
Accept: */* (или специфичный MIME-type)
User-Agent: k6-load-test
Accept-Encoding: gzip, deflate, br
```

#### Для HTML документов:
```
Accept: text/html,application/xhtml+xml,application/xml;q=0.9
User-Agent: k6-load-test
Accept-Encoding: gzip, deflate, br
```

### 4. Структура K6 скрипта

Создать следующие файлы:

#### `config/endpoints.js`
- Константы с URL endpoints
- Параметры запросов (координаты, даты)

#### `config/headers.js`
- Настройки заголовков для разных типов запросов

#### `scenarios/api-load-test.js`
- Сценарий нагрузки на Backend API
- Последовательность вызовов, имитирующая реальное поведение пользователя
- Проверки (checks) на статус коды и время ответа

#### `scenarios/static-resources-test.js`
- Сценарий загрузки статических ресурсов
- Проверки на корректность загрузки и кэширование

#### `main.js`
- Основной файл запуска тестов
- Конфигурация профилей нагрузки (stages)
- Метрики и thresholds

### 5. Профили нагрузки

Реализовать несколько профилей:

#### Smoke Test:
- 1-5 виртуальных пользователей
- Длительность: 1 минута
- Цель: проверка работоспособности

#### Load Test:
- Ramp-up: 0 → 50 пользователей (2 мин)
- Steady: 50 пользователей (5 мин)
- Ramp-down: 50 → 0 пользователей (2 мин)

#### Stress Test:
- Ramp-up: 0 → 100 пользователей (3 мин)
- Steady: 100 пользователей (5 мин)
- Ramp-up: 100 → 200 пользователей (3 мин)
- Steady: 200 пользователей (2 мин)
- Ramp-down: 200 → 0 пользователей (2 мин)

### 6. Метрики и проверки

Определить thresholds:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% запросов < 500ms
  http_req_failed: ['rate<0.01'],                  // Ошибок < 1%
  checks: ['rate>0.95'],                           // 95% проверок успешны
}
```

Добавить custom метрики:
- Время ответа API endpoints
- Размер загружаемых ресурсов
- Количество успешных/неуспешных запросов

### 7. Сценарий пользователя

Основной user flow для тестирования:

1. Загрузка главной страницы + статические ресурсы
2. Получение конфигурации приложения (`/app-config/`)
3. Авторизация/получение данных пользователя (`/employees/me/`)
4. Получение списка документов и адресов
5. Поиск открытых смен с фильтрами
6. Think time между запросами (1-3 секунды)

### 8. Требования к коду

- **Модульность**: разделить код на логические модули
- **Переиспользование**: вынести общие функции в utils
- **Конфигурируемость**: параметры в отдельных конфигах
- **Читаемость**: понятные имена переменных, комментарии
- **Отчетность**: использовать K6 Cloud или HTML отчеты

### 9. Исключения

**Не включать в нагрузочное тестирование:**
- Яндекс.Метрика (`mc.yandex.ru/*`)
- Сторонние аналитические сервисы
- Избыточные заголовки браузера (sec-ch-ua, dnt, priority и т.д.)
- Query параметры для аналитики
- Все иконки/шрифты (только выборочно 2-3 примера)

### 10. Результаты

Сохранять результаты в:
- JSON формат для последующего анализа
- HTML отчет для визуализации
- CSV для экспорта метрик

### 11. Дополнительные требования

- Параметризация дат и координат в запросах
- Имитация разных часовых поясов/локаций
- Возможность запуска с разными наборами данных
- Graceful shutdown и cleanup после тестов

## Структура проекта

```
LoadTestingK6/
├── har/
│   └── requests_for_load_testing.har
├── k6-tests/
│   ├── config/
│   │   ├── endpoints.js
│   │   ├── headers.js
│   │   └── test-data.js
│   ├── scenarios/
│   │   ├── api-load-test.js
│   │   └── static-resources-test.js
│   ├── utils/
│   │   ├── checks.js
│   │   └── helpers.js
│   └── main.js
├── results/
│   └── (будут создаваться автоматически)
└── README.md
```

## Критерии успеха

- ✅ Скрипты K6 запускаются без ошибок
- ✅ Покрыты все критичные API endpoints
- ✅ Реализованы 3 профиля нагрузки
- ✅ Thresholds настроены и работают
- ✅ Генерируются читаемые отчеты
- ✅ Код модульный и поддерживаемый
- ✅ Документация по запуску и настройке

## Команды для запуска

```bash
# Smoke test
k6 run --env PROFILE=smoke k6-tests/main.js

# Load test
k6 run --env PROFILE=load k6-tests/main.js

# Stress test
k6 run --env PROFILE=stress k6-tests/main.js

# С HTML отчетом
k6 run --out json=results/output.json k6-tests/main.js
```

---

**Примечание**: Перед запуском нагрузочного тестирования необходимо получить разрешение от владельцев сервиса и убедиться, что тестирование проводится в соответствующем окружении (staging/testing), а не в production.

