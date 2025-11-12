/**
 * K6 Load Test: /employees/docs/
 * 
 * PROFILES:
 * - profile_15: ~15 RPS
 * - profile_30: ~30 RPS
 * 
 * RUN:
 * k6 run --env PROFILE=profile_15 employees_docs_load.js
 * k6 run --env PROFILE=profile_30 employees_docs_load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Environment Configuration
const BASE_URL = 'https://platform.moya-smena.ru/api/superapp/v1';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Custom Metrics
const apiErrors = new Rate('api_errors');
const apiResponseTime = new Trend('api_response_time', true);

// Load Profiles
const PROFILES = {
  profile_15: { vus: 20, duration: '5m' },  // ~15 RPS
  profile_30: { vus: 28, duration: '5m' },  // ~30 RPS
};

const selectedProfile = PROFILES[__ENV.PROFILE] || PROFILES.profile_15;

export const options = {
  scenarios: {
    employees_docs: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: selectedProfile.vus },
        { duration: selectedProfile.duration, target: selectedProfile.vus },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.01'],
    'api_errors': ['rate<0.01'],
    'api_response_time': ['p(95)<2000'],
  },
};

function getAPIHeaders() {
  return {
    'Authorization': `Token ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export function setup() {
  const authStatus = AUTH_TOKEN ? '✓ Auth enabled' : '✗ No auth token';
  console.log(`[SETUP] ${authStatus}`);
  console.log(`[SETUP] Profile: ${__ENV.PROFILE || 'profile_15'} (${selectedProfile.vus} VUs)`);
  console.log(`[SETUP] Target: ${BASE_URL}/employees/docs/`);
}

export default function () {
  const params = { headers: getAPIHeaders() };
  
  const response = http.get(`${BASE_URL}/employees/docs/`, params);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  apiErrors.add(!success);
  apiResponseTime.add(response.timings.duration);
  
  if (response.status !== 200) {
    console.log(`❌ employees/docs: status ${response.status} - ${response.status_text}`);
  }
  
  sleep(1);
}

export function teardown(data) {
  console.log('[TEARDOWN] Test completed');
}

