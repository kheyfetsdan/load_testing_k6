/**
 * K6 Load Testing - Search Shifts Scenario
 * Тестирует поиск открытых смен (quick-filters, days-counters, shifts/open)
 * 
 * Профили:
 * - profile_30: ~30 RPS (50 VUs, 7 минут)
 * - profile_50: ~50 RPS (85 VUs, 7 минут)
 * 
 * Запуск:
 * k6 run --env PROFILE=profile_30 search_shifts_load.js
 * k6 run --env PROFILE=profile_50 search_shifts_load.js
 * 
 * С сохранением результатов:
 * k6 run --env PROFILE=profile_30 --out json=results/search-shifts-30-$(date +%Y%m%d-%H%M%S).json search_shifts_load.js
 * k6 run --env PROFILE=profile_50 --out json=results/search-shifts-50-$(date +%Y%m%d-%H%M%S).json search_shifts_load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// =============================================================================
// КОНФИГУРАЦИЯ
// =============================================================================

const BASE_URL = 'https://platform.moya-smena.ru/api/superapp/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Token 35d0b7f7ad199dafff76c52731d8646ebef161fb';

const LOCATION = {
  lat: 55.889471,
  lon: 37.6547987,
};

// =============================================================================
// CUSTOM METRICS
// =============================================================================

const apiErrorRate = new Rate('api_errors');
const apiDuration = new Trend('api_response_time');

// =============================================================================
// K6 OPTIONS
// =============================================================================

export const options = {
  stages: __ENV.PROFILE === 'profile_30'
    ? [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '2m', target: 0 },
      ]
    : [ // profile_50 (default)
        { duration: '2m', target: 85 },
        { duration: '3m', target: 85 },
        { duration: '2m', target: 0 },
      ],

  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
    'checks': ['rate>0.90'],
    'api_errors': ['rate<0.05'],
    'api_response_time': ['p(95)<2000'],
  },

  userAgent: 'k6-load-test/1.0',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

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

function getAPIHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN,
  };
}

function checkAPIResponse(response, endpointName) {
  const result = check(response, {
    [`${endpointName}: status is 200`]: (r) => r.status === 200,
    [`${endpointName}: response time < 2000ms`]: (r) => r.timings.duration < 2000,
    [`${endpointName}: has body`]: (r) => r.body.length > 0,
  });

  apiErrorRate.add(response.status !== 200);
  apiDuration.add(response.timings.duration);

  return result;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export default function() {
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
  sleep(0.8);

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
  sleep(0.8);

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
  sleep(0.8);

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

  sleep(2.5);
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

export function setup() {
  console.log('🚀 Search Shifts Load Test');
  console.log(`📊 Profile: ${__ENV.PROFILE || 'profile_50'}`);
  console.log(`🌍 Location: lat=${LOCATION.lat}, lon=${LOCATION.lon}`);
  console.log(`🔐 Auth: ${AUTH_TOKEN ? 'Token configured ✓' : 'No token'}`);
  
  const response = http.get(`${BASE_URL}/app-config/`, {
    headers: getAPIHeaders(),
  });
  
  if (response.status !== 200) {
    throw new Error(`Service is not available. Status: ${response.status}`);
  }
  
  console.log('✅ Service is available');
  return { startTime: new Date() };
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`\n✅ Test completed in ${duration.toFixed(2)} seconds`);
}

