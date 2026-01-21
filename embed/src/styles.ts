export const baseStyles = `
.cof-root {
  font-family: var(--cof-font, inherit);
  color: var(--cof-text, #18181b);
  background: var(--cof-bg, #ffffff);
}

.cof-form {
  display: grid;
  gap: 16px;
}

.cof-density-compact .cof-form {
  gap: 10px;
}

.cof-density-comfortable .cof-form {
  gap: 20px;
}

.cof-field {
  display: grid;
  gap: 6px;
}

.cof-label {
  font-size: 14px;
  font-weight: 500;
}

.cof-required {
  color: var(--cof-primary, #0ea5e9);
}

.cof-input,
.cof-textarea,
.cof-select {
  width: 100%;
  border-radius: var(--cof-radius, 8px);
  border: 1px solid var(--cof-border, #e4e4e7);
  padding: 10px 12px;
  font-size: 14px;
  background: #ffffff;
  color: inherit;
}

.cof-input:focus,
.cof-textarea:focus,
.cof-select:focus {
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

.cof-submit {
  border: none;
  border-radius: var(--cof-radius, 8px);
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  background: var(--cof-primary, #0ea5e9);
  color: #ffffff;
  cursor: pointer;
}

.cof-submit[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.cof-status {
  font-size: 14px;
}

.cof-status.cof-status-error {
  color: #dc2626;
}

.cof-status.cof-status-success {
  color: #16a34a;
}
`;
