import "packages/ui/styles/index.css";
import "./app/platformBootstrap";

import React from "react";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { log } from "packages/logger";

import App from "./app/App";
import { CoreProviders } from "./app/providers/CoreProviders";

// Temporary: silence all logs except ROUTING (and ERRORS/SECURITY) to pinpoint sidebar nav bug
log.updateConfig({
  polling: false,
  pages: false,
  hooks: false,
  auth: false,
  http: false,
  api: false,
  search: false,
  mapRendering: false,
  negotiation: false,
  checklists: false,
  calendar: false,
  dashboard: false,
  messages: false,
  feed: false,
  routing: true,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

// v7_startTransition: false so navigation commits synchronously. When true, the previous
// screen can stay visible and Search URL-sync timeouts can race with navigate() and overwrite nav.
root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: false }}
    >
      <CoreProviders>
        <App />
      </CoreProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
