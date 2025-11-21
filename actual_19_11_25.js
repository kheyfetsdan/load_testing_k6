/**
 * K6 Load Testing - Quick Start Example
 * 
 * Этот файл демонстрирует базовую структуру K6 теста
 * для сервиса web-superapp.moya-smena.ru
 * 
 * Доступные профили:
 * - test:   1 VU,  30 секунд  (быстрая проверка работоспособности)
 * - smoke:  5 VUs, 1 минута   (проверка базовой функциональности)
 * - medium: 35 VUs, 9 минут   (средняя нагрузка ~16 RPS)
 * - high:   67 VUs, 9 минут   (повышенная нагрузка ~30 RPS)
 * - load:   75 VUs, 9 минут   (обычная нагрузка ~47 RPS) - по умолчанию
 * - heavy:  75 VUs, 9 минут   (усиленная нагрузка ~87 RPS, sleep уменьшен в 2 раза)
 * - stress: 200 VUs, 15 минут (поиск пределов производительности ~126 RPS)
 * 
 * Запуск:
 * k6 run --env PROFILE=test QUICK_START_EXAMPLE.js
 * k6 run --env PROFILE=smoke QUICK_START_EXAMPLE.js
 * k6 run --env PROFILE=medium QUICK_START_EXAMPLE.js
 * k6 run --env PROFILE=high QUICK_START_EXAMPLE.js
 * k6 run --env PROFILE=load QUICK_START_EXAMPLE.js
 * k6 run --env PROFILE=heavy QUICK_START_EXAMPLE.js
 * k6 run --env PROFILE=stress QUICK_START_EXAMPLE.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// =============================================================================
// КОНФИГУРАЦИЯ
// =============================================================================

const BASE_URL = 'https://platform.moya-smena.ru/api/superapp/v1';
const BASE_URL_2 = 'https://platform.moya-smena.ru/api/superapp/v2';
const STATIC_BASE_URL = 'https://web-superapp.moya-smena.ru';

// Токен авторизации
// Можно передать через переменную окружения: k6 run -e AUTH_TOKEN="Token ..." script.js
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Token 35d0b7f7ad199dafff76c52731d8646ebef161fb';

// Параметры для API запросов
const LOCATION = {
  lat: 55.889471,
  lon: 37.6547987,
};

// =============================================================================
// PROFILE CONFIGURATION
// =============================================================================

// Множитель для sleep - для aggressive профиля уменьшаем sleep в 2 раза
const SLEEP_MULTIPLIER = __ENV.PROFILE === 'heavy' ? 0.5 : 1;

// =============================================================================
// CUSTOM METRICS
// =============================================================================

const apiErrorRate = new Rate('api_errors');
const apiDuration = new Trend('api_response_time');

// =============================================================================
// K6 OPTIONS
// =============================================================================

export const options = {
  // Выбор профиля через env: k6 run --env PROFILE=test script.js
  stages: __ENV.PROFILE === 'test'
    ? [
        { duration: '30s', target: 1 },
      ]
    : __ENV.PROFILE === 'smoke' 
    ? [
        { duration: '1m', target: 5 },
      ]
    : __ENV.PROFILE === 'medium'
    ? [
        { duration: '2m', target: 35 },
        { duration: '5m', target: 35 },
        { duration: '2m', target: 0 },
      ]
    : __ENV.PROFILE === 'high'
    ? [
        { duration: '2m', target: 67 },
        { duration: '5m', target: 67 },
        { duration: '2m', target: 0 },
      ]
    : __ENV.PROFILE === 'heavy'
    ? [
        { duration: '2m', target: 75 },
        { duration: '5m', target: 75 },
        { duration: '2m', target: 0 },
      ]
    : __ENV.PROFILE === 'stress'
    ? [
        { duration: '3m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 0 },
      ]
    : [ // default: load test
        { duration: '2m', target: 75 },
        { duration: '5m', target: 75 },
        { duration: '2m', target: 0 },
      ],

  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.95'],
    'api_errors': ['rate<0.01'],
    'api_response_time': ['p(95)<500'],
  },

  userAgent: 'k6-load-test/1.0',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Генерирует текущую дату в формате YYYY-MM-DD
 */
function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Генерирует дату через N дней в формате YYYY-MM-DD
 */
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

/**
 * Создает URL с query параметрами
 * K6 не поддерживает URL API, поэтому строим URL вручную
 */
function buildURL(baseUrl, path, params = {}) {
  let url = baseUrl + path;
  const queryParams = [];
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    }
  });
  
  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
  
  return url;
}

/**
 * Стандартные заголовки для API запросов
 */
function getAPIHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'LoadTestingK6',
    'Authorization': AUTH_TOKEN,
	'x-app-platform': 'web',
  };
}

/**
 * Стандартные заголовки для статических ресурсов
 */
function getStaticHeaders() {
  return {
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    'Accept-Encoding': 'gzip, deflate, br',
  };
}

/**
 * Выполняет проверки для API ответа
 */
