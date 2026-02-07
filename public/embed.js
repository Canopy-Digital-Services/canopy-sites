"use strict";(()=>{var E={fontFamily:"inherit",fontSize:14,text:"#18181b",background:"#ffffff",primary:"#005F6A",border:"#e4e4e7",radius:8,density:"normal",buttonWidth:"full",buttonAlign:"left",fontUrl:void 0,buttonText:void 0},S=new Set;function C(i,t){if(!i)return t;let n=i.trim();return n?/^var\(/i.test(n)||/^rgb/i.test(n)||/^hsl/i.test(n)||/^color\(/i.test(n)||/^(transparent|currentcolor|inherit)$/i.test(n)||/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?n:/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(n)?`#${n}`:t:t}function A(i,t){return{...E,...i!=null?i:{},...t!=null?t:{}}}function F(i,t){var n,e;i.style.setProperty("--canopy-font",t.fontFamily||"inherit"),i.style.setProperty("--canopy-font-size",`${(n=t.fontSize)!=null?n:E.fontSize}px`),i.style.setProperty("--canopy-text",C(t.text,E.text)),i.style.setProperty("--canopy-bg",C(t.background,E.background)),i.style.setProperty("--canopy-primary",C(t.primary,E.primary)),i.style.setProperty("--canopy-border",C(t.border,E.border)),i.style.setProperty("--canopy-radius",`${(e=t.radius)!=null?e:E.radius}px`),i.style.setProperty("--canopy-button-width",t.buttonWidth==="auto"?"auto":"100%"),i.style.setProperty("--canopy-button-align",t.buttonAlign||E.buttonAlign)}function D(i){switch(i.density){case"compact":return"canopy-density-compact";case"comfortable":return"canopy-density-comfortable";default:return"canopy-density-normal"}}function N(i){if(!i||S.has(i))return;let t=document.createElement("link");t.rel="stylesheet",t.href=i,t.dataset.canopyFont="true",document.head.appendChild(t),S.add(i)}var H={TEXT:200,EMAIL:254,TEXTAREA:2e3};function w(i){var t;return(t=i.validation)!=null&&t.maxLength?i.validation.maxLength:H[i.type]}function z(i){return i.label||i.name}function k(i,t){let n={};return i.forEach(e=>{var a,s,h,f,g,u,d;let r=t[e.name],o=z(e);if(e.required){if(e.type==="CHECKBOX"){if(!r){n[e.name]=`${o} is required.`;return}}else if(e.type!=="NAME"){if(r==null||String(r).trim()===""){n[e.name]=`${o} is required.`;return}}}if(e.type!=="NAME"){if(r==null||String(r).trim()==="")return}if(e.type==="EMAIL"){let y=String(r),m=((a=e.validation)==null?void 0:a.format)||"standard",c;if(m==="strict"?c=/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/:c=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,!c.test(y)){n[e.name]="Please enter a valid email address.";return}let p=(s=e.validation)==null?void 0:s.domainRules;if(p){let x=(h=y.split("@")[1])==null?void 0:h.toLowerCase();if(p.allow&&p.allow.length>0&&!p.allow.map(T=>T.toLowerCase()).includes(x)){n[e.name]=`${o} must be from an allowed domain.`;return}if(p.block&&p.block.length>0&&p.block.map(T=>T.toLowerCase()).includes(x)){n[e.name]=`${o} domain is not allowed.`;return}}}if(e.type==="PHONE"){let y=String(r),m=((f=e.validation)==null?void 0:f.format)||"lenient";if(m==="lenient"){if(!/^[\d\s\-\(\)\+\.]{7,}$/.test(y)){n[e.name]=`${o} must be a valid phone number.`;return}}else if(m==="strict"){let c=y.replace(/[^\d+]/g,"");if(c.startsWith("+1"))c=c.substring(2);else if(c.startsWith("+")){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}else c.startsWith("1")&&c.length===11&&(c=c.substring(1));if(!/^\d{10}$/.test(c)){n[e.name]=`${o} must be a valid US phone number (10 digits).`;return}}return}if(e.type==="DATE"){let y=String(r),m=new Date(y);if(isNaN(m.getTime())){n[e.name]=`${o} must be a valid date.`;return}let c=new Date;c.setHours(0,0,0,0),m.setHours(0,0,0,0);let p=e.validation;if(p!=null&&p.noFuture&&m>c){n[e.name]=`${o} cannot be a future date.`;return}if(p!=null&&p.noPast&&m<c){n[e.name]=`${o} cannot be a past date.`;return}if(p!=null&&p.minDate){let x=new Date(p.minDate==="today"?c:p.minDate);if(x.setHours(0,0,0,0),m<x){n[e.name]=`${o} must be on or after ${x.toLocaleDateString()}.`;return}}if(p!=null&&p.maxDate){let x=new Date(p.maxDate==="today"?c:p.maxDate);if(x.setHours(0,0,0,0),m>x){n[e.name]=`${o} must be on or before ${x.toLocaleDateString()}.`;return}}}if(e.type==="NAME"){let y=r,m=e.options||{parts:["first","last"]},c=m.parts||["first","last"],p=m.partsRequired||{};for(let x of c){let v=y[x];if((e.required||p[x])&&(!v||v.trim()==="")){let O=((g=m.partLabels)==null?void 0:g[x])||x;n[e.name]=`${O} is required.`;return}}return}if(e.type==="SELECT"&&Array.isArray(e.options)&&!e.options.map(m=>m.value).includes(String(r))){n[e.name]=`${o} must be a valid option.`;return}let l=String(r),b=w(e);if((u=e.validation)!=null&&u.minLength&&l.length<e.validation.minLength){n[e.name]=`${o} must be at least ${e.validation.minLength} characters.`;return}if(b&&l.length>b){n[e.name]=`${o} must be at most ${b} characters.`;return}if(e.type==="TEXT"||e.type==="TEXTAREA"){let y=(d=e.validation)==null?void 0:d.format;if(y&&y!=="alphanumeric"){let m=!0,c=`${o} is invalid.`;switch(y){case"numbers":m=/^\d+$/.test(l),c=`${o} must contain only numbers.`;break;case"letters":m=/^[A-Za-z]+$/.test(l),c=`${o} must contain only letters.`;break;case"url":{let p=l.startsWith("http")?l:`https://${l}`;try{m=new URL(p).hostname.includes(".")}catch(x){m=!1}c=`${o} must be a valid URL.`;break}case"postal-us":m=/^\d{5}(-\d{4})?$/.test(l),c=`${o} must be a valid US postal code (e.g., 12345 or 12345-6789).`;break;case"postal-ca":m=/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(l),c=`${o} must be a valid Canadian postal code (e.g., K1A 0B1).`;break}m||(n[e.name]=c)}}}),n}var R=0,L=class{constructor(t,n){this.formDefinition=null;this.fieldElements=new Map;this.statusEl=null;this.submitButton=null;this.instanceId=`canopy-${R++}`;this.container=t,this.options=n}async init(){try{this.container.classList.add("canopy-root");let t=await this.fetchDefinition();this.formDefinition=t,this.render(t)}catch(t){console.error(t),this.renderError("Unable to load form. Please try again later.")}}async fetchDefinition(){let t=this.options.baseUrl||"",n=await fetch(`${t}/api/embed/${this.options.formId}`,{method:"GET",credentials:"omit"});if(!n.ok)throw new Error("Failed to load form definition");return n.json()}render(t){this.container.innerHTML="",this.fieldElements.clear();let n=A(t.defaultTheme,this.options.themeOverrides);if(F(this.container,n),N(n.fontUrl),this.container.classList.remove("canopy-density-compact","canopy-density-normal","canopy-density-comfortable"),this.container.classList.add(D(n)),!t.fields||t.fields.length===0){this.renderError("This form is not configured yet.");return}let e=document.createElement("div");e.className="canopy-status",e.setAttribute("role","status"),this.statusEl=e;let r=document.createElement("form");r.className="canopy-form",r.addEventListener("submit",h=>this.handleSubmit(h)),t.fields.forEach(h=>{let{wrapper:f,input:g,errorEl:u}=this.createField(h);f&&r.appendChild(f),this.fieldElements.set(h.name,{input:g,errorEl:u})});let o=document.createElement("button");o.type="submit",o.className="canopy-submit",o.textContent=n.buttonText||"Submit";let l=getComputedStyle(this.container).getPropertyValue("--canopy-primary").trim()||"#0ea5e9",b=getComputedStyle(this.container).getPropertyValue("--canopy-radius").trim()||"8px",a=getComputedStyle(this.container).getPropertyValue("--canopy-button-width").trim()||"100%";o.style.cssText=`
      display: block !important;
      width: ${a} !important;
      box-sizing: border-box !important;
      border: none !important;
      border-radius: ${b} !important;
      padding: 10px 16px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      background: ${l} !important;
      background-color: ${l} !important;
      color: #ffffff !important;
      cursor: pointer !important;
      min-height: 40px !important;
    `,this.submitButton=o;let s=document.createElement("div");s.className="canopy-form-actions",s.appendChild(o),r.appendChild(s),this.container.appendChild(e),this.container.appendChild(r)}createField(t){let n=`${this.instanceId}-${t.name}`;if(t.type==="HIDDEN"){let a=document.createElement("input");a.type="hidden",a.name=t.name,a.id=n;let s=t.options;if(s&&typeof s=="object"&&"valueSource"in s){let f=s.valueSource;if(f==="static")a.value=s.staticValue||"";else if(f==="urlParam"){let g=s.paramName;if(g){let u=new URLSearchParams(window.location.search);a.value=u.get(g)||""}}else f==="pageUrl"?a.value=window.location.href:f==="referrer"&&(a.value=document.referrer)}let h=document.createElement("span");return{wrapper:null,input:a,errorEl:h}}let e=document.createElement("div");e.className="canopy-field";let r=document.createElement("label");if(r.className="canopy-label",r.htmlFor=n,r.textContent=t.label||t.name,t.required){let a=document.createElement("span");a.className="canopy-required",a.textContent=" *",r.appendChild(a)}let o;switch(t.type){case"TEXTAREA":{let a=document.createElement("textarea");a.className="canopy-textarea";let s=w(t);if(s){let h=Math.min(Math.max(Math.ceil(s/60),4),15);a.rows=h}else a.rows=4;o=a;break}case"SELECT":{let a=t.options,s=a&&typeof a=="object"&&"options"in a,h=s?a.options:Array.isArray(t.options)?t.options:[],f=s?a.defaultValue:void 0,g=s?a.allowOther:!1,u=document.createElement("select");if(u.className="canopy-select",h.forEach(d=>{let y=document.createElement("option");y.value=d.value,y.textContent=d.label,f&&d.value===f&&(y.selected=!0),u.appendChild(y)}),g){let d=document.createElement("option");d.value="__other__",d.textContent="Other",u.appendChild(d)}if(o=u,g){let d=document.createElement("input");d.type="text",d.className="canopy-input canopy-select-other",d.name=`${t.name}_other`,d.placeholder="Please specify...",d.style.display="none",d.style.marginTop="0.5rem",d.addEventListener("input",()=>{d.setCustomValidity("")}),u.addEventListener("change",()=>{u.value==="__other__"?(d.style.display="block",t.required&&(d.required=!0)):(d.style.display="none",d.required=!1,d.value="")}),u.__otherInput=d}break}case"CHECKBOX":{let a=document.createElement("label");a.className="canopy-checkbox";let s=document.createElement("input");s.type="checkbox",s.id=n,s.name=t.name,a.appendChild(s);let h=document.createElement("span");if(h.textContent=t.label||t.name,a.appendChild(h),e.appendChild(a),t.helpText){let g=document.createElement("p");g.className="canopy-help-text",g.textContent=t.helpText,e.appendChild(g)}let f=document.createElement("span");return f.className="canopy-error",f.id=`${n}-error`,e.appendChild(f),s.setAttribute("aria-describedby",f.id),s.setAttribute("aria-invalid","false"),{wrapper:e,input:s,errorEl:f}}case"EMAIL":{let a=document.createElement("input");a.type="email",a.className="canopy-input",o=a;break}case"PHONE":{let a=document.createElement("input");a.type="tel",a.setAttribute("inputmode","tel"),a.setAttribute("autocomplete","tel"),a.className="canopy-input",o=a;break}case"DATE":{let a=document.createElement("input");a.type="date",a.className="canopy-input";let s=t.validation;s&&(s.minDate&&(a.min=this.resolveDate(s.minDate)),s.maxDate&&(a.max=this.resolveDate(s.maxDate)),s.noFuture&&(a.max=new Date().toISOString().split("T")[0]),s.noPast&&(a.min=new Date().toISOString().split("T")[0])),o=a;break}case"NAME":return this.createNameField(t);default:{let a=document.createElement("input");a.type="text",a.className="canopy-input",o=a}}o.id=n,o.name=t.name,o.setAttribute("aria-invalid","false"),t.placeholder&&o.setAttribute("placeholder",t.placeholder);let l=w(t);l&&(o instanceof HTMLInputElement||o instanceof HTMLTextAreaElement)&&(o.maxLength=l),o.addEventListener("input",()=>{o.setCustomValidity("")});let b=document.createElement("span");if(b.className="canopy-error",b.id=`${n}-error`,o.setAttribute("aria-describedby",b.id),e.appendChild(r),e.appendChild(o),o.__otherInput&&e.appendChild(o.__otherInput),t.helpText){let a=document.createElement("p");a.className="canopy-help-text",a.textContent=t.helpText,e.appendChild(a)}return e.appendChild(b),{wrapper:e,input:o,errorEl:b}}resolveDate(t){return t==="today"?new Date().toISOString().split("T")[0]:t}createNameField(t){let n=`${this.instanceId}-${t.name}`,e=document.createElement("div");e.className="canopy-field canopy-name-group";let r=document.createElement("label");if(r.className="canopy-label",r.textContent=t.label||t.name,t.required){let u=document.createElement("span");u.className="canopy-required",u.textContent=" *",r.appendChild(u)}e.appendChild(r);let o=t.options||{parts:["first","last"]},l=o.parts||["first","last"],b=o.partLabels||{},a=o.partsRequired||{},s={first:"First Name",last:"Last Name",middle:"Middle Name",middleInitial:"M.I.",single:"Full Name"},h=document.createElement("div");h.className="canopy-name-parts";let f=document.createElement("input");f.type="hidden",f.id=n,f.name=t.name;let g=document.createElement("span");if(g.className="canopy-error",g.id=`${n}-error`,l.forEach(u=>{let d=document.createElement("div");d.className="canopy-name-part";let y=document.createElement("label");y.className="canopy-name-part-label";let m=`${n}-${u}`;if(y.htmlFor=m,y.textContent=b[u]||s[u]||u,t.required||a[u]){let p=document.createElement("span");p.className="canopy-required",p.textContent=" *",y.appendChild(p)}let c=document.createElement("input");c.type="text",c.className="canopy-input",c.id=m,c.name=`${t.name}.${u}`,c.setAttribute("data-name-part",u),c.setAttribute("data-name-field",t.name),c.addEventListener("input",()=>{c.setCustomValidity("")}),d.appendChild(y),d.appendChild(c),h.appendChild(d)}),e.appendChild(h),t.helpText){let u=document.createElement("p");u.className="canopy-help-text",u.textContent=t.helpText,e.appendChild(u)}return e.appendChild(g),{wrapper:e,input:f,errorEl:g}}collectValues(){let t={};return this.fieldElements.forEach((n,e)=>{if(n.input instanceof HTMLInputElement)if(n.input.type==="checkbox")t[e]=n.input.checked;else if(n.input.type==="hidden"){let r=this.container.querySelectorAll(`input[data-name-field="${e}"]`);if(r.length>0){let o={};r.forEach(l=>{let b=l,a=b.getAttribute("data-name-part");a&&(o[a]=b.value)}),t[e]=o}else t[e]=n.input.value}else t[e]=n.input.value;else n.input instanceof HTMLSelectElement&&n.input.value==="__other__"&&n.input.__otherInput?t[e]=n.input.__otherInput.value:t[e]=n.input.value}),t}showErrors(t){this.fieldElements.forEach((e,r)=>{let o=t[r]||"";if(e.input.type==="hidden"){let l=this.container.querySelector(`input[data-name-field="${r}"]`);l&&l.setCustomValidity(o)}else e.input.setCustomValidity(o);e.errorEl.textContent=o,e.input.setAttribute("aria-invalid",o?"true":"false")});let n=Object.keys(t);if(n.length>0){let e=this.fieldElements.get(n[0]);if(e)if(e.input.type==="hidden"){let r=this.container.querySelector(`input[data-name-field="${n[0]}"]`);r&&(r.reportValidity(),r.focus())}else e.input.reportValidity(),e.input.focus()}}setStatus(t,n){this.statusEl&&(this.statusEl.textContent=t,this.statusEl.className=`canopy-status canopy-status-${n}`)}async handleSubmit(t){var r,o;if(t.preventDefault(),!this.formDefinition)return;this.setStatus("","info"),this.fieldElements.forEach(l=>{l.input.setCustomValidity("")});let n=this.collectValues(),e=k(this.formDefinition.fields,n);if(this.showErrors(e),Object.keys(e).length>0){let l=Object.keys(e).length;this.setStatus(`Please fix ${l} field${l>1?"s":""} to continue.`,"error");return}this.submitButton&&(this.submitButton.disabled=!0,this.submitButton.textContent="Submitting...",this.submitButton.style.opacity="0.6",this.submitButton.style.cursor="not-allowed");try{let l=this.options.baseUrl||"",b=await fetch(`${l}/api/embed/${this.options.formId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)}),a=await b.json();if(!b.ok){a!=null&&a.fields&&this.showErrors(a.fields),this.setStatus((a==null?void 0:a.error)||"Submission failed.","error");return}if(this.formDefinition.redirectUrl){window.location.href=this.formDefinition.redirectUrl;return}this.setStatus(this.formDefinition.successMessage||"Thanks for your submission!","success"),t.target.reset()}catch(l){console.error(l),this.setStatus("Submission failed. Please try again.","error")}finally{if(this.submitButton){this.submitButton.disabled=!1;let l=((o=(r=this.formDefinition)==null?void 0:r.defaultTheme)==null?void 0:o.buttonText)||"Submit";this.submitButton.textContent=l,this.submitButton.style.opacity="1",this.submitButton.style.cursor="pointer"}}}renderError(t){this.container.innerHTML="";let n=document.createElement("div");n.className="canopy-status canopy-status-error",n.textContent=t,this.container.appendChild(n)}};var M=`
.canopy-root {
  font-family: var(--canopy-font, inherit);
  font-size: var(--canopy-font-size, 14px);
  color: var(--canopy-text, #18181b);
  background: var(--canopy-bg, #ffffff);
  padding: 4px;
}

.canopy-form {
  display: grid;
  gap: 16px;
}

.canopy-form-actions {
  display: flex;
  justify-content: var(--canopy-button-align, left);
}

.canopy-density-compact .canopy-form {
  gap: 8px;
}

.canopy-density-comfortable .canopy-form {
  gap: 24px;
}

.canopy-field {
  display: grid;
  gap: 6px;
}

.canopy-label {
  font-size: var(--canopy-font-size, 14px);
  font-weight: 500;
}

.canopy-required {
  color: var(--canopy-primary, #005F6A);
}

.canopy-root .canopy-input,
.canopy-root .canopy-textarea,
.canopy-root .canopy-select {
  display: block !important;
  width: 100%;
  box-sizing: border-box;
  border-radius: var(--canopy-radius, 8px);
  border: 1px solid var(--canopy-border, #e4e4e7) !important;
  padding: 10px 12px;
  font-family: inherit;
  font-size: var(--canopy-font-size, 14px);
  background: #ffffff !important;
  color: inherit;
  min-height: 40px;
  opacity: 1 !important;
  visibility: visible !important;
}

.canopy-root .canopy-textarea {
  min-height: 80px;
  resize: none;
}

.canopy-root .canopy-input:focus,
.canopy-root .canopy-textarea:focus,
.canopy-root .canopy-select:focus {
  outline: 2px solid var(--canopy-primary, #005F6A);
  outline-offset: 2px;
}

.canopy-help-text {
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
  color: #71717a;
  margin-top: 4px;
  line-height: 1.4;
}

.canopy-error {
  /* Hidden - using native HTML5 validation popups instead */
  /* Keep in DOM for screen reader accessibility */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.canopy-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canopy-name-parts {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.canopy-name-part {
  display: grid;
  gap: 4px;
}

.canopy-name-part-label {
  font-size: calc(var(--canopy-font-size, 14px) - 1px);
  font-weight: 500;
  color: var(--canopy-text, #18181b);
}

.canopy-root .canopy-submit {
  display: block;
  width: var(--canopy-button-width, 100%);
  box-sizing: border-box;
  border: none;
  border-radius: var(--canopy-radius, 8px);
  padding: 10px 16px;
  font-size: var(--canopy-font-size, 14px);
  font-weight: 600;
  background: var(--canopy-primary, #005F6A);
  color: #ffffff;
  cursor: pointer;
  min-height: 40px;
}

.canopy-root .canopy-submit[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.canopy-status {
  font-size: var(--canopy-font-size, 14px);
}

.canopy-status.canopy-status-error {
  color: #FF6B5A;
}

.canopy-status.canopy-status-success {
  color: #5FD48C;
}
`;var I="canopy-embed-styles";function V(){if(document.getElementById(I))return;let i=document.createElement("style");i.id=I,i.textContent=M,document.head.appendChild(i)}function q(i){var t;return i.dataset.baseUrl||((t=document.querySelector("script[data-base-url]"))==null?void 0:t.getAttribute("data-base-url"))||""}function P(i){let t=i.dataset.theme;if(t)try{return JSON.parse(t)}catch(n){console.warn("Canopy Forms: invalid data-theme JSON");return}}function $(){V(),Array.from(document.querySelectorAll("[data-canopy-form]")).forEach(t=>{if(t.dataset.canopyInitialized==="true"){console.warn("Canopy Forms: container already initialized");return}let n=t.dataset.canopyForm;if(!n){console.error("Canopy Forms: missing data-canopy-form attribute");return}t.dataset.canopyInitialized="true";let e=P(t),r=q(t);new L(t,{formId:n,themeOverrides:e,baseUrl:r}).init()})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",$):$();window.CanopyForms={init:$};})();
