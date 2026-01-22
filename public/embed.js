"use strict";(()=>{var d={fontFamily:"inherit",text:"#18181b",background:"#ffffff",primary:"#0ea5e9",border:"#e4e4e7",radius:8,density:"normal",fontUrl:void 0},h=new Set;function m(r,t){if(!r)return t;let e=r.trim();return e?/^var\(/i.test(e)||/^rgb/i.test(e)||/^hsl/i.test(e)||/^color\(/i.test(e)||/^(transparent|currentcolor|inherit)$/i.test(e)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e)?e:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e)?`#${e}`:t:t}function b(r,t){return{...d,...r!=null?r:{},...t!=null?t:{}}}function g(r,t){var e;r.style.setProperty("--cof-font",t.fontFamily||"inherit"),r.style.setProperty("--cof-text",m(t.text,d.text)),r.style.setProperty("--cof-bg",m(t.background,d.background)),r.style.setProperty("--cof-primary",m(t.primary,d.primary)),r.style.setProperty("--cof-border",m(t.border,d.border)),r.style.setProperty("--cof-radius",`${(e=t.radius)!=null?e:d.radius}px`)}function y(r){switch(r.density){case"compact":return"cof-density-compact";case"comfortable":return"cof-density-comfortable";default:return"cof-density-normal"}}function E(r){if(!r||h.has(r))return;let t=document.createElement("link");t.rel="stylesheet",t.href=r,t.dataset.cofFont="true",document.head.appendChild(t),h.add(r)}function k(r){return r.label||r.name}function x(r,t){let e={};return r.forEach(n=>{var c;let o=t[n.name],s=k(n);if(n.required){if(n.type==="CHECKBOX"){if(!o){e[n.name]=`${s} is required.`;return}}else if(o==null||String(o).trim()===""){e[n.name]=`${s} is required.`;return}}if(!(o==null||String(o).trim()==="")){if(n.type==="EMAIL"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(o))){e[n.name]=`${s} must be a valid email address.`;return}if(n.type==="SELECT"&&((c=n.options)!=null&&c.length)&&!n.options.map(a=>a.value).includes(String(o))){e[n.name]=`${s} must be a valid option.`;return}if(n.validation){let i=String(o);if(typeof n.validation.minLength=="number"&&i.length<n.validation.minLength){e[n.name]=n.validation.message||`${s} must be at least ${n.validation.minLength} characters.`;return}if(typeof n.validation.maxLength=="number"&&i.length>n.validation.maxLength){e[n.name]=n.validation.message||`${s} must be at most ${n.validation.maxLength} characters.`;return}if(n.validation.pattern)try{new RegExp(n.validation.pattern).test(i)||(e[n.name]=n.validation.message||`${s} is invalid.`)}catch(a){}}}}),e}var S=0,p=class{constructor(t,e){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`cof-${S++}`;this.container=t,this.options=e}async init(){try{this.container.classList.add("cof-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",e=await fetch(`${t}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,{method:"GET",credentials:"omit"});if(!e.ok)throw new Error("Failed to load form definition");return e.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let e=b(t.defaultTheme,this.options.themeOverrides);if(g(this.container,e),E(e.fontUrl),this.container.classList.remove("cof-density-compact","cof-density-normal","cof-density-comfortable"),this.container.classList.add(y(e)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}let n=document.createElement("div");n.className="cof-status",n.setAttribute("role","status"),this.statusEl=n;let o=document.createElement("form");o.className="cof-form",o.addEventListener("submit",a=>this.handleSubmit(a)),t.fields.forEach(a=>{let{wrapper:l,input:u,errorEl:T}=this.createField(a);l&&o.appendChild(l),this.fieldElements.set(a.name,{input:u,errorEl:T})});let s=document.createElement("button");s.type="submit",s.className="cof-submit",s.textContent="Submit";let c=getComputedStyle(this.container).getPropertyValue("--cof-primary").trim()||"#0ea5e9",i=getComputedStyle(this.container).getPropertyValue("--cof-radius").trim()||"8px";s.style.cssText=`
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${i} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${c} !important;
      background-color: ${c} !important;
      color: #ffffff !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=s,o.appendChild(s),this.container.appendChild(n),this.container.appendChild(o)}createField(t){let e=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let i=document.createElement("input");i.type="hidden",i.name=t.name,i.id=e;let a=document.createElement("span");return{wrapper:null,input:i,errorEl:a}}let n=document.createElement("div");n.className="cof-field";let o=document.createElement("label");if(o.className="cof-label",o.htmlFor=e,o.textContent=t.label||t.name,t.required){let i=document.createElement("span");i.className="cof-required",i.textContent=" *",o.appendChild(i)}let s;switch(t.type){case"TEXTAREA":{let i=document.createElement("textarea");i.className="cof-textarea",i.rows=4,s=i;break}case"SELECT":{let i=document.createElement("select");i.className="cof-select",(t.options||[]).forEach(a=>{let l=document.createElement("option");l.value=a.value,l.textContent=a.label,i.appendChild(l)}),s=i;break}case"CHECKBOX":{let i=document.createElement("label");i.className="cof-checkbox";let a=document.createElement("input");a.type="checkbox",a.id=e,a.name=t.name,i.appendChild(a);let l=document.createElement("span");l.textContent=t.label||t.name,i.appendChild(l),n.appendChild(i);let u=document.createElement("span");return u.className="cof-error",u.id=`${e}-error`,n.appendChild(u),a.setAttribute("aria-describedby",u.id),a.setAttribute("aria-invalid","false"),{wrapper:n,input:a,errorEl:u}}case"EMAIL":{let i=document.createElement("input");i.type="email",i.className="cof-input",s=i;break}default:{let i=document.createElement("input");i.type="text",i.className="cof-input",s=i}}s.id=e,s.name=t.name,s.setAttribute("aria-invalid","false"),t.placeholder&&s.setAttribute("placeholder",t.placeholder);let c=document.createElement("span");return c.className="cof-error",c.id=`${e}-error`,s.setAttribute("aria-describedby",c.id),n.appendChild(o),n.appendChild(s),n.appendChild(c),{wrapper:n,input:s,errorEl:c}}collectValues(){let t={};return this.fieldElements.forEach((e,n)=>{e.input instanceof HTMLInputElement?e.input.type==="checkbox"?t[n]=e.input.checked:t[n]=e.input.value:(e.input instanceof HTMLSelectElement,t[n]=e.input.value)}),t}showErrors(t){this.fieldElements.forEach((e,n)=>{let o=t[n];e.errorEl.textContent=o||"",e.input.setAttribute("aria-invalid",o?"true":"false")})}setStatus(t,e){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`cof-status cof-status-${e}`)}async handleSubmit(t){if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info");let e=this.collectValues(),n=x(this.formDefinition.fields,e);if(this.showErrors(n),Object.keys(n).length>0){this.setStatus("Please fix the highlighted fields.","error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let o=this.options.baseUrl||"",s=await fetch(`${o}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),c=await s.json();if(!s.ok){c!=null&&c.fields&&this.showErrors(c.fields),this.setStatus((c==null?void 0:c.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(o){console.error(o),this.setStatus("Submission failed. Please try again.","error")}finally{this.submitButton&&(this.submitButton.disabled=!1,this.submitButton.textContent="Submit",this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer")}}renderError(t){this.container.innerHTML="";let e=document.createElement("div");e.className="cof-status cof-status-error",e.textContent=t,this.container.appendChild(e)}};var v=`
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

.cof-root .cof-input,
.cof-root .cof-textarea,
.cof-root .cof-select {
  display: block !important;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--cof-radius, 8px);
  border: 1px solid var(--cof-border, #e4e4e7) !important;
  padding: 10px 12px;
  font-size: 14px;
  background: #ffffff !important;
  color: inherit;
  min-height: 40px;
  opacity: 1 !important;
  visibility: visible !important;
}

.cof-root .cof-textarea {
  min-height: 80px;
  resize: vertical;
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
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-radius: var(--cof-radius, 8px);
  padding: 10px 16px;
  font-size: 14px;
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
  font-size: 14px;
}

.cof-status.cof-status-error {
  color: #dc2626;
}

.cof-status.cof-status-success {
  color: #16a34a;
}
`;var C="cof-embed-styles";function L(){if(document.getElementById(C))return;let r=document.createElement("style");r.id=C,r.textContent=v,document.head.appendChild(r)}function F(r){var t,e;return r.dataset.siteKey||r.dataset.apiKey||((t=document.querySelector("script[data-site-key], script[data-api-key]"))==null?void 0:t.getAttribute("data-site-key"))||((e=document.querySelector("script[data-site-key], script[data-api-key]"))==null?void 0:e.getAttribute("data-api-key"))||""}function w(r){var t;return r.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function $(r){let t=r.dataset.theme;if(t)try{return JSON.parse(t)}catch(e){console.warn("Can-O-Forms: invalid data-theme JSON");return}}function f(){L(),Array.from(document.querySelectorAll("[data-can-o-form]")).forEach(t=>{if(t.dataset.cofInitialized==="true"){console.warn("Can-O-Forms: container already initialized");return}let e=t.dataset.canOForm;if(!e){console.error("Can-O-Forms: missing data-can-o-form attribute");return}let n=F(t);if(!n){console.error("Can-O-Forms: missing site API key");return}t.dataset.cofInitialized="true";let o=$(t),s=w(t);new p(t,{apiKey:n,formSlug:e,themeOverrides:o,baseUrl:s}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",f):f();window.CanOForms={init:f};})();
