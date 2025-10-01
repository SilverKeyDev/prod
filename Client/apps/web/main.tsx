import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { CoreProviders } from "./app/providers/CoreProviders";
import App from "./app/App";
import "../../packages/styles/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <CoreProviders>
        <App />
      </CoreProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
