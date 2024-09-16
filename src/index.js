import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { MinimizedProvider } from "./context/MinimizedContext";
import { ValidationProvider } from "./context/ValidationContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ValidationProvider>
      <MinimizedProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MinimizedProvider>
    </ValidationProvider>
  </React.StrictMode>
);
