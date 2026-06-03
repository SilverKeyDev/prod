import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.LOAD_TEST_BASE_URL || "http://127.0.0.1:5000";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  const maps = http.get(`${baseUrl}/api/maps/script`);
  check(maps, {
    "maps script responds": (r) => r.status === 200 || r.status === 429,
  });

  const profile = http.get(`${baseUrl}/api/v1/public/agent-profile/nonexistent-agent-id`);
  check(profile, {
    "public profile responds": (r) => r.status === 200 || r.status === 404 || r.status === 429,
  });

  sleep(0.3);
}
