import "packages/ui/styles/index.css";
import "./app/platformBootstrap";

import React from "react";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { getDocument } from "packages/utils/core/platform";

import App from "./app/App";
import { CoreProviders } from "./app/providers/CoreProviders";

const rootElement = getDocument()?.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}
const root = ReactDOM.createRoot(rootElement);

// v7_startTransition: false so navigation commits synchronously. When true, the previous
// screen can stay visible and Search URL-sync timeouts can race with navigate() and overwrite nav.
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: false }}>
      <CoreProviders>
        <App />
      </CoreProviders>
    </BrowserRouter>
  </React.StrictMode>
);
