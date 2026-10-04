import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
  stages: [
    { duration: '15s', target: 5 },   // Normal traffic (2 replicas)
    { duration: '45s', target: 50 },  // High traffic spike (scale out to 4-8 replicas)
    { duration: '30s', target: 50 },  // Sustained load
    { duration: '30s', target: 0 },   // Traffic drop (scale in back to 2 replicas)
  ],
};

export default function () {
  const rand = Math.random();
  let res;

  if (rand < 0.50) {
    res = http.get(`${BASE_URL}/api/v1/matches?page=1&page_size=20`);
  } else if (rand < 0.80) {
    res = http.get(`${BASE_URL}/api/v1/resources?page=1&page_size=20`);
  } else {
    res = http.get(`${BASE_URL}/api/v1/dev/load?seconds=0.3`);
  }

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has instance header': (r) => r.headers['X-ReliefGrid-Instance'] !== undefined,
  });

  sleep(0.05);
}