function checkAPIResponse(response, endpointName) {
  const result = check(response, {
    [`${endpointName}: status is 200`]: (r) => r.status === 200,
    [`${endpointName}: response time < 500ms`]: (r) => r.timings.duration < 500,
    [`${endpointName}: has body`]: (r) => r.body.length > 0,
  });

  if (response.status !== 200) {
    console.log(`❌ ${endpointName}: status ${response.status} - ${response.status_text}`);
  }

  // Записываем метрики
  apiErrorRate.add(response.status !== 200);
  apiDuration.add(response.timings.duration);

  return result;
}

// =============================================================================
// SCENARIOS
// =============================================================================

/**
 * Сценарий 1: Загрузка конфигурации и данных пользователя
 */
function userProfileScenario() {
  const params = { headers: getAPIHeaders() };

  // 1. Получаем конфигурацию приложения
  // let response = http.get(`${BASE_URL}/app-config/`, params);
  // checkAPIResponse(response, 'app-config');
  // sleep(0.5 * SLEEP_MULTIPLIER);

  // 2. Получаем данные пользователя
  let response = http.get(`${BASE_URL_2}/employees/me/`, params);
  checkAPIResponse(response, 'employees-me');
  sleep(0.5 * SLEEP_MULTIPLIER);

  // 3. Получаем адреса пользователя
  response = http.get(`${BASE_URL}/employees/me/addresses/`, params);
  checkAPIResponse(response, 'employees-addresses');
  sleep(0.5 * SLEEP_MULTIPLIER);

  // 4. Получаем документы пользователя
  response = http.get(`${BASE_URL}/employees/me/docs/`, params);
  checkAPIResponse(response, 'employees-docs');
}

/**
 * Сценарий 2: Поиск открытых смен
 */
function searchShiftsScenario() {
  const params = { headers: getAPIHeaders() };
  const today = getToday();
  const tomorrow = getFutureDate(1);
  const monthLater = getFutureDate(30);

  // 1. Получаем быстрые фильтры
  const quickFiltersUrl = buildURL(BASE_URL, '/shifts/open/quick-filters/', {
    start_date: today,
    end_date: monthLater,
    lat: LOCATION.lat,
    lon: LOCATION.lon,
  });
  let response = http.get(quickFiltersUrl, params);
  checkAPIResponse(response, 'quick-filters');
  sleep(1 * SLEEP_MULTIPLIER);

  // 2. Получаем счетчики по дням
  const countersUrl = buildURL(BASE_URL, '/shifts/open/days-counters/', {
    start_date: today,
    end_date: monthLater,
    lat: LOCATION.lat,
    lon: LOCATION.lon,
    page: 1,
    page_size: 38,
  });
  response = http.get(countersUrl, params);
  checkAPIResponse(response, 'days-counters');
  sleep(1 * SLEEP_MULTIPLIER);

  // 3. Получаем открытые смены на сегодня
  const shiftsUrl = buildURL(BASE_URL, '/shifts/open/', {
    start_date: today,
    end_date: today,
    page: 1,
    ordering: 'is_recommended',
    lat: LOCATION.lat,
    lon: LOCATION.lon,
  });
  response = http.get(shiftsUrl, params);
  checkAPIResponse(response, 'shifts-open-today');
  sleep(1 * SLEEP_MULTIPLIER);

  // 4. Получаем открытые смены на завтра
  const shiftsTomorrowUrl = buildURL(BASE_URL, '/shifts/open/', {
    start_date: tomorrow,
    end_date: tomorrow,
    page: 1,
    ordering: 'is_recommended',
    lat: LOCATION.lat,
    lon: LOCATION.lon,
  });
  response = http.get(shiftsTomorrowUrl, params);
  checkAPIResponse(response, 'shifts-open-tomorrow');

}


/**
 * Сценарий 3: Загрузка статических ресурсов (выборочно)
 */
