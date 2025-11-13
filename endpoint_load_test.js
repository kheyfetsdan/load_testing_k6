/**
 * K6 Universal Endpoint Load Test
 * 
 * USAGE:
 * k6 run --env ENDPOINT=/employees/me/ --env API_VERSION=v2 --env PROFILE=profile_15 endpoint_load_test.js
 * k6 run --env ENDPOINT=/employees/addresses/ --env PROFILE=profile_30 endpoint_load_test.js
 * 
 * PARAMETERS:
 * - ENDPOINT: endpoint path (required, e.g. /employees/me/)
 * - API_VERSION: API version (optional, default: v1, options: v1, v2)
 * - PROFILE: load profile (optional, default: profile_15, options: profile_15, profile_30)
 * 
 * PROFILES:
 * - profile_15: ~15 RPS (20 VUs, sleep 1s, 5 minutes)
 * - profile_30: ~25 RPS (32 VUs, sleep 0.9s, 5 minutes) - limited by Rate Limiter
 * 
 * NOTE: profile_30 ограничен на 25 RPS из-за Rate Limiter (429) на сервере
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Environment Configuration
const BASE_URL = 'https://platform.moya-smena.ru/api/superapp';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const ENDPOINT = __ENV.ENDPOINT || '';
const API_VERSION = __ENV.API_VERSION || 'v1';

// Validation
if (!ENDPOINT) {
  throw new Error('ENDPOINT parameter is required. Example: --env ENDPOINT=/employees/me/');
}

// Build full URL
const FULL_URL = `${BASE_URL}/${API_VERSION}${ENDPOINT}`;

// Custom Metrics
const apiErrors = new Rate('api_errors');
const apiResponseTime = new Trend('api_response_time', true);

// Load Profiles
const PROFILES = {
  profile_15: { vus: 20, duration: '5m', sleep: 1 },    // ~15 RPS
  profile_30: { vus: 35, duration: '5m', sleep: 0.85 },  // ~25 RPS (max без Rate Limiter)
};

const selectedProfile = PROFILES[__ENV.PROFILE] || PROFILES.profile_15;

export const options = {
  scenarios: {
    endpoint_test: {
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
  console.log(`[SETUP] Profile: ${__ENV.PROFILE || 'profile_15'} (${selectedProfile.vus} VUs, sleep: ${selectedProfile.sleep}s)`);
  console.log(`[SETUP] Target URL: ${FULL_URL}`);
  console.log(`[SETUP] API Version: ${API_VERSION}`);
}

export default function () {
  const params = { headers: getAPIHeaders() };
  
  const response = http.get(FULL_URL, params);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
  });
  
  apiErrors.add(!success);
  apiResponseTime.add(response.timings.duration);
  
  if (response.status !== 200) {
    console.log(`❌ ${ENDPOINT}: status ${response.status} - ${response.status_text}`);
  }
  
  sleep(selectedProfile.sleep);
}

export function teardown(data) {
  console.log('[TEARDOWN] Test completed');
}

