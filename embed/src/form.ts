import { applyTheme, ensureFontLoaded, getDensityClass, resolveTheme } from "./theme";
import { FieldDefinition, validateSubmission, getEffectiveMaxLength } from "./validation";

type FormDefinition = {
  formId: string;
  slug: string;
  fields: FieldDefinition[];
  successMessage?: string;
  redirectUrl?: string;
  defaultTheme?: Record<string, unknown>;
};

type FormOptions = {
  formId: string;
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
  private instanceId = `canopy-${instanceCounter++}`;

  constructor(container: HTMLElement, options: FormOptions) {
    this.container = container;
    this.options = options;
  }

  async init() {
    try {
      this.container.classList.add("canopy-root");
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
      `${baseUrl}/api/embed/${this.options.formId}`,
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
      "canopy-density-compact",
      "canopy-density-normal",
      "canopy-density-comfortable"
    );
    this.container.classList.add(getDensityClass(theme));

    if (!definition.fields || definition.fields.length === 0) {
      this.renderError("This form is not configured yet.");
      return;
    }

    const status = document.createElement("div");
    status.className = "canopy-status";
    status.setAttribute("role", "status");
    this.statusEl = status;

    const form = document.createElement("form");
    form.className = "canopy-form";
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
    submit.className = "canopy-submit";
    submit.textContent = (theme as { buttonText?: string }).buttonText || "Submit";
    // Apply inline styles to defeat CSS resets like Figma's @layer figreset
    const primaryColor = getComputedStyle(this.container).getPropertyValue("--canopy-primary").trim() || "#0ea5e9";
    const radius = getComputedStyle(this.container).getPropertyValue("--canopy-radius").trim() || "8px";
    const buttonWidth = getComputedStyle(this.container).getPropertyValue("--canopy-button-width").trim() || "100%";
    submit.style.cssText = `
      display: block !important;
      width: ${buttonWidth} !important;
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

    const formActions = document.createElement("div");
    formActions.className = "canopy-form-actions";
    formActions.appendChild(submit);

    form.appendChild(formActions);

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
      
      // Set value based on configured source
      const hiddenOpts = field.options as any;
      if (hiddenOpts && typeof hiddenOpts === "object" && "valueSource" in hiddenOpts) {
        const source = hiddenOpts.valueSource;
        
        if (source === "static") {
          input.value = hiddenOpts.staticValue || "";
        } else if (source === "urlParam") {
          const paramName = hiddenOpts.paramName;
          if (paramName) {
            const urlParams = new URLSearchParams(window.location.search);
            input.value = urlParams.get(paramName) || "";
          }
        } else if (source === "pageUrl") {
          input.value = window.location.href;
        } else if (source === "referrer") {
          input.value = document.referrer;
        }
      }
      
      const errorEl = document.createElement("span");
      return { wrapper: null, input, errorEl };
    }

    const wrapper = document.createElement("div");
    wrapper.className = "canopy-field";

    const label = document.createElement("label");
    label.className = "canopy-label";
    label.htmlFor = fieldId;
    label.textContent = field.label || field.name;

    if (field.required) {
      const required = document.createElement("span");
      required.className = "canopy-required";
      required.textContent = " *";
      label.appendChild(required);
    }

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    switch (field.type) {
      case "TEXTAREA": {
        const textarea = document.createElement("textarea");
        textarea.className = "canopy-textarea";
        
        // Auto-size based on character limit (roughly 60 chars per row)
        const maxLength = getEffectiveMaxLength(field);
        if (maxLength) {
          const estimatedRows = Math.min(Math.max(Math.ceil(maxLength / 60), 4), 15);
          textarea.rows = estimatedRows;
        } else {
          textarea.rows = 4;
        }
        
        input = textarea;
        break;
      }
      case "SELECT": {
        const selectOpts = field.options as any;
        const isNewFormat = selectOpts && typeof selectOpts === "object" && "options" in selectOpts;
        const options = isNewFormat ? selectOpts.options : (Array.isArray(field.options) ? field.options : []);
        const defaultValue = isNewFormat ? selectOpts.defaultValue : undefined;
        const allowOther = isNewFormat ? selectOpts.allowOther : false;
        
        const select = document.createElement("select");
        select.className = "canopy-select";
        
        options.forEach((option: any) => {
          const opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = option.label;
          if (defaultValue && option.value === defaultValue) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
        
        if (allowOther) {
          const otherOpt = document.createElement("option");
          otherOpt.value = "__other__";
          otherOpt.textContent = "Other";
          select.appendChild(otherOpt);
        }
        
        input = select;
        
        // If allowOther, create the "Other" text input (hidden initially)
        if (allowOther) {
          const otherInput = document.createElement("input");
          otherInput.type = "text";
          otherInput.className = "canopy-input canopy-select-other";
          otherInput.name = `${field.name}_other`;
          otherInput.placeholder = "Please specify...";
          otherInput.style.display = "none";
          otherInput.style.marginTop = "0.5rem";
          
          // Clear validation state when user starts typing
          otherInput.addEventListener("input", () => {
            otherInput.setCustomValidity("");
          });
          
          // Show/hide other input based on selection
          select.addEventListener("change", () => {
            if (select.value === "__other__") {
              otherInput.style.display = "block";
              if (field.required) {
                otherInput.required = true;
              }
            } else {
              otherInput.style.display = "none";
              otherInput.required = false;
              otherInput.value = "";
            }
          });
          
          // Store reference to other input for collectValues
          (select as any).__otherInput = otherInput;
        }
        
        break;
      }
      case "CHECKBOX": {
        const checkboxWrapper = document.createElement("label");
        checkboxWrapper.className = "canopy-checkbox";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = fieldId;
        checkbox.name = field.name;
        checkboxWrapper.appendChild(checkbox);
        const text = document.createElement("span");
        text.textContent = field.label || field.name;
        checkboxWrapper.appendChild(text);
        wrapper.appendChild(checkboxWrapper);
        
        // Add help text if provided
        if (field.helpText) {
          const helpTextEl = document.createElement("p");
          helpTextEl.className = "canopy-help-text";
          helpTextEl.textContent = field.helpText;
          wrapper.appendChild(helpTextEl);
        }
        
        const errorEl = document.createElement("span");
        errorEl.className = "canopy-error";
        errorEl.id = `${fieldId}-error`;
        wrapper.appendChild(errorEl);
        checkbox.setAttribute("aria-describedby", errorEl.id);
        checkbox.setAttribute("aria-invalid", "false");
        return { wrapper, input: checkbox, errorEl };
      }
      case "EMAIL": {
        const email = document.createElement("input");
        email.type = "email";
        email.className = "canopy-input";
        input = email;
        break;
      }
      case "PHONE": {
        const phone = document.createElement("input");
        phone.type = "tel";
        phone.setAttribute("inputmode", "tel");
        phone.setAttribute("autocomplete", "tel");
        phone.className = "canopy-input";
        input = phone;
        break;
      }
      case "DATE": {
        const date = document.createElement("input");
        date.type = "date";
        date.className = "canopy-input";
        // Apply min/max from validation if present
        const validation = field.validation as any;
        if (validation) {
          if (validation.minDate) {
            date.min = this.resolveDate(validation.minDate);
          }
          if (validation.maxDate) {
            date.max = this.resolveDate(validation.maxDate);
          }
          if (validation.noFuture) {
            date.max = new Date().toISOString().split("T")[0];
          }
          if (validation.noPast) {
            date.min = new Date().toISOString().split("T")[0];
          }
        }
        input = date;
        break;
      }
      case "NAME": {
        // Handle NAME as a composite field
        return this.createNameField(field);
      }
      default: {
        const text = document.createElement("input");
        text.type = "text";
        text.className = "canopy-input";
        input = text;
      }
    }

    input.id = fieldId;
    input.name = field.name;
    input.setAttribute("aria-invalid", "false");
    if (field.placeholder) {
      input.setAttribute("placeholder", field.placeholder);
    }
    
    // Apply maxLength for browser-level enforcement
    const maxLength = getEffectiveMaxLength(field);
    if (maxLength && (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
      input.maxLength = maxLength;
    }
    
    // Clear validation state when user starts typing
    input.addEventListener("input", () => {
      input.setCustomValidity("");
    });

    const errorEl = document.createElement("span");
    errorEl.className = "canopy-error";
    errorEl.id = `${fieldId}-error`;
    input.setAttribute("aria-describedby", errorEl.id);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    
    // If this is a SELECT with "Other" option, add the other input
    if ((input as any).__otherInput) {
      wrapper.appendChild((input as any).__otherInput);
    }
    
    // Add help text if provided
    if (field.helpText) {
      const helpTextEl = document.createElement("p");
      helpTextEl.className = "canopy-help-text";
      helpTextEl.textContent = field.helpText;
      wrapper.appendChild(helpTextEl);
    }
    
    wrapper.appendChild(errorEl);

    return { wrapper, input, errorEl };
  }

  private resolveDate(dateValue: string): string {
    if (dateValue === "today") {
      return new Date().toISOString().split("T")[0];
    }
    return dateValue;
  }

  private createNameField(field: FieldDefinition) {
    const fieldId = `${this.instanceId}-${field.name}`;
    const wrapper = document.createElement("div");
    wrapper.className = "canopy-field canopy-name-group";

    const label = document.createElement("label");
    label.className = "canopy-label";
    label.textContent = field.label || field.name;

    if (field.required) {
      const required = document.createElement("span");
      required.className = "canopy-required";
      required.textContent = " *";
      label.appendChild(required);
    }

    wrapper.appendChild(label);

    const options = (field.options as any) || { parts: ["first", "last"] };
    const parts = options.parts || ["first", "last"];
    const partLabels = options.partLabels || {};
    const partsRequired = options.partsRequired || {};

    const defaultLabels: Record<string, string> = {
      first: "First Name",
      last: "Last Name",
      middle: "Middle Name",
      middleInitial: "M.I.",
      single: "Full Name",
    };

    const nameInputsWrapper = document.createElement("div");
    nameInputsWrapper.className = "canopy-name-parts";

    // Create a pseudo-input to store in fieldElements (for consistency)
    const pseudoInput = document.createElement("input");
    pseudoInput.type = "hidden";
    pseudoInput.id = fieldId;
    pseudoInput.name = field.name;

    const errorEl = document.createElement("span");
    errorEl.className = "canopy-error";
    errorEl.id = `${fieldId}-error`;

    parts.forEach((part: string) => {
      const partWrapper = document.createElement("div");
      partWrapper.className = "canopy-name-part";

      const partLabel = document.createElement("label");
      partLabel.className = "canopy-name-part-label";
      const partId = `${fieldId}-${part}`;
      partLabel.htmlFor = partId;
      partLabel.textContent = partLabels[part] || defaultLabels[part] || part;

      if (field.required || partsRequired[part]) {
        const req = document.createElement("span");
        req.className = "canopy-required";
        req.textContent = " *";
        partLabel.appendChild(req);
      }

      const partInput = document.createElement("input");
      partInput.type = "text";
      partInput.className = "canopy-input";
      partInput.id = partId;
      partInput.name = `${field.name}.${part}`;
      partInput.setAttribute("data-name-part", part);
      partInput.setAttribute("data-name-field", field.name);
      
      // Clear validation state when user starts typing
      partInput.addEventListener("input", () => {
        partInput.setCustomValidity("");
      });

      partWrapper.appendChild(partLabel);
      partWrapper.appendChild(partInput);
      nameInputsWrapper.appendChild(partWrapper);
    });

    wrapper.appendChild(nameInputsWrapper);
    
    // Add help text if provided
    if (field.helpText) {
      const helpTextEl = document.createElement("p");
      helpTextEl.className = "canopy-help-text";
      helpTextEl.textContent = field.helpText;
      wrapper.appendChild(helpTextEl);
    }
    
    wrapper.appendChild(errorEl);

    return { wrapper, input: pseudoInput, errorEl };
  }

  private collectValues() {
    const data: Record<string, unknown> = {};
    this.fieldElements.forEach((element, name) => {
      if (element.input instanceof HTMLInputElement) {
        if (element.input.type === "checkbox") {
          data[name] = element.input.checked;
        } else if (element.input.type === "hidden") {
          // Check if this is a NAME field by looking for part inputs
          const partInputs = this.container.querySelectorAll(
            `input[data-name-field="${name}"]`
          );
          if (partInputs.length > 0) {
            const nameValue: Record<string, string> = {};
            partInputs.forEach((input) => {
              const partInput = input as HTMLInputElement;
              const part = partInput.getAttribute("data-name-part");
              if (part) {
                nameValue[part] = partInput.value;
              }
            });
            data[name] = nameValue;
          } else {
            data[name] = element.input.value;
          }
        } else {
          data[name] = element.input.value;
        }
      } else if (element.input instanceof HTMLSelectElement) {
        // Check if "Other" option was selected
        if (element.input.value === "__other__" && (element.input as any).__otherInput) {
          data[name] = (element.input as any).__otherInput.value;
        } else {
          data[name] = element.input.value;
        }
      } else {
        data[name] = element.input.value;
      }
    });
    return data;
  }

  private showErrors(errors: Record<string, string>) {
    // Set custom validity on all fields
    this.fieldElements.forEach((element, name) => {
      const message = errors[name] || "";
      
      // For NAME fields (hidden input), set validity on first visible part input
      if (element.input.type === "hidden") {
        const partInput = this.container.querySelector(
          `input[data-name-field="${name}"]`
        ) as HTMLInputElement;
        if (partInput) {
          partInput.setCustomValidity(message);
        }
      } else {
        element.input.setCustomValidity(message);
      }
      
      // Keep error text for screen readers (hidden via CSS)
      element.errorEl.textContent = message;
      element.input.setAttribute("aria-invalid", message ? "true" : "false");
    });

    // Show native popup on first error field
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorField = this.fieldElements.get(errorKeys[0]);
      if (firstErrorField) {
        // For NAME fields, show popup on first visible part
        if (firstErrorField.input.type === "hidden") {
          const partInput = this.container.querySelector(
            `input[data-name-field="${errorKeys[0]}"]`
          ) as HTMLInputElement;
          if (partInput) {
            partInput.reportValidity();
            partInput.focus();
          }
        } else {
          firstErrorField.input.reportValidity();
          firstErrorField.input.focus();
        }
      }
    }
  }

  private setStatus(message: string, type: "error" | "success" | "info") {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.textContent = message;
    this.statusEl.className = `canopy-status canopy-status-${type}`;
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    if (!this.formDefinition) {
      return;
    }

    this.setStatus("", "info");
    
    // Clear any previous validation state
    this.fieldElements.forEach((element) => {
      element.input.setCustomValidity("");
    });
    
    const values = this.collectValues();
    const errors = validateSubmission(this.formDefinition.fields, values);
    this.showErrors(errors);

    if (Object.keys(errors).length > 0) {
      const count = Object.keys(errors).length;
      this.setStatus(`Please fix ${count} field${count > 1 ? "s" : ""} to continue.`, "error");
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
        `${baseUrl}/api/embed/${this.options.formId}`,
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
        const buttonText = (this.formDefinition as { defaultTheme?: { buttonText?: string } })?.defaultTheme?.buttonText || "Submit";
        this.submitButton.textContent = buttonText;
        this.submitButton.style.opacity = "1";
        this.submitButton.style.cursor = "pointer";
      }
    }
  }

  private renderError(message: string) {
    this.container.innerHTML = "";
    const status = document.createElement("div");
    status.className = "canopy-status canopy-status-error";
    status.textContent = message;
    this.container.appendChild(status);
  }
}
