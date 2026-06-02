import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.LOAD_TEST_BASE_URL || "http://127.0.0.1:5000";

export const options = {
  vus: 5,
  duration: "15s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const live = http.get(`${baseUrl}/livez`);
  check(live, {
    "livez status 200": (r) => r.status === 200,
    "livez body ok": (r) => r.json("status") === "ok",
  });

  const ready = http.get(`${baseUrl}/readyz`);
  check(ready, {
    "readyz status 200": (r) => r.status === 200,
    "readyz database connected": (r) => r.json("database") === "connected",
  });

  sleep(0.2);
}
