"use strict";

import { CanOForm } from "./form";
import { baseStyles } from "./styles";

declare global {
  interface Window {
    CanOForms?: {
      init: () => void;
    };
  }
}

const styleId = "cof-embed-styles";

function ensureBaseStyles() {
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = baseStyles;
  document.head.appendChild(style);
}

function getApiKey(container: HTMLElement) {
  return (
    container.dataset.siteKey ||
    container.dataset.apiKey ||
    document
      .querySelector("script[data-site-key], script[data-api-key]")
      ?.getAttribute("data-site-key") ||
    document
      .querySelector("script[data-site-key], script[data-api-key]")
      ?.getAttribute("data-api-key") ||
    ""
  );
}

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
    console.warn("Can-O-Forms: invalid data-theme JSON");
    return undefined;
  }
}

function init() {
  ensureBaseStyles();
  const containers = Array.from(
    document.querySelectorAll<HTMLElement>("[data-can-o-form]")
  );

  containers.forEach((container) => {
    if (container.dataset.cofInitialized === "true") {
      console.warn("Can-O-Forms: container already initialized");
      return;
    }

    const formSlug = container.dataset.canOForm;
    if (!formSlug) {
      console.error("Can-O-Forms: missing data-can-o-form attribute");
      return;
    }

    const apiKey = getApiKey(container);
    if (!apiKey) {
      console.error("Can-O-Forms: missing site API key");
      return;
    }

    container.dataset.cofInitialized = "true";

    const themeOverrides = parseTheme(container);
    const baseUrl = getBaseUrl(container);
    const form = new CanOForm(container, {
      apiKey,
      formSlug,
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

window.CanOForms = {
  init,
};
