import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.LOAD_TEST_BASE_URL || "http://127.0.0.1:5000";

export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const res = http.get(`${baseUrl}/healthz`);
  check(res, {
    "healthz status 200": (r) => r.status === 200,
    "healthz database connected": (r) => r.json("database") === "connected",
  });
  sleep(0.1);
}
