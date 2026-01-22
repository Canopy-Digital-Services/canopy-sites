import { applyTheme, ensureFontLoaded, getDensityClass, resolveTheme } from "./theme";
import { FieldDefinition, validateSubmission } from "./validation";

type FormDefinition = {
  formId: string;
  slug: string;
  fields: FieldDefinition[];
  successMessage?: string;
  redirectUrl?: string;
  defaultTheme?: Record<string, unknown>;
};

type FormOptions = {
  apiKey: string;
  formSlug: string;
  themeOverrides?: Record<string, unknown>;
  baseUrl?: string;
};

type FieldElement = {
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  errorEl: HTMLSpanElement;
};

let instanceCounter = 0;

export class CanOForm {
  private container: HTMLElement;
  private options: FormOptions;
  private formDefinition: FormDefinition | null = null;
  private fieldElements = new Map<string, FieldElement>();
  private statusEl: HTMLDivElement | null = null;
  private submitButton: HTMLButtonElement | null = null;
  private instanceId = `cof-${instanceCounter++}`;

  constructor(container: HTMLElement, options: FormOptions) {
    this.container = container;
    this.options = options;
  }

  async init() {
    try {
      this.container.classList.add("cof-root");
      const definition = await this.fetchDefinition();
      this.formDefinition = definition;
      this.render(definition);
    } catch (error) {
      console.error(error);
      this.renderError("Unable to load form. Please try again later.");
    }
  }

  private async fetchDefinition(): Promise<FormDefinition> {
    const baseUrl = this.options.baseUrl || "";
    const response = await fetch(
      `${baseUrl}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,
      {
        method: "GET",
        credentials: "omit",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load form definition");
    }

    return response.json();
  }

  private render(definition: FormDefinition) {
    this.container.innerHTML = "";
    this.fieldElements.clear();

    const theme = resolveTheme(
      definition.defaultTheme as Record<string, unknown>,
      this.options.themeOverrides as Record<string, unknown>
    );
    applyTheme(this.container, theme);
    ensureFontLoaded((theme as { fontUrl?: string }).fontUrl);

    this.container.classList.remove(
      "cof-density-compact",
      "cof-density-normal",
      "cof-density-comfortable"
    );
    this.container.classList.add(getDensityClass(theme));

    if (!definition.fields || definition.fields.length === 0) {
      this.renderError("This form is not configured yet.");
      return;
    }

    const status = document.createElement("div");
    status.className = "cof-status";
    status.setAttribute("role", "status");
    this.statusEl = status;

    const form = document.createElement("form");
    form.className = "cof-form";
    form.addEventListener("submit", (event) => this.handleSubmit(event));

    definition.fields.forEach((field) => {
      const { wrapper, input, errorEl } = this.createField(field);
      if (wrapper) {
        form.appendChild(wrapper);
      }
      this.fieldElements.set(field.name, { input, errorEl });
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "cof-submit";
    submit.textContent = "Submit";
    // Apply inline styles to defeat CSS resets like Figma's @layer figreset
    const primaryColor = getComputedStyle(this.container).getPropertyValue("--cof-primary").trim() || "#0ea5e9";
    const radius = getComputedStyle(this.container).getPropertyValue("--cof-radius").trim() || "8px";
    submit.style.cssText = `
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${radius} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${primaryColor} !important;
      background-color: ${primaryColor} !important;
      color: #ffffff !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `;
    this.submitButton = submit;

    form.appendChild(submit);

    this.container.appendChild(status);
    this.container.appendChild(form);
  }

  private createField(field: FieldDefinition) {
    const fieldId = `${this.instanceId}-${field.name}`;

    if (field.type === "HIDDEN") {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = field.name;
      input.id = fieldId;
      const errorEl = document.createElement("span");
      return { wrapper: null, input, errorEl };
    }

    const wrapper = document.createElement("div");
    wrapper.className = "cof-field";

    const label = document.createElement("label");
    label.className = "cof-label";
    label.htmlFor = fieldId;
    label.textContent = field.label || field.name;

    if (field.required) {
      const required = document.createElement("span");
      required.className = "cof-required";
      required.textContent = " *";
      label.appendChild(required);
    }

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    switch (field.type) {
      case "TEXTAREA": {
        const textarea = document.createElement("textarea");
        textarea.className = "cof-textarea";
        textarea.rows = 4;
        input = textarea;
        break;
      }
      case "SELECT": {
        const select = document.createElement("select");
        select.className = "cof-select";
        (field.options || []).forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = option.label;
          select.appendChild(opt);
        });
        input = select;
        break;
      }
      case "CHECKBOX": {
        const checkboxWrapper = document.createElement("label");
        checkboxWrapper.className = "cof-checkbox";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = fieldId;
        checkbox.name = field.name;
        checkboxWrapper.appendChild(checkbox);
        const text = document.createElement("span");
        text.textContent = field.label || field.name;
        checkboxWrapper.appendChild(text);
        wrapper.appendChild(checkboxWrapper);
        const errorEl = document.createElement("span");
        errorEl.className = "cof-error";
        errorEl.id = `${fieldId}-error`;
        wrapper.appendChild(errorEl);
        checkbox.setAttribute("aria-describedby", errorEl.id);
        checkbox.setAttribute("aria-invalid", "false");
        return { wrapper, input: checkbox, errorEl };
      }
      case "EMAIL": {
        const email = document.createElement("input");
        email.type = "email";
        email.className = "cof-input";
        input = email;
        break;
      }
      default: {
        const text = document.createElement("input");
        text.type = "text";
        text.className = "cof-input";
        input = text;
      }
    }

