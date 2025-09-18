// External libraries
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Internal components
import App from "./App.tsx";
import { AuthBootstrap } from "./AuthBootstrap";
import { CoreProviders } from "./providers/CoreProviders";

// Internal styles
import "../core/styles/index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(
  <AuthBootstrap>
    <BrowserRouter
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <CoreProviders>
        <App />
      </CoreProviders>
    </BrowserRouter>
  </AuthBootstrap>
);
