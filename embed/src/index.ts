"use strict";

import { CanOForm } from "./form";
import { baseStyles } from "./styles";

declare global {
  interface Window {
    CanopyForms?: {
      init: () => void;
    };
  }
}

const styleId = "canopy-embed-styles";

function ensureBaseStyles() {
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = baseStyles;
  document.head.appendChild(style);
}

// No longer needed - formId comes from data-canopy-form attribute

function getBaseUrl(container: HTMLElement) {
  return (
    container.dataset.baseUrl ||
    document.querySelector("script[data-base-url]")?.getAttribute("data-base-url") ||
    ""
  );
}

function parseTheme(container: HTMLElement) {
  const raw = container.dataset.theme;
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    console.warn("Canopy Forms: invalid data-theme JSON");
    return undefined;
  }
}

function init() {
  ensureBaseStyles();
  const containers = Array.from(
    document.querySelectorAll<HTMLElement>("[data-canopy-form]")
  );

  containers.forEach((container) => {
    if (container.dataset.canopyInitialized === "true") {
      console.warn("Canopy Forms: container already initialized");
      return;
    }

    const formId = container.dataset.canopyForm;
    if (!formId) {
      console.error("Canopy Forms: missing data-canopy-form attribute");
      return;
    }

    container.dataset.canopyInitialized = "true";

    const themeOverrides = parseTheme(container);
    const baseUrl = getBaseUrl(container);
    const form = new CanOForm(container, {
      formId,
      themeOverrides,
      baseUrl,
    });
    form.init();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

window.CanopyForms = {
  init,
};
