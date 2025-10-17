import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { CoreProviders } from "./app/providers/CoreProviders";
import App from "./app/App";
import "../../packages/styles/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  // Temporarily removed React.StrictMode to prevent double bootstrap calls in development
  // TODO: Re-enable after auth debugging is complete
  <BrowserRouter
    future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
  >
    <CoreProviders>
      <App />
    </CoreProviders>
  </BrowserRouter>
);