function loadStaticResourcesScenario() {
  const params = { headers: getStaticHeaders() };

  // Используем batch для параллельной загрузки
  const requests = [
    // JavaScript бандлы
    { 
      method: 'GET', 
      url: `${STATIC_BASE_URL}/main.dart.js`,
      params: params,
    },
    { 
      method: 'GET', 
      url: `${STATIC_BASE_URL}/flutter_bootstrap.js`,
      params: params,
    },
    // Конфиги
    { 
      method: 'GET', 
      url: `${STATIC_BASE_URL}/manifest.json`,
      params: params,
    },
    { 
      method: 'GET', 
      url: `${STATIC_BASE_URL}/assets/FontManifest.json`,
      params: params,
    },
    { 
      method: 'GET', 
      url: `${STATIC_BASE_URL}/canvaskit/chromium/canvaskit.js`,
      params: params,
    },
  ];

  const responses = http.batch(requests);

  // Проверяем каждый ответ
  responses.forEach((response, index) => {
    check(response, {
      [`static-resource-${index}: status is 200`]: (r) => r.status === 200,
      [`static-resource-${index}: response time < 1000ms`]: (r) => r.timings.duration < 1000,
    });
  });
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export default function() {
  // Имитируем реальное поведение пользователя
  
  // 1. Пользователь заходит на сайт и загружает свой профиль
  userProfileScenario();
  sleep(2 * SLEEP_MULTIPLIER);

  // 2. Пользователь ищет смены
  searchShiftsScenario();
  sleep(2 * SLEEP_MULTIPLIER);

  // 3. Загружаем статические ресурсы (не на каждой итерации)
  // В реальности они кэшируются браузером
  if (Math.random() < 0.1) { // 10% вероятность
    loadStaticResourcesScenario();
  }

  // Think time - пользователь читает информацию
  sleep(3 * SLEEP_MULTIPLIER);
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

export function setup() {
  console.log('🚀 Starting load test...');
  console.log(`📊 Profile: ${__ENV.PROFILE || 'load'}`);
  console.log(`🌍 Location: lat=${LOCATION.lat}, lon=${LOCATION.lon}`);
  console.log(`📅 Date: ${getToday()}`);
  console.log(`🔐 Auth: ${AUTH_TOKEN ? 'Token configured ✓' : 'No token'}`);
  
  // Можно добавить предварительную проверку доступности сервиса
  /* const response = http.get(`${BASE_URL}/app-config/`, {
    headers: getAPIHeaders(),
  });
  
  if (response.status !== 200) {
    throw new Error(`Service is not available. Status: ${response.status}`);
  }
  
  console.log('✅ Service is available'); */
  return { startTime: new Date() };
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`\n✅ Test completed`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*

═══════════════════════════════════════════════════════════════════════════════
БАЗОВЫЕ КОМАНДЫ (без сохранения результатов)
═══════════════════════════════════════════════════════════════════════════════

# Test Profile (1 VU, 30 seconds) - быстрая проверка работоспособности
k6 run --env PROFILE=test QUICK_START_EXAMPLE.js

# Smoke Test (5 VUs, 1 minute) - проверка базовой функциональности
k6 run --env PROFILE=smoke QUICK_START_EXAMPLE.js

# Medium Test (35 VUs, 9 minutes) - средняя нагрузка ~16 RPS
k6 run --env PROFILE=medium QUICK_START_EXAMPLE.js

# High Test (67 VUs, 9 minutes) - повышенная нагрузка ~30 RPS
k6 run --env PROFILE=high QUICK_START_EXAMPLE.js

# Load Test (75 VUs, 9 minutes total) - обычная нагрузка ~47 RPS
k6 run --env PROFILE=load QUICK_START_EXAMPLE.js

# Heavy Test (75 VUs, 9 minutes, sleep уменьшен в 2 раза) - усиленная нагрузка ~87 RPS
k6 run --env PROFILE=heavy QUICK_START_EXAMPLE.js

# Stress Test (up to 200 VUs, 15 minutes) - поиск пределов
k6 run --env PROFILE=stress QUICK_START_EXAMPLE.js

═══════════════════════════════════════════════════════════════════════════════
С СОХРАНЕНИЕМ РЕЗУЛЬТАТОВ (рекомендуется!)
═══════════════════════════════════════════════════════════════════════════════

# Test с сохранением (timestamp в имени)
k6 run --env PROFILE=test --out json=results/test-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# Smoke test с сохранением
k6 run --env PROFILE=smoke --out json=results/smoke-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# Medium test с сохранением
k6 run --env PROFILE=medium --out json=results/medium-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# High test с сохранением
k6 run --env PROFILE=high --out json=results/high-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# Load test с сохранением
k6 run --env PROFILE=load --out json=results/load-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# Heavy test с сохранением
k6 run --env PROFILE=heavy --out json=results/heavy-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# Stress test с сохранением
k6 run --env PROFILE=stress --out json=results/stress-$(date +%Y%m%d-%H%M%S).json QUICK_START_EXAMPLE.js

# Простое имя файла
k6 run --env PROFILE=test --out json=results/output.json QUICK_START_EXAMPLE.js

═══════════════════════════════════════════════════════════════════════════════
С КАСТОМНЫМ ТОКЕНОМ АВТОРИЗАЦИИ
═══════════════════════════════════════════════════════════════════════════════

# Test с кастомным токеном
k6 run --env PROFILE=test -e AUTH_TOKEN="Token YOUR_TOKEN_HERE" QUICK_START_EXAMPLE.js

# Load test с кастомным токеном и сохранением
k6 run --env PROFILE=load -e AUTH_TOKEN="Token YOUR_TOKEN_HERE" --out json=results/load.json QUICK_START_EXAMPLE.js

═══════════════════════════════════════════════════════════════════════════════
ДРУГИЕ ОПЦИИ
═══════════════════════════════════════════════════════════════════════════════

# Override VUs and duration
k6 run --vus 10 --duration 30s QUICK_START_EXAMPLE.js

# With InfluxDB output (if configured)
k6 run --out influxdb=http://localhost:8086/k6 QUICK_START_EXAMPLE.js

# Посмотреть сохраненные результаты
ls -lht results/*.json

# Анализ результатов (требует jq)
cat results/test-*.json | jq -r 'select(.type=="Point") | .metric' | sort -u

*/

