"use strict";(()=>{var f={fontFamily:"inherit",fontSize:14,text:"#18181b",background:"#ffffff",primary:"#0ea5e9",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",fontUrl:void 0,buttonText:void 0},x=new Set;function p(o,t){if(!o)return t;let e=o.trim();return e?/^var\(/i.test(e)||/^rgb/i.test(e)||/^hsl/i.test(e)||/^color\(/i.test(e)||/^(transparent|currentcolor|inherit)$/i.test(e)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e)?e:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e)?`#${e}`:t:t}function E(o,t){return{...f,...o!=null?o:{},...t!=null?t:{}}}function v(o,t){var e,n;o.style.setProperty("--cof-font",t.fontFamily||"inherit"),o.style.setProperty("--cof-font-size",`${(e=t.fontSize)!=null?e:f.fontSize}px`),o.style.setProperty("--cof-text",p(t.text,f.text)),o.style.setProperty("--cof-bg",p(t.background,f.background)),o.style.setProperty("--cof-primary",p(t.primary,f.primary)),o.style.setProperty("--cof-border",p(t.border,f.border)),o.style.setProperty("--cof-radius",`${(n=t.radius)!=null?n:f.radius}px`),o.style.setProperty("--cof-button-width",t.buttonWidth==="auto"?"auto":"100%"),o.style.setProperty("--cof-button-align",t.buttonAlign||f.buttonAlign)}function T(o){switch(o.density){case"compact":return"cof-density-compact";case"comfortable":return"cof-density-comfortable";default:return"cof-density-normal"}}function L(o){if(!o||x.has(o))return;let t=document.createElement("link");t.rel="stylesheet",t.href=o,t.dataset.cofFont="true",document.head.appendChild(t),x.add(o)}var w={TEXT:200,EMAIL:254,TEXTAREA:2e3};function h(o){var t;return(t=o.validation)!=null&&t.maxLength?o.validation.maxLength:w[o.type]}function F(o){return o.label||o.name}function S(o,t){let e={};return o.forEach(n=>{var i,a,l,d;let s=t[n.name],r=F(n);if(n.required){if(n.type==="CHECKBOX"){if(!s){e[n.name]=`${r} is required.`;return}}else if(s==null||String(s).trim()===""){e[n.name]=`${r} is required.`;return}}if(s==null||String(s).trim()==="")return;if(n.type==="EMAIL"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s))){e[n.name]=`${r} must be a valid email address.`;return}if(n.type==="SELECT"&&((i=n.options)!=null&&i.length)&&!n.options.map(g=>g.value).includes(String(s))){e[n.name]=`${r} must be a valid option.`;return}let c=String(s),u=h(n);if((a=n.validation)!=null&&a.minLength&&c.length<n.validation.minLength){e[n.name]=n.validation.message||`${r} must be at least ${n.validation.minLength} characters.`;return}if(u&&c.length>u){e[n.name]=((l=n.validation)==null?void 0:l.message)||`${r} must be at most ${u} characters.`;return}if((d=n.validation)!=null&&d.pattern)try{new RegExp(n.validation.pattern).test(c)||(e[n.name]=n.validation.message||`${r} is invalid.`)}catch(m){}}),e}var M=0,b=class{constructor(t,e){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`cof-${M++}`;this.container=t,this.options=e}async init(){try{this.container.classList.add("cof-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",e=await fetch(`${t}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,{method:"GET",credentials:"omit"});if(!e.ok)throw new Error("Failed to load form definition");return e.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let e=E(t.defaultTheme,this.options.themeOverrides);if(v(this.container,e),L(e.fontUrl),this.container.classList.remove("cof-density-compact","cof-density-normal","cof-density-comfortable"),this.container.classList.add(T(e)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}let n=document.createElement("div");n.className="cof-status",n.setAttribute("role","status"),this.statusEl=n;let s=document.createElement("form");s.className="cof-form",s.addEventListener("submit",l=>this.handleSubmit(l)),t.fields.forEach(l=>{let{wrapper:d,input:m,errorEl:g}=this.createField(l);d&&s.appendChild(d),this.fieldElements.set(l.name,{input:m,errorEl:g})});let r=document.createElement("button");r.type="submit",r.className="cof-submit",r.textContent=e.buttonText||"Submit";let c=getComputedStyle(this.container).getPropertyValue("--cof-primary").trim()||"#0ea5e9",u=getComputedStyle(this.container).getPropertyValue("--cof-radius").trim()||"8px",i=getComputedStyle(this.container).getPropertyValue("--cof-button-width").trim()||"100%";r.style.cssText=`
      display: block !important;
      width: ${i} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${u} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${c} !important;
      background-color: ${c} !important;
      color: #ffffff !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=r;let a=document.createElement("div");a.className="cof-form-actions",a.appendChild(r),s.appendChild(a),this.container.appendChild(n),this.container.appendChild(s)}createField(t){let e=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let i=document.createElement("input");i.type="hidden",i.name=t.name,i.id=e;let a=document.createElement("span");return{wrapper:null,input:i,errorEl:a}}let n=document.createElement("div");n.className="cof-field";let s=document.createElement("label");if(s.className="cof-label",s.htmlFor=e,s.textContent=t.label||t.name,t.required){let i=document.createElement("span");i.className="cof-required",i.textContent=" *",s.appendChild(i)}let r;switch(t.type){case"TEXTAREA":{let i=document.createElement("textarea");i.className="cof-textarea";let a=h(t);if(a){let l=Math.min(Math.max(Math.ceil(a/60),4),15);i.rows=l}else i.rows=4;r=i;break}case"SELECT":{let i=document.createElement("select");i.className="cof-select",(t.options||[]).forEach(a=>{let l=document.createElement("option");l.value=a.value,l.textContent=a.label,i.appendChild(l)}),r=i;break}case"CHECKBOX":{let i=document.createElement("label");i.className="cof-checkbox";let a=document.createElement("input");a.type="checkbox",a.id=e,a.name=t.name,i.appendChild(a);let l=document.createElement("span");l.textContent=t.label||t.name,i.appendChild(l),n.appendChild(i);let d=document.createElement("span");return d.className="cof-error",d.id=`${e}-error`,n.appendChild(d),a.setAttribute("aria-describedby",d.id),a.setAttribute("aria-invalid","false"),{wrapper:n,input:a,errorEl:d}}case"EMAIL":{let i=document.createElement("input");i.type="email",i.className="cof-input",r=i;break}default:{let i=document.createElement("input");i.type="text",i.className="cof-input",r=i}}r.id=e,r.name=t.name,r.setAttribute("aria-invalid","false"),t.placeholder&&r.setAttribute("placeholder",t.placeholder);let c=h(t);c&&(r instanceof HTMLInputElement||r instanceof HTMLTextAreaElement)&&(r.maxLength=c);let u=document.createElement("span");return u.className="cof-error",u.id=`${e}-error`,r.setAttribute("aria-describedby",u.id),n.appendChild(s),n.appendChild(r),n.appendChild(u),{wrapper:n,input:r,errorEl:u}}collectValues(){let t={};return this.fieldElements.forEach((e,n)=>{e.input instanceof HTMLInputElement?e.input.type==="checkbox"?t[n]=e.input.checked:t[n]=e.input.value:(e.input instanceof HTMLSelectElement,t[n]=e.input.value)}),t}showErrors(t){this.fieldElements.forEach((e,n)=>{let s=t[n];e.errorEl.textContent=s||"",e.input.setAttribute("aria-invalid",s?"true":"false")})}setStatus(t,e){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`cof-status cof-status-${e}`)}async handleSubmit(t){var s,r;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info");let e=this.collectValues(),n=S(this.formDefinition.fields,e);if(this.showErrors(n),Object.keys(n).length>0){this.setStatus("Please fix the highlighted fields.","error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let c=this.options.baseUrl||"",u=await fetch(`${c}/api/embed/${this.options.apiKey}/${this.options.formSlug}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),i=await u.json();if(!u.ok){i!=null&&i.fields&&this.showErrors(i.fields),this.setStatus((i==null?void 0:i.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(c){console.error(c),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let c=((r=(s=this.formDefinition)==null?void 0:s.defaultTheme)==null?void 0:r.buttonText)||"Submit";this.submitButton.textContent=c,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let e=document.createElement("div");e.className="cof-status cof-status-error",e.textContent=t,this.container.appendChild(e)}};var C=`
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
`;var k="cof-embed-styles";function A(){if(document.getElementById(k))return;let o=document.createElement("style");o.id=k,o.textContent=C,document.head.appendChild(o)}function $(o){var t,e;return o.dataset.siteKey||o.dataset.apiKey||((t=document.querySelector("script[data-site-key], script[data-api-key]"))==null?void 0:t.getAttribute("data-site-key"))||((e=document.querySelector("script[data-site-key], script[data-api-key]"))==null?void 0:e.getAttribute("data-api-key"))||""}function D(o){var t;return o.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function H(o){let t=o.dataset.theme;if(t)try{return JSON.parse(t)}catch(e){console.warn("Can-O-Forms: invalid data-theme JSON");return}}function y(){A(),Array.from(document.querySelectorAll("[data-can-o-form]")).forEach(t=>{if(t.dataset.cofInitialized==="true"){console.warn("Can-O-Forms: container already initialized");return}let e=t.dataset.canOForm;if(!e){console.error("Can-O-Forms: missing data-can-o-form attribute");return}let n=$(t);if(!n){console.error("Can-O-Forms: missing site API key");return}t.dataset.cofInitialized="true";let s=H(t),r=D(t);new b(t,{apiKey:n,formSlug:e,themeOverrides:s,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",y):y();window.CanOForms={init:y};})();
