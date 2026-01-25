export const baseStyles = `
.cof-root {
  font-family: var(--cof-font, inherit);
  font-size: var(--cof-font-size, 14px);
  color: var(--cof-text, #18181b);
  background: var(--cof-bg, #ffffff);
  padding: 4px;
}

.cof-form {
  display: grid;
  gap: 16px;
}

.cof-form-actions {
  display: flex;
  justify-content: var(--cof-button-align, left);
}

.cof-density-compact .cof-form {
  gap: 8px;
}

.cof-density-comfortable .cof-form {
  gap: 24px;
}

.cof-field {
  display: grid;
  gap: 6px;
}

.cof-label {
  font-size: var(--cof-font-size, 14px);
  font-weight: 500;
}

.cof-required {
  color: var(--cof-primary, #0ea5e9);
}

.cof-root .cof-input,
.cof-root .cof-textarea,
.cof-root .cof-select {
  display: block !important;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--cof-radius, 8px);
  border: 1px solid var(--cof-border, #e4e4e7) !important;
  padding: 10px 12px;
  font-size: var(--cof-font-size, 14px);
  background: #ffffff !important;
  color: inherit;
  min-height: 40px;
  opacity: 1 !important;
  visibility: visible !important;
}

.cof-root .cof-textarea {
  min-height: 80px;
  resize: none;
}

.cof-root .cof-input:focus,
.cof-root .cof-textarea:focus,
.cof-root .cof-select:focus {
  outline: 2px solid var(--cof-primary, #0ea5e9);
  outline-offset: 2px;
}

.cof-error {
  font-size: 12px;
  color: #dc2626;
  min-height: 16px;
}

.cof-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cof-root .cof-submit {
  display: block;
  width: var(--cof-button-width, 100%);
  box-sizing: border-box;
  border: none;
  border-radius: var(--cof-radius, 8px);
  padding: 10px 16px;
  font-size: var(--cof-font-size, 14px);
  font-weight: 600;
  background: var(--cof-primary, #0ea5e9);
  color: #ffffff;
  cursor: pointer;
  min-height: 40px;
}

.cof-root .cof-submit[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.cof-status {
  font-size: var(--cof-font-size, 14px);
}

.cof-status.cof-status-error {
  color: #dc2626;
}

.cof-status.cof-status-success {
  color: #16a34a;
}
`;
