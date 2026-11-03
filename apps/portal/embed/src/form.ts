import { applyTheme, ensureFontsLoaded, ensureFontLoaded, getDensityClass, resolveTheme } from "./theme";
import {
  FieldDefinition,
  validateSubmission,
  characterLimit,
  characters,
  MAX_LENGTHS,
  localDate,
  NameOptions,
} from "./validation";
import type { AddressOptions } from "./validation";
import {
  CHOICE_PROMPT,
  OTHER_LABEL,
  OTHER_MAX_LENGTH,
  OTHER_VALUE,
  allowsOther,
  choiceList,
  type ChoiceOptions,
} from "./choices";
import { ADDRESS_PART_MAX_LENGTH, addressPartLabel, addressParts, addressRequiredParts, type AddressPart } from "./address";
import { US_STATES } from "./us-states";
import { DEFAULT_NAME_LABEL, DEFAULT_NAME_PARTS, nameRequiredParts, namePartLabel, namePartMaxLength, orderNameParts, type NamePart } from "./name";

type SelectWithOther = HTMLSelectElement & { __otherInput?: HTMLInputElement };

/** What the browser may fill each part with from the visitor's own details
    (HTML autofill tokens). A middle initial has none: the token means a whole
    middle name, which a two-letter box would cut short. */
const NAME_AUTOFILL: Partial<Record<NamePart, string>> = {
  single: "name",
  first: "given-name",
  middle: "additional-name",
  last: "family-name",
};
const ADDRESS_AUTOFILL: Record<AddressPart, string> = {
  line1: "address-line1",
  line2: "address-line2",
  city: "address-level2",
  region: "address-level1",
  postalCode: "postal-code",
};

/** A Date of birth's boxes, in US order: each part, its label, its length
    and its autofill token. */
const DATE_OF_BIRTH_PARTS = [
  ["month", "Month", 2, "bday-month"],
  ["day", "Day", 2, "bday-day"],
  ["year", "Year", 4, "bday-year"],
] as const;

/** A Date of birth's answer, YYYY-MM-DD, joined from its boxes as typed: a
    one-digit month or day gets its zero, and an empty box is an empty piece,
    for validateField to name. Nothing typed is no answer. */
const joinDateOfBirth = (boxes: HTMLInputElement[]) => {
  const [month, day, year] = boxes.map((box) => box.value.trim());
  if (!month && !day && !year) return "";
  const pad = (part: string) => (/^\d$/.test(part) ? `0${part}` : part);
  return `${year}-${pad(month)}-${pad(day)}`;
};

/** Has a screen reader read a field's help text, if any, a Paragraph's
    limit, and its error with `control` (its box, or the group of its parts
    or options). */
const describe = (control: Element, help: HTMLElement | null, error: HTMLElement, limit?: HTMLElement) =>
  control.setAttribute(
    "aria-describedby",
    [help, limit, error].flatMap((note) => (note ? [note.id] : [])).join(" ")
  );

export type FormDefinition = {
  formId: string;
  slug: string;
  fields: FieldDefinition[];
  name?: string;
  title?: string;
  description?: string;
  successMessage?: string;
  redirectUrl?: string;
  defaultTheme?: Record<string, unknown>;
};

const FEEDBACK_EMAIL = "feedback@canopyds.com";

type FormOptions = {
  formId?: string;
  themeOverrides?: Record<string, unknown>;
  baseUrl?: string;
  /**
   * Admin preview mode. The form is fully rendered and interactive (so the
   * user can feel layout, typography, and HTML5 validation), but Submit is
   * intercepted — no fetch, no submission row. The submit button gets a
   * native tooltip explaining this.
   */
  preview?: boolean;
};

type FieldElement = {
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  errorEl: HTMLSpanElement;
};

let instanceCounter = 0;

class InactiveFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InactiveFormError";
  }
}

class HostedOnlyFormError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HostedOnlyFormError";
  }
}

