/**
 * K6 Load Testing - Static Resources Scenario
 * Тестирует загрузку статических ресурсов (JS, JSON, fonts, canvaskit)
 * 
 * Профили:
 * - profile_30: ~30 RPS (15 VUs, 7 минут)
 * - profile_50: ~50 RPS (25 VUs, 7 минут)
 * 
 * Запуск:
 * k6 run --env PROFILE=profile_30 static_resources_load.js
 * k6 run --env PROFILE=profile_50 static_resources_load.js
 * 
 * С сохранением результатов:
 * k6 run --env PROFILE=profile_30 --out json=results/static-resources-30-$(date +%Y%m%d-%H%M%S).json static_resources_load.js
 * k6 run --env PROFILE=profile_50 --out json=results/static-resources-50-$(date +%Y%m%d-%H%M%S).json static_resources_load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// =============================================================================
// КОНФИГУРАЦИЯ
// =============================================================================

const STATIC_BASE_URL = 'https://web-superapp.moya-smena.ru';

// =============================================================================
// CUSTOM METRICS
// =============================================================================

const staticErrorRate = new Rate('static_errors');

// =============================================================================
// K6 OPTIONS
// =============================================================================

export const options = {
  stages: __ENV.PROFILE === 'profile_30'
    ? [
        { duration: '2m', target: 15 },
        { duration: '3m', target: 15 },
        { duration: '2m', target: 0 },
      ]
    : [ // profile_50 (default)
        { duration: '2m', target: 25 },
        { duration: '3m', target: 25 },
        { duration: '2m', target: 0 },
      ],

  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.95'],
    'static_errors': ['rate<0.01'],
  },

  userAgent: 'k6-load-test/1.0',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getStaticHeaders() {
  return {
    'Accept': '*/*',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    'Accept-Encoding': 'gzip, deflate, br',
  };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

export default function() {
  const params = { headers: getStaticHeaders() };

  // Используем batch для параллельной загрузки (имитация браузера)
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
    const passed = check(response, {
      [`static-resource-${index}: status is 200`]: (r) => r.status === 200,
      [`static-resource-${index}: response time < 1000ms`]: (r) => r.timings.duration < 1000,
      [`static-resource-${index}: has body`]: (r) => r.body && r.body.length > 0,
    });

    staticErrorRate.add(response.status !== 200);
  });

  sleep(2);
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

export function setup() {
  console.log('🚀 Static Resources Load Test');
  console.log(`📊 Profile: ${__ENV.PROFILE || 'profile_50'}`);
  console.log(`🌐 Base URL: ${STATIC_BASE_URL}`);
  
  const response = http.get(`${STATIC_BASE_URL}/manifest.json`, {
    headers: getStaticHeaders(),
  });
  
  if (response.status !== 200) {
    throw new Error(`Static resources not available. Status: ${response.status}`);
  }
  
  console.log('✅ Static resources are available');
  return { startTime: new Date() };
}

export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`\n✅ Test completed in ${duration.toFixed(2)} seconds`);
}