    input.id = fieldId;
    input.name = field.name;
    input.setAttribute("aria-invalid", "false");
    if (field.placeholder) {
      input.setAttribute("placeholder", field.placeholder);
    }

    const errorEl = document.createElement("span");
    errorEl.className = "cof-error";
    errorEl.id = `${fieldId}-error`;
    input.setAttribute("aria-describedby", errorEl.id);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(errorEl);

    return { wrapper, input, errorEl };
  }

  private collectValues() {
    const data: Record<string, unknown> = {};
    this.fieldElements.forEach((element, name) => {
      if (element.input instanceof HTMLInputElement) {
        if (element.input.type === "checkbox") {
          data[name] = element.input.checked;
        } else {
          data[name] = element.input.value;
        }
      } else if (element.input instanceof HTMLSelectElement) {
        data[name] = element.input.value;
      } else {
        data[name] = element.input.value;
      }
    });
    return data;
  }

  private showErrors(errors: Record<string, string>) {
    this.fieldElements.forEach((element, name) => {
      const message = errors[name];
      element.errorEl.textContent = message || "";
      element.input.setAttribute("aria-invalid", message ? "true" : "false");
    });
  }

  private setStatus(message: string, type: "error" | "success" | "info") {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.textContent = message;
    this.statusEl.className = `cof-status cof-status-${type}`;
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    if (!this.formDefinition) {
      return;
    }

    this.setStatus("", "info");
    const values = this.collectValues();
    const errors = validateSubmission(this.formDefinition.fields, values);
    this.showErrors(errors);

    if (Object.keys(errors).length > 0) {
      this.setStatus("Please fix the highlighted fields.", "error");
      return;
    }

    if (this.submitButton) {
      this.submitButton.disabled = true;
      this.submitButton.textContent = "Submitting...";
      this.submitButton.style.opacity = "0.6";
      this.submitButton.style.cursor = "not-allowed";
    }

    try {
      const baseUrl = this.options.baseUrl || "";
      const response = await fetch(
        `${baseUrl}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        if (payload?.fields) {
          this.showErrors(payload.fields);
        }
        this.setStatus(payload?.error || "Submission failed.", "error");
        return;
      }

      if (this.formDefinition.redirectUrl) {
        window.location.href = this.formDefinition.redirectUrl;
        return;
      }

      this.setStatus(
        this.formDefinition.successMessage || "Thanks for your submission!",
        "success"
      );
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      this.setStatus("Submission failed. Please try again.", "error");
    } finally {
      if (this.submitButton) {
        this.submitButton.disabled = false;
        this.submitButton.textContent = "Submit";
        this.submitButton.style.opacity = "1";
        this.submitButton.style.cursor = "pointer";
      }
    }
  }

  private renderError(message: string) {
    this.container.innerHTML = "";
    const status = document.createElement("div");
    status.className = "cof-status cof-status-error";
    status.textContent = message;
    this.container.appendChild(status);
  }
}
