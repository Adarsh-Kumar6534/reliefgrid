import http from 'k6/http';
import { check, sleep } from 'k6';

// Configurable target URL allowing testing against local backend or K8s ingress
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
  stages: [
    // Stage A: Baseline Normal Load (2 Replicas expected)
    { duration: '30s', target: 5 },

    // Stage B: Increasing Crisis Load (Ramp up)
    { duration: '1m', target: 30 },

    // Stage C: Peak Crisis Load (Triggers HPA Scale-Out up to 8 Replicas)
    { duration: '2m', target: 75 },

    // Stage D: Sustained Crisis Operations
    { duration: '1m', target: 75 },

    // Stage E: Crisis Resolution & Traffic Ramp-Down (Triggers HPA Scale-In back to 2 Replicas)
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Under 5% failure rate during pod scale/failover
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
  },
};

export default function () {
  const rand = Math.random();
  let res;

  // Request distribution matching Disaster Telemetry workload
  if (rand < 0.10) {
    // 10% Dashboard Telemetry Overview
    res = http.get(`${BASE_URL}/api/v1/dashboard/summary`);
    check(res, {
      'dashboard 200': (r) => r.status === 200,
    });
  } else if (rand < 0.40) {
    // 30% Resource Registry Queries
    res = http.get(`${BASE_URL}/api/v1/resources?page=1&page_size=20`);
    check(res, {
      'resources 200': (r) => r.status === 200,
    });
  } else if (rand < 0.65) {
    // 25% Emergency Needs Queries
    res = http.get(`${BASE_URL}/api/v1/needs?page=1&page_size=20`);
    check(res, {
      'needs 200': (r) => r.status === 200,
    });
  } else if (rand < 0.90) {
    // 25% Matching Engine Evaluation Queries
    res = http.get(`${BASE_URL}/api/v1/matches?page=1&page_size=20`);
    check(res, {
      'matches 200': (r) => r.status === 200,
    });
  } else {
    // 10% Controlled CPU Computation for reliable local HPA demonstration
    res = http.get(`${BASE_URL}/api/v1/dev/load?seconds=0.2`);
    check(res, {
      'cpu_load 200': (r) => r.status === 200,
    });
  }

  // Paced sleep between user interactions
  sleep(0.1 + Math.random() * 0.2);
}
