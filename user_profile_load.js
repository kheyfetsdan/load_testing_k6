/**
 * K6 Load Testing - User Profile Scenario
 * Тестирует загрузку профиля пользователя (app-config, employees/me, addresses, docs)
 * 
 * Профили:
 * - profile_30: ~30 RPS (40 VUs, 7 минут)
 * - profile_50: ~50 RPS (70 VUs, 7 минут)
 * 
 * Запуск:
 * k6 run --env PROFILE=profile_30 user_profile_load.js
 * k6 run --env PROFILE=profile_50 user_profile_load.js
 * 
 * С сохранением результатов:
 * k6 run --env PROFILE=profile_30 --out json=results/user-profile-30-$(date +%Y%m%d-%H%M%S).json user_profile_load.js
 * k6 run --env PROFILE=profile_50 --out json=results/user-profile-50-$(date +%Y%m%d-%H%M%S).json user_profile_load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// =============================================================================
// КОНФИГУРАЦИЯ
// =============================================================================

const BASE_URL = 'https://platform.moya-smena.ru/api/superapp/v1';
const BASE_URL_V2 = 'https://platform.moya-smena.ru/api/superapp/v2';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Token 35d0b7f7ad199dafff76c52731d8646ebef161fb';

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
        { duration: '2m', target: 40 },
        { duration: '3m', target: 40 },
        { duration: '2m', target: 0 },
      ]
    : [ // profile_50 (default)
        { duration: '2m', target: 70 },
        { duration: '3m', target: 70 },
        { duration: '2m', target: 0 },
      ],

  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'],
    'checks': ['rate>0.90'],
    'api_errors': ['rate<0.05'],
    'api_response_time': ['p(95)<500'],
  },

  userAgent: 'k6-load-test/1.0',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
    [`${endpointName}: response time < 500ms`]: (r) => r.timings.duration < 500,
    [`${endpointName}: has body`]: (r) => r.body.length > 0,
  });

  // Логируем ошибки с кодами
  if (response.status !== 200) {
    console.log(`❌ ${endpointName}: status ${response.status} - ${response.status_text}`);
  }

  apiErrorRate.add(response.status !== 200);
  apiDuration.add(response.timings.duration);

  return result;
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export default function() {
  const params = { headers: getAPIHeaders() };

  // 1. Получаем конфигурацию приложения
  let response = http.get(`${BASE_URL}/app-config/`, params);
  checkAPIResponse(response, 'app-config');
  sleep(0.3);

  // 2. Получаем данные пользователя
  response = http.get(`${BASE_URL_V2}/employees/me/`, params);
  checkAPIResponse(response, 'employees-me');
  sleep(0.3);

  // 3. Получаем адреса пользователя
  response = http.get(`${BASE_URL}/employees/me/addresses/`, params);
  checkAPIResponse(response, 'employees-addresses');
  sleep(0.3);

  // 4. Получаем документы пользователя
  response = http.get(`${BASE_URL}/employees/me/docs/`, params);
  checkAPIResponse(response, 'employees-docs');

  sleep(2);
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

export function setup() {
  console.log('🚀 User Profile Load Test');
  console.log(`📊 Profile: ${__ENV.PROFILE || 'profile_50'}`);
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

