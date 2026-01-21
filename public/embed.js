"use strict";(()=>{var u={fontFamily:"inherit",text:"#18181b",background:"#ffffff",primary:"#0ea5e9",border:"#e4e4e7",radius:8,density:"normal",fontUrl:void 0},p=new Set;function h(i,t){return{...u,...i!=null?i:{},...t!=null?t:{}}}function b(i,t){var e;i.style.setProperty("--cof-font",t.fontFamily||"inherit"),i.style.setProperty("--cof-text",t.text||u.text),i.style.setProperty("--cof-bg",t.background||u.background),i.style.setProperty("--cof-primary",t.primary||u.primary),i.style.setProperty("--cof-border",t.border||u.border),i.style.setProperty("--cof-radius",`${(e=t.radius)!=null?e:u.radius}px`)}function g(i){switch(i.density){case"compact":return"cof-density-compact";case"comfortable":return"cof-density-comfortable";default:return"cof-density-normal"}}function y(i){if(!i||p.has(i))return;let t=document.createElement("link");t.rel="stylesheet",t.href=i,t.dataset.cofFont="true",document.head.appendChild(t),p.add(i)}function T(i){return i.label||i.name}function E(i,t){let e={};return i.forEach(n=>{var a;let s=t[n.name],o=T(n);if(n.required){if(n.type==="CHECKBOX"){if(!s){e[n.name]=`${o} is required.`;return}}else if(s==null||String(s).trim()===""){e[n.name]=`${o} is required.`;return}}if(!(s==null||String(s).trim()==="")){if(n.type==="EMAIL"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s))){e[n.name]=`${o} must be a valid email address.`;return}if(n.type==="SELECT"&&((a=n.options)!=null&&a.length)&&!n.options.map(c=>c.value).includes(String(s))){e[n.name]=`${o} must be a valid option.`;return}if(n.validation){let r=String(s);if(typeof n.validation.minLength=="number"&&r.length<n.validation.minLength){e[n.name]=n.validation.message||`${o} must be at least ${n.validation.minLength} characters.`;return}if(typeof n.validation.maxLength=="number"&&r.length>n.validation.maxLength){e[n.name]=n.validation.message||`${o} must be at most ${n.validation.maxLength} characters.`;return}if(n.validation.pattern)try{new RegExp(n.validation.pattern).test(r)||(e[n.name]=n.validation.message||`${o} is invalid.`)}catch(c){}}}}),e}var k=0,m=class{constructor(t,e){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`cof-${k++}`;this.container=t,this.options=e}async init(){try{this.container.classList.add("cof-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",e=await fetch(`${t}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,{method:"GET",credentials:"omit"});if(!e.ok)throw new Error("Failed to load form definition");return e.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let e=h(t.defaultTheme,this.options.themeOverrides);if(b(this.container,e),y(e.fontUrl),this.container.classList.remove("cof-density-compact","cof-density-normal","cof-density-comfortable"),this.container.classList.add(g(e)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}let n=document.createElement("div");n.className="cof-status",n.setAttribute("role","status"),this.statusEl=n;let s=document.createElement("form");s.className="cof-form",s.addEventListener("submit",a=>this.handleSubmit(a)),t.fields.forEach(a=>{let{wrapper:r,input:c,errorEl:l}=this.createField(a);r&&s.appendChild(r),this.fieldElements.set(a.name,{input:c,errorEl:l})});let o=document.createElement("button");o.type="submit",o.className="cof-submit",o.textContent="Submit",this.submitButton=o,s.appendChild(o),this.container.appendChild(n),this.container.appendChild(s)}createField(t){let e=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let r=document.createElement("input");r.type="hidden",r.name=t.name,r.id=e;let c=document.createElement("span");return{wrapper:null,input:r,errorEl:c}}let n=document.createElement("div");n.className="cof-field";let s=document.createElement("label");if(s.className="cof-label",s.htmlFor=e,s.textContent=t.label||t.name,t.required){let r=document.createElement("span");r.className="cof-required",r.textContent=" *",s.appendChild(r)}let o;switch(t.type){case"TEXTAREA":{let r=document.createElement("textarea");r.className="cof-textarea",r.rows=4,o=r;break}case"SELECT":{let r=document.createElement("select");r.className="cof-select",(t.options||[]).forEach(c=>{let l=document.createElement("option");l.value=c.value,l.textContent=c.label,r.appendChild(l)}),o=r;break}case"CHECKBOX":{let r=document.createElement("label");r.className="cof-checkbox";let c=document.createElement("input");c.type="checkbox",c.id=e,c.name=t.name,r.appendChild(c);let l=document.createElement("span");l.textContent=t.label||t.name,r.appendChild(l),n.appendChild(r);let d=document.createElement("span");return d.className="cof-error",d.id=`${e}-error`,n.appendChild(d),c.setAttribute("aria-describedby",d.id),c.setAttribute("aria-invalid","false"),{wrapper:n,input:c,errorEl:d}}case"EMAIL":{let r=document.createElement("input");r.type="email",r.className="cof-input",o=r;break}default:{let r=document.createElement("input");r.type="text",r.className="cof-input",o=r}}o.id=e,o.name=t.name,o.setAttribute("aria-invalid","false"),t.placeholder&&o.setAttribute("placeholder",t.placeholder);let a=document.createElement("span");return a.className="cof-error",a.id=`${e}-error`,o.setAttribute("aria-describedby",a.id),n.appendChild(s),n.appendChild(o),n.appendChild(a),{wrapper:n,input:o,errorEl:a}}collectValues(){let t={};return this.fieldElements.forEach((e,n)=>{e.input instanceof HTMLInputElement?e.input.type==="checkbox"?t[n]=e.input.checked:t[n]=e.input.value:(e.input instanceof HTMLSelectElement,t[n]=e.input.value)}),t}showErrors(t){this.fieldElements.forEach((e,n)=>{let s=t[n];e.errorEl.textContent=s||"",e.input.setAttribute("aria-invalid",s?"true":"false")})}setStatus(t,e){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`cof-status cof-status-${e}`)}async handleSubmit(t){if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info");let e=this.collectValues(),n=E(this.formDefinition.fields,e);if(this.showErrors(n),Object.keys(n).length>0){this.setStatus("Please fix the highlighted fields.","error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...");try{let s=this.options.baseUrl||"",o=await fetch(`${s}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),a=await o.json();if(!o.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(s){console.error(s),this.setStatus("Submission failed. Please try again.","error")}finally{this.submitButton&&(this.submitButton.disabled=!1,this.submitButton.textContent="Submit")}}renderError(t){this.container.innerHTML="";let e=document.createElement("div");e.className="cof-status cof-status-error",e.textContent=t,this.container.appendChild(e)}};var x=`
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
`;var v="cof-embed-styles";function C(){if(document.getElementById(v))return;let i=document.createElement("style");i.id=v,i.textContent=x,document.head.appendChild(i)}function L(i){var t,e;return i.dataset.siteKey||i.dataset.apiKey||((t=document.querySelector("script[data-site-key], script[data-api-key]"))==null?void 0:t.getAttribute("data-site-key"))||((e=document.querySelector("script[data-site-key], script[data-api-key]"))==null?void 0:e.getAttribute("data-api-key"))||""}function S(i){var t;return i.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function F(i){let t=i.dataset.theme;if(t)try{return JSON.parse(t)}catch(e){console.warn("Can-O-Forms: invalid data-theme JSON");return}}function f(){C(),Array.from(document.querySelectorAll("[data-can-o-form]")).forEach(t=>{if(t.dataset.cofInitialized==="true"){console.warn("Can-O-Forms: container already initialized");return}let e=t.dataset.canOForm;if(!e){console.error("Can-O-Forms: missing data-can-o-form attribute");return}let n=L(t);if(!n){console.error("Can-O-Forms: missing site API key");return}t.dataset.cofInitialized="true";let s=F(t),o=S(t);new m(t,{apiKey:n,formSlug:e,themeOverrides:s,baseUrl:o}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",f):f();window.CanOForms={init:f};})();
