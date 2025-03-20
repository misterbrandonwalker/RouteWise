import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import App from "./App";
import { AuthProvider } from "react-oidc-context";
import { WebStorageStateStore } from "oidc-client-ts";

const oidcConfig = {
  authority: process.env.AUTH_AUTHORITY,
  client_id: process.env.AUTH_CLIENT_ID,
  redirect_uri: window.location.origin,
  scope: "openid profile offline_access email tenant identity_provider",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
}

const router = createBrowserRouter([
  {
    path: process.env.REACT_APP_BASE_PATH,
    element: <AuthProvider {...oidcConfig}><App /></AuthProvider>,
  },
  {
    path: "/visualize/force-directed-graph",
    element: <AuthProvider {...oidcConfig}><App /></AuthProvider>,
  },
  {
    path: "/network-visualizer",
    element: <AuthProvider {...oidcConfig}><App /></AuthProvider>,
  },
  {
    path: "/visualizer",
    element: <AuthProvider {...oidcConfig}><App /></AuthProvider>,
  },
  {
    path: "/mfe-shell/visualizer",
    element: <AuthProvider {...oidcConfig}><App /></AuthProvider>,
  },
]);

reportWebVitals();

class ChildReactElement extends HTMLElement {
  connectedCallback() {
    // Create a new div element to serve as the React root.
    const reactRoot = document.createElement("div");

    // Append the new div to the custom element.
    this.appendChild(reactRoot);

    // Use the newly created div as the container for the React root.
    const root = ReactDOM.createRoot(reactRoot);

    root.render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>
    );
  }
}

if (!customElements.get("child-react-element")) {
  customElements.define("child-react-element", ChildReactElement);
}

// Set page tab title
document.title = "Synthesis Route Design";
