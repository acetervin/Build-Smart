import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Router } from "wouter"; // <-- Import Router
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router> {/* <-- Wrap your app */}
      <App />
    </Router>
  </React.StrictMode>
);

