import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initializeAuth } from "./lib/auth";
import { hydrateLiveData } from "./lib/hydrateLiveData";
import "./styles.css";

async function render() {
  await initializeAuth();
  try {
    await hydrateLiveData();
  } catch (error) {
    console.error("Could not load backend data", error);
  }
  const { default: App } = await import("./App");
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
}

void render();