export class CanopyForm {
  private container: HTMLElement;
  private options: FormOptions;
  private formDefinition: FormDefinition | null = null;
  private fieldElements = new Map<string, FieldElement>();
  private statusEl: HTMLDivElement | null = null;
  private formEl: HTMLFormElement | null = null;
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
      if (error instanceof InactiveFormError) {
        this.renderInactive();
        return;
      }
      if (error instanceof HostedOnlyFormError) {
        this.renderHostedOnly();
        return;
      }
      this.renderError("Unable to load form. Please try again later.");
    }
  }

  private async fetchDefinition(): Promise<FormDefinition> {
    const baseUrl = this.options.baseUrl || "";
    const formId = this.options.formId || this.formDefinition?.formId;
    if (!formId) {
      throw new Error("Form configuration error: no formId");
    }
    const response = await fetch(
      `${baseUrl}/api/embed/${formId}`,
      {
        method: "GET",
        credentials: "omit",
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        try {
          const payload = await response.json();
          if (payload?.code === "FORM_INACTIVE") {
            throw new InactiveFormError(payload.error || "Form is inactive");
          }
          if (payload?.code === "FORM_HOSTED_ONLY") {
            throw new HostedOnlyFormError(
              payload.error || "Form is only available at its hosted URL"
            );
          }
        } catch (parseError) {
          if (
            parseError instanceof InactiveFormError ||
            parseError instanceof HostedOnlyFormError
          ) {
            throw parseError;
          }
        }
      }
      throw new Error("Failed to load form definition");
    }

    return response.json();
  }

  renderFromDefinition(definition: FormDefinition) {
    this.container.classList.add("canopy-root");
    this.formDefinition = definition;
    this.render(definition);
  }

  private render(definition: FormDefinition) {
    this.container.innerHTML = "";
    this.fieldElements.clear();

    const theme = resolveTheme(
      definition.defaultTheme as Record<string, unknown>,
      this.options.themeOverrides as Record<string, unknown>
    );
    applyTheme(this.container, theme);

    // Load any explicitly selected families (new format)
    ensureFontsLoaded([theme.bodyFont, theme.titleFont, theme.labelFont], this.options.baseUrl || "");

    // Backward compat: load legacy fontUrl if new fields are absent
    if (!theme.bodyFont && !theme.titleFont && !theme.labelFont) {
      ensureFontLoaded((theme as { fontUrl?: string }).fontUrl);
    }

    this.container.classList.remove(
      "canopy-density-compact",
      "canopy-density-normal",
      "canopy-density-comfortable"
    );
    this.container.classList.add(getDensityClass(theme));

    const hasFields = definition.fields && definition.fields.length > 0;
    const hasHeader = definition.title || definition.description;

    if (!hasFields && !hasHeader) {
      this.renderSkeleton();
      return;
    }

    // Render header block if title or description present
    if (definition.title || definition.description) {
      const header = document.createElement("div");
      header.className = "canopy-header";

      if (definition.title) {
        const h2 = document.createElement("h2");
        h2.className = "canopy-title";
        h2.textContent = definition.title;
        header.appendChild(h2);
      }

      if (definition.description) {
        const p = document.createElement("p");
        p.className = "canopy-description";
        p.textContent = definition.description;
        header.appendChild(p);
      }

      this.container.appendChild(header);
    }

    const status = document.createElement("div");
    status.className = "canopy-status";
    status.setAttribute("role", "alert");
    status.setAttribute("aria-live", "assertive");
    this.statusEl = status;

    const form = document.createElement("form");
    form.className = "canopy-form";
    form.addEventListener("submit", (event) => this.handleSubmit(event));
    this.formEl = form;

    definition.fields.forEach((field) => {
      const { wrapper, input, errorEl } = this.createField(field);
      if (wrapper) {
        // Lets the admin preview find a field to mark it (PreviewMark).
        wrapper.dataset.fieldName = field.name;
        form.appendChild(wrapper);
      }
      this.fieldElements.set(field.name, { input, errorEl });
    });

    // The admin preview offers no autofill: it isn't where the owner's own
    // name and address go.
    if (this.options.preview) {
      form.setAttribute("autocomplete", "off");
      form.querySelectorAll("input, select, textarea").forEach((control) => control.setAttribute("autocomplete", "off"));
    }

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "canopy-submit";
    submit.textContent = (theme as { buttonText?: string }).buttonText || "Submit";
    if (this.options.preview) {
      submit.classList.add("canopy-submit-preview");
      submit.setAttribute(
        "data-preview-tooltip",
        "For preview only. No submission will be created"
      );
    }
    // Apply inline styles to defeat CSS resets like Figma's @layer figreset
    const computedStyle = getComputedStyle(this.container);
    const primaryColor = computedStyle.getPropertyValue("--canopy-primary").trim() || "#0ea5e9";
    const buttonTextColor = computedStyle.getPropertyValue("--canopy-button-text").trim() || "#ffffff";
    const radius = computedStyle.getPropertyValue("--canopy-radius").trim() || "8px";
    const buttonWidth = computedStyle.getPropertyValue("--canopy-button-width").trim() || "100%";
    submit.style.cssText = `
      display: block !important;
      width: ${buttonWidth} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${radius} !important;
      padding: 10px 16px !important;
      font-family: var(--canopy-font, inherit) !important;
      font-size: var(--canopy-font-size, 16px) !important;
      font-weight: 600 !important;
      background: ${primaryColor} !important;
      background-color: ${primaryColor} !important;
      color: ${buttonTextColor} !important;
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
    this.container.appendChild(this.renderWatermark(definition));
  }

  private renderWatermark(definition: FormDefinition | null): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "canopy-watermark";

    const brand = document.createElement("span");
    brand.className = "canopy-watermark-brand";
    brand.textContent = "Powered by Canopy Forms (Beta)";
    wrapper.appendChild(brand);

    const sep = document.createElement("span");
    sep.className = "canopy-watermark-sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "·";
    wrapper.appendChild(sep);

    const label = definition?.title || definition?.name || definition?.formId || "unknown form";
    const formId = definition?.formId || "unknown";
    const subject = `Canopy Forms issue — ${label}`;
    const body = [
      `Form: ${label}`,
      `Form ID: ${formId}`,
      "",
      "Describe the issue:",
      "",
    ].join("\n");
    const mailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const link = document.createElement("a");
    link.className = "canopy-watermark-link";
    link.href = mailto;
    link.textContent = "Report an issue";
    link.rel = "noopener";
    wrapper.appendChild(link);

    return wrapper;
  }

  private createField(field: FieldDefinition) {
    const fieldId = `${this.instanceId}-${field.name}`;

    const wrapper = document.createElement("div");
    wrapper.className = "canopy-field";

    const label = document.createElement("label");
    label.className = "canopy-label";
    // The admin preview marks a field's label alone while its box has focus.
    label.dataset.fieldPart = "label";
    label.htmlFor = fieldId;
    label.textContent = field.label || field.name;

    if (field.required) {
      const required = document.createElement("span");
      required.className = "canopy-required";
      required.textContent = " *";
      required.setAttribute("aria-hidden", "true");
      label.appendChild(required);
    }

    let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    switch (field.type) {
      case "TEXTAREA": {
        const textarea = document.createElement("textarea");
        textarea.className = "canopy-textarea";
        // Sized to the answer expected, as GOV.UK sizes it: from the limit at
        // about 60 characters a row, else GOV.UK's 5 rows.
        const limit = characterLimit(field);
        textarea.rows = limit ? Math.min(Math.max(Math.ceil(limit / 60), 4), 15) : 5;
        input = textarea;
        break;
      }
      case "DROPDOWN": {
        const options = choiceList(field.options);
        const defaultValue = Array.isArray(field.options)
          ? undefined
          : (field.options as ChoiceOptions | undefined)?.defaultValue;
        const preset = options.some((o) => o.value === defaultValue);
        const allowOther = allowsOther(field.options);

        const select = document.createElement("select");
        select.className = "canopy-select";

        // The prompt line stays in the list even under a default, greyed.
        const prompt = document.createElement("option");
        prompt.value = "";
        prompt.textContent = CHOICE_PROMPT;
        prompt.disabled = true;
        prompt.selected = !preset;
        select.appendChild(prompt);

        options.forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option.value;
          opt.textContent = option.label;
          if (preset && option.value === defaultValue) {
            opt.selected = true;
          }
          select.appendChild(opt);
        });
        
        if (allowOther) {
          const otherOpt = document.createElement("option");
          otherOpt.value = OTHER_VALUE;
          otherOpt.textContent = OTHER_LABEL;
          select.appendChild(otherOpt);
        }
        
        input = select;
        
        // If allowOther, create the "Other" text input (hidden initially)
        if (allowOther) {
          const otherInput = this.createOtherInput(field);
          
          // Show/hide other input based on selection
          select.addEventListener("change", () => {
            if (select.value === OTHER_VALUE) {
              otherInput.style.setProperty("display", "block", "important");
              if (field.required) {
                otherInput.required = true;
              }
            } else {
              otherInput.style.setProperty("display", "none", "important");
              otherInput.required = false;
              otherInput.value = "";
            }
          });
          
          // Store reference to other input for collectValues
          (select as SelectWithOther).__otherInput = otherInput;
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
        if (field.required) {
          checkbox.setAttribute("aria-required", "true");
        }
        checkbox.addEventListener("change", () => {
          checkbox.setCustomValidity("");
        });
        checkboxWrapper.appendChild(checkbox);
        const text = document.createElement("span");
        text.dataset.fieldPart = "label";
        text.textContent = field.label || field.name;
        checkboxWrapper.appendChild(text);
        wrapper.appendChild(checkboxWrapper);
        
        const help = this.createHelpText(field, fieldId);
        if (help) wrapper.appendChild(help);

        const errorEl = document.createElement("span");
        errorEl.className = "canopy-error";
        errorEl.id = `${fieldId}-error`;
        wrapper.appendChild(errorEl);
        describe(checkbox, help, errorEl);
        checkbox.setAttribute("aria-invalid", "false");
        return { wrapper, input: checkbox, errorEl };
      }
      case "CHECKBOXES": {
        const checkboxesWrapper = document.createElement("div");
        checkboxesWrapper.className = "canopy-checkboxes";
        checkboxesWrapper.setAttribute("data-checkbox-group", field.name);

        // showErrors sets validity on the first checkbox in the group, so
        // clear it there (not on the hidden pseudo-input)
        const clearError = () => {
          const firstCb = checkboxesWrapper.querySelector("input[type=checkbox]") as HTMLInputElement;
          if (firstCb) firstCb.setCustomValidity("");
        };

        const addChoice = (value: string, text: string, part: string) => {
          const itemLabel = document.createElement("label");
          itemLabel.className = "canopy-checkbox";
          itemLabel.dataset.fieldPart = part;

          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.name = field.name;
          cb.value = value;
          cb.addEventListener("change", clearError);

          const span = document.createElement("span");
          span.textContent = text;

          itemLabel.appendChild(cb);
          itemLabel.appendChild(span);
          checkboxesWrapper.appendChild(itemLabel);
          return cb;
        };

        choiceList(field.options).forEach((option, index) => {
          addChoice(option.value, option.label, `option-${index}`);
        });

        if (allowsOther(field.options)) {
          const otherCb = addChoice(OTHER_VALUE, OTHER_LABEL, "option-other");
          const otherInput = this.createOtherInput(field);
          otherInput.dataset.choiceOther = field.name;
          otherInput.addEventListener("input", clearError);
          otherCb.addEventListener("change", () => {
            if (otherCb.checked) {
              otherInput.style.setProperty("display", "block", "important");
              otherInput.focus();
            } else {
              otherInput.style.setProperty("display", "none", "important");
              otherInput.value = "";
            }
          });
          checkboxesWrapper.appendChild(otherInput);
        }

        // Hidden pseudo-input for fieldElements map (like NAME pattern)
        const pseudoCbInput = document.createElement("input");
        pseudoCbInput.type = "hidden";
        pseudoCbInput.id = fieldId;
        pseudoCbInput.name = field.name;

        // The options are one group, named by the field's label.
        label.id = `${fieldId}-label`;
        checkboxesWrapper.setAttribute("role", "group");
        checkboxesWrapper.setAttribute("aria-labelledby", label.id);
        const help = this.createHelpText(field, fieldId);
        wrapper.appendChild(label);
        if (help) wrapper.appendChild(help);
        wrapper.appendChild(checkboxesWrapper);

        const errorEl = document.createElement("span");
        errorEl.className = "canopy-error";
        errorEl.id = `${fieldId}-error`;
        wrapper.appendChild(errorEl);
        describe(checkboxesWrapper, help, errorEl);
        pseudoCbInput.setAttribute("aria-invalid", "false");
        return { wrapper, input: pseudoCbInput, errorEl };
      }
      case "EMAIL": {
        const email = document.createElement("input");
        email.type = "email";
        email.setAttribute("autocomplete", "email");
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
      case "WEBSITE": {
        // A text box with the phone's web keyboard (its / and .com), not
        // type="url", whose own check refuses an address without https://.
        const website = document.createElement("input");
        website.type = "text";
        website.className = "canopy-input";
        website.setAttribute("inputmode", "url");
        website.setAttribute("autocomplete", "url");
        website.setAttribute("autocapitalize", "none");
        website.setAttribute("autocorrect", "off");
        website.spellcheck = false;
        input = website;
        break;
      }
      case "DATE": {
        const date = document.createElement("input");
        date.type = "date";
        date.className = "canopy-input";
        // The picker greys out the days a Future or Past Date doesn't take.
        // "Today" is the visitor's date, as validateSubmission reads it.
        if (field.validation?.minDate === "today") date.min = localDate();
        if (field.validation?.maxDate === "today") date.max = localDate();
        input = date;
        break;
      }
      case "NUMBER": {
        // GOV.UK's number input: a text box with the phone's number pad, not
        // type="number", which a scroll wheel changes, which drops leading
        // zeros, and whose own range check would speak before validateField.
        const numberInput = document.createElement("input");
        numberInput.type = "text";
        numberInput.className = "canopy-input";
        numberInput.spellcheck = false;
        // iPhone pads have no minus key, which the full keyboard's numbers have.
        const numValidation = field.validation;
        const belowZero = numValidation?.min !== undefined && numValidation.min < 0;
        if (!belowZero) numberInput.setAttribute("inputmode", numValidation?.integer ? "numeric" : "decimal");
        input = numberInput;
        break;
      }
      case "NAME": {
        // Handle NAME as a composite field
        return this.createNameField(field);
      }
      case "ADDRESS": {
        return this.createAddressField(field);
      }
      case "DATE_OF_BIRTH": {
        return this.createDateOfBirthField(field);
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
    input.dataset.fieldPart = "input";
    input.setAttribute("aria-invalid", "false");
    if (field.required) {
      input.setAttribute("aria-required", "true");
    }

    const maxLength = MAX_LENGTHS[field.type];
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

    const help = this.createHelpText(field, fieldId);
    wrapper.appendChild(label);
    if (help) wrapper.appendChild(help);
    wrapper.appendChild(input);
    const limit = characterLimit(field);
    const limitNote =
      limit && input instanceof HTMLTextAreaElement ? this.addCharacterCount(wrapper, input, limit, fieldId) : undefined;
    describe(input, help, errorEl, limitNote);

    // If this is a DROPDOWN with "Other" option, add the other input
    if ((input as SelectWithOther).__otherInput) {
      wrapper.appendChild((input as SelectWithOther).__otherInput!);
    }

    wrapper.appendChild(errorEl);

    return { wrapper, input, errorEl };
  }

  /** The field's help text, or null; its id describes the field's controls. */
  private createHelpText(field: FieldDefinition, fieldId: string) {
    if (!field.helpText) return null;
    const help = document.createElement("p");
    help.className = "canopy-help-text";
    help.id = `${fieldId}-help`;
    help.textContent = field.helpText;
    return help;
  }

  /**
   * GOV.UK's character count, under a Paragraph with a limit: the characters
   * left, or how many too many. It never stops typing (the submit check holds
   * the limit), and a screen reader hears it once typing pauses rather than
   * at every key. Returns the note of the limit, which describes the box.
   */
  private addCharacterCount(wrapper: HTMLElement, textarea: HTMLTextAreaElement, limit: number, fieldId: string) {
    const note = document.createElement("p");
    note.className = "canopy-visually-hidden";
    note.id = `${fieldId}-limit`;
    note.textContent = `You can enter up to ${characters(limit)}`;

    const count = document.createElement("p");
    count.className = "canopy-count";
    count.setAttribute("aria-hidden", "true");
    const heard = document.createElement("p");
    heard.className = "canopy-visually-hidden";
    heard.setAttribute("aria-live", "polite");

    const show = () => {
      const left = limit - textarea.value.length;
      count.textContent = `You have ${characters(Math.abs(left))} ${left < 0 ? "too many" : "remaining"}`;
      count.toggleAttribute("data-over", left < 0);
    };
    let pause: ReturnType<typeof setTimeout> | undefined;
    textarea.addEventListener("input", () => {
      show();
      clearTimeout(pause);
      pause = setTimeout(() => (heard.textContent = count.textContent), 1000);
    });
    show();
    wrapper.append(note, count, heard);
    return note;
  }

  /** The box for a visitor's "Other" answer, hidden until they pick Other. */
  private createOtherInput(field: FieldDefinition) {
    const otherInput = document.createElement("input");
    otherInput.type = "text";
    otherInput.className = "canopy-input canopy-choice-other";
    otherInput.name = `${field.name}_other`;
    otherInput.placeholder = "Please specify...";
    otherInput.maxLength = OTHER_MAX_LENGTH;
    otherInput.setAttribute("aria-label", `${field.label || field.name}: ${OTHER_LABEL}`);
    otherInput.style.setProperty("display", "none", "important");

    // Clear validation state when user starts typing
    otherInput.addEventListener("input", () => {
      otherInput.setCustomValidity("");
    });
    return otherInput;
  }

  private createNameField(field: FieldDefinition) {
    const fieldId = `${this.instanceId}-${field.name}`;
    const wrapper = document.createElement("div");
    wrapper.className = "canopy-field canopy-name-group";
    wrapper.setAttribute("role", "group");

    const options = (field.options as NameOptions) || {};
    const parts = orderNameParts(options.parts || DEFAULT_NAME_PARTS);
    const requiredParts = nameRequiredParts(options, field.required);
    const fieldLabel = field.label || DEFAULT_NAME_LABEL;
    // Parts sit under the field's label ("Name" over "First" and "Last"); a
    // single input takes the label itself.
    const single = parts.includes("single");
    const help = this.createHelpText(field, fieldId);
    if (single) {
      wrapper.setAttribute("aria-label", fieldLabel);
    } else {
      const label = document.createElement("span");
      label.id = `${fieldId}-group-label`;
      label.className = "canopy-label";
      label.dataset.fieldPart = "label";
      label.textContent = fieldLabel;
      // No top-level asterisk: the middle is optional, so markers go on the parts.
      wrapper.appendChild(label);
      if (help) wrapper.appendChild(help);
      wrapper.setAttribute("aria-labelledby", label.id);
    }

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
      partWrapper.className =
        part === "middleInitial" ? "canopy-name-part canopy-name-part-initial" : "canopy-name-part";

      const partLabel = document.createElement("label");
      partLabel.className = single ? "canopy-label" : "canopy-name-part-label";
      const partId = `${fieldId}-${part}`;
      partLabel.htmlFor = partId;
      partLabel.textContent = single ? fieldLabel : namePartLabel(part, options.partLabels);
      partLabel.dataset.fieldPart = single ? "label" : `label-${part}`;
      const required = requiredParts.includes(part);

      if (required) {
        const req = document.createElement("span");
        req.className = "canopy-required";
        req.textContent = " *";
        req.setAttribute("aria-hidden", "true");
        partLabel.appendChild(req);
      }

      const partInput = document.createElement("input");
      partInput.type = "text";
      partInput.className = "canopy-input";
      partInput.id = partId;
      partInput.name = `${field.name}.${part}`;
      partInput.setAttribute("data-name-part", part);
      partInput.setAttribute("data-name-field", field.name);
      partInput.maxLength = namePartMaxLength(part);
      const token = NAME_AUTOFILL[part as NamePart];
      if (token) partInput.setAttribute("autocomplete", token);
      if (required) {
        partInput.setAttribute("aria-required", "true");
      }
      
      // Clear validation state on all siblings — error could be on any subfield.
      partInput.addEventListener("input", () => {
        nameInputsWrapper.querySelectorAll<HTMLInputElement>("input[data-name-part]")
          .forEach(el => el.setCustomValidity(""));
      });

      partWrapper.appendChild(partLabel);
      if (single && help) partWrapper.appendChild(help);
      partWrapper.appendChild(partInput);
      nameInputsWrapper.appendChild(partWrapper);
    });

    wrapper.appendChild(nameInputsWrapper);
    describe(wrapper, help, errorEl);

    wrapper.appendChild(errorEl);

    return { wrapper, input: pseudoInput, errorEl };
  }

  private createAddressField(field: FieldDefinition) {
    const fieldId = `${this.instanceId}-${field.name}`;
    const options = (field.options as AddressOptions) || {};
    const wrapper = document.createElement("div");
    wrapper.className = "canopy-field canopy-address-group";
    wrapper.setAttribute("role", "group");
    wrapper.setAttribute("aria-labelledby", `${fieldId}-group-label`);

    const label = document.createElement("span");
    label.id = `${fieldId}-group-label`;
    label.className = "canopy-label";
    label.dataset.fieldPart = "label";
    label.textContent = field.label || "Address";
    // No top-level asterisk — required markers go on individual parts

    wrapper.appendChild(label);
    const help = this.createHelpText(field, fieldId);
    if (help) wrapper.appendChild(help);

    const partsWrapper = document.createElement("div");
    partsWrapper.className = "canopy-address-parts";

    const pseudoInput = document.createElement("input");
    pseudoInput.type = "hidden";
    pseudoInput.id = fieldId;
    pseudoInput.name = field.name;

    const errorEl = document.createElement("span");
    errorEl.className = "canopy-error";
    errorEl.id = `${fieldId}-error`;

    const attrs: Record<string, Record<string, string>> = {
      postalCode: { maxlength: "10", inputmode: "numeric" },
    };

    const requiredParts = addressRequiredParts(options, field.required);
    addressParts(options).forEach((key) => {
      const required = requiredParts.includes(key);
      const partWrapper = document.createElement("div");
      // City, State, and ZIP share a row (canopy-address-part-<key>).
      partWrapper.className = `canopy-address-part canopy-address-part-${key}`;

      const partLabel = document.createElement("label");
      partLabel.className = "canopy-address-part-label";
      const partId = `${fieldId}-${key}`;
      partLabel.htmlFor = partId;
      partLabel.textContent = addressPartLabel(key, options.partLabels);
      partLabel.dataset.fieldPart = `label-${key}`;

      if (required) {
        const req = document.createElement("span");
        req.className = "canopy-required";
        req.textContent = " *";
        req.setAttribute("aria-hidden", "true");
        partLabel.appendChild(req);
      }

      let partInput: HTMLInputElement | HTMLSelectElement;

      if (key === "region") {
        const select = document.createElement("select");
        select.className = "canopy-select";

        const prompt = document.createElement("option");
        prompt.value = "";
        prompt.textContent = CHOICE_PROMPT;
        select.appendChild(prompt);

        US_STATES.forEach((state) => {
          const opt = document.createElement("option");
          opt.value = state.value;
          opt.textContent = state.label;
          select.appendChild(opt);
        });

        // Clear validation state on all siblings — error could be on any subfield.
        select.addEventListener("change", () => {
          partsWrapper.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-address-part], select[data-address-part]")
            .forEach(el => el.setCustomValidity(""));
        });

        partInput = select;
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "canopy-input";
        input.maxLength = ADDRESS_PART_MAX_LENGTH;

        // The ZIP's own attributes narrow it further.
        if (attrs[key]) {
          Object.entries(attrs[key]).forEach(([k, v]) => input.setAttribute(k, v));
        }

        // Clear validation state on all siblings — error could be on any subfield.
        input.addEventListener("input", () => {
          partsWrapper.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[data-address-part], select[data-address-part]")
            .forEach(el => el.setCustomValidity(""));
        });

        partInput = input;
      }

      partInput.id = partId;
      partInput.setAttribute("autocomplete", ADDRESS_AUTOFILL[key]);
      partInput.setAttribute("data-address-part", key);
      partInput.setAttribute("data-address-field", field.name);
      if (required) {
        partInput.setAttribute("aria-required", "true");
      }

      partWrapper.appendChild(partLabel);
      partWrapper.appendChild(partInput);
      partsWrapper.appendChild(partWrapper);
    });

    wrapper.appendChild(partsWrapper);
    describe(wrapper, help, errorEl);

    wrapper.appendChild(errorEl);

    return { wrapper, input: pseudoInput, errorEl };
  }

  /** Month, Day and Year boxes: GOV.UK's pattern for a date people know by
      heart, rather than a calendar to page back through decades. */
  private createDateOfBirthField(field: FieldDefinition) {
    const fieldId = `${this.instanceId}-${field.name}`;
    const wrapper = document.createElement("div");
    wrapper.className = "canopy-field canopy-dob-group";
    wrapper.setAttribute("role", "group");

    const label = document.createElement("span");
    label.id = `${fieldId}-group-label`;
    label.className = "canopy-label";
    label.dataset.fieldPart = "label";
    label.textContent = field.label || field.name;
    if (field.required) {
      const required = document.createElement("span");
      required.className = "canopy-required";
      required.textContent = " *";
      required.setAttribute("aria-hidden", "true");
      label.appendChild(required);
    }
    wrapper.appendChild(label);
    wrapper.setAttribute("aria-labelledby", label.id);
    const help = this.createHelpText(field, fieldId);
    if (help) wrapper.appendChild(help);

    const boxes = document.createElement("div");
    boxes.className = "canopy-dob-parts";

    const pseudoInput = document.createElement("input");
    pseudoInput.type = "hidden";
    pseudoInput.id = fieldId;
    pseudoInput.name = field.name;

    const errorEl = document.createElement("span");
    errorEl.className = "canopy-error";
    errorEl.id = `${fieldId}-error`;

    DATE_OF_BIRTH_PARTS.forEach(([part, text, length, token]) => {
      const partWrapper = document.createElement("div");
      partWrapper.className = `canopy-dob-part canopy-dob-part-${part}`;

      const partId = `${fieldId}-${part}`;
      const partLabel = document.createElement("label");
      partLabel.className = "canopy-dob-part-label";
      partLabel.htmlFor = partId;
      partLabel.textContent = text;

      const box = document.createElement("input");
      box.type = "text";
      box.className = "canopy-input";
      box.id = partId;
      box.name = `${field.name}.${part}`;
      box.maxLength = length;
      box.setAttribute("inputmode", "numeric");
      box.setAttribute("autocomplete", token);
      box.setAttribute("data-dob-part", part);
      box.setAttribute("data-dob-field", field.name);
      if (field.required) box.setAttribute("aria-required", "true");
      // The error can be on any box.
      box.addEventListener("input", () => this.partsOf(field.name).forEach((el) => el.setCustomValidity("")));

      partWrapper.appendChild(partLabel);
      partWrapper.appendChild(box);
      boxes.appendChild(partWrapper);
    });

    wrapper.appendChild(boxes);
    describe(wrapper, help, errorEl);
    wrapper.appendChild(errorEl);

    return { wrapper, input: pseudoInput, errorEl };
  }

  /** The boxes and lists of a field made of parts (Name, Address, Date of birth). */
  private partsOf(name: string) {
    return this.container.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      `input[data-name-field="${name}"], input[data-address-field="${name}"], select[data-address-field="${name}"], input[data-dob-field="${name}"]`
    );
  }

  private collectValues() {
    const data: Record<string, unknown> = {};
    this.fieldElements.forEach((element, name) => {
      if (element.input instanceof HTMLInputElement) {
        if (element.input.type === "checkbox") {
          data[name] = element.input.checked;
        } else if (element.input.type === "hidden") {
          // Check if this is a CHECKBOXES field
          const checkboxGroup = this.container.querySelector(
            `[data-checkbox-group="${name}"]`
          );
          // A Date of birth joins its boxes.
          const dateOfBirthBoxes = this.container.querySelectorAll<HTMLInputElement>(`input[data-dob-field="${name}"]`);
          if (dateOfBirthBoxes.length > 0) {
            data[name] = joinDateOfBirth([...dateOfBirthBoxes]);
          } else if (checkboxGroup) {
            const checked: string[] = [];
            checkboxGroup.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked").forEach((cb) => {
              if (cb.value !== OTHER_VALUE) {
                checked.push(cb.value);
                return;
              }
              // Other counts once the visitor has typed it.
              const typed = checkboxGroup.querySelector<HTMLInputElement>("[data-choice-other]")?.value.trim();
              if (typed) checked.push(typed);
            });
            data[name] = checked;
          } else {
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
              // Check if this is an ADDRESS field
              const addressInputs = this.container.querySelectorAll(
                `input[data-address-field="${name}"], select[data-address-field="${name}"]`
              );
              if (addressInputs.length > 0) {
                const addrValue: Record<string, string> = {};
                addressInputs.forEach((el) => {
                  const part = (el as HTMLElement).getAttribute("data-address-part");
                  if (part) addrValue[part] = (el as HTMLInputElement | HTMLSelectElement).value;
                });
                data[name] = addrValue;
              } else {
                data[name] = element.input.value;
              }
            }
          }
        } else {
          data[name] = element.input.value;
        }
      } else if (element.input instanceof HTMLSelectElement) {
        // Check if "Other" option was selected
        if (element.input.value === OTHER_VALUE && (element.input as SelectWithOther).__otherInput) {
          data[name] = (element.input as SelectWithOther).__otherInput!.value;
        } else {
          data[name] = element.input.value;
        }
      } else {
        data[name] = element.input.value;
      }
    });
    return data;
  }

  /**
   * For composite fields (NAME, ADDRESS), find the first subfield that is
   * required and empty, or longer than it takes (a value a script set past
   * its maxlength): the one the validation error refers to. Falls back to
   * the first subfield if none fails.
   */
  private findFailingInput(name: string): HTMLInputElement | HTMLSelectElement | null {
    // DATE_OF_BIRTH: the first empty box, else a year short of 4 numbers,
    // else Month, for the date as a whole.
    const dateOfBirthBoxes = [...this.container.querySelectorAll<HTMLInputElement>(`input[data-dob-field="${name}"]`)];
    if (dateOfBirthBoxes.length > 0) {
      const [month, , year] = dateOfBirthBoxes;
      return (
        dateOfBirthBoxes.find((box) => !box.value.trim()) ?? (/^\d{4}$/.test(year.value.trim()) ? month : year)
      );
    }

    // NAME field
    const nameInputs = this.container.querySelectorAll<HTMLInputElement>(
      `input[data-name-field="${name}"]`
    );
    // Required parts carry aria-required.
    const fails = (input: HTMLInputElement | HTMLSelectElement) =>
      (input.getAttribute("aria-required") === "true" && !input.value.trim()) ||
      (input instanceof HTMLInputElement && input.maxLength > 0 && input.value.length > input.maxLength);
    if (nameInputs.length > 0) {
      for (const input of nameInputs) {
        if (fails(input)) return input;
      }
      return nameInputs[0];
    }

    // ADDRESS field
    const addressInputs = this.container.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      `input[data-address-field="${name}"], select[data-address-field="${name}"]`
    );
    if (addressInputs.length > 0) {
      for (const input of addressInputs) {
        if (fails(input)) return input;
      }
      // All required parts filled — format errors currently only apply to postalCode.
      for (const input of addressInputs) {
        if (input.getAttribute("data-address-part") === "postalCode") return input;
      }
      return addressInputs[0];
    }

    return null;
  }

  private showErrors(errors: Record<string, string>) {
    // Set custom validity on all fields
    this.fieldElements.forEach((element, name) => {
      const message = errors[name] || "";

      // For hidden pseudo-inputs (NAME, CHECKBOXES, ADDRESS), set validity on the right visible input
      if (element.input.type === "hidden") {
        const checkboxGroup = this.container.querySelector(
          `[data-checkbox-group="${name}"]`
        );
        if (checkboxGroup) {
          const firstCb = checkboxGroup.querySelector("input[type=checkbox]") as HTMLInputElement;
          if (firstCb) {
            firstCb.setCustomValidity(message);
          }
        } else {
          const target = message ? this.findFailingInput(name) : null;
          if (target) {
            target.setCustomValidity(message);
          } else {
            // Clear: reset all subfield validities
            this.partsOf(name).forEach((el) => el.setCustomValidity(""));
          }
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
        if (firstErrorField.input.type === "hidden") {
          const checkboxGroup = this.container.querySelector(
            `[data-checkbox-group="${errorKeys[0]}"]`
          );
          if (checkboxGroup) {
            const firstCb = checkboxGroup.querySelector("input[type=checkbox]") as HTMLInputElement;
            if (firstCb) {
              firstCb.reportValidity();
              firstCb.focus();
            }
          } else {
            const target = this.findFailingInput(errorKeys[0]);
            if (target) {
              target.reportValidity();
              target.focus();
            }
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
    
    // Clear any previous validation state (including visible inputs for pseudo-input fields)
    this.fieldElements.forEach((element, name) => {
      element.input.setCustomValidity("");
      if (element.input.type === "hidden") {
        const checkboxGroup = this.container.querySelector(
          `[data-checkbox-group="${name}"]`
        );
        if (checkboxGroup) {
          const firstCb = checkboxGroup.querySelector("input[type=checkbox]") as HTMLInputElement;
          if (firstCb) firstCb.setCustomValidity("");
        } else {
          // Clear all subfield validities (validity may be on any subfield)
          this.partsOf(name).forEach((el) => el.setCustomValidity(""));
        }
      }
    });

    const values = this.collectValues();
    const errors = validateSubmission(this.formDefinition.fields, values);
    this.showErrors(errors);

    if (Object.keys(errors).length > 0) {
      const count = Object.keys(errors).length;
      this.setStatus(`Please fix ${count} field${count > 1 ? "s" : ""} to continue.`, "error");
      return;
    }

    // The preview checks answers as the live form does, and stops there: no
    // submission.
    if (this.options.preview) return;

    if (this.submitButton) {
      this.submitButton.disabled = true;
      this.submitButton.textContent = "Submitting...";
      this.submitButton.style.opacity = "0.6";
      this.submitButton.style.cursor = "not-allowed";
    }

    try {
      const baseUrl = this.options.baseUrl || "";
      const formId = this.options.formId || this.formDefinition?.formId;
      if (!formId) {
        this.setStatus("Form configuration error.", "error");
        return;
      }
      const response = await fetch(
        `${baseUrl}/api/embed/${formId}`,
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

      (event.target as HTMLFormElement).reset();
      this.renderSuccess(
        this.formDefinition.successMessage || "Thanks for your submission!"
      );
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

  private renderSuccess(message: string) {
    if (this.statusEl) {
      this.statusEl.textContent = "";
      this.statusEl.className = "canopy-status";
    }
    if (this.formEl) {
      this.formEl.style.display = "none";
    }

    const existing = this.container.querySelector(".canopy-success");
    if (existing) {
      existing.remove();
    }

    const card = document.createElement("div");
    card.className = "canopy-success";
    card.setAttribute("role", "status");
    card.setAttribute("aria-live", "polite");

    const iconWrap = document.createElement("div");
    iconWrap.className = "canopy-success-icon";
    iconWrap.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    card.appendChild(iconWrap);

    const text = document.createElement("p");
    text.className = "canopy-success-message";
    text.textContent = message;
    card.appendChild(text);

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "canopy-success-reset";
    resetButton.textContent = "Submit another response";
    resetButton.addEventListener("click", () => {
      if (this.formDefinition) {
        this.render(this.formDefinition);
      }
    });
    card.appendChild(resetButton);

    this.container.appendChild(card);
  }

  private renderSkeleton() {
    this.container.innerHTML = "";

    const skeleton = document.createElement("div");
    skeleton.className = "canopy-skeleton";

    const fields = [
      { labelW: "30%", type: "input" },
      { labelW: "45%", type: "input" },
      { labelW: "25%", type: "textarea" },
    ];

    let delay = 0;

    // Title + description ghost bars
    const title = document.createElement("div");
    title.className = "canopy-skeleton-bar canopy-skeleton-title";
    title.style.animationDelay = `${delay}s`;
    skeleton.appendChild(title);
    delay += 0.15;

    const desc = document.createElement("div");
    desc.className = "canopy-skeleton-bar canopy-skeleton-desc";
    desc.style.animationDelay = `${delay}s`;
    skeleton.appendChild(desc);
    delay += 0.15;

    // Fields
    for (const f of fields) {
      const fieldWrap = document.createElement("div");
      fieldWrap.className = "canopy-skeleton-field";

      const label = document.createElement("div");
      label.className = "canopy-skeleton-bar canopy-skeleton-label";
      label.style.width = f.labelW;
      label.style.animationDelay = `${delay}s`;
      fieldWrap.appendChild(label);
      delay += 0.1;

      const input = document.createElement("div");
      input.className = `canopy-skeleton-bar canopy-skeleton-${f.type}`;
      input.style.animationDelay = `${delay}s`;
      fieldWrap.appendChild(input);
      delay += 0.15;

      skeleton.appendChild(fieldWrap);
    }

    // Button
    const btn = document.createElement("div");
    btn.className = "canopy-skeleton-bar canopy-skeleton-button";
    btn.style.animationDelay = `${delay}s`;
    skeleton.appendChild(btn);

    this.container.appendChild(skeleton);
  }

  private renderError(message: string) {
    this.container.innerHTML = "";
    const status = document.createElement("div");
    status.className = "canopy-status canopy-status-error";
    status.textContent = message;
    this.container.appendChild(status);
    this.container.appendChild(this.renderWatermark(this.formDefinition));
  }

  private renderInactive() {
    this.container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "canopy-inactive";
    wrap.setAttribute("role", "status");

    const heading = document.createElement("h2");
    heading.className = "canopy-inactive-heading";
    heading.textContent = "Form Not Available";
    wrap.appendChild(heading);

    const body = document.createElement("p");
    body.className = "canopy-inactive-body";
    body.textContent =
      "This form is not currently accepting responses. Please contact the form owner if you believe this is an error.";
    wrap.appendChild(body);

    this.container.appendChild(wrap);
    this.container.appendChild(this.renderWatermark(this.formDefinition));
  }

  private renderHostedOnly() {
    this.container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "canopy-inactive";
    wrap.setAttribute("role", "status");

    const heading = document.createElement("h2");
    heading.className = "canopy-inactive-heading";
    heading.textContent = "Form Not Available";
    wrap.appendChild(heading);

    const body = document.createElement("p");
    body.className = "canopy-inactive-body";
    body.textContent =
      "This form is only available at its hosted URL and cannot be embedded. Please contact the form owner.";
    wrap.appendChild(body);

    this.container.appendChild(wrap);
    this.container.appendChild(this.renderWatermark(this.formDefinition));
  }
}
